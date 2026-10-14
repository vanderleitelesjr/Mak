# Mr. Mak Workspace on macOS

The desktop app was built for Windows (and Linux). This document covers the macOS port:
what changed, how to build and run it, how it was verified, and what is still open.
The contributor reports native Apple Silicon operation and the checks below
for PR #25. The combined 0.5.1 update adds CI verification and a bounded login-shell
probe; its build status is tracked by the repository's Checks workflow.

## Build and run

Prerequisites: Node.js 22.20+, [Rust](https://rustup.rs), Xcode Command Line Tools
(`xcode-select --install`), and at least one agent CLI (Claude Code, Codex or OpenCode).

```bash
./setup.sh check      # report prerequisites
./setup.sh desktop    # npm ci + build Mr. Mak Workspace.app and a .dmg
```

Output: `src-tauri/target/release/bundle/macos/Mr. Mak Workspace.app` (and `bundle/dmg/`).
Copy the app to Applications and double-click **Start Mr. Mak.command** in the repository,
which opens the app on this repository. The build is not signed: the first launch needs
right-click › Open, and macOS asks again for permissions (e.g. microphone) after each rebuild,
because an ad-hoc signature changes with every build.

Development: `./node_modules/.bin/tauri dev -- -- --repo "$PWD"`. Without `--repo`,
`tauri dev` starts in `src-tauri/` and waits on a (hidden) repository picker. Dev mode serves
`dist/`; run `npm run build` first.

## What changed

### Native app (`src-tauri/`)
| Change | Why |
|---|---|
| `app` and `dmg` bundle targets, `icons/icon.icns`, `Info.plist` with `NSMicrophoneUsageDescription` | Mac packaging; voice needs a microphone usage string |
| Login-shell `PATH` for the service | Finder/Dock launches can find installed CLIs; after two seconds an unresponsive shell falls back to the inherited PATH plus common CLI folders |
| `mac_key.rs`: ⌃⌥Space recall shortcut (`tauri-plugin-global-shortcut`), shared with the Win-key setting | macOS counterpart of the Win-key recall |
| `RunEvent::Reopen` brings both windows back | Closing a window only hides it; a Dock click must restore it |
| Native file drag-out enabled on macOS (`drag` crate) | Drag files from Workspace to Finder and other apps |
| Show in Finder uses `open -R` | Finder selects the file instead of only opening its folder |
| **Chats** menu with Chat 1–9 on ⌘1–⌘9 | The WKWebView never receives ⌘+number, so tab switching lives in the menu (as in other Mac apps) |

### Packaging (`desktop/prepare.mjs`, `scripts/fix-pty-permissions.mjs`)
- Homebrew's `node` is a launcher linked to `libnode.dylib` and cannot run from the bundle
  (the service crashed with `Library not loaded: libnode.*.dylib`). On macOS the build now
  downloads the official self-contained Node of the same version from nodejs.org,
  verifies its SHA-256 against `SHASUMS256.txt`, caches it in `.cache/node-download` and
  bundles that. The copy is made writable, so rebuilds can replace it.
- npm unpacks node-pty's `spawn-helper` without the execute bit; every terminal then fails
  with `posix_spawnp failed`. It is fixed after `npm install` (postinstall) and in the bundle.

### Service (`desktop/service/`)
- Tailscale CLI inside `Tailscale.app`; Claude Code's managed MCP file at
  `/Library/Application Support/ClaudeCode/managed-mcp.json` (Linux: `/etc/claude-code/`).
- Dropped paths in a shell are quoted the POSIX way (`'\''` for an apostrophe); PowerShell keeps `''`.
- Platform-neutral error texts (no "Windows"/"Explorer" on other systems).

### Interface (`src/`)
- `src/desktop/platform.ts`: one place for platform conventions.
- Shortcuts use ⌘ on macOS (⌘⇧T/P/H/W, ⌘1–9); Ctrl+Tab still cycles.
- Terminals: ⌘C/⌘V copy and paste; Ctrl+C reaches the CLI (as in Terminal.app);
  Option+drag selects text while an agent captures the mouse; SF Mono/Menlo fonts.
- Finder/Trash/macOS wording instead of Explorer/Recycle Bin/Windows; Settings shows the
  ⌃⌥Space shortcut.
- WebKit fixes: the voice release request uses `keepalive` (WebKit cancels requests from a
  closing page); report iframes are only touched when same-origin; phone recordings are stored
  in IndexedDB as bytes, not Blobs (Safari Private Browsing).

### Scripts
`setup.sh` (macOS/Linux counterpart of `Setup.ps1`), `Start Mr. Mak.command`
(counterpart of `Start Mr. Mak.cmd`), `scripts/check-macos-native.sh`.

## Verification

| Suite | How | Result |
|---|---|---|
| UI suites (8) + preview/template checks | Playwright, headless; **WebKit** by default on macOS (`desktop/service/test/browser.mjs`), also Chromium | 20/20 pass |
| Service tests | `npm run desktop:test` | 90 pass, 0 fail, 2 skipped |
| Rust tests | `cargo test` in `src-tauri` | 2/2 |
| Template checks | `npm run test:template` | 9/9 |
| Native checks | `scripts/check-macos-native.sh` (Accessibility; needs the screen ~30 s) | Chats menu, ⌘1/⌘2, menu switch, ⌘⇧W, Dock reopen, ⌃⌥Space: all pass |
| Manual, on the release app | — | macOS labels; dropping a path with an apostrophe + `ls`; Show in Finder (folder and file); drag a file out to Finder; drag a file into a terminal |

The UI tests now run in the engine of each platform's app (WebView2/Edge on Windows,
WKWebView/WebKit on macOS); `MRMAK_TEST_BROWSER=chromium|webkit|msedge` overrides. Several tests
needed engine-aware fixes (platform copy keys, WebKit clipboard permissions, a prototype-level
microphone stub, server-side "lost reply" simulation because Playwright's WebKit cannot route
service-worker requests, and two timing races).

## Known limits / not tested
- Unsigned, Apple Silicon only (`aarch64`); no notarisation. An Intel or universal build needs
  `--target universal-apple-darwin` and both Rust targets.
- The Live voice coordinator needs `OPENAI_API_KEY` in the ignored `.env`.
  Dictation can use optional local Whisper instead. The real microphone permission
  prompt was not exercised in the contributor's native checks.
- Mobile access over Tailscale was only tested in automation (WebKit = iPhone Safari's engine),
  not with a real phone.
- The tray (menu-bar) menu is not reachable through Accessibility, so it is not in the native checks.
- `rust-objcopy` cannot strip the release binary on this toolchain (harmless warning).
