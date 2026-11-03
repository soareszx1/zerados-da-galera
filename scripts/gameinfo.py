"""Ficha de loja dos jogos (estilo página da Steam) do Zerados da Galera.

Roda no GitHub Actions junto com o robô das capas. Para cada jogo que aparece no
site (listas da galera, tier list do mês, convites do quadro, clube do jogo), monta
um resumo com descrição, lançamento, estúdio, gêneros, plataformas, nota e imagens:
  - Steam (loja oficial, em português) quando o jogo está lá;
  - Wikipédia/Wikidata para o resto (e para completar o que faltar).
Salva em info/<chave>.json e um índice em info.json. O site mostra isso na página
do jogo, mesmo que ninguém da galera tenha cadastrado o jogo ainda.
"""
import json
import os
import re
import sys
import time
import unicodedata
import urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from covers import baixar, chave, combina, romano, limpar_titulo  # noqa: E402

PROJETO = os.environ.get("FIREBASE_PROJECT", "zerados-da-galera")
PASTA = "info"
INDICE = "info.json"
MAX_POR_VEZ = 40
VALIDADE_DIAS = 7          # jogos já lançados: atualiza a cada 7 dias
VALIDADE_EM_BREVE = 1      # jogos que ainda vão sair: todo dia (data muda, saem novidades)


