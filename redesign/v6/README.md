# CDMX v6 — showcase lab

Status: **draft, not deployed**. Live `cdmx.be` still runs root `index.html`.

Spec: `../../docs/superpowers/specs/2026-04-21-cdmx-v6-design.md`
Plan: `../../docs/superpowers/plans/2026-04-21-cdmx-v6.md`

## Local preview
```bash
cd redesign/v6
python3 -m http.server 8080
# open http://localhost:8080
```

The edge-function demo (LLM completion) will degrade to a cached static completion in local preview unless you run `wrangler dev` alongside.

## Before deploy
See `../v5/README.md` section "Before deploy — checklist" adapted for v6:
1. Run `scripts/leak-check.sh` — must return zero hits.
2. Lighthouse ≥ 90 mobile.
3. Manual read-through on mobile + desktop.
4. Renke's explicit approval.
