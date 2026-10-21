# Game UI Editor: implementation plan

Deliver a standalone, bilingual Windows editor that turns generated art into
complete interactive HUDs and menus, with Claude access and a safe Unity round
trip, using Global Empires as the pilot.

**Status — October 19, 2026:** M1–M3 and M5 are complete as local deliveries (4/6).
The owner requested M5 before M4; its dependencies were already satisfied.
M4's file/MCP access, contextual panel and Codex client/controls are implemented;
real login/catalog checks and protected A/B/C passed; M4 human acceptance is
pending. [M6 packaging and local guidance](m6.md) now passed isolated
install/update/uninstall, 99 core tests, 44 interface executions and 38 parity
fixtures. M6 final native/release acceptance remains open. The [M4 record](m4.md)
documents 99 core tests and six focused Codex
browser/Windows executions after its context optimization. Its earlier
full proof covers 42 interface executions and 38 TypeScript/C# comparisons.
Optimized real Test A completed normally after the owner raised only its test
threshold to 35,000: 27,049 reported tokens, one targeted query and a correct reply.
Protected Test B first failed despite a hash-matched PNG response. Offline native
diagnosis found missing explicit Code Mode image emission. After correcting the
Codex tool instruction, one authorized B rerun passed visual identification and
configuration: 28,114 reported tokens, one image read and no retry. The final
change passed 99 core tests, six focused UI executions and build. Protected C
then passed on unchanged production code: 27,614 reported tokens, one read and
one proposal; automated owner review confirmed exactly one requested x-position
change, with no automatic save or Unity request. A/B/C technical checks passed;
owner acceptance is pending. The normal runtime is staged without restarting active apps.
The [M5 delivery record](m5.md) preserves the earlier 58 core tests,
26 browser/Windows executions, 38 matching TypeScript/C# fixtures, 20 Unity
fixtures, all 690 presentation tests and 20 live native integration checks.
Formal GE PR/review remains deferred until the baseline is published.
The [M3 delivery record](m3.md) preserves its earlier behavior-authoring evidence.
The [M1](m1.md) and [M2](m2.md) records preserve their earlier evidence and the
owner's positive general M2 feedback. The [23 interview decisions](design.md), plus the follow-up assistant
and product-guidance requests below, define the recorded scope. The first milestone
proves a small complete workflow; the first version includes the whole gameplay
HUD and start/pause/end screens.

## Current foundation

Read-only revalidation found GE on `main`, commit `aa7b912`, with Unity
`6000.6.5f1`. Its main HUD already uses UI Toolkit, constructed by `GameHud` in
C# and styled through `Resources/GameUI/hud.uss`. Its existing `CommandGrid`,
`SelectionCard` and `MatchFlow` provide useful data/action semantics.

The integration must account for three concrete behaviors:

- Parts of the HUD are rebuilt or updated as selection and game state change.
  Runtime resource values, visibility and computed geometry must remain distinct
  from the saved authoring definition.
- Most visual elements do not yet have a persistent authoring identity. Existing
  names help identify panels, but need explicit semantic IDs for fields,
  component definitions and repeated instances.
- The minimap image/input rectangle is calculated separately from its Toolkit
  frame. Layout changes must update a shared rectangle used by drawing, frame
  placement and input mapping.

The GE checkout contains untracked scene files. Implementation should use an
isolated task checkout and its own validation scene. Revalidate its checkout,
decisions and current UI before editing. No GE files were changed for this plan.

## Engineering approach

Use the existing Mak desktop pattern: React/TypeScript, a Tauri Windows shell
and a small local Node host. Keep validation, document operations, persistence,
revision checks and synchronization diff/merge in one TypeScript core owned by
that host. Desktop edits and MCP requests use that same owner. The tradeoff is
sidecar lifecycle work; existing Mak packaging and file-safety patterns provide
a starting point, and the installed MCP TypeScript SDK can be reused as a normal
dependency of the new application.

