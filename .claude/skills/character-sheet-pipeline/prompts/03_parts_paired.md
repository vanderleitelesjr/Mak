# Stage 4 · Paired items — STRICT FRONT (hands, boots, gloves, gauntlets)

**Model:** Nano Banana Pro
**Resolution:** 2K
**Reference:** the Stage 2A strict-front A-pose sheet (always attach)
**Rule:** the pair stays together in the frame, at the SAME STRICT-FRONT angle as on the sheet. NO "3/4 outer view". NO "presentable hero angle". Both items at identical strict-front orientation, close-cropped for detail.

## Per-part prompt templates

### Hands / Gloves (pair)
```
Reference the attached strict-front A-pose character sheet. Render BOTH hands of the same character as a labeled pair, close-up framing. STRICT FRONT VIEW — palms facing the camera dead-on, fingers relaxed and slightly spread, exactly as in the A-pose orientation on the sheet. Show the left hand on the left side of the frame, right hand on the right side, both at the SAME strict-front angle (palms to camera). NO 3/4 view, NO outer-side view, NO inside-palm tilt. Include any gloves, rings, or hand armor exactly as on the sheet. White background, neutral flat lighting. Sharp focus, reference-grade clarity at 2K. Same color, same material, same wear as the sheet.
```

### Boots / Feet (pair)
```
Reference the attached strict-front A-pose character sheet. Render BOTH feet/boots of the same character as a labeled pair, close-up framing. STRICT FRONT VIEW — toes pointing at the camera, both boots seen dead-on from the front, exactly as positioned on the A-pose sheet. Left boot on the left of the frame, right boot on the right, both at the SAME strict-front angle. NO 3/4 outer view, NO side angle, NO hero shot. Include any straps, buckles, or front-visible sole detail from the sheet. White background, neutral flat lighting. Sharp focus at 2K. Same color, same material, same wear.
```

### Generic paired pattern (for asymmetric pairs — one glove + one bracer, etc.)
```
Reference the attached strict-front A-pose character sheet. Render the {LEFT_ITEM_NAME} and the {RIGHT_ITEM_NAME} of the same character as a labeled pair, close-up framing. STRICT FRONT VIEW — both items shown at the same strict-front angle, matching the A-pose orientation on the sheet. Label which is left and which is right. White background, neutral flat lighting at 2K. Match the exact materials and wear from the sheet.
```

## Why paired items break differently from body parts

Body parts must STAY in strict-front A-pose so seams match the body assembly.

Paired items CAN zoom in closer for detail clarity (it's a close-up rather than a wide frame) — but they MUST stay at the same strict-front angle. The pair is shown together as a close-cropped detail shot, both items at identical strict-front orientation. If left hand is strict front and right hand is 3/4, the pipeline cannot reassemble them.

Side and back views of paired items belong to Stage 5 (multi-view) if the user requests them — not the default extract.

## Negatives
```
no three-quarter view, no 3/4 outer view, no 3/4 hero angle, no different angles between the pair, no asymmetric framing, no rotation, no tilt, no inside-palm tilt for hands, no outer-sole tilt for boots, no holding props, no clenched fists (unless the sheet showed clenched fists), no separate frames, no background, no environment, no shadow, no dramatic lighting, no presentable hero angle, no glamour shot
```

## Quality checklist

- [ ] STRICT FRONT verified — both items show dead-on front face, both at identical angle
- [ ] Items shown together in the same frame as a labeled pair
- [ ] Material / color / wear matches the sheet
- [ ] White background, no shadow
- [ ] 2K, sharp focus
- [ ] If model returns 3/4 outer view: retry with explicit anti-3/4 anchor
