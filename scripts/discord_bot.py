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
SITE = os.environ.get("SITE_URL", "https://zeradosdagalera.com.br/").rstrip("/") + "/"
HOOK = os.environ.get("DISCORD_WEBHOOK", "").strip()            # #zerados-e-conquistas (e o padrão)
HOOK_NEWS = os.environ.get("DISCORD_WEBHOOK_NEWS", "").strip()   # #noticias-games
HOOK_AVISOS = os.environ.get("DISCORD_WEBHOOK_AVISOS", "").strip() or HOOK  # #avisos (quadro do site)
HOOK_TIER = os.environ.get("DISCORD_WEBHOOK_TIER", "").strip() or HOOK      # #tier-list-do-mes
ESTADO = "discord-state/state.json"
BOT_TOKEN = os.environ.get("DISCORD_BOT_TOKEN", "").strip()       # bot de verdade, só para os cargos
GUILD = os.environ.get("DISCORD_GUILD_ID", "1567240115082764289").strip()
# cargo do site -> pedaço do nome do cargo no Discord
CARGOS = {"fundador": "Fundador", "admin": "Admin", "moderador": "Moderador", "suporte": "Suporte",
          "curador": "Curador de Guias", "cacador": "Caçador de Troféus", "speedrunner": "Speedrunner",
          "coop": "Parceiro de Coop", "streamer": "Streamer", "completista": "Completista",
          "veterano": "Veterano", "novato": "Novato"}
UA = "ZeradosDaGalera-DiscordBot/1.0 (+https://zeradosdagalera.com.br/)"
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


def discord_api(metodo, caminho, dados=None):
    """Chamada à API do Discord como o bot (só para cargos)."""
    corpo = json.dumps(dados).encode() if dados is not None else None
    for tentativa in range(4):
        req = urllib.request.Request("https://discord.com/api/v10" + caminho, data=corpo, method=metodo, headers={
            "Authorization": "Bot " + BOT_TOKEN, "User-Agent": UA, "Content-Type": "application/json",
            "X-Audit-Log-Reason": "Sincronizado com o site Zerados da Galera"})
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                txt = r.read()
                return json.loads(txt) if txt else {}
        except urllib.error.HTTPError as e:
            if e.code == 429:
                try:
                    espera = float(json.loads(e.read() or b"{}").get("retry_after", 2))
                except ValueError:
                    espera = 2
                time.sleep(min(espera, 10) + 0.5)
                continue
            raise
    return {}


