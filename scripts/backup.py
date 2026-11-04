"""Backup diário do banco do Zerados da Galera (Firestore).

Lê pela API pública do Firestore tudo o que as regras deixam qualquer um ler (perfis com jogos,
animes e imagens, comentários, cargos, configurações, tier lists e votos, quadro e respostas,
notícias da staff) e grava em backup/zerados-AAAA-MM-DD.json.gz.
Não entram: chat (só quem está logado lê), denúncias e moderação (só a staff lê).

O arquivo é criptografado no workflow (backup.yml) com a senha do secret BACKUP_KEY antes de
virar "artifact" do GitHub Actions (fica 30 dias). Para abrir um backup baixado:
  openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -in zerados-AAAA-MM-DD.json.gz.enc -out backup.json.gz
  (pede a senha do BACKUP_KEY) e depois: gunzip backup.json.gz
"""
import gzip
import json
import os
import time
import urllib.request

PROJETO = os.environ.get("FIREBASE_PROJECT", "zerados-da-galera")
BASE = f"https://firestore.googleapis.com/v1/projects/{PROJETO}/databases/(default)/documents"
UA = "ZeradosDaGalera-Backup/1.0 (+https://zeradosdagalera.com.br/)"
# coleção -> subcoleções de cada documento
COLECOES = {"players": ["covers", "media", "shots"], "comments": [], "roles": [], "config": [],
            "tierlists": ["votes"], "board": ["resp"], "news": []}


def baixar(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for tentativa in range(4):
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                return json.loads(r.read())
        except Exception as e:  # rede instável: tenta de novo
            if tentativa == 3:
                raise
            print(f"  tentando de novo ({e})")
            time.sleep(3 * (tentativa + 1))


def listar(caminho):
    """Todos os documentos de uma coleção, no formato bruto do Firestore (dá para restaurar igualzinho)."""
    docs, token = [], ""
    while True:
        url = f"{BASE}/{caminho}?pageSize=300" + (f"&pageToken={token}" if token else "")
        j = baixar(url)
        docs.extend(j.get("documents", []))
        token = j.get("nextPageToken", "")
        if not token:
            return docs


def main():
    saida = {"projeto": PROJETO, "feitoEm": int(time.time()), "colecoes": {}}
    total = 0
    for nome, subs in COLECOES.items():
        docs = listar(nome)
        for d in docs:
            doc_id = d["name"].rsplit("/", 1)[-1]
            for sub in subs:
                try:
                    filhos = listar(f"{nome}/{doc_id}/{sub}")
                except Exception as e:
                    print(f"  {nome}/{doc_id}/{sub}: {e}")
                    filhos = []
                if filhos:
                    d.setdefault("_sub", {})[sub] = filhos
                    total += len(filhos)
        saida["colecoes"][nome] = docs
        total += len(docs)
        print(f"{nome}: {len(docs)} documentos")
    if not saida["colecoes"].get("players"):
        raise SystemExit("Nenhum perfil lido: backup cancelado para não salvar um arquivo vazio.")
    os.makedirs("backup", exist_ok=True)
    nome = time.strftime("backup/zerados-%Y-%m-%d.json.gz", time.gmtime(time.time() - 3 * 3600))
    with gzip.open(nome, "wt", encoding="utf-8") as f:
        json.dump(saida, f, ensure_ascii=False, separators=(",", ":"))
    print(f"{total} documentos salvos em {nome} ({os.path.getsize(nome) // 1024} KB)")


if __name__ == "__main__":
    main()
