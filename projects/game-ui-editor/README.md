# Game UI Editor

Current native property proof: **four reviewed properties applied, reopened and reimported** in isolated UXML, uGUI scene and prefab sources. Callbacks and portable-only additions survived; three focused conflict tests passed. No new application implementation or human acceptance. Windows interaction, procedural GE application and complete M4/M6 gates remain open. See [the scoped result](../../workspace/2026-10-17_game-ui-editor/unity-roundtrip-0.3.3.md).

Current owner result: **0.3.3 tested and working**, reported as “testado e funcionando”. The delivered usability/visual adjustments are generally accepted, superseding their pending-retest status in the historical entries below. Individual checklist results were not supplied. Unity source application/reimport and complete M4/M6 acceptance remain separate; historical milestone completion stays at 4/6. See [the result](../../workspace/2026-10-17_game-ui-editor/canvas-0.3.3.md).

Previous correction: **Unity exporter 0.1.1** fixes the invisible GE command snapshot (PT-2026-10-20-03). The same editor **0.3.2** displays 15 slots, native labels/icons and empty positions. The owner test project was backed up and reimported; ten focused import tests, native success/failure restoration and Windows checks passed. Dynamic command behavior and human acceptance remain open. See [the correction](../../workspace/2026-10-17_game-ui-editor/commands-0.1.1.md).

Previous local follow-up: **0.3.2** adds per-branch hierarchy disclosure, including the root. Selection, saved data and drag/drop are preserved; 16 focused browser/Windows UI executions passed. The GE sample reduces 430 rows to seven or one. Existing test projects are reused; owner retest remains pending. See [the hierarchy record](../../workspace/2026-10-17_game-ui-editor/hierarchy-0.3.2.md).

Previous playtest correction: **0.3.1**. Two authorized findings are implemented: compact conversation sizing and imported canvas content/visibility. Current proof: 123 core tests, 18 focused browser/Windows UI executions, comparable native editor captures and 262 verified release files. Existing test projects are preserved; owner retest remains pending. See the [correction record](../../workspace/2026-10-17_game-ui-editor/fixes-0.3.1.md).

Structural-import base: **0.3.0**. Structural Unity UI import, original assets, screen states, selection/queue mocks, protected reimport and reviewed UXML/uGUI source-property writes are implemented. See the [delivery report and coverage limits](../../workspace/2026-10-17_game-ui-editor/structured-import-0.3.0.md).

Current proof: 123 core tests, 39 browser and 39 isolated Windows UI cases, 43 TypeScript/C# comparisons, 20 Unity behavior fixtures, plus an independent Unity source-write/reimport fixture. Four archives contain 260 manifest-verified files. The installed **0.2.0** is preserved. No real inference was requested. GE import remains partial for command templates, custom minimap rendering, procedural writeback and special layout/rendering features. Human acceptance and M4/M6 closure remain open; historical milestones remain 4/6.

The earlier [0.2.1 follow-up](../../workspace/2026-10-17_game-ui-editor/followup-0.2.1.md) and [P01-P18 corrections](../../workspace/2026-10-17_game-ui-editor/corrections-report.md) remain historical evidence.

Working description for a standalone Windows tool that turns generated game UI
art into editable, interactive HUDs and menus, with Claude-readable files, MCP
access and bidirectional Unity synchronization.

The working product name is Game UI Editor. Implementation lives in the separate
local repository `E:\MrMak\GameUIEditor`; this folder stores project knowledge.

The canonical [design and decision record](../../workspace/2026-10-17_game-ui-editor/design.md)
is registered in the Game UI Editor Workspace card. It contains the 23 confirmed
interview choices, a proposed technical approach and acceptance criteria.

The [implementation plan](../../workspace/2026-10-17_game-ui-editor/implementation.md)
defines six milestones, their dependencies and concrete completion checks.

