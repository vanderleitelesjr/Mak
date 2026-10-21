# Theme implementation

All ten variants were approved on 20 October 2026 and implemented in the shared application catalog. Workspace and Chat can select them independently. The three tool-inspired themes remain available, bringing the catalog to thirteen named themes alongside Dark, Light and System.

| Family | Light | Dark |
| --- | --- | --- |
| Nordic | Fjord | Polar Night |
| Forest | Botanical | Moss & Brass |
| Sandstone | Clay | Desert Night |
| Ocean | Sea Glass | Harbor |
| Plum | Orchid Paper | Velvet |

Saved family identifiers continue to select Fjord, Moss & Brass, Clay, Harbor and Velvet respectively. No preference reset is required. Each variant includes its approved action-label colour. Orchid Paper's muted ink was darkened by one RGB step to keep secondary labels above 4.5:1 even on its deepest surface.

## Verified

- Production build, lint and the native installer build passed.
- Three catalog/API tests passed: approved palette parity, readable foregrounds and action labels, valid saved identifiers, independent settings, invalid-value rejection and persistence after a service restart.
- All thirteen named themes passed the isolated application renderer checks in Workspace, standard reports, Conversation and Terminal, including multiple-window synchronisation, system preference and retained drafts, report state and terminal connection.
- Chat layouts fit 390, 768 and 1280 px. Representative light and dark Workspace and Conversation captures were visually inspected.
- The comparison previews retain their own colours inside light and dark report chrome; the editable study remains available in the Theme comparison tab.

## Application update

The independent updater completed installation and reopened the same Workspace after the active agent turns finished. A fresh verification confirmed that all 26 catalog, service and UI files in the SHA-256 manifest match the approved build. The installed catalog contains all thirteen named themes, and the service is running from the installed runtime and responding with HTTP 200. No further restart is needed.

## Sources and evidence

- [Editable comparison and palettes](index.html), [styles](board.css), [preview renderer](board.js).
- Production catalog: `desktop/service/appearance.mjs`.
- Tests: `desktop/service/test/appearance.test.mjs` and `desktop/service/test/theme-ui.mjs`.
- Local renderer captures: `.cache/theme-previews/` (generated evidence, outside the deliverable).
