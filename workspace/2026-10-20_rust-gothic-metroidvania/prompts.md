# Gameplay scene concepts — prompts

Date: 2026-10-20. Current status: B — Corroded Bastion selected by the owner on 2026-10-20. A and C are preserved alternatives. Exact generation prompts below are unchanged.

Delivered originals: three PNG images, each 1672 x 941 pixels. The complete images are preserved without resizing.

Generator: built-in `image_gen`, via the imagegen skill. Exact model version, seed and provider request ID are not exposed by this integration. Three separate tool calls produced the three images. A was generated from text; B and C used A as a composition reference.

## A — Iron Cathedral

Output: [scene-a-iron-cathedral-v01.png](media/scene-a-iron-cathedral-v01.png).

Input: text only.

```text
Use case: stylized-concept.
Asset type: first visual-foundation concept for a new gothic medieval fantasy 2.5D metroidvania.
Deliver ONE finished full-frame 16:9 landscape gameplay-view concept, not a collage or concept sheet. Target wide 2048x1152 composition.
Camera/layout locked for comparison across three independent directions: camera looks sideways at the playable lane, with mild perspective revealing depth in the 3D environment. No isometric angle, no cinematic low angle. Horizontal floor at about 78% image height; raised landing on the far right at 57% height. A small broken span interrupts the lower floor near the middle; a chain-ring grappling anchor hangs above that gap. The upper right landing is supported by clear medieval stone and iron construction. Readable platform edges.
At x=24% an EMPTY animated medieval suit of armor faces right, full-body, carrying a straight sword and a simple shield; about 15% of image height, plausible gameplay scale. Darkness visible inside helmet and armor gaps; no human face or exposed skin. Make the character read as a crisp pre-rendered 3D sprite integrated into the 3D scene. At x=73% a corroded swordsman stands on the lower floor; a small archer silhouette stands on the upper-right landing. Keep them subordinate to the scene, distinguishable from the protagonist.
Space: a ruined fortress passage connected to a cathedral, with massive distant arches, layered stonework and corroded structural iron. A dormant forge is suggested deep in the right background. Two small braziers, one at lower left and one near the right gateway, provide believable local light.
The rust must be physically specific: layered iron oxide, pitting, flakes, failing seams, restrained dusty deposits. Stone remains stone. Rust is the principal visual theme, not a flat orange color filter. Distinguish the legible playable middle plane from subdued distant architecture and unobtrusive foreground silhouettes.
Constraints: original game concept, gothic medieval fantasy, clean playable silhouette, coherent object scale, complete small characters with visible feet, important platform paths unobstructed. No user interface, no HUD, no captions, no typography, no logos, no watermark. No modern machinery, guns, steampunk gears, neon, organic tentacles, or giant portrait character. This is a concept visualization, not a technical screenshot.

Direction A — IRON CATHEDRAL. Tall slender Gothic lancet arches, rib vaults, slender iron tracery, weathered pale limestone and black forged-iron frameworks. Restrained refined architectural detail, a mournful abandoned sacred space. Blue-gray daylight shafts through high broken windows, warm amber from the two braziers, focused copper-orange corrosion along joints and railings. Semi-realistic authored 3D game-art finish, elegant silhouettes and tactile materials; clear value hierarchy and moderate contrast around the protagonist. Keep the composition and all actor positions specified above.
```

## B — Corroded Bastion

Output: [scene-b-corroded-bastion-v01.png](media/scene-b-corroded-bastion-v01.png).

Input image: scene-a-iron-cathedral-v01.png, as composition/layout reference.

