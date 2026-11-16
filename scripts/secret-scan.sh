#!/usr/bin/env bash
# CodeSense AI — secret scan used by CI (kept in repo for local runs).
#
# Detects real credential VALUE patterns (provider key formats, private keys)
# and hardcoded credential assignments in production source. Deliberately
# does NOT flag variable names that merely contain words like "token"
# (e.g. csrfToken) or documented test fixtures, which caused false positives.
#
# `tests/artifacts/` is excluded from the value-pattern scan: those files are
# machine-generated QA evidence (Lighthouse reports embed full-page screenshots
# as base64 JPEG, whose random character sequences can coincidentally resemble
# credential formats — verified false positives, e.g. "AKIA…" inside a data
# URI). Source, config and documentation files remain fully scanned.

set -u

fail=0

# 1) Known credential value formats anywhere in tracked file types.
if grep -rniE \
  'AIza[0-9A-Za-z_-]{30,}|gh[pousr]_[0-9A-Za-z]{36,}|nfp_[0-9A-Za-z]{20,}|sk-[0-9A-Za-z]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----' \
  --include='*.js' --include='*.json' --include='*.html' --include='*.css' \
  --include='*.yml' --include='*.yaml' --include='*.md' --include='*.toml' \
  --include='*.example' --include='*.txt' \
  --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=artifacts \
  . ; then
  echo "Potential secret detected above (credential value pattern)."
  fail=1
fi

# 2) Hardcoded credential assignments in production source (not tests).
if grep -rniE "(api[_-]?key|secret|password|passwd|token)[\"']?[[:space:]]*[:=][[:space:]]*[\"'][A-Za-z0-9+/_.-]{16,}[\"']" \
  --include='*.js' --include='*.html' \
  --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=tests \
  --exclude='*.test.js' \
  frontend/ backend/src/ backend/server.js 2>/dev/null; then
  echo "Potential hardcoded credential detected above."
  fail=1
fi

if [ "$fail" -ne 0 ]; then
  exit 1
fi

echo "No secrets detected."
