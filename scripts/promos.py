"""Robô de promoções do Zerados da Galera.

Junta ofertas das lojas e grava promos.json, separado por classe:
  pc       → jogos de PC (Steam, Nuuvem)
  console  → jogos de console (PlayStation Store, Nintendo eShop, Xbox)
  gratis   → jogos de graça (Epic, GamerPower)
  hardware → peças e acessórios (KaBuM! e ofertas do Promobit de Amazon, Mercado Livre,
             Pichau, Terabyte e outras lojas)
Cada loja é lida em separado: se uma sair do ar, as outras continuam. Só usa a biblioteca padrão.
"""
import html
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from news import data_iso, https  # noqa: E402

SAIDA = "promos.json"
FEEDS = "promo_feeds.json"
POR_LOJA = 40          # no máximo 40 ofertas de cada loja
NAVEGADOR = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"

GRATIS = re.compile(r"\b(gr[aá]tis|gratuito|gratuita|de gra[cç]a|free to keep|100% off)\b", re.I)
HARDWARE = re.compile(
    r"\b(rtx|gtx|radeon|rx ?\d{3,4}|placa de v[ií]deo|processador|ryzen|core i[3579]|core ultra|ssd|nvme|hd externo|"
    r"mem[oó]ria ram|mem[oó]ria ddr|ddr[45]|monitor|teclado|mouse|headset|fone gamer|gabinete|fonte \d|fonte .*w\b|cooler|"
    r"water ?cooler|placa[- ]m[aã]e|notebook gamer|cadeira gamer|webcam|microfone|controle|joystick|dualsense|"
    r"dualshock|volante|mousepad|roteador|steam deck|rog ally|legion go|pc gamer|placa de som|hub usb)\b", re.I)
CONSOLE = re.compile(r"\b(ps5|ps4|playstation|psn|ps plus|xbox|game pass|nintendo|switch)\b", re.I)
FORA = re.compile(r"\b(smart ?tv|tv \d|televis|impressora|geladeira|lavadora|celular|smartphone|galaxy s\d|iphone)", re.I)
JOGO_PC = re.compile(r"\b(steam|epic games|gog|nuuvem|jogo para pc|game pc)\b", re.I)


def baixar(url, corpo=None, cab=None, tipo="json"):
    h = {"User-Agent": NAVEGADOR, "Accept": "application/json, text/html, */*", "Accept-Language": "pt-BR,pt;q=0.9"}
    h.update(cab or {})
    req = urllib.request.Request(url, data=corpo, headers=h, method="POST" if corpo else "GET")
    with urllib.request.urlopen(req, timeout=25) as r:
        dados = r.read()
    if tipo == "json":
        return json.loads(dados)
    return dados.decode("utf-8", "replace") if tipo == "txt" else dados


def reais(v):
    """Número em reais -> 'R$ 1.234,56'."""
    return "R$ " + f"{float(v):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def pct(final, base):
    try:
        final, base = float(final), float(base)
        return round(100 - final * 100 / base) if base > 0 and final < base else None
    except (TypeError, ValueError):
        return None


def item(t, u, loja, cls, final=None, base=None, img="", ate=None, plat=None):
    p = pct(final, base)
    return {"t": html.unescape(str(t)).strip()[:120], "u": https(u), "src": loja, "cls": cls,
            "preco": ("Grátis" if final == 0 else reais(final)) if final is not None else None,
            "de": reais(base) if p and base else None, "pct": p if final != 0 else 100,
            "img": https(img), "ate": ate, "plat": plat}


# ---------------- PC ----------------
def steam():
    j = baixar("https://store.steampowered.com/search/results/?query&start=0&count=100&specials=1&infinite=1&cc=BR&l=brazilian")
    itens = []
    for bloco in j.get("results_html", "").split('<a href="')[1:]:
        appid = re.search(r'data-ds-appid="(\d+)"', bloco)
        nome = re.search(r'<span class="title">([^<]+)</span>', bloco)
        final = re.search(r'data-price-final="(\d+)"', bloco)
        base = re.search(r'discount_original_price">([^<]+)<', bloco)
        if not (appid and nome and final):
            continue
        b = None
        if base:
            n = re.sub(r"[^\d,]", "", base.group(1)).replace(",", ".")
            b = float(n) if n else None
        a = appid.group(1)
        itens.append(item(nome.group(1), f"https://store.steampowered.com/app/{a}/", "Steam", "pc",
                          int(final.group(1)) / 100, b, f"https://cdn.akamai.steamstatic.com/steam/apps/{a}/header.jpg"))
    return itens


