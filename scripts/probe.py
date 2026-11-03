"""Teste temporário 2: formato dos dados das lojas que responderam."""
import json, re, urllib.request, urllib.parse
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
def get(url, corpo=None, hdr=None):
    h = {"User-Agent": UA, "Accept": "application/json, text/html, */*", "Accept-Language": "pt-BR,pt;q=0.9"}
    h.update(hdr or {})
    req = urllib.request.Request(url, data=corpo, headers=h, method="POST" if corpo else "GET")
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read().decode("utf-8", "replace")
def show(nome, txt, n=1500):
    txt = re.sub(r"https?://", "h__", txt)
    txt = re.sub(r"[?&]", " ", txt)
    print(f"\n######## {nome}\n{txt[:n]}")
def around(txt, pat, n=1500):
    m = re.search(pat, txt)
    return txt[max(0, m.start() - 200): m.start() + n] if m else f"(sem {pat})"
T = {}
def tenta(nome, fn):
    try: fn()
    except Exception as e: print(f"\n######## {nome} ERRO {e}")
def steam():
    j = json.loads(get("https://store.steampowered.com/search/results/?query&start=0&count=50&specials=1&infinite=1&cc=BR&l=brazilian"))
    show("steam keys", str(list(j.keys())) + " total=" + str(j.get("total_count")), 300)
    show("steam row", around(j["results_html"], r"search_result_row"), 2500)
tenta("steam", steam)
def nuuvem():
    t = get("https://www.nuuvem.com/br-pt/catalog/price/promo/sort/bestselling/sort-mode/desc")
    show("nuuvem card", around(t, r"product-card|product__|data-track-product"), 2500)
tenta("nuuvem", nuuvem)
def ps():
    v = {"id":"3f772501-f6f8-49b7-abac-874a88ca4897","pageArgs":{"size":3,"offset":0},"sortBy":None,"filterBy":[],"facetOptions":[]}
    e = {"persistedQuery":{"version":1,"sha256Hash":"4ce7d410a4db2c8b635a48c1dcec375906ff63b19dadd87e073f8fd0c0481d35"}}
    t = get("https://web.np.playstation.com/api/graphql/v1/op?operationName=categoryGridRetrieve&variables=" + urllib.parse.quote(json.dumps(v)) + "&extensions=" + urllib.parse.quote(json.dumps(e)), hdr={"x-psn-store-locale-override": "pt-BR", "Content-Type": "application/json"})
    show("ps graphql", t, 2500)
    h = get("https://store.playstation.com/pt-br/pages/deals")
    ids = re.findall(r"/pt-br/category/([0-9a-f-]{36})", h)
    show("ps deals categories", str(list(dict.fromkeys(ids))[:15]), 1500)
    show("ps deals text", around(h, r"category/"), 1200)
tenta("ps", ps)
def nin():
    h = get("https://www.nintendo.com/pt-br/store/sales-and-deals/")
    show("nin next", around(h, r"__NEXT_DATA__"), 600)
    show("nin price", around(h, r"salePrice|regPrice|finalPrice|\"discount"), 1800)
    for idx in ("store_game_pt_br", "store_all_products_pt_br", "store_all_products_en_us", "ncom_game_pt_br"):
        try:
            t = get("https://u3b6gr4ua3-dsn.algolia.net/1/indexes/*/queries", json.dumps({"requests":[{"indexName":idx,"params":"query=&hitsPerPage=1"}]}).encode(), {"x-algolia-application-id":"U3B6GR4UA3","x-algolia-api-key":"a29c6927638bfd8cee23993e51e721c9","Content-Type":"application/json"})
            show("algolia " + idx, t, 700)
        except Exception as e: print("algolia", idx, e)
tenta("nin", nin)
def epic():
    v = {"country":"BR","locale":"pt-BR","onSale":True,"count":3,"category":"games/edition/base","sortBy":"currentPrice","sortDir":"ASC"}
    e = {"persistedQuery":{"version":1,"sha256Hash":"7d58e12d9dd8cb14c84a3ff18d360bf9f0caa96bf218f2c5fda68ba88d68a437"}}
    show("epic", get("https://store.epicgames.com/graphql?operationName=searchStoreQuery&variables=" + urllib.parse.quote(json.dumps(v)) + "&extensions=" + urllib.parse.quote(json.dumps(e))), 1500)
tenta("epic", epic)
def xbox():
    h = get("https://www.xbox.com/pt-BR/promotions/sales/sales-and-specials")
    show("xbox sales ids", str(list(dict.fromkeys(re.findall(r"\b9[A-Z0-9]{11}\b", h)))[:30]) + " len=" + str(len(h)), 900)
    show("xbox sales text", around(h, r"9[A-Z0-9]{11}"), 800)
    try:
        show("xbox emerald", get("https://emerald.xboxservices.com/xboxcomfd/browse?locale=pt-BR", json.dumps({"Filters":"e30=","ReturnFilters":False,"ChannelKeyToBeUsedInResponse":"BROWSE","ChannelId":""}).encode(), {"Content-Type":"application/json","x-ms-api-version":"1.1"}), 1200)
    except Exception as e: print("emerald", e)
tenta("xbox", xbox)
def kabum():
    show("kabum api", get("https://servicespub.prod.api.aws.grupokabum.com.br/catalog/v2/products-by-category/hardware?page_number=1&page_size=2&facet_filters=&sort=-offer_price&include=gift"), 2500)
    h = get("https://www.kabum.com.br/ofertas/ofertadodia")
    show("kabum ofertas", around(h, r"__NEXT_DATA__|productCard|offer"), 1500)
tenta("kabum", kabum)
def ml():
    h = get("https://www.mercadolivre.com.br/ofertas?category=MLB1648")
    show("ml", around(h, r"poly-card|promotion-item"), 2000)
tenta("ml", ml)
def amz():
    h = get("https://www.amazon.com.br/deals")
    show("amazon", ("CAPTCHA " if "captcha" in h.lower() else "") + around(h, r"dealPrice|DealCard|deal-price|savingsPercentage"), 1200)
tenta("amz", amz)
def promobit():
    t = get("https://api.promobit.com.br/offers?page=1&limit=3")
    show("promobit", t, 3500)
tenta("promobit", promobit)
