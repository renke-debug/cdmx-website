// Tweak panel — hidden unless ?tweaks=1 or postMessage({type:'__activate_edit_mode'}).
// Persists selection to localStorage and updates body[data-pattern]/[data-hero].

const STORAGE_KEY = 'cdmx.tweaks';
const PATTERNS = ['yellow', 'mint', 'green', 'none'];
const HERO_VARIANTS = [
  ['default', 'Plain'],
  ['strike', 'Struck'],
  ['highlight', 'Yellow'],
  ['mono', 'Monotone'],
];

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveState(s) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

export function startTweakPanel(mount) {
  if (!mount) return;

  // Hydrate from storage
  const stored = loadState();
  let pattern = stored?.pattern || document.body.dataset.pattern || 'yellow';
  let heroVariant = stored?.heroVariant || document.body.dataset.hero || 'default';
  document.body.dataset.pattern = pattern;
  document.body.dataset.hero = heroVariant;

  let open = false;

  const urlOpen = new URLSearchParams(location.search).get('tweaks') === '1';
  if (urlOpen) open = true;

  function render() {
    if (!open) {
      mount.classList.remove('open');
      mount.innerHTML = '';
      return;
    }
    mount.classList.add('open');
    mount.innerHTML = `
      <h5>Tweaks</h5>
      <div class="tweak-row">
        <label>Hero pattern</label>
        <div class="tweak-opts" data-row="pattern">
          ${PATTERNS.map((p) => `<button type="button" data-val="${p}" class="${pattern === p ? 'on' : ''}">${p}</button>`).join('')}
        </div>
      </div>
      <div class="tweak-row">
        <label>Hero line 2 emphasis</label>
        <div class="tweak-opts" data-row="heroVariant">
          ${HERO_VARIANTS.map(([k, l]) => `<button type="button" data-val="${k}" class="${heroVariant === k ? 'on' : ''}">${l}</button>`).join('')}
        </div>
      </div>
    `;
    mount.querySelectorAll('[data-row] button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const row = btn.closest('[data-row]').dataset.row;
        const val = btn.dataset.val;
        if (row === 'pattern') {
          pattern = val;
          document.body.dataset.pattern = val;
        } else if (row === 'heroVariant') {
          heroVariant = val;
          document.body.dataset.hero = val;
        }
        saveState({ pattern, heroVariant });
        render();
        try {
          window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [row]: val } }, '*');
        } catch {}
      });
    });
  }

  window.addEventListener('message', (e) => {
    const d = e.data || {};
    if (d.type === '__activate_edit_mode') {
      open = true;
      render();
    }
    if (d.type === '__deactivate_edit_mode') {
      open = false;
      render();
    }
  });

  try {
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
  } catch {}

  render();
}
