# Game UI Editor: design and decisions

A standalone Windows authoring tool for complete game HUDs and menus. The owner
imports generated artwork, composes the interface, configures its structure and
behavior, and gives Claude an editable specification that can be implemented and
kept synchronized with the game.

**Status:** 23 individual choices confirmed on October 17, 2026. The combined
product understanding was confirmed on October 18, 2026, closing the interview.
Technical proposals below remain reviewable recommendations, not additional
confirmed user decisions. No product code, Unity integration or runtime validation
has been delivered by this interview.

## The interface is the unit of work

The authored result includes the complete screen, rather than only the function
of isolated buttons. It describes hierarchy, reusable components, positioning,
size, spacing, alignment, anchors, adaptive layout, states, transitions, data,
actions and relationships between elements.

For example, selecting several units can change the selection panel structure,
repeat portrait components, expose shared commands and keep the result anchored
to the screen. The artwork, arrangement and behavior must travel together.

## Confirmed decisions

All entries below have status **Confirmed**, dated **2026-10-17**. The original
question number and selected option are retained for traceability.

### Product and pilot

- **UIED-01 / 1B:** Develop a dedicated tool.
- **UIED-02 / 2C:** Import separate art elements and complete screen artwork.
- **UIED-03 / 3B, clarified:** Configure the structure, layout and behavior of the
  whole HUD visually, using fields and connections.
- **UIED-04 / 4A:** Validate the product with one pilot game first.
- **UIED-05 / 5A:** Use Global Empires, in Unity, as the pilot.
- **UIED-06 / 6A:** Deliver a separate Windows application.
- **UIED-07 / 7A:** Provide an interactive preview with clicks, simulated data,
  states and transitions.
- **UIED-08 / 8C, user-defined A+B:** Support semantic descriptions of data/actions
  and selection of real game functions/data. Both modes must coexist.

### Visual authoring and reusable structure

- **UIED-09 / 9A:** The user marks regions and adjusts crops when importing a
  complete screen image.
- **UIED-10 / 10C:** Combine free positioning with guides/anchors and containers
  that align and distribute their children.
- **UIED-11 / 11A:** Support reusable components whose changes propagate to their
  instances.
- **UIED-21 / 21A:** Support window resizing and verify 16:9 and ultrawide layouts.
- **UIED-22 / 22C:** Offer an editor interface switchable between Brazilian
  Portuguese and English.
- **UIED-23 / 23A:** Store each HUD project in a portable, versionable folder with
  its editable document, artwork, fonts and bindings.

### Unity synchronization and game bindings

- **UIED-12 / 12C:** Synchronize in both directions between the authoring tool and
  Unity, including changes made after the first integration.
- **UIED-13 / 13A:** Preserve unsupported/custom components as blocks, exposing
  position, size and explicitly exposed properties.
- **UIED-14 / 14A:** Synchronization is initiated explicitly and shows changes
  before applying them.
- **UIED-15 / 15A:** When both sides change the same property, show the conflict
  and let the user choose the result.
- **UIED-16 / 16A:** Offer a curated catalog of actions and data prepared for UI,
  extending it as required by the project.

### First-version coverage and Claude access

- **UIED-17 / 17C:** Cover the complete GE gameplay HUD plus start, pause and end
  screens. The gameplay HUD includes resources, selection, commands, minimap and
  tooltips.
- **UIED-18 / 18C:** Provide both a file package and MCP access for Claude to
  inspect and edit the authored project.
- **UIED-19 / 19C:** Support creating a new interface over a game capture and
  importing the existing GE interface from the first version.
- **UIED-20 / 20A:** Render the authoring preview in the application and perform
  final visual and behavioral validation in Unity.

## Assistant follow-up decisions

The following additions are **Confirmed**, dated **2026-10-19**, from the
assistant-integration discussion. They extend the original 23 decisions. The
owner's final selections below close the assistant definition and authorize its
implementation within these boundaries. A model turn still starts only from an
explicit user message or Continue action.
The owner subsequently confirmed the structure/assets method and its five
suggestions with "Let's proceed this way", authorizing their provider-independent
implementation. Model-selection, usage, the initial work limit and model-change
conversation behavior are now confirmed below. The model itself is selected in
the editor, not pinned in this record.

