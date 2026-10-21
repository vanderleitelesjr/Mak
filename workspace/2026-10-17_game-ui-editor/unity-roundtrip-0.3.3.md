# Unity source property round-trip — 0.3.3

**Native property application and reimport passed for UXML, a saved uGUI scene and a uGUI prefab.** Four reviewed properties persisted after Unity reopened the source; original callbacks and portable-only additions survived. Three focused conflict and stale-review tests also passed. This is technical proof; M4/M6 remain open at 4/6.

| Persistent source | Reviewed change |
| --- | --- |
| UXML with a unique view-data-key | Title text and font size, 24 → 32. |
| Saved uGUI scene | Label text. |
| uGUI prefab | Label text. |

The existing independent native fixture exported three source roots. The real project owner imported them, saved portable edits, exported the concrete source review and reimported a fresh Unity export after applying it. Unity reopened the scene and prefab before validating persistence. The native check preserved callback targets/methods, refused replaying the stale review and retained a portable-only overlay. Source IDs survived sibling reordering, and imported image bytes matched the original hash.

The three focused owner tests covered competing source/local edits, stale source/project reviews and source deletions versus local edits. They required conflict choices and preserved independent additions. They are separate from the native property fixture; there was no new Windows interaction test.

## Environment and preservation

Before validation, the source, delivered 0.3.3 owner files and installed behavior catalog were compared. The isolated Unity exporter's local copy had an older UISourceEdits.cs. It was backed up and aligned to the already delivered package; no application implementation changed.

The first official-MCP attempt connected to the explicit isolated GE project, but its asynchronous interactive export did not complete. No source property was applied by that attempt. Its task-created Unity was exited, the original export manifest was restored, and the existing independent batch fixture completed successfully. Failed attempts remain recorded separately.

The owner's ge-importada/project.json and nine existing Unity scenes/assets kept the same hashes. The original six-screen GE manifest was restored byte for byte. Its inventory was only prepared/read during the successful test: 430 nodes and 28 resources. Test projects, receipts and logs remain under .local; the production installation was not changed.

## Remaining scope

This run exercised the project-owner APIs and native persistent properties. It did not repeat editing/review/apply through the Windows interface, capture native appearance, rewrite the procedural GE HUD, implement dynamic commands, repeat the full suites or repeat the current installer lifecycle. The previous general owner approval of 0.3.3 remains valid; no new human acceptance is inferred.

The next validation is the Windows interaction path for the same supported properties, followed separately by the procedural GE integration and remaining M4/M6 gates.

[Structured evidence](evidence-unity-roundtrip-0.3.3.json) · [Previous owner retest](canvas-0.3.3.md)