def slug(t):
    t = unicodedata.normalize("NFD", str(t or "").lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")[:48]


def valor(v):
    if "stringValue" in v:
        return v["stringValue"]
    if "integerValue" in v:
        return int(v["integerValue"])
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
        j = baixar(url)
        for d in j.get("documents", []):
            docs.append((d["name"].rsplit("/", 1)[-1], {k: valor(x) for k, x in d.get("fields", {}).items()}))
        token = j.get("nextPageToken", "")
        if not token:
            return docs


def titulos():
    """Todos os títulos que aparecem no site."""
    vistos = {}

    def add(t):
        t = str(t or "").strip()
        if t and len(chave(t)) >= 3:
            vistos.setdefault(chave(t), t)
    for _, p in colecao("players"):
        for g in (p.get("games") or {}).values():
            add((g or {}).get("title"))
    for _, t in colecao("tierlists"):
        for g in t.get("games") or []:
            add((g or {}).get("title"))
    for _, b in colecao("board"):
        add(((b.get("ev") or {}).get("game")))
    for doc, c in colecao("config"):
        if doc == "site":
            add(((c.get("club") or {}).get("title")))
    return vistos


def html_para_texto(h):
    h = re.sub(r"<br\s*/?>", "\n", h or "", flags=re.I)
    h = re.sub(r"<[^>]+>", "", h)
    h = re.sub(r"&quot;", '"', h)
    h = re.sub(r"&amp;", "&", h)
    h = re.sub(r"&#39;", "'", h)
    return re.sub(r"\s+", " ", h).strip()


# ---------- Steam ----------
def steam(titulo):
    try:
        busca = baixar("https://store.steampowered.com/api/storesearch/?" + urllib.parse.urlencode(
            {"term": titulo, "l": "brazilian", "cc": "BR"}))
    except Exception as e:
        print(f"  steam busca falhou: {e}")
        return None
    itens = [{"title": i.get("name", ""), "img": "x", "id": i.get("id")} for i in busca.get("items", []) if i.get("type") == "app"]
    hit = combina(titulo, itens)
    if not hit:
        return None
    appid = hit["id"]
    try:
        d = baixar(f"https://store.steampowered.com/api/appdetails?appids={appid}&l=brazilian&cc=BR").get(str(appid), {})
    except Exception as e:
        print(f"  steam detalhes falhou: {e}")
        return None
    if not d.get("success"):
        return None
    d = d["data"]
    rel = d.get("release_date") or {}
    plats = [n for k, n in (("windows", "PC"), ("mac", "Mac"), ("linux", "Linux")) if (d.get("platforms") or {}).get(k)]
    return {
        "fonte": "Steam", "appid": appid, "nome": d.get("name") or titulo,
        "resumo": html_para_texto(d.get("short_description"))[:600],
        "lancamento": rel.get("date") or "", "emBreve": bool(rel.get("coming_soon")),
        "estudio": (d.get("developers") or [])[:3], "editora": (d.get("publishers") or [])[:3],
        "generos": [g.get("description") for g in (d.get("genres") or [])][:6],
        "plataformasSteam": plats,
        "nota": (d.get("metacritic") or {}).get("score"),
        "preco": (d.get("price_overview") or {}).get("final_formatted") or ("Gratuito" if d.get("is_free") else ""),
        "banner": d.get("header_image") or "",
        "fundo": d.get("background_raw") or d.get("background") or "",
        "imagens": [{"p": s.get("path_thumbnail"), "g": s.get("path_full")} for s in (d.get("screenshots") or [])[:8]],
        "video": next((m.get("mp4", {}).get("480") for m in (d.get("movies") or []) if m.get("mp4")), None),
        "link": f"https://store.steampowered.com/app/{appid}/",
    }


# ---------- Wikipédia / Wikidata ----------
def wiki(titulo):
    url = ("https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrlimit=7&format=json"
           "&prop=pageimages|pageprops|langlinks&piprop=thumbnail&pithumbsize=400&pilicense=any&lllang=pt&ppprop=wikibase_item&gsrsearch="
           + urllib.parse.quote(romano(titulo) + ' hastemplate:"Infobox video game"'))
    j = baixar(url)
    pags = sorted((j.get("query") or {}).get("pages", {}).values(), key=lambda p: p.get("index", 0))
    res = [{"title": limpar_titulo(p["title"]), "wtitle": p["title"], "img": "x",
            "qid": (p.get("pageprops") or {}).get("wikibase_item"),
            "pt": ((p.get("langlinks") or [{}])[0]).get("*")} for p in pags]
    hit = combina(titulo, res)
    if not hit:
        return None
    # resumo: português se existir, senão inglês
    resumo, fonte_link = "", ""
    for lang, t in (("pt", hit.get("pt")), ("en", hit["wtitle"])):
        if not t:
            continue
        try:
            e = baixar(f"https://{lang}.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&exsentences=4&format=json&titles="
                       + urllib.parse.quote(t))
            pg = next(iter((e.get("query") or {}).get("pages", {}).values()), {})
            if pg.get("extract"):
                resumo = pg["extract"].strip()[:700]
                fonte_link = f"https://{lang}.wikipedia.org/wiki/" + urllib.parse.quote(t.replace(" ", "_"))
                break
        except Exception:
            pass
    out = {"fonte": "Wikipédia", "nome": hit["title"], "resumo": resumo, "link": fonte_link}
    qid = hit.get("qid")
    if qid:
        try:
            w = baixar(f"https://www.wikidata.org/w/api.php?action=wbgetentities&ids={qid}&props=claims&format=json")["entities"][qid]["claims"]

            def ids(prop):
                return [c["mainsnak"].get("datavalue", {}).get("value", {}).get("id") for c in w.get(prop, []) if c["mainsnak"].get("datavalue")]
            datas = sorted(c["mainsnak"]["datavalue"]["value"]["time"] for c in w.get("P577", []) if c["mainsnak"].get("datavalue"))
            todos = {p: [i for i in ids(p) if i][:6] for p in ("P178", "P123", "P136", "P400")}
            todos_ids = sorted({i for v in todos.values() for i in v})
            nomes = {}
            if todos_ids:
                lab = baixar("https://www.wikidata.org/w/api.php?action=wbgetentities&props=labels&languages=pt-br|pt|en&languagefallback=1&format=json&ids="
                             + "|".join(todos_ids[:50]))["entities"]
                for i, ent in lab.items():
                    ls = ent.get("labels", {})
                    nomes[i] = (ls.get("pt-br") or ls.get("pt") or ls.get("en") or {}).get("value", "")
            if datas:
                m = re.match(r"\+(\d{4})-(\d{2})-(\d{2})", datas[0])
                if m:
                    a, mes, dia = m.groups()
                    out["lancamento"] = f"{dia}/{mes}/{a}" if dia != "00" and mes != "00" else a
                    out["ano"] = int(a)
                    hoje = time.strftime("%Y%m%d")
                    out["emBreve"] = f"{a}{mes if mes != '00' else '12'}{dia if dia != '00' else '31'}" > hoje
                    if out["emBreve"] and dia != "00":
                        out["dataISO"] = f"{a}-{mes}-{dia}"
            else:
                out["emBreve"] = True   # sem data ainda: provavelmente anunciado
            out["estudio"] = [nomes[i] for i in todos["P178"] if nomes.get(i)][:3]
            out["editora"] = [nomes[i] for i in todos["P123"] if nomes.get(i)][:3]
            out["generos"] = [nomes[i] for i in todos["P136"] if nomes.get(i)][:6]
            out["plataformas"] = [nomes[i] for i in todos["P400"] if nomes.get(i)][:8]
        except Exception as e:
            print(f"  wikidata falhou: {e}")
    return out


def main():
    os.makedirs(PASTA, exist_ok=True)
    try:
        indice = json.load(open(INDICE, encoding="utf-8"))
    except (OSError, ValueError):
        indice = {}
    jogos = indice.get("jogos", {})
    agora = time.time()
    feitos = 0
    for k, titulo in sorted(titulos().items()):
        atual = jogos.get(k)
        if atual:
            dias = VALIDADE_EM_BREVE if atual.get("emBreve") else VALIDADE_DIAS
            if agora - atual.get("em", 0) < dias * 86400 and os.path.exists(f"{PASTA}/{k[:60]}.json"):
                continue
        if feitos >= MAX_POR_VEZ:
            continue
        feitos += 1
        try:
            s = steam(titulo)
        except Exception as e:
            print(f"  steam erro: {e}")
            s = None
        try:
            w = wiki(titulo)
        except Exception as e:
            print(f"  wiki erro: {e}")
            w = None
        if not s and not w:
            jogos[k] = {"titulo": titulo, "slug": slug(titulo), "em": int(agora), "vazio": True}
            print(f"sem ficha: {titulo}")
            continue
        info = dict(w or {})
        info.update({kk: vv for kk, vv in (s or {}).items() if vv not in (None, "", [], {})})
        if w and s:  # junta o melhor dos dois
            for campo in ("plataformas", "lancamento", "ano"):
                if w.get(campo):
                    info[campo if campo != "lancamento" else "lancamentoWiki"] = w[campo]
            if s.get("lancamento"):
                info["lancamento"] = s["lancamento"]
            info["fontes"] = [{"nome": "Steam", "link": s["link"]}] + ([{"nome": "Wikipédia", "link": w["link"]}] if w.get("link") else [])
            if not s.get("resumo") and w.get("resumo"):
                info["resumo"] = w["resumo"]
        else:
            src = s or w
            info["fontes"] = [{"nome": src["fonte"], "link": src.get("link", "")}]
        info["titulo"] = titulo
        info["atualizadoEm"] = int(agora)
        json.dump(info, open(f"{PASTA}/{k[:60]}.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
        jogos[k] = {"titulo": titulo, "nome": info.get("nome") or titulo, "slug": slug(titulo), "em": int(agora),
                    "emBreve": bool(info.get("emBreve")), "appid": info.get("appid")}
        print(f"ficha: {titulo} ({', '.join(f['nome'] for f in info['fontes'])})")
        time.sleep(0.6)
    json.dump({"atualizadoEm": int(agora), "jogos": jogos}, open(INDICE, "w", encoding="utf-8"), ensure_ascii=False, indent=1, sort_keys=True)
    print(f"{feitos} fichas processadas, {len(jogos)} no índice.")


if __name__ == "__main__":
    main()
