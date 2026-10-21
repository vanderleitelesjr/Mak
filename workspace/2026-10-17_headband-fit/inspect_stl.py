"""Read-only STL inspection and orthographic previews in an isolated Blender process."""
import bpy
import bmesh
import json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parent
SOURCE = Path(r"C:\Users\vande\Downloads\Meshy_AI_gothic_horn_headband_easy_pla_20261017_generate.stl")
ROOT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.wm.stl_import(filepath=str(SOURCE))
obj = bpy.context.object
obj.name = "Original_STL_unscaled"
mesh = obj.data
bm = bmesh.new()
bm.from_mesh(mesh)
seen = set()
components = []
for vert in bm.verts:
    if vert.index in seen:
        continue
    pending = [vert]
    seen.add(vert.index)
    count = 0
    low = [float("inf")] * 3
    high = [-float("inf")] * 3
    while pending:
        current = pending.pop()
        count += 1
        for axis in range(3):
            low[axis] = min(low[axis], current.co[axis])
            high[axis] = max(high[axis], current.co[axis])
        for edge in current.link_edges:
            other = edge.other_vert(current)
            if other.index not in seen:
                seen.add(other.index)
                pending.append(other)
    components.append({"vertices": count, "bounds": [low, high]})
stats = {
    "source": str(SOURCE),
    "units": "STL has no units; raw coordinate units reported below",
    "vertices": len(mesh.vertices),
    "triangles": len(mesh.polygons),
    "extents": list(obj.dimensions),
    "boundary_edges": sum(e.is_boundary for e in bm.edges),
    "nonmanifold_edges": sum(not e.is_manifold for e in bm.edges),
    "signed_volume": bm.calc_volume(signed=True),
    "components": sorted(components, key=lambda c: c["vertices"], reverse=True),
}
bm.free()
(ROOT / "original_measurements.json").write_text(json.dumps(stats, indent=2), encoding="utf-8")
print("HEADBAND_STATS " + json.dumps(stats))

# Normalize only the display copy; the original remains unchanged in the blend.
obj.hide_render = True
obj.hide_set(True)
display = obj.copy()
display.data = obj.data.copy()
bpy.context.collection.objects.link(display)
display.name = "Original_display_normalized"
display.hide_render = False
display.hide_set(False)
corners = [Vector(c) for c in obj.bound_box]
center = sum(corners, Vector()) / 8
scale = 3.0 / max(obj.dimensions)
for vert in display.data.vertices:
    vert.co = (vert.co - center) * scale
mat = bpy.data.materials.new("Neutral clay")
mat.diffuse_color = (0.28, 0.34, 0.40, 1)
display.data.materials.clear()
display.data.materials.append(mat)
for poly in display.data.polygons:
    poly.use_smooth = True
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.samples = 24
scene.cycles.use_denoising = True
scene.render.resolution_x = 1200
scene.render.resolution_y = 1000
scene.render.resolution_percentage = 100
scene.world = bpy.data.worlds.new("Inspection world")
scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs[0].default_value = (0.75, 0.78, 0.82, 1)
scene.world.node_tree.nodes["Background"].inputs[1].default_value = 0.6
for name, position, energy, size in [
    ("Key", (3, -4, 6), 600, 4),
    ("Fill", (-4, -2, 2), 300, 3),
    ("Rim", (1, 4, 4), 500, 3),
]:
    data = bpy.data.lights.new(name, "AREA")
    light = bpy.data.objects.new(name, data)
    scene.collection.objects.link(light)
    light.location = position
    light.rotation_euler = (-light.location).to_track_quat("-Z", "Y").to_euler()
    data.energy = energy
    data.shape = "DISK"
    data.size = size
camera_data = bpy.data.cameras.new("Inspection camera")
camera = bpy.data.objects.new("Inspection camera", camera_data)
scene.collection.objects.link(camera)
scene.camera = camera
camera_data.type = "ORTHO"
camera_data.ortho_scale = 3.65
for name, position in [
    ("original_front", (0, -8, 0)),
    ("original_top", (0, 0, 8)),
    ("original_side", (8, 0, 0)),
    ("original_perspective", (4, -7, 4)),
]:
    camera.location = position
    camera.rotation_euler = (-camera.location).to_track_quat("-Z", "Y").to_euler()
    scene.render.filepath = str(ROOT / (name + ".png"))
    bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / "inspection.blend"))
