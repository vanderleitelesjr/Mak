# Stage 5 · Multi-view per part — SIDE and BACK views (gate-controlled)

**Model:** Nano Banana Pro (same as Stages 2A + 4 — consistency wins)
**Resolution:** 2K
**Reference:** the Stage 2A strict-front A-pose sheet + the matching part's strict-front extract from Stage 4 (attach both)
**Rule:** these are STRICT ORTHOGRAPHIC side and back views. NO 3/4 here either. Side = exactly 90° rotated profile. Back = exactly 180° dead-back. The character / part must hold A-pose throughout.

## Gate 2 default proposal

Before generating any multi-view, propose this default to the user:

> **Default multi-view set:** body-essential parts (torso, legs, arms, head) + hair → side + back views for each.
>
> **Tell me:**
> - "default" — accept the default set
> - "add: [parts]" — also generate multi-view for these accessories
> - "remove: [parts]" — skip multi-view for these
> - "skip all" — don't generate any multi-view
> - "side only" — generate side views only, skip back views

Wait for explicit user response before continuing.

## Why gate this

Multi-view doubles or triples the render count vs Stage 4. For a character with 9 parts at front + multi-view on 5 of them (body parts) at side + back = 9 front + 10 multi-view = 19 renders. Each costs credits. User needs to consent to that volume.

## Per-part prompt templates

### Body part — side view (90° profile)
```
Reference the attached strict-front A-pose character sheet and the front-facing {PART_NAME} extract. Render the same {PART_NAME} in STRICT PROFILE view — the body / part rotated exactly 90 degrees so the camera now sees the character's LEFT side (showing the right side of the part from the camera's perspective). Strict orthographic, NO 3/4, NO tilt, NO perspective. A-pose held — arms still angled 45°, legs still shoulder-width. White background (#FFFFFF), neutral flat lighting at 2K. Same character, same proportions, same materials as the sheet. Clean cuts at the same anatomical landmarks as the front extract.
```

### Body part — back view (180°)
```
Reference the attached strict-front A-pose character sheet and the front-facing {PART_NAME} extract. Render the same {PART_NAME} in STRICT BACK view — the character rotated exactly 180 degrees so the camera now sees the back of the part dead-on. Strict orthographic, NO 3/4, NO tilt, NO perspective. A-pose held — arms still angled 45° (now seen from behind), legs still shoulder-width. White background, neutral flat lighting at 2K. Same character, same proportions, same materials. Clean cuts at the same landmarks as the front extract.
```

### Head — side view
```
Reference the attached strict-front A-pose character sheet and the front-facing head extract. Render the same head in STRICT PROFILE view — rotated exactly 90 degrees, camera sees the character's left ear, nose pointing to the camera-right edge of frame. NO 3/4. Strict orthographic. Neutral expression, mouth closed, eye open. White background, neutral flat lighting at 2K. Same face, hair, accessories.
```

### Head — back view
```
Reference the attached strict-front A-pose character sheet and the front-facing head extract. Render the back of the same head — exactly 180 degrees rotated, camera sees the back of the skull dead-on. NO 3/4. Show the hair from behind in full, any tied details (ponytail, braid, hair accessories on the back). White background, neutral flat lighting at 2K.
```

### Hair — side and back (high-value for long/styled hair)
```
Reference the attached strict-front A-pose character sheet and the front-facing hair extract. Render the same hair from {ANGLE — "the left side, 90° profile" / "directly behind, 180°"}, isolated on a white background. Strict orthographic. Soft alpha edges. Show the full back silhouette where braids, ties, or accessories sit. Neutral flat lighting at 2K. No head, no body — hair only.
```

### Accessory (only if user-approved) — side view
```
Reference the attached strict-front A-pose character sheet and the front-facing {ACCESSORY_NAME} extract. Render the same {ACCESSORY_NAME} from STRICT PROFILE — exactly 90° rotation, camera sees the side. NO 3/4. Strict orthographic. White background, neutral flat lighting at 2K. Same materials, same wear.
```

### Accessory — back view
```
Reference the attached strict-front A-pose character sheet and the front-facing {ACCESSORY_NAME} extract. Render the same {ACCESSORY_NAME} from STRICT BACK — exactly 180° rotation, camera sees the back face dead-on. NO 3/4. White background, neutral flat lighting at 2K.
```

## Universal multi-view negatives
```
no three-quarter view, no 3/4 angle, no 45° angle, no rotated showcase, no perspective distortion, no foreshortening, no different pose, no broken A-pose, no different materials, no different color, no environment, no background, no shadow, no dramatic lighting, no presentable hero angle
```

## Quality checklist per multi-view render

- [ ] Side view = exact 90° profile (not 80°, not 100°, not 3/4)
- [ ] Back view = exact 180° (not "back 3/4")
- [ ] A-pose held (for character parts)
- [ ] Same character / proportions / materials as the strict-front extract
- [ ] White background, flat lighting, 2K
- [ ] If model defaults to 3/4: retry with stronger STRICT PROFILE / STRICT BACK anchor
