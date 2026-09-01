#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
PROFILE_DIR="${REPO_ROOT}/.chrome-test-profile"
CHROME_APP="/Applications/Google Chrome.app"
CHROME_BIN="${CHROME_APP}/Contents/MacOS/Google Chrome"

if [[ ! -d "${CHROME_APP}" ]]; then
  echo "Google Chrome was not found at ${CHROME_APP}" >&2
  exit 1
fi

PROFILE_PIDS="$(pgrep -f "Google Chrome.*--user-data-dir=${PROFILE_DIR}" || true)"
if [[ -n "${PROFILE_PIDS}" ]]; then
  echo "Closing existing disposable Chrome profile..."
  kill ${PROFILE_PIDS}
  for _ in {1..40}; do
    if ! pgrep -f "Google Chrome.*--user-data-dir=${PROFILE_DIR}" >/dev/null; then
      break
    fi
    sleep 0.25
  done
fi

if [[ "${1:-}" == "--reset" ]]; then
  rm -rf "${PROFILE_DIR}"
fi

mkdir -p "${PROFILE_DIR}"

WINDOW_A_TABS=(
  "https://www.amazon.com/"
  "https://www.amazon.com/gp/cart/view.html"
  "https://www.duolingo.com/"
  "https://docs.google.com/document/d/DOC_ID/edit"
  "chrome://extensions/"
)

WINDOW_B_TABS=(
  "https://www.amazon.com/deals"
  "https://www.instagram.com/"
  "https://docs.google.com/spreadsheets/d/SHEET_ID/edit"
)

open -na "Google Chrome" --args \
  --user-data-dir="${PROFILE_DIR}" \
  --enable-extensions \
  --load-extension="${REPO_ROOT}" \
  --disable-extensions-except="${REPO_ROOT}" \
  --no-first-run \
  --no-default-browser-check \
  about:blank

for _ in {1..40}; do
  if [[ -f "${PROFILE_DIR}/RunningChromeVersion" ]]; then
    break
  fi
  sleep 0.25
done

"${CHROME_BIN}" \
  --user-data-dir="${PROFILE_DIR}" \
  --enable-extensions \
  --load-extension="${REPO_ROOT}" \
  --disable-extensions-except="${REPO_ROOT}" \
  --new-window \
  "${WINDOW_A_TABS[@]}" \
  >/dev/null 2>&1 &

"${CHROME_BIN}" \
  --user-data-dir="${PROFILE_DIR}" \
  --enable-extensions \
  --load-extension="${REPO_ROOT}" \
  --disable-extensions-except="${REPO_ROOT}" \
  --new-window \
  "${WINDOW_B_TABS[@]}" \
  >/dev/null 2>&1 &

cat <<EOF
Disposable Chrome profile opened with the unpacked extension loaded.

Profile: ${PROFILE_DIR}

Prepared windows:
- Window A: amazon.com x2, duolingo.com, docs.google.com, chrome://extensions
- Window B: amazon.com, instagram.com, docs.google.com spreadsheet

Use --reset to remove and recreate the disposable profile:
  npm run test:chrome:move -- --reset
EOF
