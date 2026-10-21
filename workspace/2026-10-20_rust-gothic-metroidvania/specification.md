# Rust Gothic Metroidvania Prototype

Working descriptor, not a final game title. Interview date: 2026-10-20.

**Status:** the owner confirmed the consolidated scope on 2026-10-20 by selecting option A in the final review. The requirements interview and visual selections are complete. The first rendering/runtime proof is implemented and agent-verified; physical input playtesting and human visual review remain pending. The complete prototype and visual editor are not implemented.

## Primary goal

Prove a custom Rust engine through a playable Windows metroidvania prototype and its visual authoring tools. The engine owns rendering and game systems, with libraries providing windowing, GPU access, physics and audio.

This is a new project. Its setting, decisions and implementation are independent of the existing Gothic Platformer and Game UI Editor projects.

## Confirmed decision record

All decisions below were confirmed during the 2026-10-20 interview. They describe requested behavior, not implemented or validated functionality.

| ID | Confirmed decision |
| --- | --- |
| D01 | The primary objective is a functioning custom engine. Rust is mandatory; the first target is Windows. |
| D02 | Build our own renderer and game systems, reusing libraries for windowing, GPU access, physics and audio. |
| D03 | The game is a gothic medieval fantasy metroidvania, with rust as its central theme. |
| D04 | Use Bloodstained: Ritual of the Night as a reference for composition: 3D environments, side-on movement, and sprites for characters and selected scenery details. |
| D05 | Use a side-following camera with mild perspective. |
| D06 | Generate character sprites and animations from 3D models in Blender. The engine imports the resulting assets; sprite generation belongs to the external production pipeline. |
| D07 | The first delivery uses simple models while exercising the real model-to-sprite pipeline. |
| D08 | Dynamic lights, including torches, affect both environments and character sprites. |
| D09 | The protagonist is an empty suit of armor animated by an unknown presence. |
| D10 | The playable area is a fortress and cathedral overtaken by rust. |
| D11 | The objective is to reignite a protective forge during exploration. Doing so transforms routes and opens access to the boss. |
| D12 | Rust contributes to atmosphere and story, and also deteriorates equipment and environments. It is not a player rust-power mechanic. |
| D13 | Equipment corrosion comes from contact with corrosive enemies and environments, rather than ordinary weapon use. |
| D14 | Corrosion can permanently destroy weapons and shields within the current play session. Traversal abilities remain available. |
| D15 | Environmental changes occur at defined story events, rather than through continuously simulated corrosion. |
| D16 | Start with a sword and shield. The initial combat set is one sword attack, blocking, parrying and dodging. |
| D17 | Combat has no stamina meter; animation timing provides the commitment to actions. |
| D18 | Unarmed combat remains available after equipment loss. Replacement equipment is purchased at safe points with resources earned in combat. |
| D19 | Common enemies respawn when resting and can be defeated unarmed to regain purchasing resources. |
| D20 | Purchased equipment goes into an inventory, allowing reserves and manual equipment changes. Opening the inventory pauses gameplay. |
| D21 | Death returns the player to the last safe point while retaining traversal abilities, equipment state and currency. Destruction is not undone by death. |
| D22 | Player progression exists only during the running session. Closing the game does not preserve that run. Authored maps and graphs are saved separately as project assets. |
| D23 | The playable prototype contains 8-12 rooms, two common enemy types and one boss. |
| D24 | The common enemies are a corroded swordsman and an archer. |
| D25 | Unlock all three traversal abilities in this order: double jump, horizontal dash, then grappling hook. |
| D26 | The grappling hook pulls the player toward fixed anchor points, rather than supporting rope swinging. |
| D27 | Support keyboard, mouse and game controller in the prototype. |
| D28 | Include a custom visual editor for rooms, objects, simple events, map saving/loading and playtesting. |
| D29 | The editor includes visual programming blocks for room events, enemy behavior, and protagonist movement and combat. |

## Behavioral invariants

These are implementation requirements derived from the confirmed decisions, to be checked during implementation:

