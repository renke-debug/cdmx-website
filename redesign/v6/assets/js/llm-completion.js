// Streams the worker response char-by-char into the DOM slot.
// One call per session (sessionStorage flag). Falls back to a cached sentence.

const ENDPOINT_PROD = 'https://cdmx-v6-completion.REPLACE_SUBDOMAIN.workers.dev/';
const ENDPOINT_DEV = 'http://127.0.0.1:8787/';
const ENDPOINT = (location.hostname === 'cdmx.be') ? ENDPOINT_PROD : ENDPOINT_DEV;

const STATIC_FALLBACK = '... the difference is not the tool. The difference is the attention.';

export async function runCompletion(slotEl) {
  if (!slotEl) return;

  if (sessionStorage.getItem('cdmx.llm.done') === '1') {
    slotEl.textContent = sessionStorage.getItem('cdmx.llm.last') || STATIC_FALLBACK;
    return;
  }

  let text;
  try {
    const resp = await fetch(ENDPOINT, { cache: 'no-store' });
    if (!resp.ok) throw new Error('edge failed');
    const data = await resp.json();
    text = (data.text || '').trim();
    if (!text) throw new Error('empty');
  } catch {
    text = STATIC_FALLBACK;
  }

  slotEl.dataset.state = 'streaming';
  slotEl.textContent = '';
  for (let i = 0; i < text.length; i++) {
    slotEl.textContent += text[i];
    const pause = /[.,]/.test(text[i]) ? 220 : 20 + Math.random() * 40;
    // eslint-disable-next-line no-await-in-loop
    await new Promise(r => setTimeout(r, pause));
  }
  slotEl.dataset.state = 'done';
  sessionStorage.setItem('cdmx.llm.done', '1');
  sessionStorage.setItem('cdmx.llm.last', text);
}
