#!/usr/bin/env bash
set -euo pipefail
# Requires: pyftsubset (fonttools + brotli)
# Install: pip install fonttools brotli

SRC="../../Brand/Hanken_Grotesk/HankenGrotesk-VariableFont_wght.ttf"
DST_DIR="assets/fonts"
mkdir -p "$DST_DIR"

pyftsubset "$SRC" \
  --output-file="$DST_DIR/HankenGrotesk-Variable.woff2" \
  --flavor=woff2 \
  --unicodes="U+0020-007E,U+00A0-00FF,U+2010-2027,U+2030-2052" \
  --layout-features="kern,liga,calt,frac,onum,tnum" \
  --no-hinting

echo "Wrote $DST_DIR/HankenGrotesk-Variable.woff2"
ls -lh "$DST_DIR/HankenGrotesk-Variable.woff2"
