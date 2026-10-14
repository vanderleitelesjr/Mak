# Stage 2B · Supplementary multi-view character sheet (3 projections + accessories laid out)

**Model:** GPT-Image-2.5 (primary since Sep 2026, source workflow choice; fal id `openai/gpt-image-2.5/flare/*`) | GPT-Image-2, then Seedream V5 Lite (fallbacks) — the GPT-Image family is best at composing multiple framed projections in one image
**Aspect:** 16:9 landscape
**Reference:** the user's input character image + the Stage 2A strict-front A-pose sheet (attach both)

## Purpose

This is the **visual aid for the user** — a single 16:9 image showing the character in three orthographic projections (front, side, back) plus accessories laid out separately to the side. Large items like hats, weapons, capes, and backpacks are drawn isolated next to the figure so the user can point to them precisely during the parts-confirmation gate.

It is NOT used as direct input to part extraction (Stage 2A's image is). It exists for human reference and as a downstream pose-match reference during multi-view extraction.

## Prompt skeleton

```
A clean orthographic character sheet of {CHARACTER_DESCRIPTION}, 16:9 landscape composition, white background (#FFFFFF) throughout. Show the character in THREE views, each in A-pose, laid out left-to-right across the sheet:

1. FRONT view (left third) — character faces the camera dead-on, strict front, A-pose, full body head to toe. Identical to the strict-front sheet from Stage 2A.

2. SIDE view (middle third) — character in profile, 90 degrees rotated to the right (camera sees the character's left side), still in A-pose, full body head to toe, feet on the same ground line as the front view.

3. BACK view (right third) — character faces directly away from the camera, dead-back, A-pose, full body head to toe, feet on the same ground line as front and side.

To the right of the figure (or above/below if space requires), lay out the character's separable accessories as ISOLATED objects on the same white background: {ACCESSORY_LIST — e.g. "the wizard hat, the curved katana, the leather satchel"}. Each accessory drawn cleanly at a natural angle, large enough to read all detail. Label each accessory with its name in small caption text below the object.

Neutral diffuse flat lighting throughout, no shadow on the ground, no cinematic mood. Character identity, proportions, color palette, and accessories match the reference image EXACTLY across all three projections. Sharp focus, reference-grade clarity. Same character in all three views — verifiably the same proportions and face.
```

## Substitution rules

- `{CHARACTER_DESCRIPTION}` — same description used in Stage 2A
- `{ACCESSORY_LIST}` — every separable accessory detected during intake (hat, weapon, backpack, jewelry, cape, etc.). If no accessories, omit the accessory layout instruction entirely.

## Negatives

```
no inconsistent character across views, no different face between views, no different proportions, no different outfit, no different colors, no overlapping views, no cropping of any view, no environment, no background props, no shadow gradient on ground, no dramatic lighting, no rim light, no cinematic mood, no perspective camera, no foreshortening, no missing accessories, no merged accessories, no labels missing
```

## Quality checklist

- [ ] All three views present and clearly separated
- [ ] Each view is strict orthographic (front = dead front, side = dead profile, back = dead back)
- [ ] Same character verifiably across views (same face proportions, same outfit, same colors)
- [ ] A-pose held in all three views
- [ ] Accessories laid out separately and labeled
- [ ] White background, no shadow, no environment
- [ ] 16:9 aspect held cleanly with no cropping
- [ ] Reference-grade clarity (used as visual reference, not input — but still needs to read clearly)
- [ ] If composition fails (overlap, different faces between views): retry. If after 2 retries still failing, fall back to Seedream V5 Lite. If still failing, escalate.

## Why GPT-Image-2 and not Nano Banana Pro for this stage

Nano Banana Pro is the workhorse for single-character-single-pose at strict orthographic. But it struggles with multi-panel layouts that hold character identity across panels. GPT-Image-2 is more reliable at composing 3 distinct framed views of the same character on one canvas with consistent identity — and that's the only job for Stage 2B.
