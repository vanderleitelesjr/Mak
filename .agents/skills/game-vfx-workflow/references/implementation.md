# Implementation and native review

For each layer, record a stable ID, trigger/state owner, recipient, local or
world space, begin/hold/end conditions, scale basis, visibility rule and resource
owner. Keep unknown tuning values explicit rather than filling them from a demo.

Check the effect against the event that actually happens:

| Case | Expected relationship |
| --- | --- |
| Windup cancelled | No released projectile or confirmed-hit burst |
| Release occurs, target moves | Visual travel follows the existing gameplay projectile |
| Hit confirmed | One impact at the real recipient/contact point |
| Continuous status refreshes | Existing effect updates; no unintended duplicate stack |
| Owner dies or disappears | Local emission stops and owned resources finish or release |
| Teleport or pooled reuse | Previous trail/particles do not bridge to the new position |
| Surface emitter changes site | New site starts a new lifetime; old smoke remains coherent |

Inspect bright and dark terrain, the intended lighting, moving targets, selected
units and a plausible crowd. Readability should come from silhouette, value,
timing and placement before increasing bloom. Preserve distinct visual priorities
for idle, movement, anticipation and brief contact.

Measure the affected system: active emitters, particles, material instances,
transparent overlap, allocations and frame cost as appropriate. A passing event
counter confirms lifecycle wiring, not visual quality or acceptable performance.
Record the capture setup and the actual measured scope.

Use three explicit evidence labels: generated concept, code-drawn study, native
engine capture. Keep source/vendor licences with assets that are actually shipped.
