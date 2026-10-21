# Test feedback: correction proposals

Status: implementation authorized by the owner on 2026-10-20. P16 uses assisted discovery; P17 follows the recommendations. Execute current corrections sequentially without waiting between items. P19 remains the recommended optional deferral unless the owner selects real additional connectors.

Delivery: P01-P18 are implemented in local version 0.2.0. See the
[per-item correction report](corrections-report.md) and
[current evidence](evidence-corrections.json). The proposals below remain as the
review baseline. P19 stays deferred; installed application and milestone
acceptance remain separate.

The owner reported that testing has concluded and asked for every recorded correction, with a proposed solution, before implementation. This supersedes the earlier instruction to continue the image-import checklist. It does not assert a new item-by-item test result, close M4/M6 or approve the stopped 0.1.1 prototype.

Sources: [M6 feedback](m6.md), [structured M6 record](evidence-m6.json), and [earlier M2 feedback](m2.md). This review also inspected the current, uncommitted application sources in `E:/MrMak/GameUIEditor`. Static inspection is not reproduction in the owner's installed application.

All defaults and interactions below are recommendations for review. Recorded requirements remain distinct from proposed choices. IDs P01-P19 allow the owner to adjust individual items without approving the whole list.

## P01. Toolbar actions become dim after selecting a canvas element

- Recorded: Compare, Reload, New and Open dim after canvas selection. The original report was not independently reproduced.
- Current source: New/Open and synchronization actions depend on the unsaved-document flag. Pointer down already adds an undo entry; pointer movement updates geometry without a drag threshold, including component geometry overrides. An incidental movement is a plausible cause, not a confirmed diagnosis of the installed build.
- Proposal: reproduce the reported click first; distinguish selection from movement with a small screen-pixel threshold; only record history and document changes when a gesture changes authored data. Keep selection read-only. Explain legitimate disabled states. For New/Open/Reload with a real draft, offer Save / Discard / Cancel before navigation; keep synchronization revision and pending-write protection.
- Suggested choice: 3 screen pixels before starting a drag. Verify that selecting, clicking without displacement and cancelled gestures do not create edits/history, while real drags and existing conflict guards still work.

## P02. Resize directly on the canvas

- Recorded: resize elements directly instead of relying only on inspector dimensions.
- Current source: free-layout elements can be dragged, and dimensions can be edited in the inspector; no canvas resize handles were found. The earlier M2 description overstates the current canvas resizing support.
- Proposal: eight accessible selection handles for edges/corners; keep numeric fields. Share geometry, anchor and component-override operations with the inspector. A gesture is one undo step; Escape cancels. Respect automatic parent layout: expose only meaningful size adjustments, rather than writing positions that the layout ignores.
- Suggested choice: Shift preserves aspect ratio for corner resizing. Screen dimensions remain controlled by the existing canvas-size fields. Verify nested/scaled geometry, component instances and image crops without modifying original artwork.

## P03. Make the hierarchy readable and compact

- Recorded: indent each child one column after its parent, with tighter spacing and dashed relationship connectors.
- Current source: all descendants receive the same child CSS class; depth is not represented visually.
- Proposal: derive depth from the existing parent relationships; use a compact 12 px indentation step and dashed tree connectors. Keep names readable and selection keyboard-accessible.
- Suggested choice: 12 px is a proposed starting value, not a confirmed design decision. Verify three or more nesting levels at narrow widths.

## P04. Make hierarchy order, parenting and stacking agree

- Recorded: Screen is the background; parent precedes its grouped descendants; entries farther down are above earlier entries; moving entries changes parent and layer order.
- Current source: the list renders the flat node array; layer buttons swap siblings without moving their descendant blocks. Parent selection and layer order are separate controls.
- Proposal: keep one canonical parent-first order in the existing document, derived from sibling order. Move an entire subtree together. Drop before/after a row to reorder, or inside a valid container to reparent. Keep Screen first and fixed. Later entries render above earlier entries, consistently in the editor and native export. Retain button/keyboard alternatives to dragging.
- Safety and compatibility: reject cycles, invalid parents and excessive depth; preserve stable IDs, bindings and native blocks. Preserve visible placement when changing between free-layout parents, recalculating anchors/offsets; automatic-layout destinations explicitly adopt the destination layout. Review normalization of old files with a backup instead of silently changing their stacking.
- Verify ordering, overlaps, undo, save/reopen and GE native parity after implementation.

