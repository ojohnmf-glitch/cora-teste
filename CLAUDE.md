# Cora — protótipo para teste com pessoas

Companheira virtual de conversa para pessoas 70+ que moram sozinhas. Versão standalone (sem conta no claude.ai),
hospedada no GitHub Pages, com as respostas vindo da API da Anthropic por um Cloudflare Worker do dono do projeto.
Leia o `README.md` para o passo a passo de infraestrutura.

## Arquitetura (não mude sem motivo)

- `index.html` — o app inteiro: CSS, HTML e JS num arquivo só. Sem build, sem dependências, sem framework.
- `worker/worker.js` — proxy mínimo na Cloudflare. Já está publicado em `https://cora-proxy.johnatanmf.workers.dev`
  (URL fixada em `CONFIG.proxy` no topo do script do `index.html`). Segredos `ANTHROPIC_API_KEY` e `ACCESS_CODE` vivem só lá.
  Se mudar o Worker, o dono precisa colar o código novo no painel da Cloudflare — o deploy dele NÃO é automático.
- `lume-chamada.jpg`, `cora-*.mp4` — rosto e vídeos (início, ouvindo, falando). O JS troca entre os vídeos por um mapa
  de poses (`VMAP`); não renomear.
- `manifest.json`, `icone.png` — "Adicionar à tela de início".
- `exemplos/nicolina.json` + `registro-nicolina.html` + `registro/` — registro de uso simulado (persona Nicolina); `?exemplo=nicolina` carrega no app via `loadExample()`; `?zerar=1` apaga tudo e começa do zero.
- Deploy da página: push na `main` → GitHub Pages republica sozinho em 1–2 min em `https://ojohnmf-glitch.github.io/cora-teste/`.

## Como a conversa funciona

- `rules()` monta o prompt da Cora a cada turno (perfil, memórias, lembretes, regras de tom). A resposta do modelo é
  fala + bloco `<<<DADOS>>>` com JSON (perfil, humor, risco, memórias novas, lembretes, caderno…); `splitReply()` separa
  e `applyData()` aplica. Mudanças de comportamento da Cora normalmente são edições em `rules()`.
- `makeProxySample()` é a ponte com o Worker (streaming SSE). Mesma interface do `sample` do runtime de artifacts.
- Estado fica só no `localStorage` do aparelho (`companheira_state_v1`, `companheira_chat_v1`). Não há servidor de dados.
- Código de acesso chega por `?codigo=XXXX`, é guardado em `localStorage` (`cora_codigo`) e removido da URL.

## Público e princípios de UX (ver histórico do teste com a persona "Nicolina")

- Usuária 70+, conversadora, pouco interesse em tecnologia. Botões grandes, poucas decisões por tela, linguagem cotidiana.
- Nunca usar na interface: avatar, interface, IA generativa, customizar, configurações avançadas. Dizer "a Cora", "guardar", "lembrar".
- A Cora diz na própria fala o que vai guardar ("vou guardar que a Nicole é sua neta") — memória às claras. Não reintroduzir
  avisos de sistema para isso.
- Sem botão de emergência nas telas (assustava): os telefones ficam só em Menu → Telefones de emergência; abrir a tela não liga para ninguém; números são links `tel:`. O cartão de segurança automático na conversa (risco detectado) continua.
- Entrada direta na conversa: nenhuma tela de configuração antes do primeiro "oi". Ajustes de voz ficam em Perfil e ajustes.
- Limitações conhecidas e aceitas nesta versão: sem notificação com a página fechada; microfone é o do teclado do celular
  (o da página pode não abrir); Modo Família não está no menu.

## Checagens antes de dar push

- Abrir `index.html` num navegador (pode ser via `python3 -m http.server`) e: tela inicial → Vamos conversar → menu → Telefones de emergência → O que Cora lembra, sem erro no console.
- Não colocar chave de API, código de acesso novo ou dados de testadores em arquivo nenhum do repositório.
- Commits em português, curtos, dizendo o que mudou para a pessoa que testa.