def nuuvem():
    t = baixar("https://www.nuuvem.com/br-pt/catalog/price/promo/sort/bestselling/sort-mode/desc", tipo="txt")
    itens, vistos = [], set()
    for m in re.finditer(r'product-tracking-data-param="([^"]+)"', t):
        try:
            d = json.loads(html.unescape(m.group(1)))
        except ValueError:
            continue
        if d.get("id") in vistos:
            continue
        vistos.add(d.get("id"))
        resto = t[m.end(): m.end() + 8000]
        base = re.search(r'data-base-price="([^"]+)"', resto)
        b = None
        if base:
            try:
                b = json.loads(html.unescape(base.group(1))).get("v", 0) / 100
            except ValueError:
                pass
        itens.append(item(d.get("name"), d.get("url"), "Nuuvem", "pc", d.get("price"), b, d.get("image_url")))
    return itens


# ---------------- Consoles ----------------
def playstation():
    v = {"id": "3f772501-f6f8-49b7-abac-874a88ca4897", "pageArgs": {"size": 60, "offset": 0},
         "sortBy": {"name": "sales30", "isAscending": False},
         "filterBy": ["storeDisplayClassification:FULL_GAME"], "facetOptions": []}
    e = {"persistedQuery": {"version": 1, "sha256Hash": "4ce7d410a4db2c8b635a48c1dcec375906ff63b19dadd87e073f8fd0c0481d35"}}
    url = ("https://web.np.playstation.com/api/graphql/v1/op?operationName=categoryGridRetrieve&variables="
           + urllib.parse.quote(json.dumps(v)) + "&extensions=" + urllib.parse.quote(json.dumps(e)))
    j = baixar(url, cab={"x-psn-store-locale-override": "pt-BR", "Content-Type": "application/json"})
    prods = ((j.get("data") or {}).get("categoryGridRetrieve") or {}).get("products") or []
    itens = []
    for p in prods:
        pr = p.get("price") or {}
        num = lambda s: float(re.sub(r"[^\d,]", "", s).replace(",", ".")) if s and re.search(r"\d", s) else None  # noqa: E731
        final, base = num(pr.get("discountedPrice")), num(pr.get("basePrice"))
        if final is None or not base or final >= base:
            continue
        img = next((m.get("url") for m in p.get("media") or [] if m.get("role") in ("MASTER", "GAMEHUB_COVER_ART")), "")
        plat = "/".join(p.get("platforms") or [])
        itens.append(item(p.get("name"), f"https://store.playstation.com/pt-br/product/{p.get('id')}", "PlayStation Store",
                          "console", final, base, img, plat=plat or None))
    return itens


def nintendo():
    corpo = json.dumps({"requests": [{"indexName": "store_game_pt_br",
                                      "params": "query=&hitsPerPage=60&filters=" + urllib.parse.quote('topLevelFilters:"Promoções"')}]}).encode()
    j = baixar("https://u3b6gr4ua3-dsn.algolia.net/1/indexes/*/queries", corpo,
               {"x-algolia-application-id": "U3B6GR4UA3", "x-algolia-api-key": "a29c6927638bfd8cee23993e51e721c9",
                "Content-Type": "application/json"})
    itens = []
    for h in j["results"][0].get("hits", []):
        pr = h.get("price") or {}
        final, base = pr.get("salePrice") or pr.get("finalPrice"), pr.get("regPrice")
        if not final or not base or final >= base:
            continue
        chave = h.get("urlKey") or ""
        url = f"https://www.nintendo.com/pt-br/store/products/{chave}/" if chave else (
            "https://www.nintendo.com" + h["url"] if str(h.get("url", "")).startswith("/") else
            "https://www.nintendo.com/pt-br/search/#q=" + urllib.parse.quote(h.get("title", "")))
        img = ("https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_460/b_white/f_auto/q_auto/" + h["productImage"]) if h.get("productImage") else ""
        itens.append(item(h.get("title"), url, "Nintendo eShop", "console", final, base, img, plat=h.get("platform")))
    return itens


