# Cora — protótipo para teste com pessoas

Versão do protótipo Cora que roda em qualquer celular por um link, **sem conta no claude.ai**.
A página fica no GitHub Pages; as respostas vêm da API da Anthropic através de um "servidor de bolso"
(Cloudflare Worker) que guarda a sua chave. Quem testa só abre o link.

```
celular da pessoa  ──►  GitHub Pages (index.html)  ──►  Cloudflare Worker (sua chave)  ──►  API da Anthropic
```

O que fica onde:
- **Conversa, memórias, lembretes, caderno:** só no celular da pessoa (`localStorage`). Nada vai pro seu servidor.
- **Chave da API:** só no Worker. Nunca entra na página.
- **Código de acesso:** evita que o link vaze e gaste seus tokens. Vai dentro do link (`?codigo=...`) e fica guardado no celular.

## Arquivos

| Arquivo | O que é |
|---|---|
| `index.html` | O protótipo inteiro (uma página só) |
| `lume-chamada.jpg`, `cora-*.mp4` | Rosto e vídeos da Cora |
| `manifest.json`, `icone.png` | Para "Adicionar à tela de início" virar um ícone chamado Cora |
| `worker/worker.js` | O proxy (cole na Cloudflare) |
| `worker/wrangler.toml` | Config, só se for publicar o Worker pela linha de comando |

## Passo 1 — Chave da API

1. Entre em https://console.anthropic.com → **API Keys** → **Create Key**. Copie (começa com `sk-ant-`).
2. Coloque um limite de gasto em **Settings → Limits** (R$ 50 cobre dezenas de dias de teste).

## Passo 2 — Worker na Cloudflare (10 min, sem instalar nada)

1. Crie uma conta gratuita em https://dash.cloudflare.com.
2. Menu **Workers & Pages → Create → Create Worker**. Dê o nome `cora-proxy` e clique **Deploy**.
3. Clique **Edit code**, apague tudo, cole o conteúdo de `worker/worker.js`, clique **Deploy**.
4. Volte ao Worker → **Settings → Variables and Secrets → Add**:
   - `ANTHROPIC_API_KEY` (tipo *Secret*): a chave do passo 1
   - `ACCESS_CODE` (tipo *Secret*): um código seu, ex. `nini2026`
5. Anote a URL do Worker, algo como `https://cora-proxy.SEU-USUARIO.workers.dev`.

Teste no navegador: abrir a URL deve mostrar `Use POST`. É sinal de que está no ar.

*Alternativa por linha de comando:* `cd worker && npx wrangler login && npx wrangler secret put ANTHROPIC_API_KEY && npx wrangler secret put ACCESS_CODE && npx wrangler deploy`.

## Passo 3 — Apontar a página para o Worker (já feito neste pacote)

Abra `index.html` num editor de texto, procure a linha

```js
const CONFIG = { proxy: "https://SEU-WORKER.workers.dev" };
```

e troque pela URL do seu Worker. Salve.

## Passo 4 — GitHub Pages (5 min)

1. Em https://github.com/new crie um repositório **público** (ex. `cora-teste`).
2. **Add file → Upload files**: arraste todos os arquivos desta pasta (inclusive a pasta `worker`). **Commit**.
3. **Settings → Pages → Build and deployment**: Source *Deploy from a branch*, Branch `main`, pasta `/ (root)`. **Save**.
4. Em um ou dois minutos a página aparece em `https://SEU-USUARIO.github.io/cora-teste/`.

Para restringir o Worker a esse endereço, adicione no Worker a variável `ALLOWED_ORIGIN = https://SEU-USUARIO.github.io`.

## Passo 5 — Link para quem vai testar

Mande **sempre com o código**:

```
https://SEU-USUARIO.github.io/cora-teste/?codigo=nini2026
```

Na primeira abertura o código é guardado no celular e some da barra de endereço. Depois disso o link sem código também funciona naquele aparelho.
Se precisar trocar, há um campo "Código de acesso do teste" em **Menu → Perfil e ajustes → Privacidade**.

### No celular da pessoa (quem monta o teste faz isso, não ela)

1. Abrir o link no **Chrome** (Android) ou **Safari** (iPhone).
2. **Adicionar à tela de início** (Android: menu ⋮ → *Adicionar à tela inicial*; iPhone: botão compartilhar → *Adicionar à Tela de Início*). Vira um ícone "Cora".
3. Abrir pelo ícone, tocar em **Vamos conversar**, mandar um "oi" de teste e conferir se a voz sai.
   - Android Samsung costuma vir com voz robótica: em **Menu → Perfil e ajustes → Voz** tem o passo a passo para trocar pela voz do Google.
   - iPhone: baixar a voz *Luciana (Premium)* em Ajustes → Acessibilidade → Conteúdo Falado.
4. **Menu → Perfil e ajustes → Apagar só a conversa**, para a pessoa começar do zero.
5. Deixar **Puxar assunto quando ficar em silêncio** em 20 min se quiser testar a Cora chamando. Só funciona com a página aberta na tela.

## Limites desta versão

- Sem notificação: se a pessoa fechar a página, a Cora não chama nem lembra remédio. Teste de "ela volta sozinha?" vale, teste de lembrete só com a página aberta.
- Microfone: dentro da página o microfone pode não abrir; a pessoa dita pelo microfone do **teclado** do celular. O botão de microfone explica isso.
- Modo Família não aparece aqui (dependia da conta). O painel pode voltar numa próxima versão.
- Tudo fica no celular: se limparem os dados do navegador, a Cora esquece tudo. Para guardar o log do teste, use **ver a conversa escrita** e copie.

## Custo

Cada mensagem manda a conversa recente mais as instruções da Cora (uns 3 a 5 mil tokens de entrada, 100 a 300 de saída).
Com `claude-sonnet-5-5`, um dia de uso ativo (30 a 40 mensagens) fica na casa de centavos de dólar; confira na sua conta da Anthropic.
Para gastar menos, mude `MODEL` para `claude-haiku-5-5` nas variáveis do Worker (respostas um pouco mais simples).

## Registro de uso simulado

`registro-nicolina.html` é a transcrição de dois dias de uso simulado no app publicado, com a Cora real respondendo
(persona Nicolina, viúva, 70+). Para abrir o app já com essa conversa, memórias e caderno carregados:
`https://SEU-USUARIO.github.io/cora-teste/?codigo=SEU-CODIGO&exemplo=nicolina` (ou Menu → Perfil e ajustes → "Carregar a conversa da Nicolina").

Para começar do zero num aparelho que já tem dados (ex.: depois de carregar a Nini): `…/cora-teste/?codigo=SEU-CODIGO&zerar=1`.