- Destroying every carried weapon or shield must leave a viable route to recovery. Unarmed combat must earn resources; traversal abilities and access to safe points must not require an intact weapon or shield.
- Death preserves losses and currency within the session. It must not silently restore destroyed equipment or remove unlocked traversal abilities.
- Pausing for inventory management pauses gameplay simulation, including combat, physics, corrosion and gameplay graph timers.
- A story event must leave room geometry, collisions, doors and traversal connections in a consistent state. Re-entering a changed room must preserve its current session state.
- Keyboard/mouse and controller feed the same gameplay actions and behavior graphs.
- Visual graphs execute the actual player, enemy and room logic. Editing a graph must change runtime behavior; displaying nodes or changing a few native-code parameters alone does not satisfy this requirement.
- Playtests use runtime instances of authored data. Stopping a playtest must preserve the authored map and graphs rather than saving runtime damage, deaths or corrosion into them.
- Saving maps and graphs is distinct from saving a player run. The former is required; the latter is outside this prototype's confirmed scope.

## Proposed technical approach

This section is a proposal, not an additional set of owner-confirmed technology decisions.

- Share one Rust runtime between the game and editor so that playtests exercise the same rendering, physics and graph execution as the playable build.
- Evaluate `wgpu` and `winit` for graphics access and windowing, `egui` for editor panels, and existing physics/audio libraries. Exact dependencies and versions are selected during technical setup.
- Use planar gameplay physics with 3D scene rendering. Decorative depth does not introduce free movement into the screen.
- Have Blender export simple animated color/alpha sprite atlases with accompanying normal data and animation metadata. Prototype the light response before producing the full sprite set.
- Store maps, entity definitions and typed behavior graphs as editable data. Provide clear validation errors for missing assets, invalid connections and invalid graphs.
- Let native runtime operations own input sampling, collision queries, motion, animation playback and damage application. Compose player behavior, enemy decisions and narrative sequences in graphs, keeping their behavior ownership in those graphs.
- Bound graph execution so that an invalid cycle cannot freeze the application. Report the offending graph and node in the editor.
- Begin with a focused catalog of gameplay and control-flow blocks sufficient to implement this prototype. The interview did not request a general-purpose programming language, a material editor or a 3D modeling tool.

## Proposed delivery sequence

1. **Rendering and runtime proof:** one room, a Blender-generated animated sprite, dynamic light response, planar collision, the camera, normalized input and a small executable movement graph.
2. **Authoring proof:** edit and reload a room and its graphs, run it through the shared runtime, inspect validation errors, and return from playtesting without altering authored state.
3. **Gameplay systems:** graph-authored player and enemy behavior; sword/shield and unarmed combat; corrosion and destruction; paused inventory; purchases, resting and checkpoint state; the three traversal abilities.
4. **Complete playable circuit:** 8-12 connected rooms, the two enemy types, ordered traversal unlocks, the forge event and changed routes, and the final boss.
5. **Verification and handoff:** native gameplay and editor checks, measured rendering behavior, editable Blender sources, exported sprite assets, map/graph sources and a reproducible Windows build.

These are implementation stages of the agreed scope. The first technical proof does not replace the complete prototype.

## Acceptance checks

- A native Windows build runs the complete playable circuit with keyboard/mouse and controller.
- A simple model actually passes through Blender into an animated, dynamically lit in-game sprite; installation checks or a static mockup are insufficient evidence.
- Maps and graphs can be edited, saved, closed, reloaded and executed. A graph edit demonstrably changes a player behavior, an enemy behavior and a room event.
- All three traversal abilities are acquired in order and used to open routes, including a return to a previously visited area.
- Reigniting the forge changes the environment and makes the boss reachable.
- Equipment can corrode and be destroyed; unarmed recovery, purchases, reserve inventory and manual equipment changes work together.
- Death preserves the current session's currency, unlocked traversal and equipment state. Resting respawns common enemies. Closing and reopening the game begins a fresh run.
- Inventory pause and editor playtesting preserve the behavioral invariants above.
- Rendering measurements identify the test machine, resolution and build. A frame-rate guarantee has not been agreed or demonstrated.

