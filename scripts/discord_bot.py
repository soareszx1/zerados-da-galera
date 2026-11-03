"""Bot do Discord do Zerados da Galera.

Roda no GitHub Actions a cada 20 minutos. Lê os dados públicos do site no Firebase
e posta no Discord, por webhook:
  - quem entrou na galera
  - quem zerou ou platinou um jogo
  - votação da tier list do mês aberta / resultado final
  - destaques postados pela staff
  - notícias automáticas (news.json), num canal separado, se houver o segundo webhook

Os endereços dos webhooks ficam nos "secrets" do GitHub (DISCORD_WEBHOOK e
DISCORD_WEBHOOK_NEWS) e nunca aparecem no código. Na primeira execução o bot só
memoriza o que já existe, para não lotar o canal com coisas antigas.
"""
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.request

PROJETO = os.environ.get("FIREBASE_PROJECT", "zerados-da-galera")
SITE = os.environ.get("SITE_URL", "https://soareszx1.github.io/zerados-da-galera/").rstrip("/") + "/"
HOOK = os.environ.get("DISCORD_WEBHOOK", "").strip()            # #zerados-e-conquistas (e o padrão)
HOOK_NEWS = os.environ.get("DISCORD_WEBHOOK_NEWS", "").strip()   # #noticias-games
HOOK_AVISOS = os.environ.get("DISCORD_WEBHOOK_AVISOS", "").strip() or HOOK  # #avisos (quadro do site)
HOOK_TIER = os.environ.get("DISCORD_WEBHOOK_TIER", "").strip() or HOOK      # #tier-list-do-mes
ESTADO = "discord-state/state.json"
UA = "ZeradosDaGalera-DiscordBot/1.0 (+https://soareszx1.github.io/zerados-da-galera/)"
MAX_POSTS = 12
MAX_NOTICIAS = 5
COR = 0xFF3B6B


