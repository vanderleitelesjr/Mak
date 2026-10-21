# Rusted: first rendering/runtime proof

An isolated Rust crate inside the existing Mr. Mak project. No separate Git repository, published build or final engine architecture is implied. The confirmed game specification is [../README.md](../README.md).

Implemented: a custom `wgpu` renderer and `winit` window; one perspective 3D blockout room; a Blender-generated animated armor sprite with unlit color/alpha and linear world-normal atlases; two moving-intensity torch lights affecting the room and sprite; side-following camera; 120 Hz planar movement/collision; keyboard, right-mouse and controller mappings; and a bounded executable movement graph loaded from JSON.

The room and character are **simple technical proxies**, informed by the selected visual references. They do not replace the accepted concepts or establish final model/animation approval. Lights have no shadow maps. The sprite uses a single world plane without per-pixel depth. Combat, traversal unlocks, inventory, corrosion, shop, forge event, boss, complete level and visual editor are future work.

## Build and run on Windows

Requires Rust (tested with 1.99.1), MSVC build tools and a DX12 adapter. Locked dependencies include `wgpu` 26.0.1 and stable `winit` 0.30.13. These are implementation selections, not new owner-confirmed design decisions. No paid service or generation API is used.

```powershell
Set-Location E:\MrMak\Mak\projects\rust-gothic-metroidvania\runtime
cargo run --release --locked
```

Controls for this proof:

| Action | Keyboard / mouse | Controller |
| --- | --- | --- |
| Move | A/D or Left/Right | Left stick or D-pad |
| Jump | Space or right mouse button | South button |
| Toggle torch contribution | L | — |
| View normals | N | — |
| Reload movement graph | F5 | — |
| Exit | Escape / window close | — |

These are temporary proof mappings, not approval of the illustrative UI glyphs. Physical keyboard/mouse/controller playtesting remains pending. Focus loss clears held keyboard/mouse actions. Controller input is polled through `gilrs`; lack of a controller backend is reported while keyboard/mouse remain available.

The executable finds `assets` beside itself, then falls back to the development asset directory. `--assets PATH` selects another copy explicitly. Missing images, malformed rooms, invalid graph links, unknown clips and atlas mismatches produce contextual startup errors.

## Editable Blender source and exports

`assets/penitent-proof-v01/penitent-proof-v01.blend` contains a stationary global root, rigid armor parts, editable keyed joint controls and ordinary material-preview setup. It has no skinned runtime skeleton: the engine consumes rendered sprites, as required by D06. The active playback range is Walk, frames 1–25 at 32 fps. Idle is frames 33–65 in the same source. The repeated endpoint closes the loop; exported samples exclude that duplicate.

| Clip | Source range / fps | Exported samples / fps | Duration |
| --- | --- | --- | --- |
| Walk | 1–25 / 32 | 12 / 16 | 0.75 seconds |
| Idle | 33–65 / 32 | 8 / 8 | 1 second |

```powershell
& 'D:\Program Files\Blender Foundation\Blender 5.2\blender.exe' -b --factory-startup --python-exit-code 1 --python tools/export_sprites.py
& 'D:\Program Files\Blender Foundation\Blender 5.2\blender.exe' -b --factory-startup --python-exit-code 1 --python tools/verify_blender.py
```

Change the Blender executable path for another installation. Tested with Blender 5.2.2 LTS. The exporter creates its own isolated headless scene and does not attach to an existing Blender session. Re-exporting overwrites only this versioned technical proxy's exports; it does not edit the approved reference images.

The 5×4 atlases contain 192×256 RGBA frames. Albedo uses sRGB, and normals use linear RGB, encoding world `(X right, Y up, Z toward camera)` from `[-1,1]` into `[0,1]`. The renderer reverses normal X when mirroring the sprite. Cycles denoising is disabled for these data passes: it corrupts normal length. Source verification reopens the saved `.blend` in a fresh process and checks 20 sole-contact poses, stationary root and both loop seams. This checks geometry/data; it is not an artist's approval of gait quality.

## Executable graph and ownership

`assets/movement.json` owns control flow: horizontal operation, jump-input and grounded branches, vertical impulse, animation selection and halt. `src/graph.rs` owns native operations and bounded traversal. `src/world.rs` owns gravity, collision and camera integration. `assets/room.json` owns the visible collision solids. The renderer builds those solids from the same data; decorative masonry does not claim collision or room-event behavior.

Change the `yes` link on `on_ground` from `jump` to `animation` and press F5 to remove jumping without recompiling. Restore it to restore jumping. This changes executable topology, rather than merely a native movement constant. A regression test proves this behavior. Reload validates the whole graph before replacing the running one; an invalid reload preserves the previous graph. Execution is limited to 128 operations per tick and commits player changes only after reaching Halt. A runtime cycle reports its current node and exits with an error rather than freezing.

## Reproduce verification

```powershell
cargo test --locked
cargo build --release --locked
.\target\release\rusted-proof.exe --verify evidence\final-v01
.\target\release\rusted-proof.exe --smoke evidence\native-v01
```

The first command runs six focused tests for graph topology/errors/cycles, floor/side/platform collision, authored-room preservation and actual exported frame/normal data. `--verify` performs an eight-second scripted replay at 120 simulation steps/second and captures 160 PNGs at 20 Hz. Its matched light OFF/ON pair uses identical pose, time and camera; only torch contribution changes. A sprite-only render mask measures changed character pixels independently of the background. It uses the exact renderer/shader used by the native window.

`--smoke` opens a separate native Windows window, presents 120 frames with synthetic actions, captures the same render pass and closes itself. These modes do not inject input into physical devices. GPU readback screenshots are not desktop screenshots and do not prove physical controller operation.

To encode the captured original PNGs as a review video, pass an existing FFmpeg executable:

```powershell
& $Ffmpeg -hide_banner -loglevel error -framerate 20 -i 'evidence/final-v01/frames/%04d.png' -c:v libx264 -crf 20 -pix_fmt yuv420p -movflags +faststart evidence/final-v01/runtime-loop.mp4
```

Original captures and JSON reports remain under ignored `evidence/`; the Workspace card contains a selected review copy. Capture/PNG-encoding time is recorded only for provenance and is **not** a gameplay frame-rate benchmark. Reproduction should use a fresh evidence folder or preserve earlier captures before overwriting them.

## Verified 2026-10-20

- Windows 11 Pro, NVIDIA GeForce RTX 5080, DX12, release build, 1280×720.
- Six tests passed. Source reopened successfully: 20 support poses, root and loop seams passed; maximum sole error below 0.000001 m.
- Matched light comparison: 467,757 changed scene pixels and 3,711 changed sprite pixels. Scripted jump reached 1.332 m above its initial floor.
- Native startup/render/close passed with 120 presented frames.
- Pending: human visual acceptance and physical input playtest. The full prototype and editor are not implemented.

Next technical milestone: visual room/graph authoring using this same runtime, with save/reload validation and playtest instances that cannot overwrite authored data.