## Scope confirmation and next step

The owner approved this consolidated specification as the prototype scope. All 29 recorded decisions remain confirmed. The technical approach and delivery sequence remain implementation proposals; the approval closed the requirements interview.

The first rendering/runtime proof now lives in [runtime/](runtime/README.md), an isolated Rust crate inside this repository. It uses locked `wgpu` 26.0.1 and stable `winit` 0.30.13 dependencies. These are implementation choices, not additional owner-confirmed design decisions. The final game title, detailed room layout, boss behavior, complete block catalog, combat/economy tuning and a separate implementation repository remain open implementation/design work.

The next technical milestone is visual room/graph authoring through this same runtime, including validated save/reload and isolated playtest state. The first proof provides a custom renderer, one 3D room, a genuinely Blender-generated animated sprite with dynamic light, planar collision, following camera, common input actions and an executable movement graph. It does not substitute for the complete approved prototype.

## Visual exploration

The first scene exploration contains three generated directions: A, Iron Cathedral; B, Corroded Bastion; and C, Sepulchral Forge. Camera and gameplay composition are kept broadly consistent while architecture, corrosion and lighting vary.

The protagonist exploration adds three empty-armor concepts: P01, Hollow Sentinel; P02, Reliquary Warden; and P03, Penitent Harness. Each board includes equipped, side and unarmed views. On 2026-10-20 the owner selected **B — Corroded Bastion** as the environment direction and **P03 — Penitent Harness** as the protagonist direction.

### Confirmed visual selections

| ID | Confirmed visual direction |
| --- | --- |
| VIS01 | B — Corroded Bastion: heavy fortress masonry, broad arches, riveted corroded iron, overcast light and localized warm fire. Use this architectural/material language in new rooms. |
| VIS02 | P03 — Penitent Harness: lean asymmetric repaired empty armor, angular damaged helmet, visible hollow neck/gaps, straight sword and round buckler. |
| VIS03 | L02 — Cold Skylight: the selected combined-scene lighting/visibility reference, with cooler silver highlights and localized rust. Preserve the image as the current reference; the technical runtime proxy does not establish a match to this approved appearance. |

These three visual decisions supplement the 29 gameplay/engine decisions above; those original requirements are unchanged.

A new **Lower Gatehouse** concept combines both selected references in a different room with a portcullis, chain lift and raised gallery. The original scene is retained as the baseline for the selected L02 treatment. Its specific room layout and mechanisms are not additional confirmed gameplay scope. The first take was superseded after a protagonist-identity correction and is retained for traceability.

The owner subsequently reported that the protagonist blends into the environment. A five-image visibility study applies the recommended correction plus four alternatives: **L01 Balanced Steel**, **L02 Cold Skylight**, **L03 Mist Silhouette**, **L04 Warm Firelight** and **L05 Quiet Materials**. Each is an edit of the same scene with the original Penitent Harness board as an identity reference. The owner selected **L02 — Cold Skylight** as the final lighting/visibility treatment on 2026-10-20, recorded as VIS03. VIS01 and VIS02 are unchanged. The original scene and earlier draft remain preserved.

- [Selected L02 original](../../workspace/2026-10-20_rust-gothic-metroidvania/media/scene-d-lower-gatehouse-l02-cold-skylight-v01.png)
- [Visibility study prompts and review](../../workspace/2026-10-20_rust-gothic-metroidvania/media/cenario/combined-scenes/scene-d-lower-gatehouse-v02.prompt.md)
- [Combined scene original](../../workspace/2026-10-20_rust-gothic-metroidvania/media/scene-d-lower-gatehouse-v01.png)
- [Combined scene prompts and review](../../workspace/2026-10-20_rust-gothic-metroidvania/media/cenario/combined-scenes/scene-d-lower-gatehouse-v01.prompt.md)
- [Project dashboard](../../workspace/2026-10-20_rust-gothic-metroidvania/painel.html)
- [Art collection](../../workspace/2026-10-20_rust-gothic-metroidvania/acervo.html)
- [Scene comparison gallery](../../workspace/2026-10-20_rust-gothic-metroidvania/concepts.html)
- [Complete generation prompts](../../workspace/2026-10-20_rust-gothic-metroidvania/prompts.md)
- [Protagonist generation prompts](../../workspace/2026-10-20_rust-gothic-metroidvania/protagonist-prompts.md)