def sincronizar_cargos(estado):
    """Dá no Discord os mesmos cargos que a pessoa tem no site.

    O vínculo é pelo "Usuário do Discord" que cada um coloca no perfil do site.
    O bot só tira cargos que ele mesmo deu, então nada colocado à mão é mexido.
    """
    if not BOT_TOKEN:
        print("DISCORD_BOT_TOKEN não configurado; cargos não sincronizados.")
        return
    try:
        roles_doc = dict(colecao("roles")).get("all", {}).get("map", {}) or {}
        jogadores = dict(colecao("players"))
        roles_dc = discord_api("GET", f"/guilds/{GUILD}/roles")
    except Exception as e:
        print(f"Cargos: não consegui ler os dados ({e}).")
        return
    def limpa(t):
        return re.sub(r"[^a-z0-9]", "", slug(t))
    por_nome = {}
    for r in roles_dc:
        for chave, nome in CARGOS.items():
            if limpa(nome) and limpa(nome) in limpa(r.get("name", "")):
                por_nome.setdefault(chave, r["id"])
    nivel_ids = {}
    for minimo, nome, cor in NIVEIS:
        rid = next((r["id"] for r in roles_dc if r.get("name") == nome), None)
        if not rid:
            try:
                rid = discord_api("POST", f"/guilds/{GUILD}/roles", {"name": nome, "color": cor, "hoist": False, "mentionable": False}).get("id")
                print(f"Cargos: criei {nome}")
            except Exception as e:
                print(f"Cargos: não deu para criar {nome} ({e}).")
        if rid:
            nivel_ids[minimo] = rid
    dados = estado.setdefault("cargos", {})   # discord user id -> [ids de cargos dados pelo bot]
    vistos_dc = {}
    for pid, p in jogadores.items():
        usuario = str(p.get("discord") or "").strip().lstrip("@").lower()
        if not re.fullmatch(r"[a-z0-9_.]{2,32}", usuario):
            continue
        try:
            achados = discord_api("GET", f"/guilds/{GUILD}/members/search?" + urllib.parse.urlencode({"query": usuario, "limit": 10}))
        except Exception as e:
            print(f"Cargos: busca de {usuario} falhou ({e}).")
            continue
        membro = next((m for m in achados if (m.get("user") or {}).get("username", "").lower() == usuario), None)
        if not membro:
            continue
        uid = membro["user"]["id"]
        if uid in vistos_dc:           # dois perfis dizendo ser a mesma pessoa: ignora os dois
            vistos_dc[uid] = None
            continue
        vistos_dc[uid] = (pid, membro)
    for uid, par in vistos_dc.items():
        if not par:
            continue
        pid, membro = par
        quer = {por_nome[c] for c in (roles_doc.get(pid) or []) if c in por_nome}
        try:
            nv = int(((jogadores.get(pid) or {}).get("lvl") or {}).get("L") or 0)
        except (TypeError, ValueError):
            nv = 0
        faixa = next((m for m, _, _ in NIVEIS if nv >= m and m in nivel_ids), None)
        if faixa:
            quer.add(nivel_ids[faixa])
        tem = set(membro.get("roles") or [])
        dei = set(dados.get(uid, []))
        for rid in quer - tem:
            try:
                discord_api("PUT", f"/guilds/{GUILD}/members/{uid}/roles/{rid}")
                dei.add(rid)
                print(f"Cargos: +{rid} para {membro['user']['username']}")
            except Exception as e:
                print(f"Cargos: não deu para dar {rid} ({e}). O cargo do bot precisa ficar acima dos outros.")
        for rid in (dei - quer) & tem:
            try:
                discord_api("DELETE", f"/guilds/{GUILD}/members/{uid}/roles/{rid}")
                dei.discard(rid)
                print(f"Cargos: -{rid} de {membro['user']['username']}")
            except Exception as e:
                print(f"Cargos: não deu para tirar {rid} ({e}).")
        dados[uid] = sorted(dei & (quer | tem))


CONQUISTAS = {"primeiro": "Primeiro zerado", "maratona": "Maratonista", "platina": "Platinador", "horas": "Sem vida social",
              "malabar": "Malabarista", "guia": "Guia da galera", "colec": "Colecionador", "multi": "Multiplataforma",
              "retro": "Saudosista", "mole": "Coração mole", "critico": "Crítico exigente", "desapego": "Desapegado",
              "influ": "Influencer", "papo": "Resenhista", "desafio": "Desafiante", "assiduo": "Assíduo",
              "zero50": "Zerador nato", "zero100": "Lenda viva", "plat5": "Caçador de platinas", "horas1k": "Mil horas",
              "streak7": "Em chamas", "streak30": "Imparável", "miss10": "Missionário", "miss100": "Viciado em missões",
              "podio": "Pódio da temporada", "campeao": "Campeão da temporada", "foto": "Fotógrafo", "nota10": "Obra-prima",
              "popular": "Popular", "nv10": "Dois dígitos", "nv20": "Mito"}
NIVEIS = [(20, "👑 Nível 20+", 0xF5C518), (10, "🛡️ Nível 10+", 0x9B5DE5), (5, "⚔️ Nível 5+", 0x16A3C7)]
MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]


def mes_anterior():
    hoje = time.gmtime(time.time() - 3 * 3600)  # horário de Brasília
    a, m = (hoje.tm_year, hoje.tm_mon - 1) if hoje.tm_mon > 1 else (hoje.tm_year - 1, 12)
    return f"{a}-{m:02d}"