def http_json(url, dados=None):
    corpo = json.dumps(dados).encode() if dados is not None else None
    req = urllib.request.Request(url, data=corpo, headers={"User-Agent": UA, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=20) as r:
        txt = r.read()
        return json.loads(txt) if txt else {}


def valor(v):
    """Converte um valor do formato REST do Firestore para Python."""
    if "stringValue" in v:
        return v["stringValue"]
    if "integerValue" in v:
        return int(v["integerValue"])
    if "doubleValue" in v:
        return float(v["doubleValue"])
    if "booleanValue" in v:
        return v["booleanValue"]
    if "nullValue" in v:
        return None
    if "mapValue" in v:
        return {k: valor(x) for k, x in v["mapValue"].get("fields", {}).items()}
    if "arrayValue" in v:
        return [valor(x) for x in v["arrayValue"].get("values", [])]
    return None


def colecao(nome):
    docs, token = [], ""
    while True:
        url = f"https://firestore.googleapis.com/v1/projects/{PROJETO}/databases/(default)/documents/{nome}?pageSize=300"
        if token:
            url += "&pageToken=" + token
        j = http_json(url)
        for d in j.get("documents", []):
            docs.append((d["name"].rsplit("/", 1)[-1], {k: valor(x) for k, x in d.get("fields", {}).items()}))
        token = j.get("nextPageToken", "")
        if not token:
            return docs


def slug(t):
    t = unicodedata.normalize("NFD", str(t or "").lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")[:48]


def nota(n):
    if isinstance(n, (int, float)):
        return str(int(n)) if float(n).is_integer() else f"{n:.1f}".replace(".", ",")
    return ""


def capa(url):
    return url if isinstance(url, str) and re.match(r"^https://(upload|thumb)\.wikimedia\.org/", url) else None


def postar(hook, conteudo=None, embed=None):
    dados = {"username": "Zerados da Galera", "allowed_mentions": {"parse": []}}
    if conteudo:
        dados["content"] = conteudo[:1900]
    if embed:
        dados["embeds"] = [embed]
    for tentativa in range(3):
        try:
            http_json(hook + ("&" if "?" in hook else "?") + "wait=true", dados)
            time.sleep(1.2)
            return True
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(3 + tentativa * 2)
                continue
            print(f"Erro ao postar no Discord: HTTP {e.code}", file=sys.stderr)
            return False
    return False


def eventos():
    """Lista tudo que pode virar post, cada um com uma chave única."""
    jogadores = dict(colecao("players"))
    saida = []
    for pid, p in jogadores.items():
        nick = p.get("nick") or "Alguém"
        perfil = SITE + "#perfil-" + (slug(nick) or "jogador")
        saida.append((f"p|{pid}", None, {"title": f"{nick} entrou na galera!", "url": perfil,
                                         "description": (p.get("title") or "") + ("\n" if p.get("title") else "") + "Dá as boas-vindas no chat do site.", "color": COR}))
        for gid, g in (p.get("games") or {}).items():
            st = g.get("status")
            if st not in ("zerado", "platinado"):
                continue
            titulo = g.get("title") or "um jogo"
            extras = [x for x in [f"nota {nota(g.get('nota'))}" if nota(g.get("nota")) else "",
                                  f"{g.get('hours')} h" if g.get("hours") else "", g.get("platform") or ""] if x]
            desc = " · ".join(extras)
            if g.get("comment"):
                desc += ("\n" if desc else "") + "“" + g["comment"][:200] + "”"
            emb = {"title": f"{nick} {'platinou' if st == 'platinado' else 'zerou'} {titulo}",
                   "url": SITE + "#jogo-" + slug(titulo), "description": desc or None, "color": 0xFFD23F if st == "platinado" else 0x3DDC97}
            if capa(g.get("coverUrl")):
                emb["thumbnail"] = {"url": g["coverUrl"]}
            saida.append((f"g|{pid}|{gid}|{st}", None, emb))
    for mes, t in colecao("tierlists"):
        st = t.get("status")
        if st == "aberta":
            jogos = ", ".join(x.get("title", "") for x in (t.get("games") or [])[:10])
            saida.append((f"tl|{mes}|aberta", "tier", {"title": f"Votação aberta: {t.get('title') or 'Tier list do mês'}",
                                                     "url": SITE + "#tierlist", "description": f"Vote no tier de cada jogo no site.\nNa disputa: {jogos}", "color": 0x4CC9F0}))
        elif st == "encerrada":
            final = (t.get("final") or {}).get("tiers") or {}
            linhas = [f"**{k}**: " + ", ".join(x.get("title", "") for x in final.get(k, [])) for k in "SABCD" if final.get(k)]
            saida.append((f"tl|{mes}|encerrada", "tier", {"title": f"Resultado: {t.get('title') or 'Tier list do mês'}",
                                                        "url": SITE + "#tierlist", "description": "\n".join(linhas)[:1500] or "Confira no site.", "color": 0x9B5DE5}))
    tipos = {"aviso": ("Aviso", 0xFF9F1C), "evento": ("Convite para jogar", 0x4CC9F0), "enquete": ("Enquete", 0xB79CFF)}
    for bid, b in colecao("board"):
        nome, cor = tipos.get(b.get("type"), ("Aviso", COR))
        desc = (b.get("text") or "")[:600]
        if b.get("type") == "evento":
            ev = b.get("ev") or {}
            extra = " · ".join(x for x in [ev.get("game") or "", (ev.get("when") or "").replace("T", " às "), ev.get("where") or ""] if x)
            desc = (extra + ("\n" if desc else "") + desc + "\nConfirme presença no site.").strip()
        elif b.get("type") == "enquete":
            opcoes = "\n".join(f"• {o}" for o in ((b.get("poll") or {}).get("opts") or []))
            desc = (desc + ("\n" if desc else "") + opcoes + "\nVote no site.").strip()
        autor = (jogadores.get(b.get("by")) or {}).get("nick") or "Staff"
        emb = {"title": f"{nome}: {b.get('title') or ''}"[:250], "url": SITE + "#quadro", "description": desc[:1500] or None,
               "color": cor, "footer": {"text": "Publicado por " + autor}}
        cap = capa(((b.get("ev") or {}).get("coverUrl")))
        if cap:
            emb["thumbnail"] = {"url": cap}
        saida.append((f"b|{bid}", "aviso", emb))
    for nid, n in colecao("news"):
        url = n.get("url") or ""
        if url.startswith("https://"):
            saida.append((f"n|{nid}", "news", {"title": (n.get("title") or "Novidade")[:250], "url": url,
                                               "description": (n.get("summary") or "")[:300] or None, "color": COR,
                                               "footer": {"text": "Destaque da staff · fonte: " + (n.get("source") or "")}}))
    try:
        auto = json.load(open("news.json", encoding="utf-8")).get("itens", [])
    except (OSError, ValueError):
        auto = []
    for n in auto[:20]:
        url = n.get("url") or ""
        if url.startswith("https://"):
            emb = {"title": (n.get("title") or "")[:250], "url": url, "description": (n.get("summary") or "")[:300] or None,
                   "color": 0x16A3C7, "footer": {"text": "Fonte: " + (n.get("source") or "")}}
            saida.append((f"a|{url}", "auto", emb))
    return saida


def main():
    os.makedirs(os.path.dirname(ESTADO), exist_ok=True)
    open(os.path.join(os.path.dirname(ESTADO), ".keep"), "w").close()
    if not HOOK:
        print("DISCORD_WEBHOOK não configurado; nada a fazer.")
        return
    try:
        estado = json.load(open(ESTADO, encoding="utf-8"))
    except (OSError, ValueError):
        estado = None
    lista = eventos()
    if estado is None:
        os.makedirs(os.path.dirname(ESTADO), exist_ok=True)
        json.dump({"vistos": [k for k, _, _ in lista]}, open(ESTADO, "w", encoding="utf-8"))
        print(f"Primeira execução: {len(lista)} itens memorizados, nada postado.")
        postar(HOOK, "O bot do **Zerados da Galera** está ligado! Daqui pra frente eu aviso aqui quando alguém entrar na galera, zerar ou platinar um jogo. " + SITE)
        return
    vistos = set(estado.get("vistos", []))
    postados, noticias = 0, 0
    for chave, tipo, emb in lista:
        if chave in vistos:
            continue
        if tipo == "auto":
            if not HOOK_NEWS or noticias >= MAX_NOTICIAS:
                vistos.add(chave)  # sem canal de notícias: só memoriza
                continue
            ok = postar(HOOK_NEWS, embed={k: v for k, v in emb.items() if v})
            noticias += 1
        else:
            if postados >= MAX_POSTS:
                break
            destino = {"news": HOOK_NEWS or HOOK, "aviso": HOOK_AVISOS, "tier": HOOK_TIER}.get(tipo, HOOK)
            ok = postar(destino, embed={k: v for k, v in emb.items() if v})
            postados += 1
        if ok:
            vistos.add(chave)
    json.dump({"vistos": sorted(vistos)[-5000:]}, open(ESTADO, "w", encoding="utf-8"))
    print(f"Postados: {postados} avisos, {noticias} notícias.")


if __name__ == "__main__":
    main()