The PNG originals and prompts are preserved in the project's Workspace card. These concepts guide visual review. The first Blender-to-sprite/runtime proof is now implemented and separately verified; its simple models and room blockout are technical proxies, not replacements for these accepted references.

## Additional art foundation selections — 2026-10-20

The owner authorized all remaining suggested image concepts, with three distinct options each. The batch contains **27 new PNGs in nine groups**: rust/material language, forge before/after, swordsman, archer, boss, exploration signals, HUD, paused reserve inventory and equipment shop. The owner confirmed all nine choices: HUD B, inventory B, shop B, swordsman B, archer B, boss C, materials B, forge C and exploration B. The approved B/P03/L02 direction and original gameplay scope remain unchanged.

[Batch index and original images](../../workspace/2026-10-20_rust-gothic-metroidvania/foundations-index.md). Each group has exact prompts, three comparative previews and original downloads in the existing Workspace card.

The selected boss appearance and the selected visual languages are approved. Exact boss dimensions/behavior, UI prices, slot counts, currency symbols and input glyphs remain illustrative rather than confirmed implementation rules. Some generated details need refinement after selection; the card records observed issues. This art batch produced image references. The later Blender-to-sprite proof does not implement the selected HUD, inventory, shop or boss behavior.

### Confirmed additional visual selections

| ID | Group | Selected direction |
| --- | --- | --- |
| VIS04 | Rust and material language | B — Pitted cavities |
| VIS05 | Forge before and after | C — Circular anvil and passage |
| VIS06 | Corroded swordsman | B — Hunched Mail Veteran |
| VIS07 | Corroded archer | B — Mantled Wall Hunter |
| VIS08 | Fortress boss proposals | C — Ashbound Colossus |
| VIS09 | Exploration and safety signals | B — Gothic stone insets |
| VIS10 | Essential gameplay HUD | B — Cathedral Tracery |
| VIS11 | Paused reserve inventory | B — Cathedral Tracery |
| VIS12 | Replacement equipment shop | B — Cathedral Tracery |

These selections establish appearance. Existing gameplay rules remain authoritative: material B does not add player-armor destruction; exploration B does not add swinging; UI slot counts, prices and input glyphs are illustrative; boss C selects appearance while exact scale and combat behavior still require design and production.

## Rendering/runtime proof — 2026-10-20

The continuation request started the first technical milestone. Sources, build commands, controls, asset format and limitations are in [runtime/README.md](runtime/README.md). Review the [native GPU evidence and video](../../workspace/2026-10-20_rust-gothic-metroidvania/runtime-proof.html) in the existing Workspace card.

Implemented: one 3D blockout room; custom Rust rendering; an editable simple Blender armor source with Idle/Walk atlases and linear world normals; torch lighting affecting both geometry and sprite; side-following perspective camera; fixed-step planar collision; common keyboard/mouse/controller actions; and a bounded JSON control-flow graph. Reconnecting a graph branch demonstrably removes jumping without changing native code.

Agent verification: six focused tests passed; the saved Blender source reopened and passed 20 support-pose/root/loop checks; a matched light comparison changed 3,711 sprite pixels independently of background changes; and a native Windows window presented 120 frames and closed normally. Captures used Windows 11 Pro, RTX 5080, DX12 and 1280×720. The eight-second replay uses synthetic actions and the same renderer as the native window. It is not a performance benchmark or physical input playtest.

Pending: owner visual review and physical keyboard/mouse/controller testing. The model, animations and room remain simple technical proxies. No shadows or sprite depth are implemented. The complete game and visual editor remain future milestones; all 41 confirmed design/visual decisions and approved images are preserved.
