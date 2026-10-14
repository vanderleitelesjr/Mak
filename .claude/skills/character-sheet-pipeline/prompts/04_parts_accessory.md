# Stage 4 · Accessories — STRICT FRONT (hat, weapon, backpack, jewelry, cape, props)

**Model:** Nano Banana Pro
**Resolution:** 2K
**Reference:** the Stage 2A strict-front A-pose sheet (always attach)
**Rule:** even accessories go STRICT FRONT first. NO "3/4 hero angle", NO "presentable showcase shot". Front-facing as the item would sit on the character. Side and back views are generated in Stage 5 (multi-view) ONLY if the user requests.

## Per-accessory templates

### Hat / Helmet / Headpiece
```
Reference the attached strict-front A-pose character sheet. Render ONLY the {HAT_DESCRIPTOR — e.g. "wide-brimmed wizard hat with star-pattern band"} from the character, isolated on a white background. STRICT FRONT VIEW — the hat is shown head-on from the front, exactly as it would appear sitting on the character's head in the A-pose. NO 3/4 angle, NO tilted-back hero shot, NO side angle. Show the brim and crown as they read dead-on from the front. Neutral flat lighting. Same material, same color, same pattern, same wear as the sheet. Sharp focus at 2K. No character wearing it — just the hat as a standalone object, but oriented as it would sit on the front-facing character.
```

### Weapon (one-handed)
```
Reference the attached strict-front A-pose character sheet. Render ONLY the {WEAPON_NAME — e.g. "curved katana with red wrapped handle"} from the character, isolated on a white background. STRICT FRONT VIEW — the weapon shown blade-front / front-face directly to the camera, full length visible vertically (or horizontally if naturally long-axis). NO 3/4 hero angle, NO presentable showcase angle. Front-orthographic, like a technical reference. Neutral flat lighting. Same material, same hilt detail, same blade finish, same wear as the sheet. Sharp focus at 2K.
```

### Weapon (two-handed) / Pole-arm
```
Reference the attached strict-front A-pose character sheet. Render ONLY the {WEAPON_NAME} from the character, isolated on a white background. STRICT FRONT VIEW — full length visible, front face to the camera, no rotation. Neutral flat lighting at 2K.
```

### Backpack / Bag / Carried item
```
Reference the attached strict-front A-pose character sheet. Render ONLY the {ITEM_NAME — e.g. "leather satchel with brass buckles"} from the character, isolated on a white background. STRICT FRONT VIEW — front face of the item shown dead-on, the way it would appear hanging on the character's front-facing pose. NO 3/4 angle, NO hero shot. Neutral flat lighting. Same material, same hardware, same wear and patina as the sheet. Sharp focus at 2K.
```

### Cape / Cloak / Long flowing garment
```
Reference the attached strict-front A-pose character sheet. Render ONLY the {GARMENT_NAME} from the character, isolated on a white background. STRICT FRONT VIEW — shown either laid flat or hanging on an invisible stand, silhouette dead-front to the camera. NO 3/4. Neutral flat lighting. Same color, same material, same trim, same wear as the sheet. Sharp focus at 2K.
```

### Jewelry / Small attached accessory (ring, brooch, necklace, earring)
```
Reference the attached strict-front A-pose character sheet. Render ONLY the {JEWELRY_NAME} from the character, isolated on a pure white background. STRICT FRONT VIEW — macro close-up, front face to the camera, no rotation. Neutral flat lighting at 2K. Same metal, same stones, same finish as the sheet.
```

## Universal accessory negatives
```
no three-quarter view, no 3/4 angle, no presentable hero shot, no glamour shot, no character body parts visible, no holding hands, no environment, no background, no shadow on the ground, no dramatic lighting, no different colors, no different materials, no rotated showcase angle
```

## Quality checklist per accessory

- [ ] STRICT FRONT verified — front face of the item dead-on, no rotation
- [ ] Isolated — no body parts in the frame
- [ ] Material and color match the sheet
- [ ] Scale is readable
- [ ] All distinctive details visible at front view (side/back details come in Stage 5 if requested)
- [ ] White background, no shadow gradient
- [ ] 2K, sharp focus
- [ ] If model defaults to 3/4 hero shot (very common): retry with explicit anti-3/4 negative
- [ ] **V3 enforcement:** the output is automatically passed through the vision classifier in Stage 4.5. If verdict is `hard_fail`, the escalated-prompt retry in `prompts/08_3q_classifier.md` is invoked automatically. Do NOT bypass the classifier on accessories — accessories are the highest-drift category in V2 data.

## Why STRICT FRONT even for accessories

Older versions of this skill allowed 3/4 angles for accessories on the theory that "the user can re-orient in 3D anyway". This was wrong — it forced the user to manually rotate the reference back to front before feeding it to image-to-3D models, which adds an extra step + degrades reference quality. Strict front is the single consistent baseline. Side and back come from Stage 5 (multi-view) ONLY when the user explicitly asks.
