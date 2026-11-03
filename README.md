# Zerados da Galera

Comunidade da galera para registrar jogos zerados, o que está jogando, dicas, tier list, chat e ranking.
Criado por **João Rodrigues**.

Site estático (GitHub Pages) + Firebase (login e banco de dados) + RAWG (nomes e capas dos jogos).

## Arquivos

| Arquivo | Para quê |
|---|---|
| `index.html`, `styles.css`, `app.js` | O site |
| `config.js` | Chaves do Firebase, seu ID de dono e chave do RAWG |
| `firestore.rules` | Regras de segurança do banco (cole no Firebase) |
| `backup-soarezx.json` | Seu perfil do teste no Claude, para importar. **Não suba esse arquivo no GitHub.** |

## Passo a passo

### 1. Firebase
1. Em [console.firebase.google.com](https://console.firebase.google.com), abra o projeto `zerados-da-galera`.
2. Na página inicial do projeto, clique no ícone **`</>`** (Web), dê o apelido `site` e clique em **Registrar app**. Não precisa marcar Hosting.
3. Copie os valores do `firebaseConfig` que aparecem (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId) para o `config.js`.
4. Menu **Authentication** → **Vamos começar** → aba **Método de login**:
   - ative **E-mail/senha**;
   - ative **Google** (escolha seu e-mail de suporte e salve).
5. Menu **Firestore Database** → **Criar banco de dados** → local **southamerica-east1 (São Paulo)** → **modo de produção**.
6. Ainda no Firestore, aba **Regras**: apague tudo, cole o conteúdo de `firestore.rules` e clique em **Publicar** (o UID você troca no passo 4).

### 2. RAWG
1. Crie conta em [rawg.io](https://rawg.io) e pegue a chave em [rawg.io/apidocs](https://rawg.io/apidocs).
2. Cole em `rawgKey` no `config.js`.

### 3. GitHub
1. Em [github.com/new](https://github.com/new), crie o repositório **público** `zerados-da-galera`.
2. **Add file → Upload files** e arraste: `index.html`, `styles.css`, `app.js`, `config.js` (já preenchido). Clique em **Commit changes**.
3. **Settings → Pages** → em *Branch* escolha `main` e pasta `/ (root)` → **Save**.
4. Em 1–2 minutos o site fica em `https://SEU-USUARIO.github.io/zerados-da-galera/`.
5. No Firebase: **Authentication → Configurações → Domínios autorizados → Adicionar domínio** → `SEU-USUARIO.github.io`.

### 4. Virar dono do site
1. Abra o site, clique em **Criar conta** (ou **Entrar com Google**) e confirme o e-mail.
2. Crie seu perfil e salve. Depois abra **Editar perfil → Sua conta** e copie **Seu ID**.
3. Cole esse ID:
   - em `ownerUid` no `config.js` (suba o arquivo de novo no GitHub);
   - no lugar de `COLE_SEU_UID_AQUI` nas regras do Firestore (e publique de novo).
4. Recarregue o site: aparece o botão **Painel do dono**.

### 5. Trazer seu perfil do teste
**Editar perfil → Sua conta → Importar backup** → escolha `backup-soarezx.json`.
Vêm apelido, título, plataformas e os 13 jogos. Fotos, banner e prints você envia de novo.

## Para atualizar o site depois
Substitua o arquivo no GitHub (**Add file → Upload files**, mesmo nome) e confirme. O site atualiza em 1–2 minutos.

## Segurança

Já incluído:
- login com e-mail confirmado ou Google; recuperação de senha por e-mail;
- regras do Firestore: cada um só altera os próprios dados, só o dono mexe em cargos, configurações e denúncias, chat só para quem está logado, imagens com limite de tamanho;
- moderação: dono apaga comentários e mensagens; bloquear e denunciar usuários;
- LGPD: termos e privacidade, baixar os próprios dados, excluir a conta;
- HTTPS automático pelo GitHub Pages.

Também incluído:
- **Regras versionadas**: `firestore.rules` + `firebase.json` + `.firebaserc`. Para publicar pelo computador: `npm i -g firebase-tools`, `firebase login`, `firebase deploy --only firestore:rules`. Antes, compare o arquivo com Firestore → Regras no console; se for diferente, descubra por quê antes de sobrescrever.
- **SRI** nos 3 scripts do Firebase (10.12.2) no `index.html`. Ao trocar de versão, gere hashes novos (`curl -s URL | openssl dgst -sha384 -binary | base64`), senão o site não carrega.
- **Chave do Firebase restrita por site** (Google Cloud → Credenciais → Browser key → Referenciadores HTTP): `soareszx1.github.io/*`, `zeradosdagalera.com.br/*`, `www.zeradosdagalera.com.br/*`. Se trocar de domínio, adicione o novo ANTES de tirar o antigo, e também em Firebase → Authentication → Configurações → Domínios autorizados.

A fazer:
1. **Cabeçalhos de segurança** (o GitHub Pages não permite): se o domínio passar pelo Cloudflare (proxy laranja ligado), criar em Rules → Transform Rules → Modify Response Header:
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Content-Security-Policy` liberando só: o próprio site, `www.gstatic.com` (Firebase), `*.googleapis.com` e `*.firebaseapp.com` (login e banco), fonts.googleapis.com / fonts.gstatic.com, imagens da Steam/Wikipédia. Testar primeiro como `Content-Security-Policy-Report-Only`.
2. **App Check** (Firebase → App Check) com reCAPTCHA v3, para bloquear bots fora do site.
3. **Backup**: Firestore → Importar/Exportar (exige plano Blaze) ou exportar os dados pelo próprio site de vez em quando.
4. **Alertas de uso**: Firebase → Uso e faturamento.

## Próximas ideias
- Bot do Discord avisando quando alguém zera (precisa de Cloud Functions)
- Mensagens privadas de verdade
- Notificações no celular
