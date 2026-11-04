"""Teste temporário 3: campos exatos."""
import html, json, re, urllib.request, urllib.parse
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
def get(url, corpo=None, hdr=None):
    h = {"User-Agent": UA, "Accept": "application/json, text/html, */*", "Accept-Language": "pt-BR,pt;q=0.9"}
    h.update(hdr or {})
    req = urllib.request.Request(url, data=corpo, headers=h, method="POST" if corpo else "GET")
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read().decode("utf-8", "replace")
def show(nome, obj, n=3000):
    t = obj if isinstance(obj, str) else json.dumps(obj, ensure_ascii=False)
    print(f"\n######## {nome}\n{t[:n]}")
def tenta(nome, fn):
    try: fn()
    except Exception as e: print(f"\n######## {nome} ERRO {e}")
def promobit():
    j = json.loads(get("https://api.promobit.com.br/offers?page=1&limit=2"))
    o = j["offers"][0]
    show("promobit offer", {k: v for k, v in o.items() if k != "authors"})
    show("promobit top keys", list(j.keys()))
    for q in ("category_id=5", "category_slug=games", "category=games", "where=category&value=games"):
        try:
            jj = json.loads(get("https://api.promobit.com.br/offers?page=1&limit=5&" + q))
            show("promobit " + q, [(x.get("category_id"), x.get("category_slug"), x.get("store_name") or x.get("offer_store_name"), x.get("offer_title", "")[:40]) for x in jj.get("offers", [])], 800)
        except Exception as e: print("promobit", q, e)
    jj = json.loads(get("https://api.promobit.com.br/offers?page=1&limit=100"))
    cats = {}
    for x in jj.get("offers", []):
        cats[(x.get("category_id"), x.get("category_slug"))] = cats.get((x.get("category_id"), x.get("category_slug")), 0) + 1
    show("promobit cats(100)", str(cats) + " n=" + str(len(jj.get("offers", []))), 1500)
    for u in ("https://api.promobit.com.br/categories", "https://api.promobit.com.br/offers/categories"):
        try: show("promobit " + u[-20:], get(u), 1500)
        except Exception as e: print(u, e)
tenta("promobit", promobit)
def kabum():
    j = json.loads(get("https://servicespub.prod.api.aws.grupokabum.com.br/catalog/v2/products-by-category/hardware?page_number=1&page_size=2&facet_filters=&sort=-offer_price&include=gift"))
    show("kabum keys", list(j.keys()))
    d = j.get("data") or []
    show("kabum item", d[0] if d else j, 2500)
tenta("kabum", kabum)
ALG = "https://u3b6gr4ua3-dsn.algolia.net/1/indexes/*/queries"
AH = {"x-algolia-application-id":"U3B6GR4UA3","x-algolia-api-key":"a29c6927638bfd8cee23993e51e721c9","Content-Type":"application/json"}
def nin():
    j = json.loads(get(ALG, json.dumps({"requests":[{"indexName":"store_game_pt_br","params":"query=&hitsPerPage=1&facets=%5B%22topLevelFilters%22%2C%22availability%22%5D"}]}).encode(), AH))
    r = j["results"][0]
    show("nin facets", r.get("facets"), 1500)
    h = r["hits"][0]
    show("nin hit", {k: v for k, v in h.items() if k not in ("description", "contentDescriptors", "_highlightResult")}, 2500)
tenta("nin", nin)
def nuuvem():
    t = get("https://www.nuuvem.com/br-pt/catalog/price/promo/sort/bestselling/sort-mode/desc")
    m = re.search(r'<a([^>]{0,3000})href="https://www\.nuuvem\.com/br-pt/item/', t)
    show("nuuvem a-attrs", html.unescape(m.group(1)) if m else "(nada)", 2500)
    i = t.find('data-component="product-card"')
    show("nuuvem card tail", re.sub(r"\s+", " ", t[i:i + 6000])[1500:4500], 3000)
tenta("nuuvem", nuuvem)
def xbox():
    h = get("https://www.xbox.com/pt-BR/promotions/sales/sales-and-specials")
    ids = list(dict.fromkeys(re.findall(r"\b9[A-Z0-9]{11}\b", h)))
    show("xbox n ids", len(ids))
    j = json.loads(get("https://displaycatalog.mp.microsoft.com/v7.0/products?bigIds=" + ",".join(ids[:2]) + "&market=BR&languages=pt-br"))
    p = j["Products"][0]
    lp = p["LocalizedProperties"][0]
    show("xbox title", lp.get("ProductTitle"))
    show("xbox images", [(i.get("ImagePurpose"), i.get("Width"), i.get("Uri")) for i in lp.get("Images", [])][:8], 1200)
    av = [a for s in p.get("DisplaySkuAvailabilities", []) for a in s.get("Availabilities", [])]
    show("xbox prices", [((a.get("OrderManagementData") or {}).get("Price"), a.get("Actions"), (a.get("Conditions") or {}).get("EndDate")) for a in av][:6], 2000)
tenta("xbox", xbox)
def ml():
    t = get("https://www.mercadolivre.com.br/ofertas?category=MLB1648")
    i = t.find("poly-card")
    show("ml card", re.sub(r"\s+", " ", t[i:i + 5000]), 3000)
    show("ml preloaded", re.sub(r"\s+", " ", t[t.find("__PRELOADED_STATE__"):t.find("__PRELOADED_STATE__") + 1500]), 1500)
tenta("ml", ml)
def epic():
    v = {"country":"BR","locale":"pt-BR","onSale":True,"count":2,"category":"games/edition/base","sortBy":"currentPrice","sortDir":"ASC"}
    e = {"persistedQuery":{"version":1,"sha256Hash":"7d58e12d9dd8cb14c84a3ff18d360bf9f0caa96bf218f2c5fda68ba88d68a437"}}
    j = json.loads(get("https://store.epicgames.com/graphql?operationName=searchStoreQuery&variables=" + urllib.parse.quote(json.dumps(v)) + "&extensions=" + urllib.parse.quote(json.dumps(e))))
    el = j["data"]["Catalog"]["searchStore"]["elements"][0]
    show("epic el", {k: el.get(k) for k in ("title", "productSlug", "urlSlug", "catalogNs", "offerMappings", "price", "keyImages")}, 2500)
tenta("epic", epic)