## P05. Keep at most one movable X guide and one movable Y guide

- Recorded: the later one-per-axis request supersedes the earlier multiple-guide request.
- Current source: each click adds another guide at one third of the corresponding dimension; clicking a guide removes it. There is existing drag snapping to guides.
- Proposal: X and Y become on/off controls; drag the displayed guide to reposition it, with an adjacent numeric position for precision and keyboard access. Turning a guide off removes its snap effect; a click on the guide no longer deletes it.
- Suggested choices: a new guide starts at the center; positions use canvas pixels and are saved with the UI project. For old projects with multiple guides on an axis, show a conversion review to choose the retained guide and preserve an original backup. Do not silently discard legacy positions.

## P06. Add a grid with snap and adjacent spacing control

- Recorded: a third Grid option, snapping and a cell-spacing field beside the Grid button.
- Proposal: draw the grid as an editor overlay; snapping uses canvas coordinates and works consistently at any zoom. Reuse one snapping calculation for dragging and resizing. Keep the overlay out of game exports.
- Suggested choices: start at 16 canvas pixels; use positive integer spacing; Grid toggles visibility and grid snapping together. Hold Alt to temporarily bypass snapping. Store these editor preferences per UI project without changing runtime behavior. Legacy projects open with Grid off.
- Verify identical coordinates at different zooms, no loss on reopening, and no grid graphics in exported HUDs.

## P07. Align automatically with other elements

- Recorded: automatic alignment to other elements.
- Proposal: while dragging/resizing, show temporary alignment hints for the parent's edges/center and visible siblings' edges/centers. Snap only during the gesture, using the same geometry calculation as guides/grid; do not rearrange other elements.
- Suggested choices: a visible Align toggle, on initially; a 6 screen-pixel tolerance, independent of zoom; choose the nearest valid target with deterministic tie-breaking, giving explicit X/Y guides priority on equal distance. Exclude hidden elements and descendants of the moving subtree; Alt bypasses all snapping.
- Verify there is no oscillation between targets and no conflict with automatic container layout.

## P08. Edit text by double-click or F2

- Recorded: edit authored content, not the hierarchy name/ID; containers are excluded.
- Proposal: double-click or F2 focuses the existing Content editor for text and button elements. Keep the element selected; Escape restores the text from the start of that edit; leaving the field commits a local draft, with explicit project Save unchanged. Treat the completed text edit as one undo step.
- Suggested choice: reuse the inspector rather than introduce an overlay editor initially. Images, containers and opaque native internals have no editable text target; do not offer a misleading editor. Shortcuts must not override normal typing or Interact mode.
- Verify text, IDs, binding targets and component instance/shared-default semantics remain distinct.

## P09. Add a color picker beside hexadecimal input

- Recorded: offer a visual picker for every supported color property and retain hexadecimal entry.
- Proposal: a reusable color field with swatch/native RGB picker, opacity and the existing #RRGGBBAA entry, all synchronized. Keep empty/unset distinct from transparent black. Apply it to supported background/text and other actual color fields, including shared component defaults.
- Suggested choice: opacity is shown as 0-100%; internal storage remains #RRGGBBAA. Verify RGB/alpha round trips, unset/reset behavior and no changes to imported image pixels.

## P10. Collapse behavior subitems

- Recorded: collapse/expand subitems in Visible when, Enabled when and Event connections.
- Current source: states and variables already use native details/summary; the requested condition/rule rows remain expanded.
- Proposal: extend that existing disclosure pattern to individual conditions and event connections, keeping concise summaries and item counts visible. Automatically open newly added or invalid entries.
- Suggested choices: existing entries start collapsed; remember expansion for the current editor session and selection, outside the authored document. No rules are disabled by collapsing them. Verify keyboard access and unchanged behavior/save results.

## P11. Provide an interactive first-use tour

- Recorded: keep current Help/contextual help and add practical, interactive onboarding.
- Existing work: a stopped, unapproved 0.1.1 prototype has a separate practice project and action-based checkpoints. It is not an approved installed delivery.
- Proposal: review/reuse that prototype after the editing contract is settled. Offer an optional first-use invitation plus a replay command; use a separate practice project, real editing actions, minimization, exit and resumption. Make the base tour independent of GE; teach game integration only for a linked supported project.
- Suggested choice: ask before entering the practice project and return to the previous project on exit, with normal unsaved-work handling. Verify completion comes from actual actions and that no owner HUD, inference or Unity synchronization is changed automatically.

