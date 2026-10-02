#!/usr/bin/env bash
set -euo pipefail

hooks_path="$(git config --local --get core.hooksPath || true)"
if [[ -n "${hooks_path}" ]]; then
  git config --local --unset-all core.hooksPath
fi

status=0
lefthook install || status=$?

if [[ -n "${hooks_path}" ]]; then
  git config --local core.hooksPath "${hooks_path}"
fi

exit "${status}"
