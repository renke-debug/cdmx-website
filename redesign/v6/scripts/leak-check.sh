#!/usr/bin/env bash
set -euo pipefail

# CDMX v6 leak-check. Scans HTML + JSON + MD for identifying phrases and deploy-blocker placeholders.
# Exit 1 if any hit found.

TARGET="${1:-.}"

# Identifying strings + deploy placeholders. Pipe-separated regex (extended grep).
# Acronyms use \b word boundaries to avoid matching inside words like "http" (which would hit "TTP" case-insensitively).
# Run case-sensitive on acronym tokens; case-insensitive on prose tokens.
PATTERN='\bEPB\b|\bFrank\b|Schilwijs|bouwkundigen|\bJean\b|\bTTP\b|lokale LLM|Renke Pieters|\bKIXX\b|Brugge|Bruges|marketing agency|full-service|€[0-9]|YOUR_FORM_ID|REPLACE_BEFORE_DEPLOY|REPLACE_SUBDOMAIN|\b5 AI products\b|five.*AI.*products'

echo "Scanning $TARGET for leak patterns..."
if grep -rEn --include='*.html' --include='*.json' --include='*.md' --include='*.js' --include='*.toml' "$PATTERN" "$TARGET"; then
  echo
  echo "LEAK CHECK FAILED — above hits must be removed before deploy."
  exit 1
fi
echo "LEAK CHECK PASSED (no hits)."
