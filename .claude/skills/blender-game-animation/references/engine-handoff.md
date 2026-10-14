# Export and integration checks

## Preserve the authoring source

Normalize or prune weights on a runtime copy according to the target's influence
limit. Do not silently alter approved source skinning to satisfy an export test.
Inspect deformed surfaces between keys: wrists above the floor do not prove that
forearms clear the torso, and a valid rest mesh does not prove a valid animation.

If an editable pose view is requested, use real rig controls and save the chosen
reference locally. Keep this view independent of approved Actions and restore
ordinary playback when leaving it. Avoid automatic handlers that overwrite the
user's pose or repeatedly change the scene range.

## Verify independent clip files

When the model and animation files are separate, verify that their skeletons
share the same bind basis. A clip exported from a posed rig can import without
errors yet drive the model incorrectly. Compare evaluated poses on the actual
model, including the first frame and contacts. If the exporter requires bind
geometry, include the same skinned bind mesh in each clip file; consume those
files as animation sources in the engine while keeping one runtime model.

Use relative texture paths and one documented texture set. Copy the entire
delivery to a fresh directory before reimporting, so tests cannot accidentally
resolve missing files from the author's original machine.

Record source and export frame ranges, fps, sample count, duration, looping,
root displacement, bone mapping and event markers. Do not infer sample count
from a rounded duration. Compare source and reimported geometry in the same
space with a tolerance appropriate to the target scale; document the tolerance.

## Hand over runtime transitions

Keep navigation heading, clip yaw and model-forward correction separate to
avoid applying the same rotation twice. A turn exit should match the last
evaluated pose and contact phase, including a turn interrupted midway. Do not
assume every turn reaches its final sample or every Walk can restart at frame
zero. Use the receiving project's locomotion system and anatomy mapping.

Send this manifest and evidence to `game-animation-integration`. Preserve the
project's actual rotation rates, event times and control rules; record unknown
values as unresolved instead of inventing universal defaults.