The application belongs in a separate repository. `Game UI Editor` remains a
working description; choose its name and code location during M1 setup. The
current Mak project folder stores its specification and reports.

Use one portable, versioned document containing stable IDs, screens, hierarchy,
layout, component definitions/instances, asset references, UI rules and binding
intent/mappings. Keep original images, crop metadata and fonts in the project
folder. Store a common authored synchronization baseline, with local connection
paths, instance credentials and recovery runtime state excluded from Git.

Add a focused C# adapter to the GE presentation layer. It maps the supported
document to UI Toolkit and preserves custom components as blocks. Persist the
Unity-side authoring definition in a Unity asset with editor controls and Undo;
capture live trees as import/diagnostic evidence. Saved Unity edits must survive
leaving Play Mode and reopening the scene. Existing callbacks and game command
paths continue to own gameplay behavior.

UI rules use explicit events, typed conditions, effects and states. Desktop and
Unity implementations must agree through shared fixtures. A binding catalog
identifies the real data source or dispatch path and required context; semantic
intent remains visible when a mapping is missing. Required unmapped interactions
cannot be reported as integrated. Authored labels and editor language never
change binding/component IDs.

## M1 — Prove one complete Unity round trip

**Output:** a minimal Windows editor, portable pilot document and GE adapter for
the resource bar with a live food value and pause action. Provide hierarchy
selection, a property inspector, one editable art slot, basic positioning and
the PT-BR/English language switch. Produce files that Claude can inspect.

**Dependencies:** separate application setup, an isolated GE task checkout and a
Unity instance explicitly targeted to that checkout. Establish the supported
property/identity map before editing the runtime HUD.

**Proof:**

1. Import the current GE bar with stable IDs, a real data binding and its pause
   action; preserve the remaining interface and a registered custom block.
2. Edit layout and artwork in the application, inspect the proposed changes,
   explicitly apply them in Unity, and verify the real bar and pause action.
3. Change a supported authoring property in Unity, save it, reopen the scene,
   and import the same change into the application with unchanged identities.
4. Change different properties on both sides and merge them. Change the same
   property on both sides, show the conflict and apply the user's chosen value.
5. Reject a stale target revision or interrupted operation without losing the
   previous valid state. Reopen both sides and verify the accepted baseline.

The first gate must demonstrate persistence and both directions; a screenshot,
generated JSON file or a temporary Play Mode style edit does not satisfy it.

**Decisions covered:** UIED-01, UIED-04, UIED-05, UIED-06, UIED-08, UIED-12,
UIED-13, UIED-14, UIED-15, UIED-16, UIED-20.

## M2 — Complete visual authoring and portable projects

**Output:** new-project and import workflows; art/reference import and manual
crops; hierarchy editing; free layout with anchors/guides; automatic containers;
reusable components and instances. Support separate text/font settings,
stretchable image borders, ordering, selection, undo/redo and recoverable saves.
Retain originals and expose instance overrides when shared components change.

**Dependencies:** M1 document/identity and persistence contracts.

**Proof:** build a new HUD over a game capture and modify an imported one. Reuse
a button/panel in multiple places, update the definition and retain explicit
instance overrides. Reopen a project copied to a new location with the original
art paths unavailable. Verify image/font dependencies, both editor languages,
16:9, ultrawide and resized windows, including long text and overflow.

**Decisions covered:** UIED-02, UIED-03, UIED-09, UIED-10, UIED-11, UIED-19,
UIED-21, UIED-22, UIED-23.

## M3 — Add behavior authoring and meaningful simulation

**Output:** field-based rule editing with visible connections for UI events,
conditions, effects, states and transitions. Provide simulated resources,
selection, command availability and progression; support contextual/repeated
components. Offer the curated real GE catalog alongside semantic intent.

**Dependencies:** M1 binding/command adapter and M2 component/layout model.

