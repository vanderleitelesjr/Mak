#!/usr/bin/env bash
# macOS counterpart of "Start Mr. Mak.cmd": opens the app on this repository.
root="$(cd "$(dirname "$0")" && pwd)"
for app in "/Applications/Mr. Mak Workspace.app" "$HOME/Applications/Mr. Mak Workspace.app" \
           "$root/src-tauri/target/release/bundle/macos/Mr. Mak Workspace.app"; do
  if [ -d "$app" ]; then open -a "$app" --args --repo "$root"; exit 0; fi
done
echo "Build the app first: ./setup.sh desktop  (see docs/getting-started.md)"
read -r -p "Press Return to close." _
