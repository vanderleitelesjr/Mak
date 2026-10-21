"""Read-only verification after reopening the saved source in a fresh Blender process."""
import bpy
import json
from pathlib import Path
from mathutils import Vector

root = Path(__file__).resolve().parents[1]
directory = root / 'assets' / 'penitent-proof-v01'
bpy.ops.wm.open_mainfile(filepath=str(directory / 'penitent-proof-v01.blend'))
scene = bpy.context.scene
assert (scene.frame_start, scene.frame_end, scene.render.fps) == (1, 25, 32)
assert scene.view_layers[0].material_override is None
soles = [o for o in scene.objects if o.type == 'MESH' and 'sabaton' in o.name]
assert len(soles) == 2
contacts = []
for frame in list(range(1, 25, 2)) + list(range(33, 65, 4)):
    scene.frame_set(frame)
    z = min((o.matrix_world @ Vector(c)).z for o in soles for c in o.bound_box)
    assert abs(z) < .005, (frame, z)
    contacts.append({'frame': frame, 'minimum_sole_z': z})
    assert tuple(scene.objects['GLOBAL / stationary sprite origin'].location) == (0, 0, 0)
for first, last in [(1, 25), (33, 65)]:
    poses = []
    for frame in [first, last]:
        scene.frame_set(frame)
        poses.append({o.name: o.matrix_world.copy() for o in scene.objects if o.type == 'MESH'})
    error = max(abs(poses[0][name][i][j]-poses[1][name][i][j]) for name in poses[0] for i in range(4) for j in range(4))
    assert error < .005, ('loop seam', first, last, error)
print('RUSTED_SOURCE_VERIFIED ' + json.dumps({'blender': bpy.app.version_string, 'frames_checked': len(contacts), 'max_sole_error': max(abs(c['minimum_sole_z']) for c in contacts), 'stationary_root': True, 'loop_seams': 'passed', 'saved_playback': 'Walk 1-25 at 32 fps; Idle 33-65; no render overrides'}))