**Proof:** exercise no selection, one unit, mixed/multiple selection and a
selected building; empty/full queues; available/unavailable commands; tooltips;
and start/play/pause/end transitions. Save/reopen the same behaviors. Validate
rule types/references and bounded evaluation; run matching semantic fixtures in
the desktop core and Unity adapter. Keep mock state clearly identified and read
real game values/availability through the existing authoritative systems.

**Decisions covered:** UIED-03, UIED-07, UIED-08, UIED-16.

## M4 — Deliver agent access and an in-editor assistant

**Output:** a portable file package documenting the hierarchy, layout, assets,
rules, bindings, unresolved items and reference render; an MCP interface for
reading the project/catalog, inspecting validation results and proposing/applying
revisioned document edits through the same project owner.

**Owner follow-up:** provide a conversation panel inside the editor, with the
current project, selection, relevant hierarchy/assets, visible unsaved draft,
revision and validation context. It should explain the selected element and
propose changes through the existing validated owner/history path. The provider,
connection/login method, model selection and usage policy must be settled before
connecting an LLM. This extends the external file/MCP experience; it is not
implemented by M2.

**Dependencies:** M1 persistence and M3 complete document/rule semantics. Reuse
the MCP SDK; scope access to the selected project and exposed catalog. File
package edits are reimported through revision validation, avoiding a second
writer/model for an open desktop project.

**Proof:** Claude can locate an element, understand its containing panel and
context, modify layout or behavior, and see validation results in the desktop
editor. A simultaneous desktop/MCP edit preserves both independent changes or
reports a conflict; a stale request cannot silently overwrite a newer revision.
Invalid paths, references, types and bindings are rejected. Applying changes to
Unity retains the manual preview/conflict review boundary chosen by the user.

**Decisions covered:** UIED-18; enforce UIED-14 and UIED-15 across both entry points.

## M5 — Complete GE gameplay and screen coverage

**Output:** import and author the resource bar, selection panel, command grid,
tooltips, minimap frame/custom block, and start/pause/end screens. Preserve the
current options flows while exposing supported authoring properties. Extend
the catalog and adapters only for the real components required by these screens.

**Dependencies:** M2 authoring, M3 rules/bindings and the M1 synchronization path.

**Proof:** demonstrate supported structure, layout, styles, states, transitions
and binding edits in both directions. Update contextual/repeated UI without
losing its authored settings. Move/resize the minimap and verify its image,
frame, camera/world coordinate mapping and input use the same rectangle.
Exercise native selection, commands, keyboard focus/shortcuts and pause/return
paths; a click on a HUD panel must not also issue a world command. Preserve
custom code and unsupported blocks through import, edits and reimport.

GE game rules and pending design decisions retain their existing status. The
editor integration follows the current command/data paths rather than changing
the deterministic simulation or declaring pending gameplay choices approved.

**Decisions covered:** UIED-12, UIED-13, UIED-17, UIED-19, UIED-20.

## M6 — Validate and package the first Windows version

**Current local delivery:** installer/update safety and replayable bilingual
guidance are implemented; real isolated install/update/uninstall passed. See
[M6 packaging and guidance](m6.md). Local archives are unsigned and unpublished;
M4 human acceptance and M6 final native/release acceptance remain open (4/6).

**Output:** Windows application package, editable sources, a portable GE pilot
project, Unity integration package, local setup instructions and a compact
acceptance/evidence record. All six milestones are required for this first
version; none is counted complete based on documentation alone.

**Requested product guidance:** explain each function with practical examples
and contextual help. The owner confirmed the reference help works but requested
a more interactive first-use tour. This is recorded feedback; the owner clarified
that testing feedback must not trigger immediate implementation. Keep the reference
help. Further tour work waits for an explicit implementation request. A local
prototype was started prematurely and has been stopped without replacing or
restarting the owner's installation; see the [M6 record](m6.md).