## P12. Put conversation at the bottom of the window

- Recorded: a bottom composer; without AI, it opens assistant connection controls; with AI, it sends explicitly. Expand/collapse full controls and remove the replaced top Assistant & agents button.
- Proposal: reuse the current Assistant conversation/history/request owner, with a compact bottom bar and expandable conversation/settings area. Keep model, reasoning, operation limit, Stop and explicit Continue. Keep Options available in the toolbar independently of the assistant panel. Preserve drafts and ongoing responses when collapsing the panel.
- Suggested choice: an expandable bottom dock, not a modal covering the canvas. No connection, expansion or selection change sends a model message. Verify project switching, partial responses, revisioned proposal review and narrow-window usability.

## P13. Explain assistant controls and context

- Recorded: project revision, selection/parent, local explanation/note, Reload history, Export package, Refresh context and Import package need clearer purposes. The owner asked whether Screen is needed for whole-project context.
- Current source: each sent message receives the compact hierarchy, project metadata and current selection/draft; images/details are on demand. Selecting Screen changes focus, not access to the project. Local explanation does not call the model; context publication already occurs automatically.
- Proposal: show a plain-language context summary: project, selected focus and saved/draft state. Move technical revisions and external-package operations into an Advanced area. Rename local explanation to Inspect selection (local), move it out of the model composer and replace its apparent free-form AI question with direct local help. Describe Reload history as rereading this project's stored messages; explain package export/import as external-agent review workflows.
- Suggested choice: keep Refresh context as an advanced recovery action with help text. Provide short examples/tooltips; avoid claiming every image byte or all game source is automatically sent. Verify the explanations match actual operations and never imply that model proposals are already saved.

## P14. Optional image attachments in conversation

- Recorded as a possibility, not a confirmed requirement.
- Proposal if selected: a small attachment button with preview/removal. Accept supported image formats with existing size/type validation; attach to the next explicit message and support requesting those bytes on demand. Keep transient conversation references separate from authored HUD assets. Do not dump every project image into every turn.
- Suggested choice: leave this out of the first correction batch unless the owner selects it. A complete implementation would need model-image compatibility, private attachment persistence/lifetime and token-impact checks; the current chat contract accepts text, so a decorative button is not a complete solution.

## P15. Make first-use Codex sign-in understandable