def xbox():
    t = baixar("https://www.xbox.com/pt-BR/promotions/sales/sales-and-specials", tipo="txt")
    ids = list(dict.fromkeys(re.findall(r"\b9[A-Z0-9]{11}\b", t)))[:60]
    itens = []
    for i in range(0, len(ids), 20):
        j = baixar("https://displaycatalog.mp.microsoft.com/v7.0/products?bigIds=" + ",".join(ids[i:i + 20]) + "&market=BR&languages=pt-br")
        for p in j.get("Products", []):
            lp = (p.get("LocalizedProperties") or [{}])[0]
            melhor = None
            for s in p.get("DisplaySkuAvailabilities", []):
                for a in s.get("Availabilities", []):
                    pr = (a.get("OrderManagementData") or {}).get("Price") or {}
                    if "Purchase" in (a.get("Actions") or []) and pr.get("MSRP") and pr.get("ListPrice", 0) < pr["MSRP"]:
                        fim = (a.get("Conditions") or {}).get("EndDate")
                        melhor = (pr["ListPrice"], pr["MSRP"], data_iso(fim) if fim and not fim.startswith("9998") else None)
                        break
                if melhor:
                    break
            if not melhor:
                continue
            imgs = {im.get("ImagePurpose"): im.get("Uri") for im in lp.get("Images", [])}
            uri = imgs.get("SuperHeroArt") or imgs.get("BrandedKeyArt") or imgs.get("TitledHeroArt") or imgs.get("BoxArt") or ""
            img = ("https:" + uri + "?w=460") if uri.startswith("//") else uri
            itens.append(item(lp.get("ProductTitle"), f"https://www.xbox.com/pt-BR/games/store/x/{p.get('ProductId')}",
                              "Xbox", "console", melhor[0], melhor[1], img, melhor[2]))
    return itens


# ---------------- Grátis ----------------
def epic():
    j = baixar("https://store-site-backend-static-ipv4.ak.epicgames.com/freeGamesPromotions?locale=pt-BR&country=BR&allowCountries=BR")
    itens = []
    for e in j["data"]["Catalog"]["searchStore"]["elements"]:
        promos = ((e.get("promotions") or {}).get("promotionalOffers") or [])
        ofertas = [o for p in promos for o in p.get("promotionalOffers", [])
                   if (o.get("discountSetting") or {}).get("discountPercentage") == 0]
        if not ofertas:
            continue
        maps = (e.get("catalogNs") or {}).get("mappings") or e.get("offerMappings") or []
        slug = (maps[0].get("pageSlug") if maps else None) or e.get("productSlug") or ""
        img = next((k["url"] for k in e.get("keyImages", []) if k.get("type") in ("OfferImageWide", "DieselStoreFrontWide")), "")
        fim = ofertas[0].get("endDate")
        itens.append(item(e["title"], f"https://store.epicgames.com/pt-BR/p/{slug}" if slug else "https://store.epicgames.com/pt-BR/free-games",
                          "Epic Games", "gratis", 0, None, img, data_iso(fim) if fim else None, "PC"))
    return itens


def gamerpower():
    j = baixar("https://www.gamerpower.com/api/giveaways?type=game&sort-by=date")
    itens = []
    for g in j[:40]:
        if g.get("status") != "Active":
            continue
        fim = g.get("end_date")
        itens.append(item(g["title"], g.get("open_giveaway_url") or g.get("gamerpower_url"), "GamerPower", "gratis", 0, None,
                          g.get("thumbnail"), data_iso(fim.replace(" ", "T") + "Z") if fim not in (None, "N/A") else None,
                          (g.get("platforms") or "")[:40] or None))
    return itens


# ---------------- Hardware ----------------
def kabum():
    itens = []
    for cat in ("hardware", "perifericos", "gamer"):
        try:
            j = baixar(f"https://servicespub.prod.api.aws.grupokabum.com.br/catalog/v2/products-by-category/{cat}"
                       "?page_number=1&page_size=60&facet_filters=&sort=most_searched&include=gift")
        except Exception as e:
            print(f"  kabum {cat}: {e}")
            continue
        for d in j.get("data", []):
            a = d.get("attributes") or {}
            of = a.get("offer") or {}
            final = of.get("price_with_discount") or a.get("price_with_discount")
            base = a.get("old_price") if (a.get("old_price") or 0) > (final or 0) else (a.get("price") if of else None)
            if not final or not base or final >= base:
                continue
            fotos = a.get("photos") or a.get("images") or {}
            img = (fotos.get("g") or fotos.get("m") or [""])[0] if isinstance(fotos, dict) else (fotos[0] if fotos else "")
            fim = of.get("ends_at")
            itens.append(item(a.get("title"), f"https://www.kabum.com.br/produto/{d.get('id')}", "KaBuM!", "hardware",
                              final, base, img, int(fim) * 1000 if isinstance(fim, (int, float)) and fim > 1e9 else None))
    itens.sort(key=lambda x: -(x.get("pct") or 0))
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


