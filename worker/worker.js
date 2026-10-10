/* Cora — proxy mínimo para a API da Anthropic (Cloudflare Worker).
   A chave fica aqui, nunca na página. A página manda {messages, tier} e recebe o stream de volta.
   Segredos (wrangler secret put ...): ANTHROPIC_API_KEY (obrigatório), ACCESS_CODE (recomendado).
   Variáveis opcionais: MODEL (padrão claude-sonnet-5-5), MODEL_QUICK (padrão claude-haiku-5-5), ALLOWED_ORIGIN. */
export default {
  async fetch(req, env) {
    const cors = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Access-Code",
    };
    const reply = (text, status) => new Response(text, { status, headers: { ...cors, "Content-Type": "text/plain; charset=utf-8" } });
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (req.method !== "POST") return reply("Use POST", 405);
    if (!env.ANTHROPIC_API_KEY) return reply("ANTHROPIC_API_KEY não configurada no Worker", 500);
    if (env.ACCESS_CODE && req.headers.get("X-Access-Code") !== env.ACCESS_CODE) return reply("Código de acesso inválido", 401);

    let body;
    try { body = await req.json(); } catch { return reply("JSON inválido", 400); }
    const raw = Array.isArray(body.messages) ? body.messages : [];
    // Mantém só user/assistant com texto, junta turnos seguidos do mesmo papel, limita tamanho.
    const messages = [];
    for (const m of raw.slice(-80)) {
      if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string" || !m.content.trim()) continue;
      const last = messages[messages.length - 1];
      if (last && last.role === m.role) last.content += "\n\n" + m.content; else messages.push({ role: m.role, content: m.content });
    }
    if (!messages.length || messages[0].role !== "user") return reply("Sem mensagens", 400);
    if (messages.reduce((n, m) => n + m.content.length, 0) > 150000) return reply("Conversa longa demais", 413);

    const model = body.tier === "quick" ? (env.MODEL_QUICK || "claude-haiku-5-5") : (env.MODEL || "claude-sonnet-5-5");
    const up = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model, max_tokens: 1500, stream: true, messages }),
    });
    if (!up.ok) {
      const t = await up.text().catch(() => "");
      return reply(t.slice(0, 500), up.status === 429 ? 429 : 502);
    }
    return new Response(up.body, { headers: { ...cors, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
  },
};
