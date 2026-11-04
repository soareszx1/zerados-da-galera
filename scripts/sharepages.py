"""Páginas leves de compartilhamento: p/<apelido>.html (uma por perfil).

Quando alguém cola zeradosdagalera.com.br/p/fulano.html no WhatsApp, Discord ou X, aparece a
prévia com a foto e os números da pessoa. Quem clica cai no perfil e entra como convidado dela.
Roda junto com o robô das capas (covers.yml). Só regrava o que mudou.
"""
import base64
import html
import json
import os
import re
import sys
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from discord_bot import colecao, slug, SITE, PROJETO, UA  # noqa: E402

PASTA = "p"


def avatar(uid):
    url = f"https://firestore.googleapis.com/v1/projects/{PROJETO}/databases/(default)/documents/players/{uid}/media/avatar"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=25) as r:
            d = json.loads(r.read())
    except Exception:
        return None
    img = ((d.get("fields") or {}).get("img") or {}).get("stringValue") or ""
    m = re.match(r"^data:image/(png|jpeg|jpg|webp|gif);base64,(.+)$", img, re.S)
    if not m:
        return None
    ext = {"jpeg": "jpg"}.get(m.group(1), m.group(1))
    try:
        return ext, base64.b64decode(m.group(2))
    except ValueError:
        return None


def grava(caminho, dados):
    modo = "wb" if isinstance(dados, bytes) else "w"
    try:
        with open(caminho, "rb") as f:
            atual = f.read()
        if atual == (dados if isinstance(dados, bytes) else dados.encode("utf-8")):
            return False
    except OSError:
        pass
    with open(caminho, modo, **({} if modo == "wb" else {"encoding": "utf-8"})) as f:
        f.write(dados)
    return True


def main():
    os.makedirs(PASTA, exist_ok=True)
    mudou, feitos = 0, set()
    for uid, p in colecao("players"):
        nick = (p.get("nick") or "").strip()
        s = slug(nick)
        if not s or s in feitos:
            continue
        feitos.add(s)
        jogos = [g for g in (p.get("games") or {}).values() if isinstance(g, dict)]
        zerados = sum(1 for g in jogos if g.get("status") in ("zerado", "platinado"))
        jogando = sum(1 for g in jogos if g.get("status") == "jogando")
        nivel = (p.get("lvl") or {}).get("L")
        img = SITE + "img/banner.jpg"
        card = "summary_large_image"
        av = avatar(uid) if p.get("avatarV") else None
        if av:
            ext, dados = av
            for velho in os.listdir(PASTA):
                if velho.startswith(s + ".") and not velho.endswith((".html", "." + ext)):
                    os.remove(os.path.join(PASTA, velho))
            if grava(f"{PASTA}/{s}.{ext}", dados):
                mudou += 1
            img = f"{SITE}{PASTA}/{s}.{ext}"
            card = "summary"
        partes = [f"Nível {nivel}" if nivel else "", f"{zerados} {'jogo zerado' if zerados == 1 else 'jogos zerados'}", f"{jogando} jogando agora" if jogando else ""]
        desc = " · ".join(x for x in partes if x) + ". Vem montar a sua estante também!"
        destino = f"/?convite={s}#perfil-{s}"
        e = html.escape
        pagina = f"""<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(nick)} · Zerados da Galera</title>
<meta name="description" content="{e(desc)}">
<meta property="og:site_name" content="Zerados da Galera">
<meta property="og:title" content="{e(nick)} no Zerados da Galera">
<meta property="og:description" content="{e(desc)}">
<meta property="og:type" content="profile">
<meta property="og:url" content="{SITE}{PASTA}/{s}.html">
<meta property="og:image" content="{e(img)}">
<meta name="twitter:card" content="{card}">
<meta name="twitter:title" content="{e(nick)} no Zerados da Galera">
<meta name="twitter:description" content="{e(desc)}">
<meta name="twitter:image" content="{e(img)}">
<meta name="theme-color" content="#FF3B6B">
<link rel="icon" href="/img/favicon-64.png">
<meta http-equiv="refresh" content="0;url={destino}">
<script>location.replace({json.dumps(destino)})</script>
</head><body style="background:#14111D;color:#fff;font-family:sans-serif;text-align:center;padding:40px">
<p>Abrindo o perfil de <b>{e(nick)}</b>…</p><p><a style="color:#FFD23F" href="{destino}">Clique aqui se não abrir</a></p>
</body></html>
"""
        if grava(f"{PASTA}/{s}.html", pagina):
            mudou += 1
    for f in os.listdir(PASTA):  # perfis que mudaram de apelido ou saíram
        base = f.rsplit(".", 1)[0]
        if base not in feitos:
            os.remove(os.path.join(PASTA, f))
            mudou += 1
    print(f"{len(feitos)} perfis, {mudou} arquivos atualizados em {PASTA}/")


if __name__ == "__main__":
    main()
