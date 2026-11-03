"""Integração com a Steam do Zerados da Galera.

Roda no GitHub Actions. Para cada jogador que colocou o perfil da Steam no site,
lê a biblioteca (jogos, horas e o que jogou nas últimas 2 semanas) pela API oficial
da Steam e salva em steam/<id do jogador>.json. O site lê esse arquivo para importar
jogos e atualizar as horas. A chave da Steam fica no secret STEAM_API_KEY do GitHub.
"""
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

PROJETO = os.environ.get("FIREBASE_PROJECT", "zerados-da-galera")
CHAVE = os.environ.get("STEAM_API_KEY", "").strip()
PASTA = "steam"
UA = "ZeradosDaGalera-Steam/1.0 (+https://zeradosdagalera.com.br/)"
API = "https://api.steampowered.com"


def baixar(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.loads(r.read() or b"{}")


def steam(metodo, **params):
    params["key"] = CHAVE
    params["format"] = "json"
    return baixar(f"{API}/{metodo}/?" + urllib.parse.urlencode(params))


def jogadores():
    """Lista (uid, valor do campo steam) de quem conectou a Steam."""
    out, token = [], ""
    while True:
        url = f"https://firestore.googleapis.com/v1/projects/{PROJETO}/databases/(default)/documents/players?pageSize=300"
        if token:
            url += "&pageToken=" + token
        j = baixar(url)
        for d in j.get("documents", []):
            uid = d["name"].rsplit("/", 1)[-1]
            s = d.get("fields", {}).get("steam", {}).get("stringValue", "").strip()
            if re.fullmatch(r"[A-Za-z0-9]{10,40}", uid):
                out.append((uid, s))
        token = j.get("nextPageToken", "")
        if not token:
            return out


def resolver(valor):
    if re.fullmatch(r"\d{17}", valor):
        return valor
    m = re.fullmatch(r"vanity:([A-Za-z0-9_-]{2,32})", valor)
    if not m:
        return None
    r = steam("ISteamUser/ResolveVanityURL/v1", vanityurl=m.group(1)).get("response", {})
    return r.get("steamid") if r.get("success") == 1 else None


def ler(steamid):
    nome = ""
    try:
        ps = steam("ISteamUser/GetPlayerSummaries/v2", steamids=steamid).get("response", {}).get("players", [])
        nome = ps[0].get("personaname", "") if ps else ""
    except Exception as e:
        print(f"  resumo do perfil falhou: {e}")
    r = steam("IPlayerService/GetOwnedGames/v1", steamid=steamid, include_appinfo=1,
              include_played_free_games=1).get("response", {})
    if "games" not in r:
        return {"steamid": steamid, "nome": nome, "privado": True, "jogos": []}
    recentes = {}
    try:
        rp = steam("IPlayerService/GetRecentlyPlayedGames/v1", steamid=steamid, count=50).get("response", {})
        recentes = {g["appid"]: g.get("playtime_2weeks", 0) for g in rp.get("games", [])}
    except Exception as e:
        print(f"  jogos recentes falharam: {e}")
    jogos = []
    for g in r["games"]:
        if not g.get("name"):
            continue
        jogos.append({"appid": g["appid"], "nome": g["name"][:120], "min": g.get("playtime_forever", 0),
                      "min2w": recentes.get(g["appid"], 0), "ult": g.get("rtime_last_played", 0)})
    jogos.sort(key=lambda j: (-j["min2w"], -j["min"], j["nome"].lower()))
    return {"steamid": steamid, "nome": nome, "privado": False, "jogos": jogos[:3000]}


def main():
    if not CHAVE:
        print("STEAM_API_KEY não configurada; nada a fazer.")
        return
    os.makedirs(PASTA, exist_ok=True)
    open(os.path.join(PASTA, ".keep"), "w").close()
    lista = jogadores()
    ativos = set()
    for uid, valor in lista:
        arq = os.path.join(PASTA, uid + ".json")
        if not valor:
            if os.path.exists(arq):
                os.remove(arq)  # desconectou a Steam: apaga a cópia da biblioteca
                print(f"{uid}: Steam desconectada, arquivo removido")
            continue
        ativos.add(uid)
        try:
            sid = resolver(valor)
            dados = ler(sid) if sid else {"erro": "perfil", "jogos": []}
        except urllib.error.HTTPError as e:
            print(f"{uid}: erro HTTP {e.code} na Steam", file=sys.stderr)
            continue
        except Exception as e:
            print(f"{uid}: erro {e}", file=sys.stderr)
            continue
        dados["atualizadoEm"] = int(time.time())
        antigo = None
        try:
            antigo = json.load(open(arq, encoding="utf-8"))
        except (OSError, ValueError):
            pass
        if antigo and {k: v for k, v in antigo.items() if k != "atualizadoEm"} == {k: v for k, v in dados.items() if k != "atualizadoEm"}:
            continue  # nada mudou: não gera commit à toa
        json.dump(dados, open(arq, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
        print(f"{uid}: {'privado' if dados.get('privado') else str(len(dados.get('jogos', []))) + ' jogos'}")
        time.sleep(1)
    # remove arquivos de jogadores que saíram do site
    for f in os.listdir(PASTA):
        if f.endswith(".json") and f[:-5] not in {u for u, _ in lista}:
            os.remove(os.path.join(PASTA, f))


if __name__ == "__main__":
    main()