```text
Use case: stylized-concept.
Create one full-frame 16:9 landscape visual-direction variant for a gothic medieval fantasy 2.5D metroidvania.
Input image role: the supplied Iron Cathedral concept is a COMPOSITION AND GAMEPLAY-LAYOUT REFERENCE, not an approved art direction. Preserve its exact side-view camera and mild perspective, the protagonist/enemy positions and scale, platform silhouettes, gap, hanging ring anchor, upper-right archer landing and background depth. No collage or labels. The empty protagonist armor, sword and shield should remain recognizable, without a visible human body. Keep crisp pre-rendered-3D-sprite character readability inside a 3D environment.
Redesign the architectural construction, forms, surface treatment and lighting as a distinctly different candidate:
Direction B — CORRODED BASTION. The same camera, actor positions and level layout, but with squat monumental fortress architecture: broad pointed arches, thick buttresses, heavy bolted iron reinforcement, rough dark limestone blocks and large readable masses. Corrosion eats through thick plates in deep layered scales, with iron debris gathered at the base of supports. A weathered, grounded stylized 3D finish with bold proportions and simpler surface detail for excellent gameplay readability. Desaturated charcoal and ash stone, rusty russet and ochre iron; pale overcast light from upper openings balanced by muted gold braziers. Weighty, austere, oppressive medieval fortification, no industrial or steampunk machinery.
Make the contrast against the reference obvious: broader, heavier forms and simplified bold masses rather than slender ornate tracery; charcoal and ash masonry with ochre iron, and diffuse pale overcast light rather than blue cathedral light. Keep localized rust texture legible rather than coating all stone orange. Two small braziers and a distant medieval forge are sufficient warm light. Keep pathways and character silhouettes clear.
Constraints: original gothic medieval fantasy. No modern machinery, steampunk gears, firearms, neon, organic tentacles, user interface, text, borders, watermark or camera changes. Deliver the complete scene only.
```

## C — Sepulchral Forge

Output: [scene-c-sepulchral-forge-v01.png](media/scene-c-sepulchral-forge-v01.png).

Input image: scene-a-iron-cathedral-v01.png, as composition/layout reference.

```text
Use case: stylized-concept.
Create one full-frame 16:9 landscape visual-direction variant for a gothic medieval fantasy 2.5D metroidvania.
Input image role: the supplied Iron Cathedral image is ONLY a composition/layout reference. Preserve its exact side-view camera and mild perspective, playable platform silhouettes, central gap and hanging ring anchor, upper-right archer landing, all three actor positions and gameplay scale. This is candidate C, a different art direction, not an accepted design.
Direction C — SEPULCHRAL FORGE. The same camera, actor positions and level layout, but with a funerary cathedral-fortress language: narrow clustered columns, layered pointed arcades, carved stone niches and elegantly bent wrought-iron screens whose edges crumble into delicate oxide flakes. Stylized sculptural 3D game-art finish with strong flowing silhouettes and selective detail, not photorealistic clutter. Pale gray bone-colored limestone, near-black iron, deep reddish-brown rust and subdued verdigris-gray ambient tones (iron corrosion remains reddish-brown, not green). Cold soft ambient light from distant apertures, small pale-gold braziers, with a faint warm dormant-forge ember deep in the right background. Eerie solemn emptiness, ornamental medieval construction, no body horror or organic growth.
Push the distinction strongly: pale stone, austere tall funerary arcades, elongated clean architectural silhouettes, slender broken metal screens and broad quiet shadow shapes. Simplify surface noise into sculptural hand-authored material masses; make this more stylized than the reference, with much less photorealistic rubble and less dense decoration. Use restrained red-brown oxide specifically on iron edges and joints, contrasting clearly against pale weathered stone. The dominant ambient palette is cold desaturated gray-sage with creamy stone highlights, not the reference's blue-orange palette. Braziers produce small pale-gold local pools, never a uniform orange wash. Background forge is dormant with only a faint ember.
Keep the empty animated armor protagonist side-facing right with sword and shield, clean readable silhouette and dark empty helmet, no human anatomy. The corroded swordsman and small archer retain their relative locations. Characters should read as crisp pre-rendered 3D sprites inside a coherent 3D scene.
Constraints: medieval gothic fantasy construction only. No modern machinery, steampunk, organic tentacles, giant skull decorations, neon, extra characters, text, titles, HUD, logos, watermark or borders. One complete scene, not a collage.
```
