"""Capas automáticas do Zerados da Galera.

Roda no GitHub Actions. Lê os jogos cadastrados no site (dados públicos do Firebase),
procura a capa de cada título na Wikipédia e salva uma cópia pequena na pasta covers/
do próprio site. Assim a capa aparece até em redes que bloqueiam a Wikipédia.
O índice fica em covers.json: {"capas": {chave_do_titulo: "covers/arquivo.jpg"}}.
"""
import json
import os
import re
import time
import unicodedata
import urllib.parse
import urllib.request

PROJETO = os.environ.get("FIREBASE_PROJECT", "zerados-da-galera")
UA = "ZeradosDaGalera-Capas/1.0 (+https://soareszx1.github.io/zerados-da-galera/)"
INDICE = "covers.json"
PASTA = "covers"
MAX_POR_VEZ = 60
TENTAR_DE_NOVO_DIAS = 7
ROM = {"2": "ii", "3": "iii", "4": "iv", "5": "v", "6": "vi", "7": "vii", "8": "viii", "9": "ix", "10": "x"}


def baixar(url, tipo="json"):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=25) as r:
        dados = r.read()
    return json.loads(dados) if tipo == "json" else dados


def sem_acento(t):
    t = unicodedata.normalize("NFD", str(t or "").lower())
    return "".join(c for c in t if unicodedata.category(c) != "Mn")


def romano(t):
    return re.sub(r"\b(10|[2-9])\b", lambda m: ROM[m.group(1)], t)


def chave(t):
    """Mesma regra do site (ckey): minúsculas, sem acento, números viram romanos, sem 'the'."""
    t = re.sub(r"^the\s+", "", romano(sem_acento(t)))
    return re.sub(r"[^a-z0-9]", "", t)


def palavras(t):
    t = romano(sem_acento(t).replace("'", ""))
    return [w for w in re.split(r"[^a-z0-9]+", t) if w and w not in ("the", "of", "and", "a", "bros")]


def um_erro(a, b):
    if abs(len(a) - len(b)) > 1:
        return False
    i = j = d = 0
    while i < len(a) and j < len(b):
        if a[i] == b[j]:
            i += 1
            j += 1
            continue
        d += 1
        if d > 1:
            return False
        if len(a) > len(b):
            i += 1
        elif len(b) > len(a):
            j += 1
        else:
            i += 1
            j += 1
    return d + (len(a) - i) + (len(b) - j) <= 1


def limpar_titulo(t):
    return re.sub(r"\s*\((?:\d{4} )?video ?game\)$", "", t, flags=re.I).strip()


def combina(titulo, resultados):
    k = chave(titulo)
    if len(k) < 3:
        return None
    for r in resultados:
        if r["img"] and chave(r["title"]) == k:
            return r
    for r in resultados:
        w = chave(r["title"])
        if not r["img"] or len(w) < 3:
            continue
        a = k if k in w else (w if w in k else None)
        if a and len(a) >= max(5, 0.5 * max(len(w), len(k))):
            return r
    qw = palavras(titulo)
    if len(qw) < 2:
        return None
    for r in resultados[:3]:
        if not r["img"]:
            continue
        rw = palavras(r["title"])
        if len(rw) > len(qw) + 2:
            continue
        if all(any(x == q or (len(q) >= 5 and um_erro(q, x)) for x in rw) for q in qw):
            return r
    return None


def buscar(q):
    url = ("https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrlimit=7&format=json"
           "&prop=pageimages&piprop=thumbnail&pithumbsize=400&pilicense=any&gsrsearch="
           + urllib.parse.quote(q + ' hastemplate:"Infobox video game"'))
    j = baixar(url)
    pags = sorted((j.get("query") or {}).get("pages", {}).values(), key=lambda p: p.get("index", 0))
    return [{"title": limpar_titulo(p["title"]), "wtitle": p["title"],
             "img": (p.get("thumbnail") or {}).get("source", "")} for p in pags]


def titulos_do_site():
    vistos, token = {}, ""
    while True:
        url = f"https://firestore.googleapis.com/v1/projects/{PROJETO}/databases/(default)/documents/players?pageSize=300"
        if token:
            url += "&pageToken=" + token
        j = baixar(url)
        for d in j.get("documents", []):
            jogos = d.get("fields", {}).get("games", {}).get("mapValue", {}).get("fields", {})
            for g in jogos.values():
                t = g.get("mapValue", {}).get("fields", {}).get("title", {}).get("stringValue", "").strip()
                if t:
                    vistos.setdefault(chave(t), t)
        token = j.get("nextPageToken", "")
        if not token:
            return vistos


def main():
    try:
        indice = json.load(open(INDICE, encoding="utf-8"))
    except (OSError, ValueError):
        indice = {}
    capas = indice.get("capas", {})
    falhas = indice.get("falhas", {})
    os.makedirs(PASTA, exist_ok=True)
    agora = time.time()
    feitos = novos = 0
    for k, titulo in sorted(titulos_do_site().items()):
        if k in capas and os.path.exists(capas[k]):
            continue
        if k in falhas and agora - falhas[k] < TENTAR_DE_NOVO_DIAS * 86400:
            continue
        if feitos >= MAX_POR_VEZ or len(k) < 3:
            continue
        feitos += 1
        try:
            hit = combina(titulo, buscar(romano(titulo)))
            if not hit and romano(titulo) != titulo:
                hit = combina(titulo, buscar(titulo))
            if not hit:
                falhas[k] = agora
                print(f"sem capa: {titulo}")
                continue
            img = baixar(hit["img"], "bin")
            ext = ".png" if hit["img"].lower().endswith(".png") else ".jpg"
            arq = f"{PASTA}/{k[:60]}{ext}"
            open(arq, "wb").write(img)
            capas[k] = arq
            falhas.pop(k, None)
            novos += 1
            print(f"capa: {titulo} -> {hit['wtitle']}")
        except Exception as e:  # uma falha não derruba as outras
            print(f"erro em {titulo}: {e}")
        time.sleep(0.5)
    indice = {"atualizadoEm": int(agora), "fonte": "Wikipédia", "capas": capas, "falhas": falhas}
    json.dump(indice, open(INDICE, "w", encoding="utf-8"), ensure_ascii=False, indent=1, sort_keys=True)
    print(f"{novos} capas novas, {len(capas)} no total.")


if __name__ == "__main__":
    main()