- Recorded: a new user needs sign-in even without an authenticated local CLI.
- Current source: Connect finds the installed Codex CLI and calls account/read; absent ChatGPT authentication produces an error. It does not initiate browser login. No API-key fallback is allowed.
- Proposal: distinguish CLI unavailable, signed out, signing in, connected and failed states. Offer install/setup guidance when the CLI is absent. For a signed-out installed CLI, an explicit Sign in with ChatGPT action starts managed login, opens the returned browser URL and waits for completion before presenting the model catalog. Reuse an existing valid account without forcing login; support cancellation/errors without starting inference.
- Official flow rechecked for this review: account/login/start with type chatgpt -> authUrl -> account/login/completed and account/updated. Source: [official OpenAI App Server documentation](https://learn.chatgpt.com/docs/app-server). Protocol support must also be checked against the installed CLI before implementing; authentication is not an approval to send a model turn.
- Suggested choice: Codex account sign-in only, preserving the current provider/account route and explicit model/reasoning/work-limit choices. Do not silently change global configuration or fall back to a paid API key.

## P16. Support other games with project-specific data and actions

- Recorded: GE is the pilot; available data/conditions/actions should reflect the actual linked game. Generic versus adapted behavior was discussed, not finalized.
- Current source: visual editing and UI-local rules exist, but behavior validation, preview controls and native integration depend on a global GE catalog.
- Proposal: keep the current editor/rule model and separate its generic UI operations from game declarations. A new unlinked project has generic states, variables and UI events, with no GE-specific choices. Load a validated, versioned data/action catalog per linked project; keep the GE catalog and existing adapter for GE projects. Do not add hypothetical engine implementations.
- Discovery: a read-only scan of a linked game's relevant source/metadata can suggest mappings, excluding secrets and generated/runtime directories. Review each proposed type, instance context, parameter and authoritative action path before adding it to the project's catalog. Symbol discovery alone does not make an action callable or safe. Use reviewed host operations; do not broaden the assistant to arbitrary shell/filesystem access.
- Compatibility: preserve old GE binding IDs and opaque native data; surface missing/mismatched catalogs as unresolved bindings, not silent remapping. A catalog declaration and simulated result remain separate from a working runtime adapter.
- Suggested choice: generic authoring + per-project catalog + the existing GE adapter. Other engines require their own concrete integration scope. Verify a generic project has no GE leakage and existing GE authoring/native tests retain parity.

## P17. Link a game folder and start import pickers there

- Recorded: link a game-project root for architecture discovery and image/font import starting folders; preserve portability.
- Proposal: add Link game folder / Change / Relink in project settings, distinct from the portable UI-project folder. Keep the machine-specific absolute root in private local project settings; keep reviewed catalog data and copied image/font assets portable. Use the chosen native file dialog's supported default-directory option; browser file inputs cannot reliably choose an initial folder. Validate the selected root/imported bytes through the existing project owner, not just the dialog.
- Suggested choice: first import opens at the game root; later imports remember the last image/font folder under that root and fall back if it no longer exists. Moving the project to another computer requests relinking and still opens copied assets normally. A folder link never initiates discovery, inference or game writes by itself.
- Verify missing/moved folders, root validation, fresh Windows dialog behavior and portable project reopening without the original asset paths.

## P18. Add appearance modes and color schemes in Options

- Recorded: dark/light modes and additional selectable schemes.
- Current source: interface colors are mostly fixed CSS; there is an Options dialog and private settings lease that can be extended.
- Proposal: replace fixed chrome colors with semantic CSS variables. Add Light, Dark and System appearance plus a small reviewed accent-scheme selector in Options. Persist privately using the current settings owner/concurrency protection. Keep authored HUD colors and original media untouched; themes apply to editor chrome and overlays only.
- Suggested choices: System as the initial mode; Neutral, Blue and Green as initial scheme proposals. Verify text/control contrast, selection, guides, disabled states and all panels in both appearances.

## P19. Optional future Claude/Antigravity connections

- Recorded as future possibilities; Codex is the current production connector.
- Proposal: show only implemented providers as connectable. Each additional provider needs an explicitly selected scope covering its supported account/login route, model/reasoning controls, tool restrictions, cancellation/history and revisioned proposals. Reuse the current operations when a concrete connector is authorized; do not create empty adapters or simulate connectivity.
- Suggested choice: defer additional providers from this correction batch. Their mention does not authorize new credentials, global installs or inference.

## Proposed implementation order and acceptance

1. P16-P17: settle the generic/project boundary and folder/catalog contract first. Output: a compatible document/settings contract and a generic project without GE choices; preserve the GE pilot. These are the main architectural choices for owner review.
2. P01-P10: correct authoring behavior using shared geometry, subtree order and document-owner validation. Output: precise canvas editing with matching hierarchy, portable persistence and one undo step per completed gesture.
3. P12-P13, P15 and P18: revise assistant access, sign-in clarity and appearance. Output: clear explicit-message flow and settings that do not alter authored game content.
4. P11: adapt/review the stopped tour against the settled interface, then package only when implementation/installation are separately requested. P14 and P19 remain optional.

For implementation, use targeted regression tests for no-edit clicks, gesture cancellation/undo, hierarchy cycles/order, coordinate/snapping behavior, catalog compatibility and assistant/account boundaries. Check the real Windows file picker and interface at wide/narrow widths. Changes affecting exported structure, layout or bindings require fresh GE native parity and the relevant isolated Unity proof; editor screenshots and simulated preview cannot replace that proof. No real A/B/C inference rerun is part of this review.

## Review choices

The owner can accept or revise individual IDs. In particular: resize gesture modifiers (P02), indentation (P03), hierarchy drop/legacy normalization (P04), guide initial position/legacy conversion (P05), grid spacing and units (P06), alignment scope/tolerance (P07), inspector versus inline text editing (P08), expansion persistence (P10), tour entry (P11), optional attachments (P14), generic/catalog integration (P16), native picker defaults (P17), theme choices (P18) and optional providers (P19).

The later owner instruction authorizes application implementation, verification and Workspace standardization. Preserve the installed application and active sessions; no commit, publication, paid inference or unrelated game change is implied. Implementation evidence is recorded separately.
