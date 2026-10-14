#!/usr/bin/env bash
# macOS / Linux counterpart of Setup.ps1.  Usage: ./setup.sh [check|preview|desktop]
set -euo pipefail
mode="${1:-check}"
cd "$(dirname "$0")"
[ -f workspace/workspace.json ] || { echo "Run setup.sh from the complete repository folder." >&2; exit 1; }
has() { command -v "$1" >/dev/null 2>&1 && echo true || echo false; }
echo "Mr. Mak Workspace setup"
echo "Node: $(has node) | npm: $(has npm) | Rust (desktop source build only): $(has cargo)"
echo "Codex CLI: $(has codex) | Claude Code CLI: $(has claude) | OpenCode: $(has opencode)"
if ! command -v codex >/dev/null && ! command -v claude >/dev/null && ! command -v opencode >/dev/null; then
  echo "Install and configure Codex CLI, Claude Code CLI or OpenCode first. See docs/getting-started.md." >&2; exit 1
fi
case "$mode" in
  check)
    echo "Source preview: ./setup.sh preview"
    echo "Source desktop build: ./setup.sh desktop"; exit 0 ;;
  preview|desktop) ;;
  *) echo "Usage: ./setup.sh [check|preview|desktop]" >&2; exit 1 ;;
esac
command -v node >/dev/null && command -v npm >/dev/null || { echo "Install Node.js 22.20 or newer." >&2; exit 1; }
node -e "const p=process.versions.node.split('.').map(Number);if(p[0]<22||(p[0]===22&&p[1]<20))process.exit(1)" \
  || { echo "Node.js 22.20 or newer is required." >&2; exit 1; }
if [ "$mode" = desktop ] && ! command -v cargo >/dev/null; then
  echo "Install stable Rust (https://rustup.rs) and, on macOS, the Xcode Command Line Tools (xcode-select --install)." >&2; exit 1
fi
npm ci
if [ "$mode" = preview ]; then
  echo "Opening the report preview. Full terminal and voice features use the desktop app."
  exec npm run dev
fi
if [ "$(uname)" = Darwin ]; then
  npm run desktop:build -- --bundles app dmg
  echo "App ready in src-tauri/target/release/bundle/macos (disk image in bundle/dmg)."
  echo "Drag Mr. Mak Workspace.app to Applications, then double-click 'Start Mr. Mak.command'."
else
  npm run desktop:build:appimage
  echo "AppImage ready in src-tauri/target/release/bundle/appimage."
fi
