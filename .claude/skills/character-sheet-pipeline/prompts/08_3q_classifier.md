# Stage 4.5 · Vision-classifier verification — the anti-3/4 retry loop (V3)

**Model:** Use the host agent's available image inspection or a configured vision API with verified image-input support. Record the model and method with the verdict. This file supplies the rubric, not a deployed classifier service.
**Inputs:** the candidate image + the part category (`body-essential | paired | accessory | hair | sheet | multiview-side | multiview-back`)
**Output:** JSON verdict — `pass | soft_fail | hard_fail` + reason string + per-axis flags.

## Why this stage exists

Image models can drift toward 3/4 hero angles on accessories and small parts even with anti-3/4 prompts. Inspect the generated image before accepting it and record a structured verdict. Keep retries within the approved generation scope; the rubric does not establish API cost or guaranteed accuracy.

## Classifier prompt (strict-front rubric — for Stage 2A and all Stage 4 parts)

```
You are a strict orthographic-reference verifier for a 3D-modeling pipeline. You receive one rendered image and a category label. Your job is to decide whether the image is STRICT FRONT and usable as an orthographic reference for downstream 3D extraction.

CATEGORY: {{category}}
EXPECTED ANGLE: strict front (dead-on to camera, no rotation, no tilt, no 3/4)

Evaluate the image against these binary checks:

1. body_axis_dead_front — Is the subject's longitudinal axis perpendicular to the camera (no body rotation in the horizontal plane)? Both sides of the subject should read at equal width.
2. no_three_quarter — Is the subject FREE of any 3/4 rotation between front and side? (3/4 is the most common drift — flag aggressively.)
3. no_body_twist — Is the subject FREE of contrapposto, hip twist, shoulder twist, head turn relative to chest?
4. no_hero_angle — Is the camera at neutral eye level with zero perspective drama? No upward hero tilt, no downward god-view, no foreshortening.
5. no_partial_back — Is NO portion of the subject's back showing? (If you can see any back surface, it's not strict front.)
6. framing_clean — Is the subject isolated on white background, fully visible, no crop of essential geometry?

Use these decision rules:

- ALL six checks pass → verdict = "pass"
- 1–2 minor failures (e.g. slight head tilt, mild foreshortening) but the image is still usable as an orthographic reference → verdict = "soft_fail"
- ANY of checks 1, 2, 3, or 5 fail clearly → verdict = "hard_fail"
- Check 4 or 6 failing alone usually means "soft_fail" unless the angle is dramatically off

Reply ONLY with this JSON, no prose, no markdown fence:

{
  "verdict": "pass" | "soft_fail" | "hard_fail",
  "checks": {
    "body_axis_dead_front": true | false,
    "no_three_quarter": true | false,
    "no_body_twist": true | false,
    "no_hero_angle": true | false,
    "no_partial_back": true | false,
    "framing_clean": true | false
  },
  "reason": "<one short sentence naming the dominant failure mode, or 'clean strict front' on pass>",
  "estimated_camera_rotation_degrees": <integer, signed: negative = camera left of axis, positive = camera right of axis, 0 = dead front>
}
```

## Classifier prompt (multi-view side rubric — for Stage 5 side outputs)

Same skeleton, but swap the expected-angle and decision-rule blocks:

```
EXPECTED ANGLE: strict side / profile (camera at 90° to subject longitudinal axis, viewing left or right side)

Adjusted checks:
1. profile_dead_on — Is the camera at 90° (or 270°) to the subject? The subject's body axis should be exactly side-on, one shoulder occluding the other or nearly so.
2. no_three_quarter_between_front_and_side — Is the image FREE of the 3/4-between-front-and-side drift? (The other common drift mode.)
3. no_three_quarter_between_side_and_back — Is the image FREE of 3/4-between-side-and-back? (Less common but happens.)
4. body_pose_matches_front — Does the body hold the same A-pose as the Stage 2A sheet (arms angled ~45°, legs shoulder-width)?
5. framing_clean — Same as front rubric.
```

