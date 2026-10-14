# Stage 4 · Body-essential parts — STRICT FRONT (torso / legs / arms / head)

**Model:** Nano Banana Pro (same as Stage 2A — consistency wins)
**Resolution:** 2K
**Reference:** the Stage 2A strict-front A-pose sheet (always attach)
**Rule:** the part must be in STRICT FRONT view, matching the A-pose orientation of the sheet exactly. No 3/4. No tilt. No rotation.

## Per-part prompt templates

### Torso
```
Reference the attached strict-front A-pose character sheet. Render ONLY the torso of the same character, from the base of the neck down to the top of the hips. STRICT FRONT VIEW — both shoulders equal width, body dead-on facing the camera, no rotation, no tilt, no 3/4 angle. Exact same A-pose orientation as the sheet. White background (#FFFFFF), neutral flat lighting. Show clean cut at the neck and at the hips — no clothing detail hanging off the cut. Sharp focus, reference-grade clarity at 2K. Same art style, same color palette, same materials as the sheet.
```

### Legs (pair, kept together)
```
Reference the attached strict-front A-pose character sheet. Render ONLY the lower body of the same character, from the top of the hips down to the soles of the feet, both legs together. STRICT FRONT VIEW — both legs visible at equal angle, toes pointing forward at the camera, no 3/4, no rotation. Exact same A-pose orientation as the sheet. Include any pants, leggings, or leg armor exactly as on the sheet. White background, neutral flat lighting. Clean cut at the hip line. Sharp focus at 2K.
```

### Arms (pair)
```
Reference the attached strict-front A-pose character sheet. Render ONLY both arms of the same character, from the shoulder cap down to the wrist. STRICT FRONT VIEW — both arms at the exact A-pose angle from the sheet (arms angled ~45° from the torso, palms facing the camera). Both arms shown side by side at the same A-pose angle, no rotation, no 3/4. Include any sleeves, bracers, or arm wraps from the sheet. White background, neutral flat lighting. Clean cut at the shoulder and at the wrist. Hands NOT included (extracted separately).
```

### Head
```
Reference the attached strict-front A-pose character sheet. Render ONLY the head and neck of the same character. STRICT FRONT VIEW — face dead-on to the camera, eyes looking directly at the camera, no head tilt, no chin tilt, no 3/4 angle, no profile. Neutral expression (mouth closed, eyes open). Show from the top of the head down to the base of the neck. Hair included as it appears on the sheet. White background, neutral flat lighting. Same face, same proportions, same age, same skin tone, same eye color, same hair color. Sharp focus at 2K. Clean cut at the base of the neck.
```

## Universal negatives
```
no three-quarter view, no 3/4 angle, no rotation, no body twist, no head tilt, no shoulder tilt, no profile view, no back view, no perspective distortion, no foreshortening, no different pose, no different angle, no dramatic lighting, no rim light, no cinematic mood, no DoF blur, no environment, no background, no shadow on the ground, no extra limbs, no costume changes, no presentable hero shot, no glamour shot
```

## Quality checklist per part

- [ ] **STRICT FRONT** — verifiable: both sides of the part are equal width / equal angle in the frame
- [ ] Same A-pose orientation as the Stage 2A sheet (most common failure: model rotates the part)
- [ ] Cut lines are clean (no half-cut props, no dangling sleeve fragments)
- [ ] Same material / color / wear as on the sheet
- [ ] White background, no shadow gradient
- [ ] 2K resolution
- [ ] Reference image was actually used (sanity check: does the face/skin/colors match?)
- [ ] If pose drifts to 3/4: re-prompt with stronger STRICT FRONT anchor + explicit anti-3/4 negative. NEVER ship a drifted part.
- [ ] If after 3 retries still drifting: escalate to user, offer to skip or accept with warning
- [ ] **V3:** output is verified by the Stage 4.5 vision classifier before acceptance. Retry logic and escalated-prompt template live in `prompts/08_3q_classifier.md`. Do not ship a part with `hard_fail` verdict.