def eventos_gamificacao(jogadores):
    """Subiu de nível, ganhou conquista e campeões da temporada (dados que o próprio site resume em players.lvl)."""
    saida = []
    for pid, p in jogadores.items():
        lv = p.get("lvl") or {}
        nick = p.get("nick") or "Alguém"
        perfil = SITE + "#perfil-" + (slug(nick) or "jogador")
        try:
            nivel = int(lv.get("L") or 0)
        except (TypeError, ValueError):
            nivel = 0
        if nivel >= 2:
            saida.append((f"lv|{pid}|{nivel}", None, {"title": f"⬆️ {nick} subiu para o nível {nivel}!", "url": perfil, "color": 0x9B5DE5,
                                                      "description": "Missões, zerados e dicas dão XP. Bora acompanhar?"}))
        for b in lv.get("b") or []:
            if b in CONQUISTAS:
                saida.append((f"cq|{pid}|{b}", None, {"title": f"🏅 {nick} conquistou “{CONQUISTAS[b]}”", "url": perfil, "color": 0xF5C518}))
    mes = mes_anterior()
    placar = []
    for pid, p in jogadores.items():
        try:
            pts = int(((p.get("lvl") or {}).get("s") or {}).get(mes) or 0)
        except (TypeError, ValueError):
            pts = 0
        if pts > 0:
            placar.append((pts, p.get("nick") or "Alguém"))
    placar.sort(reverse=True)
    if placar:
        a, m = mes.split("-")
        medalhas = ["🥇", "🥈", "🥉"]
        linhas = [f"{medalhas[i]} **{n}** · {pts} pts" for i, (pts, n) in enumerate(placar[:3])]
        saida.append((f"tp|{mes}", "aviso", {"title": f"🏆 Campeões da temporada de {MESES[int(m) - 1]} de {a}", "url": SITE + "#ranking",
                                             "description": "\n".join(linhas) + "\n\nA nova temporada já começou: o ranking zerou!", "color": 0xF5C518}))
    return saida


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
    ultimo_dia = ultimo_dia_do_mes()
    for mes, t in colecao("tierlists"):
        st = t.get("status")
        tipo = mes.split("~")[1] if "~" in mes else "jogos"
        oque = TIPOS_TL.get(tipo, "jogo")
        if st == "aberta":
            jogos = ", ".join(x.get("title", "") for x in (t.get("games") or [])[:10])
            saida.append((f"tl|{mes}|aberta", "tier", {"title": f"Votação aberta: {t.get('title') or 'Tier list do mês'}",
                                                     "url": SITE + "#tierlist", "description": f"Vote no tier de cada {oque} no site.\nNa disputa: {jogos}", "color": 0x4CC9F0}))
            if ultimo_dia and mes.split("~")[0] == mes_atual():
                saida.append((f"tl|{mes}|lembrete", "tier", {"title": f"⏰ Último dia para votar: {t.get('title') or 'Tier list do mês'}",
                                                           "url": SITE + "#tierlist", "description": f"A votação fecha com o fim do mês. Já deu o tier de cada {oque}?", "color": 0xFF9F1C}))
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
    for n in [x for x in auto if x.get("cat") != "geek"][:20]:
        url = n.get("url") or ""
        if url.startswith("https://"):
            emb = {"title": (n.get("title") or "")[:250], "url": url, "description": (n.get("summary") or "")[:300] or None,
                   "color": 0x16A3C7, "footer": {"text": "Fonte: " + (n.get("source") or "")}}
            saida.append((f"a|{url}", "auto", emb))
    for pid, p in jogadores.items():
        nick = p.get("nick") or "Alguém"
        for mid, x in (p.get("media") or {}).items():
            if not isinstance(x, dict) or x.get("st") != "visto" or not x.get("t"):
                continue
            k = x.get("k") or "anime"
            verbo = {"manga": "terminou de ler", "filme": "assistiu"}.get(k, "terminou")
            desc = " · ".join(v for v in [TIPOS_TL.get(k, "").capitalize(), f"tier {x['tier']}" if x.get("tier") else "", f"nota {nota(x.get('nota'))}" if nota(x.get("nota")) else ""] if v)
            if x.get("c"):
                desc += "\n“" + str(x["c"])[:200] + "”"
            emb = {"title": f"{nick} {verbo} {x['t']}", "url": SITE + "#midia-" + slug(x["t"]), "description": desc or None, "color": 0xB14DFF}
            img = x.get("img") or ""
            if img.startswith("https://"):
                emb["thumbnail"] = {"url": img}
            saida.append((f"m|{pid}|{mid}|visto", None, emb))
    saida.extend(eventos_gamificacao(jogadores))
    saida.extend(resumo_semana(jogadores))
    return saida


TIPOS_TL = {"jogos": "jogo", "anime": "anime", "serie": "série", "filme": "filme", "manga": "mangá"}


def agora_br():
    return time.gmtime(time.time() - 3 * 3600)  # horário de Brasília


def mes_atual():
    h = agora_br()
    return f"{h.tm_year}-{h.tm_mon:02d}"


def ultimo_dia_do_mes():
    """True no último dia do mês (horário de Brasília), a partir das 10h."""
    h = agora_br()
    amanha = time.gmtime(time.time() - 3 * 3600 + 86400)
    return amanha.tm_mon != h.tm_mon and h.tm_hour >= 10