## Classifier prompt (multi-view back rubric — for Stage 5 back outputs)

```
EXPECTED ANGLE: strict back (dead away from camera, 180° from front)

Adjusted checks:
1. body_axis_dead_back — Subject's back fully faces the camera, both shoulders equal width from behind, head fully turned away.
2. no_three_quarter_back — Image is FREE of 3/4 between side and back.
3. no_partial_face — NO portion of the subject's face is visible.
4. body_pose_matches_front — A-pose held from behind.
5. framing_clean — Same.
```

## Retry strategy — escalated prompt template

When the classifier returns `hard_fail`, do NOT re-run the original prompt verbatim. Build an escalated prompt that **names the specific failure** and prepends it as a correction. Template:

```
[CRITICAL CORRECTION] The previous attempt failed strict-front verification: {{classifier.reason}}.
Estimated rotation: {{classifier.estimated_camera_rotation_degrees}}° off dead-front.

YOU MUST regenerate with the body axis DEAD FRONT. NO three-quarter angle. NO rotation. Both sides of the subject EQUAL width. Both feet/legs/arms at EQUAL angle.

{{original_stage_prompt}}

Anti-drift reinforcement (mandatory): zero rotation in the horizontal plane. Camera at zero degrees azimuth relative to the subject. Subject's longitudinal axis is parallel to the image plane, NOT angled away from it. If the prior attempt was rotated to camera-right (positive degrees), this attempt must counter-rotate to dead-front. If the prior attempt was rotated to camera-left (negative degrees), same correction.
```

## Retry budget

- **Initial attempt** uses the original stage prompt with normal anti-3/4 negatives.
- **Retry 1** uses the escalated prompt above, same model (Nano Banana Pro for image stages).
- **Retry 2** uses the escalated prompt + falls back to Nano Banana 2.
- **After retry 2** still `hard_fail` → stop. Show the user the three attempts plus the classifier reasons. Offer: (a) accept best attempt with warning, (b) provide custom instructions and retry once more, (c) skip this part.

A `soft_fail` is accepted automatically but logged as `accepted_with_warning` in the manifest with the classifier reason recorded. The user can review the manifest after the run and ask for a regeneration of any `soft_fail` part.

## Manifest entry per part

```json
{
  "part": "hat_front",
  "category": "accessory",
  "attempts": [
    { "model": "nano-banana-pro", "verdict": "hard_fail", "reason": "rotated ~25° camera-right; 3/4 hero angle", "image_hash": "..." },
    { "model": "nano-banana-pro", "verdict": "hard_fail", "reason": "still rotated ~15° camera-right", "image_hash": "..." },
    { "model": "nano-banana-2", "verdict": "pass", "reason": "clean strict front", "image_hash": "..." }
  ],
  "final_verdict": "pass",
  "retry_count": 2,
  "accepted_image": "01_parts/hat_front.png"
}
```

## Cost note

Each verification call is one vision request — small image input, ~200 token JSON output. Budget roughly 1¢–2¢ per check on GPT-4o-mini-vision tier, more on GPT-5 vision. For a typical 10-part run with one verification per part and a ~15% hard-fail rate, expect ~12 vision calls total: cheap compared to a single Nano Banana Pro regeneration.

## When to skip the classifier

- The user explicitly says "skip verification, accept first attempt" — log it in the manifest, ship.
- Stage 6 (360 videos) — verification is harder on video; do a visual sanity pass instead of automated classifier for now.

## Why GPT-4/5 vision and not Claude vision

Both work. OpenAI vision was chosen as the default for this version because (a) the pipeline already integrates an OpenAI image call at Stage 2B, so an OPENAI_API_KEY is required regardless, and (b) the strict-rubric JSON output mode is well-trodden territory on GPT-4o / GPT-5. If you prefer Anthropic-only, replace the call with claude-opus-4-7 vision and keep the prompt identical — the rubric is portable.