Individual choices were confirmed on October 17, 2026. The combined product
understanding was confirmed on October 18, 2026, closing the interview.
M1 is complete as a local delivery and locally validated. The [M1 delivery record](../../workspace/2026-10-17_game-ui-editor/m1.md)
contains the launcher and native evidence. Formal PR/review are deferred until the
GE baseline is published.
M2 visual authoring is complete as a local delivery, with 23 core tests and 16
browser/Windows UI executions passing. The owner reported positive general
manual feedback; see the [M2 delivery record](../../workspace/2026-10-17_game-ui-editor/m2.md).
M3 behavior authoring and simulation are complete as a local delivery: 46 core
tests, 24 browser/Windows executions, 20 TypeScript/C# parity fixtures, 20 Unity
fixtures and all 690 GE presentation tests passed. Live match checks and native
captures are recorded in the [M3 delivery record](../../workspace/2026-10-17_game-ui-editor/m3.md).
M5 complete-HUD integration is delivered locally: 58 core tests, 26 interface
executions, 38 TypeScript/C# comparisons, 20 Unity fixtures, 690 presentation
tests and 20 live native checks passed. See the [M5 delivery record](../../workspace/2026-10-17_game-ui-editor/m5.md).
M4 file/MCP access, structured inspection, images on demand, the existing-account
Codex client, model/reasoning controls, configurable work limit (default 20),
Continue/Stop and per-project model-attributed history are implemented. Current
context optimization passed 99 core tests and six focused Codex UI
executions. Earlier full proof covers 42 UI executions and 38 TypeScript/C#
comparisons. Real login/catalog and the new restricted-profile preflight passed;
optimized real Test A used one structure query and returned a correct reply.
Cumulative tokens fell from 36,626 to 27,029 (26.2%); uncached input fell 28.2%.
The earlier 25,000 monitor threshold interrupted that turn. An initial
optimized attempt had stopped on the expected skills-catalog truncation advisory;
that specific warning was classified offline before controlled resumption.
The owner then approved 35,000 for the test. Test A completed normally on its
controlled rerun: 27,049 reported tokens, one query and a correct real reply;
the document stayed unchanged and all owned processes exited. Protected B then
returned a hash-correct PNG block, but the model reported inaccessible visual
content. B failed functionally (27,434 reported tokens, one image read, no retry);
the missing Code Mode image emission was then diagnosed offline. Its adapter
flattens dynamic-tool content to metadata plus an image data URL; the Codex tool
instruction now emits the URL with `image(...)` in the same call without printing
base64. One authorized real B rerun passed: correct shapes/colors/order and
configuration, 28,114 reported tokens, one read, no retry and clean shutdown.
The final change passed 99 core tests, six focused UI executions and build.
C then passed on the unchanged runtime: 27,614 reported tokens, one real turn,
one document read and one proposal. Only the button's x position changed from
1480 to 1400; automated owner review confirmed one difference, no conflicts,
and intact behavior and opaque native data. No save or Unity request occurred;
the proposal was dismissed and test processes exited. A local fixture error was
fixed before connecting Codex, with zero inference. A/B/C technical checks
passed; owner acceptance remains pending. The normal runtime is staged without
restarting active apps.
Automated conversation regressions use a simulator.
The [M4 record](../../workspace/2026-10-17_game-ui-editor/m4.md) separates these
technical proofs from pending human acceptance. M6 remains
open for final release acceptance and completed progress remains 4/6.
The [M6 packaging and guidance record](../../workspace/2026-10-17_game-ui-editor/m6.md)
documents the current-user Windows installer, safe update refusal, preserved
portable projects, replayable bilingual help and local release archives. A real
isolated installation/update/uninstall passed without replacing the owner's
installation or restarting active sessions. This is separate from final native
release acceptance and M4 human acceptance.
The owner then confirmed help/context/language functionality and requested a
more interactive first-use tour, keeping the current help. This is feedback,
pending an explicit implementation request. The owner clarified: during testing,
record feedback only. A local prototype was started prematurely; further work is
stopped and the installed application was not changed. See the same
[M6 record](../../workspace/2026-10-17_game-ui-editor/m6.md).
The owner has now reported testing concluded and requested correction proposals
before implementation. The [feedback review](../../workspace/2026-10-17_game-ui-editor/correction-proposals.md)
consolidates all recorded requests, current source observations and proposed
solutions/defaults. It is awaiting owner evaluation; no application change or
milestone acceptance is implied.
The owner requested M5 before M4.

## Historical delivery: post-test corrections (0.2.0)

The owner then explicitly authorized the correction batch, including image
attachments, assisted game discovery (P16) and the recommended optional private
game root (P17). P01-P18 are implemented and packaged locally. Claude/Antigravity
connectors remain future scope. This supersedes the historical feedback-only
and awaiting-review status above.

The [correction report](../../workspace/2026-10-17_game-ui-editor/corrections-report.md)
lists each delivery and attention point. Current proof: 112 core tests, 60
browser/isolated Windows UI executions, 41 TypeScript/C# comparisons, four real
Windows picker checks, and 212 manifest-verified files across four archives.
The card now follows the active-project modular pattern, with six tabs and an
18/18 correction phase. Historical milestone completion stays at 4/6.

The 0.2.0 installer is prepared separately from the owner's installation. No
real inference, new account sign-out, production restart, commit or publication
was performed. Fresh isolated Unity/native validation and owner acceptance
remain required for M4/M6; discovery/catalog authoring is not runtime integration
for arbitrary games. The supplied native adapter remains GE-specific.