def promobit():
    """Ofertas da comunidade Promobit (Amazon, Mercado Livre, Pichau, Terabyte, KaBuM!…), só as de games e PC."""
    itens, depois, vistos = [], None, set()
    for pagina in range(1, 31):
        url = f"https://api.promobit.com.br/offers?page={pagina}&limit=50" + (f"&after={urllib.parse.quote(depois)}" if depois else "")
        try:
            j = baixar(url)
        except Exception as e:
            print(f"  promobit pág. {pagina}: {e}")
            break
        ofertas = j.get("offers") or []
        if not ofertas:
            break
        for o in ofertas:
            if o.get("offer_id") in vistos:
                continue
            vistos.add(o.get("offer_id"))
            titulo = o.get("offer_title") or ""
            if FORA.search(titulo):
                continue
            cls = classe(titulo)
            if not cls:
                continue
            base = o.get("offer_old_price") if (o.get("offer_old_price") or 0) > 1 else None
            foto = o.get("offer_photo") or ""
            img = ("https://www.promobit.com.br" + foto) if foto.startswith("/") else foto
            loja = (o.get("store_name") or "Promobit")[:30]
            it = item(o.get("offer_title"), f"https://www.promobit.com.br/oferta/{o.get('offer_slug')}/", loja, cls,
                      o.get("offer_price"), base, img)
            it["at"] = data_iso(o.get("offer_published", "").replace("-0300", "-03:00"))
            it["via"] = "Promobit"
            itens.append(it)
        depois = j.get("after")
        time.sleep(0.4)
    return itens


def rss(fonte):
    raiz = ET.fromstring(baixar(fonte["url"], tipo="bin"))
    itens = []
    for it in raiz.iter("item"):
        t = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", it.findtext("title") or ""))).strip()[:140]
        u = https(it.findtext("link"))
        cls = fonte.get("classe") or classe(t)
        if not t or not u or not cls:
            continue
        desc = it.findtext("description") or ""
        img = re.search(r'<img[^>]+src="(https://[^"]+)"', desc)
        x = item(t, u, fonte["nome"][:40], cls, img=img.group(1) if img else "")
        x["at"] = data_iso(it.findtext("pubDate"))
        itens.append(x)
    return itens[:fonte.get("max", 20)]


def main():
    agora = int(time.time() * 1000)
    fontes = [("Steam", steam), ("Nuuvem", nuuvem), ("PlayStation Store", playstation), ("Nintendo eShop", nintendo),
              ("Xbox", xbox), ("Epic Games", epic), ("GamerPower", gamerpower), ("KaBuM!", kabum), ("Promobit", promobit)]
    try:
        cfg = json.load(open(FEEDS, encoding="utf-8"))
        fontes += [(f["nome"], (lambda f=f: rss(f))) for f in cfg.get("fontes", [])]
    except (OSError, ValueError) as e:
        print(f"sem {FEEDS}: {e}")
    grupos, relatorio = [], []
    for nome, fn in fontes:
        try:
            itens = [i for i in fn() if i.get("u") and i.get("t") and not (i.get("ate") and i["ate"] < agora)]
            grupos.append(itens)
            relatorio.append({"nome": nome, "ok": True, "itens": len(itens)})
            print(f"OK     {nome}: {len(itens)}")
        except Exception as e:  # uma loja fora do ar não derruba as outras
            relatorio.append({"nome": nome, "ok": False, "itens": 0})
            print(f"FALHOU {nome}: {e}", file=sys.stderr)
    # limita por loja e intercala as lojas, para a lista não ficar só com uma
    por_loja = {}
    for g in grupos:
        for i in g:
            por_loja.setdefault((i["cls"], i["src"]), []).append(i)
    filas = [v[:POR_LOJA] for v in por_loja.values()]
    saida, vistos = [], set()
    while any(filas):
        for f in filas:
            if f:
                i = f.pop(0)
                if i["u"] in vistos:
                    continue
                vistos.add(i["u"])
                i.setdefault("at", agora)
                i["at"] = i["at"] or agora
                saida.append({k: v for k, v in i.items() if v not in (None, "")})
    if not saida:
        print("Nenhuma promoção lida; mantendo o promos.json anterior.")
        return
    cont = {}
    for i in saida:
        cont[i["cls"]] = cont.get(i["cls"], 0) + 1
    json.dump({"atualizadoEm": agora, "fontes": relatorio, "itens": saida},
              open(SAIDA, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print(f"promos.json gravado: {cont} · lojas: {sorted({i['src'] for i in saida})}")


if __name__ == "__main__":
    main()
