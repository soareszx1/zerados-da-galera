"""Robô de notícias do Zerados da Galera.

Lê os feeds listados em feeds.json e grava news.json com título, um trecho curto,
a imagem de capa (quando o feed traz), o nome do site e o link da matéria original.
Roda no GitHub Actions a cada 3 horas. Só usa a biblioteca padrão do Python.
"""
import email.utils
import html
import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

UA = "ZeradosDaGalera-NewsBot/1.0 (+https://zeradosdagalera.com.br/)"
MAX_ITENS = 80
POR_FONTE = 15
TRECHO = 180
PALAVRAS_GEEK = re.compile(
    r"\b(anime|animes|mang[aá]s?|crunchyroll|otaku|cosplay|filmes?|s[ée]ries?|cinema|bilheteria|trailer|netflix|prime video|disney\+?|hbo|max|marvel|dc|star wars|pixar|ghibli|temporada|epis[óo]dio|estreia|streaming|quadrinhos|hq)\b",
    re.IGNORECASE)
MAX_GEEK = 60

PALAVRAS_GAMES = re.compile(
    r"\b(game|games|jogo|jogos|gamer|playstation|ps5|ps4|xbox|nintendo|switch|steam|"
    r"console|consoles|rpg|fps|dlc|trailer|lançamento|esports?|zelda|mario|pokémon|pokemon)\b",
    re.IGNORECASE,
)
NS = {
    "atom": "http://www.w3.org/2005/Atom",
    "media": "http://search.yahoo.com/mrss/",
    "content": "http://purl.org/rss/1.0/modules/content/",
}


def baixar(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read()


def limpar(texto):
    texto = re.sub(r"<[^>]+>", " ", texto or "")
    texto = html.unescape(texto)
    texto = re.sub(r"\s+", " ", texto).strip()
    if len(texto) > TRECHO:
        texto = texto[:TRECHO].rsplit(" ", 1)[0] + "…"
    return texto


def data_iso(valor):
    if not valor:
        return None
    valor = valor.strip()
    try:
        d = email.utils.parsedate_to_datetime(valor)
    except (TypeError, ValueError):
        try:
            d = datetime.fromisoformat(valor.replace("Z", "+00:00"))
        except ValueError:
            return None
    if d.tzinfo is None:
        d = d.replace(tzinfo=timezone.utc)
    return int(d.timestamp() * 1000)


def https(url):
    url = (url or "").strip()
    return url if url.startswith("https://") else ""


def imagem(item, descricao_html):
    for tag in ("media:content", "media:thumbnail"):
        el = item.find(tag, NS)
        if el is not None and https(el.get("url")):
            return el.get("url")
    enc = item.find("enclosure")
    if enc is not None and (enc.get("type") or "").startswith("image") and https(enc.get("url")):
        return enc.get("url")
    m = re.search(r'<img[^>]+src="(https://[^"]+)"', descricao_html or "")
    return m.group(1) if m else ""


def ler_fonte(fonte):
    raiz = ET.fromstring(baixar(fonte["url"]))
    itens = []
    if raiz.tag.endswith("rss") or raiz.find("channel") is not None:
        for it in raiz.iter("item"):
            desc = it.findtext("description") or it.findtext("content:encoded", namespaces=NS) or ""
            itens.append({
                "title": limpar(it.findtext("title")),
                "url": https(it.findtext("link")),
                "summary": limpar(desc),
                "img": imagem(it, desc),
                "at": data_iso(it.findtext("pubDate")),
            })
    else:
        for it in raiz.findall("atom:entry", NS):
            link = ""
            for l in it.findall("atom:link", NS):
                if l.get("rel") in (None, "alternate"):
                    link = l.get("href")
                    break
            desc = it.findtext("atom:summary", namespaces=NS) or it.findtext("atom:content", namespaces=NS) or ""
            itens.append({
                "title": limpar(it.findtext("atom:title", namespaces=NS)),
                "url": https(link),
                "summary": limpar(desc),
                "img": imagem(it, desc),
                "at": data_iso(it.findtext("atom:published", namespaces=NS) or it.findtext("atom:updated", namespaces=NS)),
            })
    bons = []
    for i in itens:
        if not i["title"] or not i["url"]:
            continue
        texto = i["title"] + " " + i["summary"]
        geek = fonte.get("cat") == "geek"
        if fonte.get("filtrar") and not (PALAVRAS_GEEK if geek else PALAVRAS_GAMES).search(texto):
            continue
        if geek:
            i["cat"] = "geek"
        i["source"] = fonte["nome"][:40]
        i["title"] = i["title"][:160]
        bons.append(i)
    return bons[:POR_FONTE]


def main():
    cfg = json.load(open("feeds.json", encoding="utf-8"))
    todos, relatorio = [], []
    for fonte in cfg.get("fontes", []):
        try:
            itens = ler_fonte(fonte)
            todos.extend(itens)
            relatorio.append({"nome": fonte["nome"], "ok": True, "itens": len(itens)})
            print(f"OK   {fonte['nome']}: {len(itens)} notícias")
        except Exception as e:  # uma fonte fora do ar não derruba as outras
            relatorio.append({"nome": fonte["nome"], "ok": False, "itens": 0})
            print(f"FALHOU {fonte['nome']}: {e}", file=sys.stderr)
    vistos, unicos = set(), []
    agora = int(datetime.now(timezone.utc).timestamp() * 1000)
    for i in sorted(todos, key=lambda x: x["at"] or 0, reverse=True):
        if i["url"] in vistos:
            continue
        vistos.add(i["url"])
        i["at"] = i["at"] or agora
        unicos.append(i)
    games = [i for i in unicos if i.get("cat") != "geek"][:MAX_ITENS]
    geek = [i for i in unicos if i.get("cat") == "geek"][:MAX_GEEK]
    saida = {"atualizadoEm": agora, "fontes": relatorio, "itens": sorted(games + geek, key=lambda x: x["at"] or 0, reverse=True)}
    if not unicos:
        print("Nenhuma notícia lida; mantendo o news.json anterior.")
        return
    with open("news.json", "w", encoding="utf-8") as f:
        json.dump(saida, f, ensure_ascii=False, indent=1)
    print(f"news.json gravado com {len(saida['itens'])} notícias.")


if __name__ == "__main__":
    main()