- **UIED-24 / assistant 1:** Support existing-account login, API-key access and
  local models as product connection options. Implement existing-account login
  first; API keys and local models are later work, not automatic fallbacks.
- **UIED-25 / assistant 2:** Start with OpenAI/Codex (the user's "you"), then add
  Claude and Gemini. An exact model has not been selected. Access with the
  intended account and selected model still require their own runtime proof.
- **UIED-26 / assistant 4A:** Keep separate conversation history per project,
  resumable after reopening. A private local implementation is recorded in M4;
  model changes preserve the conversation under UIED-38. Actual
  transcripts and credentials must remain outside Git under the repository rules.
- **UIED-27 / assistant 3, custom clarification:** The assistant's job is to
  understand screen structure, component locations, purpose, configuration and
  referenced images/effects. Evaluating visual polish is outside its intended
  role. Supply structured context and asset references normally; allow it to
  access a specific referenced image only when needed for the task. Do not send
  every artwork or screen capture automatically, and do not treat this as strict
  text-only operation that forbids all image inspection.
- **UIED-28 / confirmed follow-up:** Use permanent IDs, readable component names
  and configured purpose descriptions, so identity survives changes to appearance
  or position. Existing names, rule names/intents and catalog descriptions are
  the semantic sources; do not invent purpose by inspecting artwork.
- **UIED-29 / confirmed follow-up:** Expose both authored layout and computed
  positions for a stated viewport/state, including parent/anchor/flow settings
  and repeated components. Distinguish simulated context from live game state.
- **UIED-30 / confirmed follow-up:** Describe configured effects by trigger,
  target and supported parameters. Report unsupported or opaque effects rather
  than pretending arbitrary visual effects are already implemented.
- **UIED-31 / confirmed follow-up:** Make assets individually queryable through
  project-scoped IDs, with relative paths, names, dimensions, crop/stretch-border
  settings and component usages. Open image bytes only on a specific request.
- **UIED-32 / confirmed follow-up:** Begin with screen/selection context and
  expand through targeted structural, rule and asset queries as the task needs.
  Fetch the full editable document explicitly when preparing a change proposal;
  the full portable package is not the default assistant prompt.
- **UIED-33 / model and usage round 1A:** Provide model and reasoning-effort
  selectors in the editor, remembered per project. Populate supported choices
  from Codex; do not hard-code an exact model or silently substitute another.
- **UIED-34 / model and usage round 2A:** Start inference only when the user
  explicitly sends a message, or explicitly continues a paused request. Merely
  selecting/editing components, opening a project or publishing structured
  context must not trigger background inference or proactive suggestions.
- **UIED-35 / model and usage round 3A:** Bound work per request and offer
  Continue when that boundary is reached. Preserve request/conversation progress
  and existing change-review boundaries. UIED-37 defines the initial boundary;
  this is a work limit, not a guaranteed monetary spending cap.
- **UIED-36 / model and usage round 4B:** Show request progress and limit/error
  warnings only; do not add a visible token/remaining-quota metrics dashboard.
  Internal accounting may still enforce the work boundary and handle provider
  limits. Do not erase these guards because their metrics are hidden.

- **UIED-37 / final round 1A, clarified:** Default to 20 assistant tool operations
  per request slice. Make the value configurable in application Options, across
  projects. A changed setting applies to the next Send or Continue; do not change
  the active slice silently. Continue renews the work allowance explicitly.
- **UIED-38 / final round 2A:** Changing model keeps the same project conversation.
  Preserve older replies and identify the model/reasoning used for each reply;
  do not rewrite their attribution when the current model changes. A paused
  request can continue as a new reply segment under the newly selected model.

UIED-33 through UIED-38 are confirmed product decisions. The local implementation
and its protocol/UI tests are recorded in [M4](m4.md). Existing-account login and
catalog discovery were verified against the installed Codex CLI; a real model
reply remains for the user's first explicit Send, followed by acceptance.

The original assistant question 3 is replaced by UIED-27. A file reference
identifies the image but does not itself give a remote model access to its bytes;
the integration needs a project-scoped individual-asset inspection operation.
The current context already exposes asset metadata, while the portable package
embeds all original assets and a rendered reference. The assistant should use
the structured-context path and request individual assets when needed instead
of forwarding that entire package as its default prompt. This access policy is
confirmed. The implementation is recorded in [M4](m4.md); live LLM connection
and user acceptance remain separate.

The former suggestions are now covered by UIED-28 through UIED-32, including
surfacing missing references or unsupported effects.
The present rule effects cover presentation values, variables, state transitions
and game actions. Do not claim arbitrary visual animation/shader/audio authoring
is already implemented. The exact model is a per-project runtime choice. No
additional provider switch, API-key fallback or paid generation is implied.

**Technical research, not a new decision:** the official [Codex App Server
documentation](https://learn.chatgpt.com/docs/app-server) describes account
inspection, ChatGPT login, conversations and streaming events. It provides a
candidate integration route for UIED-24/25; it does not establish that the editor
is connected, authorize reading credentials or transfer this chat's identity,
selected model or history automatically. Reviewed on October 19, 2026.

## Proposed operating flow

1. Create a portable HUD project or import the existing GE interface through the
   Unity integration. Preserve unsupported components as identified blocks.
2. Import individual artwork or use a game capture/full-screen artwork as a
   reference. Mark regions for manual crops and retain their source artwork.
3. Build the hierarchy, combine free layout with automatic containers, and create
   reusable component definitions and instances.
4. Configure UI events, conditions, effects, states and transitions through
   fields and visible connections. Bind dynamic values and player actions using
   the curated game catalog or semantic intent awaiting a real mapping.
5. Exercise the interface with simulated data and input; inspect narrow/wide
   windows and the selected aspect ratios.
6. Let Claude read or edit the same project through files or MCP, including the
   structure, behaviors and bindings needed for integration.
7. Preview the differences with Unity, resolve conflicts and explicitly apply
   synchronization. Inspect native rendering and real game behavior.
8. Bring supported Unity changes back into the editable document and retain a
   common synchronization baseline for the next round.

## Proposed technical ownership and invariants

### One editable document

Use one versioned, structured project document for the desktop editor, file
package and MCP operations. Assign stable IDs to screens, elements, component
definitions/instances, rules, assets and bindings. UI language and visible labels
must not change those identities. Keep implementation technology as an engineering
choice for setup; the separate Windows application is the confirmed requirement.

Keep art, editable text and live values distinct. Store crop rectangles and
stretchable-border information without destroying original images. Component
defaults should propagate while retaining explicit instance overrides. Keep
project assets inside the portable folder and report missing dependencies.

### Shared authoring and simulation behavior

Use a defined set of UI events, predicates, effects and state transitions.
Validate rule connections and types before simulation or export. Reuse their
meaning in the Unity adapter rather than inventing a second set of rules for
native integration. Simulated resources, selection and timers must be visibly
distinguishable from actual game values.

Use the project's existing authoritative data and command paths for gameplay.
The UI must not duplicate game economy, command scheduling, availability rules
or simulation timers. A semantic action can remain explicitly unmapped until
its game binding is supplied and validated.

### Unity adapter and synchronization

Integrate with the GE UI Toolkit presentation layer. A Unity-side bridge is the
proposed way to import its constructed interface, expose supported properties
and exchange structured changes. Existing procedural C# and custom rendering
require an adapter or a preserved block; arbitrary C# is not assumed to have an
automatic visual-rule equivalent.

Synchronize supported hierarchy, layout, styles, component properties, states,
transitions and bindings. Preserve unsupported/custom implementation and identify
which block properties can be edited. Deletion and component replacement must
appear in the change preview.

Compare editor and Unity revisions against their last successful common
baseline. Merge non-overlapping changes and present competing edits, deletions
or moved/replaced nodes for resolution. Check that the target revision has not
changed again before applying. Use undo/recoverable snapshots and avoid partial
application; unresolved conflicts must prevent writes. The same review boundary
applies when work originated through MCP.

### Claude access

The portable package should describe the visual hierarchy, assets, layout,
behavior graph, catalog bindings and unresolved items, alongside a rendered
reference. MCP should expose the same validated project model for inspection
and edits, with revision checks so agent edits cannot silently overwrite newer
desktop edits. Keep access scoped to the selected project and exposed catalog;
an action binding is not permission to execute arbitrary source code.

## Current GE evidence

Read-only inspection during the interview found:

- The pilot repository is `E:\Claude Projects\GlobalEmpires\GE-game`. Its
  inspected snapshot was `main`, commit `aa7b912`, using Unity `6000.6.5f1`.
- The main HUD already uses UI Toolkit, constructed in C# with `UIDocument`,
  `PanelSettings` and USS. Relevant source: `view/com.globalempires.view/Runtime/GameHud.cs`
  around lines 19 and 106-139. Its reference layout is 1920 x 1080.
- `Runtime/EconomyHud.cs:82` creates `GameHud` when needed. World-space bars and
  the minimap retain separate rendering paths; see `Runtime/MinimapView.cs:58`.
- `Logic/CommandGrid.cs:37` and `:78` define existing action/cell semantics,
  including enabled state, reason and progress. `Logic/SelectionCard.cs:70`
  provides a selection presentation model. Both are under
  `view/com.globalempires.view/`.
- Commands already have context validation and scheduling. A public C# method
  is therefore not automatically a valid button action. Reuse the dispatch path
  in `Runtime/GameHud.cs:493` and the existing economy/command helpers.

This is source inspection, not a Unity runtime test. Recheck the checkout and
source locations before implementation. No existing reusable HUD authoring
editor was confirmed by the targeted search.

## Proposed delivery sequence

These are implementation checkpoints within the full confirmed first-version
scope, not a replacement for that scope.

1. **Document and editor foundation:** portable files, stable IDs, bilingual
   editor, art/crop workflow, hierarchy/layout and reusable components.
2. **First complete Unity round trip:** prove one real GE panel through import,
   edit, native application, reverse import, conflict handling and recovery.
3. **Full authoring and simulation:** behavioral configuration, curated bindings,
   contextual/repeated UI, mock data and responsive previews.
4. **Complete GE coverage and agent access:** all selected gameplay/start/pause/end
   screens, new-project/import workflows, file package and MCP editing.
5. **First-version acceptance:** execute the native and portability checks below
   and deliver the Windows application with reviewable evidence.

## First-version acceptance

- Create a new HUD and import the existing GE interface; reopen both projects
  after saving and copy a project to another location with its dependencies.
- Edit whole-screen hierarchy, free/container layout, art and live text. Verify
  shared component updates and instance overrides.
- Simulate contextual selection, unavailable commands, tooltips and transitions
  between start, gameplay, pause and end screens.
- Verify the editor in both languages and inspect 16:9, ultrawide and resized
  windows, including long labels, repeated elements and overflow.
- Read and edit through files and MCP without diverging document models or
  silently overwriting a concurrent edit.
- Demonstrate editor-to-Unity and Unity-to-editor changes for supported visual
  properties, structure, behavior and bindings. Demonstrate user conflict
  resolution, deletion preview and preservation of a custom block.
- Confirm real GE actions and values through the existing gameplay paths;
  verify input exclusion so HUD clicks do not also command the world.
- Exercise stale revisions, missing assets, invalid bindings and failed
  synchronization; retain the previous valid project/game state.
- Record native Unity captures and actual behavioral checks. An approved editor
  preview or green document validation does not count as game integration.

## Overall confirmation and next step

The user confirmed every numbered product choice above and approved the combined
product understanding with "sim" on October 18, 2026. The interview is closed.
The [implementation plan](implementation.md) is ready. Its [M1 delivery](m1.md)
now implements and locally validates the editor-to-Unity-and-back flow in GE.
Application code lives in the separate local repository `E:\MrMak\GameUIEditor`;
`Game UI Editor` remains a descriptive working label.

This record and its Workspace registration were the interview deliverables.
The M1 delivery record distinguishes implementation/native evidence from user
acceptance. The user approved M1 as a local delivery; formal PR/review are deferred
until the GE baseline is published. M2–M6 remain future work.

## Record verification: October 18, 2026

The 23 unique decision IDs, card registration, report path and project-index
reference passed structural checks. Pre-existing Workspace entries were preserved.
The new tab was opened in the browser preview at 1440, 768 and 390 pixels in light
and dark themes, without page errors. At narrow widths, the existing Hide menu
control gives the document the available reading width; the document showed no
horizontal overflow. Desktop and narrow reading captures were inspected.

These checks validate the record and its preview. The editor and Unity integration
were implemented and locally validated later, as documented in [M1 delivery](m1.md).
