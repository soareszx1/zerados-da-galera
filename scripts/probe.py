"""Teste temporário: quais lojas respondem para o robô do GitHub."""
import json, urllib.request, urllib.parse
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
ALG = "https://u3b6gr4ua3-dsn.algolia.net/1/indexes/*/queries"
URLS = [
 ("steam-search", "https://store.steampowered.com/search/results/?query&start=0&count=50&specials=1&infinite=1&cc=BR&l=brazilian", None, {}),
 ("nuuvem-html", "https://www.nuuvem.com/br-pt/catalog/price/promo/sort/bestselling/sort-mode/desc", None, {}),
 ("nuuvem-json", "https://www.nuuvem.com/br-pt/catalog/price/promo/sort/bestselling/sort-mode/desc.json", None, {}),
 ("ps-graphql", "https://web.np.playstation.com/api/graphql/v1/op?operationName=categoryGridRetrieve&variables=" + urllib.parse.quote(json.dumps({"id":"3f772501-f6f8-49b7-abac-874a88ca4897","pageArgs":{"size":24,"offset":0},"sortBy":None,"filterBy":[],"facetOptions":[]})) + "&extensions=" + urllib.parse.quote(json.dumps({"persistedQuery":{"version":1,"sha256Hash":"4ce7d410a4db2c8b635a48c1dcec375906ff63b19dadd87e073f8fd0c0481d35"}})), None, {"x-psn-store-locale-override": "pt-BR", "Content-Type": "application/json"}),
 ("ps-deals-html", "https://store.playstation.com/pt-br/pages/deals", None, {}),
 ("psprices", "https://psprices.com/region-br/discounts/?platform=PS5", None, {}),
 ("nintendo-algolia-ptbr", ALG, json.dumps({"requests":[{"indexName":"store_game_pt_br","params":"query=&hitsPerPage=5&filters=topLevelFilters%3A%22Deals%22"}]}).encode(), {"x-algolia-application-id":"U3B6GR4UA3","x-algolia-api-key":"a29c6927638bfd8cee23993e51e721c9","Content-Type":"application/json"}),
 ("nintendo-algolia-enus", ALG, json.dumps({"requests":[{"indexName":"store_game_en_us","params":"query=&hitsPerPage=2"}]}).encode(), {"x-algolia-application-id":"U3B6GR4UA3","x-algolia-api-key":"a29c6927638bfd8cee23993e51e721c9","Content-Type":"application/json"}),
 ("nintendo-br-html", "https://www.nintendo.com/pt-br/store/sales-and-deals/", None, {}),
 ("xbox-reco", "https://reco-public.rec.mp.microsoft.com/channels/Reco/V8.0/Lists/Computed/Deal?Market=br&Language=pt&ItemTypes=Game&deviceFamily=Windows.Xbox&count=30", None, {}),
 ("xbox-catalog", "https://displaycatalog.mp.microsoft.com/v7.0/products?bigIds=9NBLGGH4PNC7&market=BR&languages=pt-br", None, {}),
 ("epic-graphql", "https://store.epicgames.com/graphql?operationName=searchStoreQuery&variables=" + urllib.parse.quote(json.dumps({"country":"BR","locale":"pt-BR","onSale":True,"count":10,"category":"games/edition/base"})) + "&extensions=" + urllib.parse.quote(json.dumps({"persistedQuery":{"version":1,"sha256Hash":"7d58e12d9dd8cb14c84a3ff18d360bf9f0caa96bf218f2c5fda68ba88d68a437"}})), None, {}),
 ("gg-deals", "https://gg.deals/br/deals/", None, {}),
 ("cheapshark", "https://www.cheapshark.com/api/1.0/deals?pageSize=3", None, {}),
 ("pichau-home", "https://www.pichau.com.br/", None, {}),
 ("pichau-api", "https://www.pichau.com.br/api/catalog", json.dumps({"query":"{ products(search:\"rtx\", pageSize:3){ items{ name sku } } }"}).encode(), {"Content-Type":"application/json"}),
 ("terabyte", "https://www.terabyteshop.com.br/promocoes", None, {}),
 ("kabum-api", "https://servicespub.prod.api.aws.grupokabum.com.br/catalog/v2/products-by-category/hardware?page_number=1&page_size=5&facet_filters=&sort=-offer_price&include=gift", None, {}),
 ("kabum-ofertas", "https://www.kabum.com.br/ofertas/ofertadodia", None, {}),
 ("ml-api", "https://api.mercadolibre.com/sites/MLB/search?q=placa%20de%20video&limit=3", None, {}),
 ("ml-ofertas", "https://www.mercadolivre.com.br/ofertas?category=MLB1648", None, {}),
 ("amazon-deals", "https://www.amazon.com.br/deals", None, {}),
 ("promobit-api", "https://api.promobit.com.br/offers?page=1&limit=5", None, {}),
 ("promobit-html", "https://www.promobit.com.br/promocoes/hardware/", None, {}),
 ("pelando-html", "https://www.pelando.com.br/grupo/hardware", None, {}),
 ("gatry-html", "https://gatry.com/", None, {}),
]
for nome, url, corpo, hdr in URLS:
    h = {"User-Agent": UA, "Accept": "application/json, text/html, */*", "Accept-Language": "pt-BR,pt;q=0.9"}
    h.update(hdr)
    try:
        req = urllib.request.Request(url, data=corpo, headers=h, method="POST" if corpo else "GET")
        with urllib.request.urlopen(req, timeout=20) as r:
            d = r.read()
            print(f"== {nome}: {r.status} {len(d)}b :: {d[:300]!r}")
    except Exception as e:
        body = b""
        try: body = e.read()[:150]
        except Exception: pass
        print(f"== {nome}: ERRO {e} :: {body!r}")
