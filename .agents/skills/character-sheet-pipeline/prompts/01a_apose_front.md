# Stage 2A · Strict-front A-pose sheet — the workhorse

**Model:** Nano Banana Pro (primary) | Nano Banana 2 (fallback). NEVER GPT-Image-2/2.5 here.
**Resolution:** 2K (2048×2048 or closest 1:1)
**Aspect:** 1:1 square
**Reference:** the user's input character image

## Prompt skeleton

```
A clean character reference sheet of {CHARACTER_DESCRIPTION}, full body visible from head to toe, standing in a relaxed A-pose. STRICT FRONT VIEW — the character faces the camera directly, dead-on, NO three-quarter angle, NO rotation, NO tilt of the body. Both shoulders fully visible at equal width. Both feet equally visible at equal angle. Eyes look directly at the camera. Camera at eye-level, perfectly orthographic-style framing, zero perspective distortion. Arms angled ~45° down-and-out from the torso (A-pose), palms facing the camera, fingers relaxed. Legs shoulder-width apart, weight evenly distributed on both feet, toes pointing forward at the camera. Pure white background (#FFFFFF), no shadow on the ground, no ground plane visible. Neutral diffuse studio lighting — soft and even, no rim light, no key light from the side, no cinematic mood lighting, no colored gels. Match the character's identity, proportions, color palette, and accessories EXACTLY from the reference image. Preserve face identity. Sharp focus on the entire silhouette from head to toe. Reference-grade clarity for 3D modeling at 2K resolution.
```

## Substitution rules

- `{CHARACTER_DESCRIPTION}` — built during intake. Always include: gender presentation (if obvious), apparent age, art style (realistic / stylized / anime / cel-shaded), key wardrobe items, key accessories, color palette.

## Negatives (append per model syntax)

```
no three-quarter view, no 3/4 angle, no body rotation, no body twist, no contrapposto, no hero pose, no dynamic pose, no action shot, no looking away from camera, no closed eyes, no head tilt, no shoulder tilt, no asymmetric stance, no foreshortening, no perspective distortion, no environment, no background props, no shadow on the ground, no rim lighting, no cinematic mood lighting, no motion blur, no depth of field, no cropped limbs, no missing parts, no duplicate limbs
```

## Quality checklist before passing to Stage 2B

- [ ] STRICT FRONT — both shoulders equal width, both feet equal angle, head facing camera
- [ ] Full body visible — head to toe, no part cut off
- [ ] Genuinely A-pose (arms NOT at T-pose 90°, NOT down at sides, ~45° angle)
- [ ] Palms facing camera (forward)
- [ ] Toes pointing forward at camera (NOT angled outward)
- [ ] White background with no shadow gradient
- [ ] No background elements, no floor, no props in the scene that weren't on the source
- [ ] Character matches the source image — same face, same outfit, same accessories
- [ ] Sharp focus across the entire body at 2K
- [ ] If the model returns 3/4, retry with stronger STRICT FRONT language. Falling back to Nano Banana 2 is fine. If after 3 attempts no model holds strict front, escalate to the user — DO NOT ship a 3/4 sheet.