**Dependencies:** M1–M5 and the full confirmed product acceptance checklist.

**Proof:**

- Validate load/save and schema version handling, missing assets,
  invalid bindings, malformed requests and safe path handling. Unsupported future
  schema versions must be refused without rewriting the project.
- Verify conflict/deletion/reparenting/component-replacement previews, revision
  checks, interrupted application and recovery. An unresolved conflict prevents
  writes; original assets, native custom code and the previous valid project
  remain recoverable.
- Reopen a moved portable project, test desktop/MCP concurrency and exercise all
  authored screens in both editor languages and the selected viewport formats.
- Run the relevant core, renderer and GE presentation checks, then capture the
  real Unity interface and interactions. Follow the GE repository's branch/PR
  and required review workflow for later GE code changes.
- Verify the packaged Windows application in its own test installation. Prepare
  updates without restarting an active user application or agent session.

An editor preview approval, test pass or installer build is recorded as that
specific result. Native Unity behavior and installation each require their own
evidence before being reported complete.

## Native integration anchors

Paths below are relative to `E:\Claude Projects\GlobalEmpires\GE-game`, rechecked
read-only on October 18, 2026:

- `view/com.globalempires.view/Runtime/GameHud.cs:106` builds the Toolkit tree;
  `:226` updates context and visibility; `:493` revalidates and activates actions.
- `view/com.globalempires.view/Runtime/GameHud.Panels.cs:88` builds the resource
  bar; `:141` reads authoritative player economy data.
- `view/com.globalempires.view/Runtime/GameHud.Minimap.cs:24` calculates the
  minimap rectangle;
  `view/com.globalempires.view/Runtime/MinimapView.cs:58` consumes it.
- `view/com.globalempires.view/Logic/CommandGrid.cs:37` and `:78` define actions
  and cells; `view/com.globalempires.view/Logic/SelectionCard.cs:70` supplies the
  selection presentation model.
- `view/com.globalempires.view/Runtime/GameHud.Screens.cs` builds the existing
  start/options/pause/end flows; `view/com.globalempires.view/Runtime/MatchFlow.cs`
  owns their real actions.

These anchors guide implementation; they do not establish runtime compatibility
of an adapter that has not been written.

## Immediate next task

The Codex client and confirmed assistant controls are implemented and verified
through protocol tests and actual Windows/browser UI. Real existing-account
login/catalog and restricted-profile preflight checks succeeded without inference.
Code Mode and context optimization are implemented. Protected Test A completed
normally with one targeted query and 27,049 reported tokens under the owner-approved
35,000 test threshold. The Code Mode image-forwarding instruction is now fixed;
one authorized B rerun passed shapes/colors/order and configuration with 28,114
reported tokens and one image read. C passed a precise proposal and review with
27,614 tokens, two calls and no automatic save. Obtain owner acceptance before
closing M4; M6 remains pending.
Model/reasoning choices are per project;
application Options sets the operation allowance (default 20), Continue/Stop
preserves progress, and the conversation keeps each reply's model attribution.
Only status and limit/error warnings are shown. No background inference or paid
API-key fallback is authorized. See [confirmed decisions](design.md#assistant-follow-up-decisions)
and [M4 proof](m4.md). M6 remains pending and completed progress stays at 4/6.
Formal GE publication/review remains deferred; no commit, PR or merge is claimed.
Application source is in `E:\MrMak\GameUIEditor`; the current name remains a
working label. Use `Open-GE-HUD.cmd` for the current connected GE validation project.

## Planning verification

All 23 decision IDs are covered by the six milestones. The plan and brief links
resolve, and other Workspace cards were preserved. Both tabs were opened at
1440, 768 and 390 pixels in light/dark themes, with the navigation collapsed for
narrow reading; no page errors or document horizontal overflow were observed.
Desktop and narrow plan captures were inspected. This validates the plan/report
delivery; product and native integration checks remain in M1–M6.
