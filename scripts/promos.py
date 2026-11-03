"""Robô de promoções do Zerados da Galera.

Junta ofertas de várias fontes e grava promos.json, separado por classe:
  pc       → jogos de PC em promoção (Steam, em reais)
  console  → jogos e consoles (PlayStation, Xbox, Nintendo)
  gratis   → jogos de graça (Epic, GamerPower e promoções marcadas como grátis)
  hardware → peças e acessórios de PC/console (placa de vídeo, SSD, monitor, controle…)
As fontes de promoções em RSS ficam em promo_feeds.json (dá para tirar ou pôr sites lá).
Itens que não são de games ou hardware são descartados. Só usa a biblioteca padrão.
"""
import html
import json
import os
import re
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from news import data_iso, https  # noqa: E402

UA = "ZeradosDaGalera-Promos/1.0 (+https://zeradosdagalera.com.br/)"
SAIDA = "promos.json"
FEEDS = "promo_feeds.json"
POR_CLASSE = 40

GRATIS = re.compile(r"\b(gr[aá]tis|gratuito|gratuita|de gra[cç]a|free to keep|100% off)\b", re.I)
HARDWARE = re.compile(
    r"\b(rtx|gtx|radeon|rx ?\d{3,4}|placa de v[ií]deo|processador|ryzen|core i[3579]|ssd|nvme|hd externo|"
    r"mem[oó]ria ram|ddr[45]|monitor|teclado|mouse|headset|fone gamer|gabinete|fonte \d|cooler|water ?cooler|"
    r"placa[- ]m[aã]e|notebook gamer|cadeira gamer|webcam|microfone|controle|joystick|dualsense|dualshock|"
    r"volante|mousepad|roteador|steam deck|rog ally|legion go)\b", re.I)
CONSOLE = re.compile(r"\b(ps5|ps4|playstation|psn|ps plus|xbox|game pass|nintendo|switch)\b", re.I)
JOGO_PC = re.compile(r"\b(steam|epic games|gog|nuuvem|jogo|game|pc)\b", re.I)
PRECO = re.compile(r"R\$\s?([\d.]+(?:,\d{2})?)")


NAVEGADOR = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"


def baixar(url, tipo="json"):
    # sites de promoção costumam barrar robôs com nome próprio; para RSS usa um nome de navegador comum
    ua = NAVEGADOR if tipo == "bin" else UA
    req = urllib.request.Request(url, headers={"User-Agent": ua, "Accept": "*/*", "Accept-Language": "pt-BR,pt;q=0.9"})
    with urllib.request.urlopen(req, timeout=25) as r:
        dados = r.read()
    return json.loads(dados) if tipo == "json" else dados


def reais(centavos):
    return "R$ " + f"{centavos / 100:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def limpar(t):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", t or ""))).strip()


def steam():
    j = baixar("https://store.steampowered.com/api/featuredcategories?cc=BR&l=brazilian")
    itens, vistos = [], set()
    for bloco in ("specials", "top_sellers", "new_releases"):
        for g in (j.get(bloco) or {}).get("items", []):
            if not g.get("discounted") or g["id"] in vistos or g.get("currency") != "BRL":
                continue
            vistos.add(g["id"])
            itens.append({
                "t": g["name"][:120], "u": f"https://store.steampowered.com/app/{g['id']}/",
                "src": "Steam", "cls": "pc", "preco": reais(g["final_price"]), "de": reais(g["original_price"]),
                "pct": g.get("discount_percent"), "img": g.get("header_image") or g.get("large_capsule_image") or "",
                "ate": (g.get("discount_expiration") or 0) * 1000 or None,
            })
    return itens


def epic():
    j = baixar("https://store-site-backend-static-ipv4.ak.epicgames.com/freeGamesPromotions?locale=pt-BR&country=BR&allowCountries=BR")
    itens = []
    for e in j["data"]["Catalog"]["searchStore"]["elements"]:
        promos = ((e.get("promotions") or {}).get("promotionalOffers") or [])
        ofertas = [o for p in promos for o in p.get("promotionalOffers", [])
                   if (o.get("discountSetting") or {}).get("discountPercentage") == 0]
        if not ofertas:
            continue
        slug = (e.get("catalogNs") or {}).get("mappings") or []
        slug = (slug[0].get("pageSlug") if slug else None) or e.get("productSlug") or e.get("urlSlug") or ""
        img = next((k["url"] for k in e.get("keyImages", []) if k.get("type") in ("OfferImageWide", "DieselStoreFrontWide")), "")
        fim = ofertas[0].get("endDate")
        itens.append({
            "t": e["title"][:120], "u": f"https://store.epicgames.com/pt-BR/p/{slug}" if slug else "https://store.epicgames.com/pt-BR/free-games",
            "src": "Epic Games", "cls": "gratis", "preco": "Grátis", "pct": 100, "img": https(img),
            "ate": data_iso(fim) if fim else None,
        })
    return itens


