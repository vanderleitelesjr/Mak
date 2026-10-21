# Customized 0.5.2 update

The upstream 0.5.2 application is integrated with the thirteen approved themes and the existing local additions. Source changes are synchronized to the primary checkout with guarded comparisons and backups. Personal projects and cards remain in place.

**Installation:** Deferred safely because agent turns remained active. The prepared installer is still available locally.

## Preserved and integrated

- Independent Workspace and Chat themes; usage, quotas and model limits; Antigravity; richer Workspace cards; double-Ctrl dictation.
- Upstream named groups, message editing safeguards, terminal cleanup, graceful shutdown, mobile fixes and native platform updates. The integration base also includes the Windows screen-save lock and mobile report-menu fixes after the release tag.
- Existing project grouping migrates once into named groups, retaining saved project order, chat IDs and pinning. Group edits then survive restarts; Group tabs by project remains an explicit action. Legacy browser-only project collapse state is not migrated.
- The usage footer wraps at narrow window widths so quotas and token counts stay visible.

## Verified

- Primary checkout: production build and 196 service tests, with 190 passed, 6 skipped and no failures. Lint and template/asset checks passed in the integration worktree.
- Application renderer checks passed for all thirteen themes, native groups and keyboard movement, desktop/mobile cards, dictation, Conversation, clipboard, mobile access and report preview.
- Synthetic quota checks cover consumed/remaining values, general/exclusive limits, tooltip content, the project-group action and footer bounds at 390, 768 and 1280 px in representative light and dark themes. No real provider calls were made for this check.
- A custom Windows 0.5.2 installer is built locally. Its pinned hash, native version and runtime file manifest are checked by the updater before and after installation.

## Installation and recovery

The independent updater waits for every open agent turn to finish before normal Quit, saves settings and sessions after shutdown, installs in the existing application directory, and verifies a fresh service. It safely defers if agents remain busy. The previous pinned themes installer and source backups remain available locally for recovery.

The source integration and installer are local. The upstream theme-only PR is separate: [PR 55](https://github.com/witnesstodark/mr-mak-workspace/pull/55).