def resumo_semana(jogadores):
    """Toda segunda (a partir das 10h, horário de Brasília): o que a galera fez nos últimos 7 dias."""
    h = agora_br()
    if h.tm_wday != 0 or h.tm_hour < 10:
        return []
    semana = time.strftime("%G-W%V", h)
    limite = (time.time() - 7 * 86400) * 1000
    zerados, ativos, geek = [], {}, 0
    for pid, p in jogadores.items():
        nick = p.get("nick") or "Alguém"
        for g in (p.get("games") or {}).values():
            try:
                quando = float(g.get("updatedAt") or 0)
            except (TypeError, ValueError):
                quando = 0
            if quando < limite:
                continue
            ativos[nick] = ativos.get(nick, 0) + 1
            if g.get("status") in ("zerado", "platinado"):
                zerados.append(f"**{nick}** {'platinou' if g.get('status') == 'platinado' else 'zerou'} {g.get('title') or 'um jogo'}")
        for x in (p.get("media") or {}).values():
            try:
                if isinstance(x, dict) and float(x.get("at") or 0) >= limite:
                    geek += 1
                    ativos[nick] = ativos.get(nick, 0) + 1
            except (TypeError, ValueError):
                pass
    if not zerados and not ativos:
        return []
    top = sorted(ativos.items(), key=lambda kv: -kv[1])[:3]
    partes = []
    if zerados:
        partes.append(f"🏁 **{len(zerados)} zerado{'s' if len(zerados) > 1 else ''}**\n" + "\n".join(zerados[:8]) + ("\n…" if len(zerados) > 8 else ""))
    if top:
        partes.append("🔥 **Mais ativos:** " + ", ".join(f"{n} ({q})" for n, q in top))
    if geek:
        partes.append(f"🎌 {geek} {'títulos' if geek > 1 else 'título'} de anime, série, filme ou mangá {'atualizados' if geek > 1 else 'atualizado'}")
    partes.append("Missões novas da semana já estão no site. Bora!")
    return [(f"sem|{semana}", "aviso", {"title": "📊 Resumo da semana na galera", "url": SITE + "#feed", "description": "\n\n".join(partes)[:1800], "color": 0x16A3C7})]


def main():
    os.makedirs(os.path.dirname(ESTADO), exist_ok=True)
    open(os.path.join(os.path.dirname(ESTADO), ".keep"), "w").close()
    try:
        estado = json.load(open(ESTADO, encoding="utf-8"))
    except (OSError, ValueError):
        estado = {}
    primeira = "vistos" not in estado

    def salvar():
        json.dump(estado, open(ESTADO, "w", encoding="utf-8"))

    sincronizar_cargos(estado)
    if not HOOK:
        salvar()
        print("DISCORD_WEBHOOK não configurado; avisos não postados.")
        return
    lista = eventos()
    if primeira:
        estado["vistos"] = [k for k, _, _ in lista]
        salvar()
        print(f"Primeira execução: {len(lista)} itens memorizados, nada postado.")
        postar(HOOK, "O bot do **Zerados da Galera** está ligado! Daqui pra frente eu aviso aqui quando alguém entrar na galera, zerar ou platinar um jogo. " + SITE)
        return
    vistos = set(estado.get("vistos", []))
    # níveis e conquistas: na primeira vez que o bot vê cada pessoa, só memoriza (não anuncia o histórico todo)
    conhecidos = set(estado.get("gami_p", []))
    com_nivel = {k.split("|")[1] for k, _, _ in lista if k.split("|")[0] in ("lv", "cq")}
    novos = com_nivel - conhecidos
    vistos.update(k for k, _, _ in lista if k.split("|")[0] in ("lv", "cq") and k.split("|")[1] in novos)
    if "geek" not in estado:
        vistos.update(k for k, _, _ in lista if k.startswith("m|"))
        estado["geek"] = 1
    if "gami" not in estado:
        vistos.update(k for k, _, _ in lista if k.startswith("tp|"))
        estado["gami"] = 1
    estado["gami_p"] = sorted(conhecidos | com_nivel)
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
    estado["vistos"] = sorted(vistos)[-5000:]
    salvar()
    print(f"Postados: {postados} avisos, {noticias} notícias.")


if __name__ == "__main__":
    main()