def gamerpower():
    j = baixar("https://www.gamerpower.com/api/giveaways?type=game&sort-by=date")
    itens = []
    for g in j[:30]:
        if g.get("status") != "Active":
            continue
        plat = g.get("platforms", "")
        itens.append({
            "t": g["title"][:120], "u": https(g.get("open_giveaway_url") or g.get("gamerpower_url")),
            "src": "GamerPower", "cls": "gratis", "preco": "Grátis", "pct": 100, "img": https(g.get("thumbnail")),
            "plat": plat[:60], "de": g.get("worth") if g.get("worth") not in ("N/A", None) else None,
            "ate": data_iso(g["end_date"].replace(" ", "T") + "Z") if g.get("end_date") not in (None, "N/A") else None,
        })
    return itens


def classe(texto):
    if GRATIS.search(texto) and (CONSOLE.search(texto) or JOGO_PC.search(texto)):
        return "gratis"
    if HARDWARE.search(texto):
        return "hardware"
    if CONSOLE.search(texto):
        return "console"
    if JOGO_PC.search(texto):
        return "pc"
    return None


def rss(fonte):
    raiz = ET.fromstring(baixar(fonte["url"], "bin"))
    itens = []
    for it in raiz.iter("item"):
        t = limpar(it.findtext("title"))[:140]
        u = https(it.findtext("link"))
        if not t or not u:
            continue
        cls = fonte.get("classe") or classe(t)
        if not cls:
            continue
        m = PRECO.search(t)
        desc = it.findtext("description") or ""
        img = re.search(r'<img[^>]+src="(https://[^"]+)"', desc)
        itens.append({"t": t, "u": u, "src": fonte["nome"][:40], "cls": cls,
                      "preco": "R$ " + m.group(1) if m else None, "img": img.group(1) if img else "",
                      "at": data_iso(it.findtext("pubDate"))})
    return itens[:fonte.get("max", 40)]


def main():
    agora = int(time.time() * 1000)
    fontes = [("Steam", steam), ("Epic Games", epic), ("GamerPower", gamerpower)]
    try:
        cfg = json.load(open(FEEDS, encoding="utf-8"))
        fontes += [(f["nome"], (lambda f=f: rss(f))) for f in cfg.get("fontes", [])]
    except (OSError, ValueError) as e:
        print(f"sem {FEEDS}: {e}")
    todos, relatorio = [], []
    for nome, fn in fontes:
        try:
            itens = fn()
            todos.extend(itens)
            relatorio.append({"nome": nome, "ok": True, "itens": len(itens)})
            print(f"OK     {nome}: {len(itens)}")
        except Exception as e:  # uma fonte fora do ar não derruba as outras
            relatorio.append({"nome": nome, "ok": False, "itens": 0})
            print(f"FALHOU {nome}: {e}", file=sys.stderr)
    vistos, por_classe, saida = set(), {}, []
    for i in todos:
        if not i.get("u") or i["u"] in vistos:
            continue
        if i.get("ate") and i["ate"] < agora:
            continue
        vistos.add(i["u"])
        if por_classe.get(i["cls"], 0) >= POR_CLASSE:
            continue
        por_classe[i["cls"]] = por_classe.get(i["cls"], 0) + 1
        i["at"] = i.get("at") or agora
        saida.append({k: v for k, v in i.items() if v not in (None, "")})
    if not saida:
        print("Nenhuma promoção lida; mantendo o promos.json anterior.")
        return
    json.dump({"atualizadoEm": agora, "fontes": relatorio, "itens": saida},
              open(SAIDA, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"promos.json gravado: {por_classe}")


if __name__ == "__main__":
    main()
