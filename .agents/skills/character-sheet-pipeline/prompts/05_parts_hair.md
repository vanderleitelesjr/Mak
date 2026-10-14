# Stage 4 · Hair — STRICT FRONT (default ON, opt-out only)

**Model:** Nano Banana Pro
**Resolution:** 2K
**Reference:** the Stage 2A strict-front A-pose sheet + the head extract (both attached if available)
**Rule:** hair is **always extracted by default**. The user can opt out at Gate 1, but it's an opt-out, not an opt-in. Hair must stay in STRICT FRONT, matching the head's front-facing orientation, so it can be reassembled 1:1 onto the head later.

## Why default-ON

Most image-to-3D models struggle with volumetric hair — they output it as a fused blob attached to the head. Providing an isolated hair reference with clean strand definition lets the user:
- Feed it to a hair-specific 3D pipeline (XGen, Hair Tool, Genesis hair)
- Use it as a texture reference for hair cards
- Hand-model the hair separately while the body is generated automatically

Skipping hair extraction defaults to a worse 3D output. So it's on by default.

## Prompt template

```
Reference the attached strict-front A-pose character sheet and head extract. Render ONLY the hair of the same character, isolated on a white background. STRICT FRONT VIEW — exactly the same front-facing angle as the head appears on the sheet. NO 3/4 angle, NO profile, NO back view (those come in Stage 5 multi-view if requested). Include the full silhouette as it reads from the front — every strand, braid, accessory, or extension that's visible from the front. Soft alpha-style edges where the hair meets the air (no harsh cut-outs). Neutral flat lighting. Same color, same highlights, same shine level, same accessories as the sheet. Sharp focus on the strand detail at 2K. No head, no face, no body — only the hair shape as if it were lifted off the head and floated in space, but viewed dead-on from the front.
```

## Universal negatives

```
no three-quarter view, no 3/4 angle, no profile, no back view, no rotation, no tilt, no head, no face, no body, no shoulders, no environment, no background, no shadow, no dramatic lighting, no harsh outline, no clean silhouette cut (hair needs soft edges), no presentable showcase angle
```

## Quality checklist

- [ ] STRICT FRONT view — verifiable: hair silhouette is symmetric or matches the front-facing silhouette on the sheet
- [ ] Isolated — no head, no body
- [ ] Soft alpha edges where strands meet air
- [ ] Color, highlights, shine match the sheet
- [ ] White background
- [ ] 2K, sharp on strand detail

## When to skip (rare)

Hair extraction can be skipped ONLY if:
- The character is bald / no hair
- The hair is completely hidden by a hat or hood (extract the hat/hood instead)
- The user explicitly opts out at Gate 1

For everything else — short flat hair, complex styled hair, anime spikes, braids, kitsune ears — extract.

## Stage 5 multi-view for hair

If the user approves multi-view for hair at Gate 2, generate a side view + back view of the hair using the same strict-orthographic standard. Especially valuable for long hair, ponytails, braids tied behind, or any style where the back silhouette is meaningfully different from the front.
