// Cloudflare Worker — one-shot LLM completion with rate limit + static fallback.
// Never accepts user input; prompt is server-side. Called once per visitor session.

const SYSTEM_PROMPT = `You complete the last sentence of a manifest about AI and taste.
Return 8–16 words. No quotes. No preamble. Sentence must end with a period.
Theme: the difference between slop and craft is attention, not the model.`;

const USER_PROMPT = `Complete: "Most people will produce more mediocre work with AI.
A few people will produce work that could not exist without it.
The difference is ..."`;

export default {
  async fetch(req, env, ctx) {
    if (req.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }
    const ip = req.headers.get('cf-connecting-ip') || 'anon';

    globalThis.__rl ??= new Map();
    const rl = globalThis.__rl;
    const now = Date.now();
    const windowStart = now - Number(env.RATE_LIMIT_WINDOW_MS);
    const rec = rl.get(ip) ?? [];
    const recent = rec.filter(t => t > windowStart);
    if (recent.length >= Number(env.RATE_LIMIT_PER_IP)) {
      return json({ text: env.FALLBACK_TEXT, cached: true });
    }
    recent.push(now);
    rl.set(ip, recent);

    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: Number(env.MAX_TOKENS),
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: USER_PROMPT }],
        }),
      });
      if (!resp.ok) return json({ text: env.FALLBACK_TEXT, cached: true });
      const data = await resp.json();
      const text = (data.content?.[0]?.text ?? '').trim();
      return json({ text: text || env.FALLBACK_TEXT, cached: false });
    } catch {
      return json({ text: env.FALLBACK_TEXT, cached: true });
    }
  }
};

function json(obj) {
  return new Response(JSON.stringify(obj), {
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': 'https://cdmx.be',
      'cache-control': 'no-store',
    },
  });
}
