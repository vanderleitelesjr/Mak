"""Transfer the approved v2 contour to the repaired ornament, without remeshing.

The v1 ellipse is used only to invert the existing mesh's known deformation.
The accepted v2 profile owns the new contact contour. Arc position is monotone;
radial ornament relief and front-to-back coordinates stay at their existing mm
scale. This injective polar map preserves the full mesh connectivity.
"""
import bpy
import bmesh
import hashlib
import json
import math
import numpy as np
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "v2"
TRIAL = json.loads((ROOT / "fit_trial_v2.json").read_text(encoding="utf-8"))
V1 = json.loads((ROOT / "delivery_measurements.json").read_text(encoding="utf-8"))
GAUGE = json.loads((OUT / "delivery_measurements.json").read_text(encoding="utf-8"))
PROFILE_PATH = OUT / "nominal_profile.json"
PROFILE = json.loads(PROFILE_PATH.read_text(encoding="utf-8"))
assert TRIAL["result"] == "passed"
assert hashlib.sha256((ROOT / TRIAL["test_file"]).read_bytes()).hexdigest() == TRIAL["test_sha256"] == GAUGE["sha256"]
filename = "Headband_58cm_PLA_fit_v2.stl"
blendname = "Headband_58cm_v2_editable.blend"
# A new release must not silently replace an already delivered revision.
assert not (OUT / blendname).exists()

bpy.ops.wm.open_mainfile(filepath=str(ROOT / "Headband_58cm_editable.blend"))
full = bpy.data.objects["Headband_58cm_fitted_mm"]
for obj in list(bpy.context.scene.objects):
    if obj != full:
        bpy.data.objects.remove(obj, do_unlink=True)
full.name = "Headband_58cm_v2_fitted_mm"
old = np.array([v.co[:] for v in full.data.vertices], dtype=np.float64)
old_faces = [tuple(p.vertices) for p in full.data.polygons]
old_phi = np.arctan2(np.abs(old[:, 0]), old[:, 2])
old_radius = np.hypot(old[:, 0], old[:, 2])
a, c = V1["nominal_inner_width_mm"] / 2, V1["nominal_inner_height_mm"]

def cumulative(points):
    return np.r_[0.0, np.cumsum(np.linalg.norm(np.diff(points, axis=0), axis=1))]

old_t = np.linspace(0, math.pi / 2, 16001)
old_r = 1 / np.sqrt((np.sin(old_t) / a)**2 + (np.cos(old_t) / c)**2)
old_curve = np.column_stack((old_r * np.sin(old_t), old_r * np.cos(old_t)))
old_s = cumulative(old_curve)
old_s /= old_s[-1]
curve = np.array(PROFILE["points"], dtype=float)
right = curve[len(curve)//2:]
target_s = cumulative(right)
target_half_length = float(target_s[-1])
target_s /= target_s[-1]
assert np.all(np.diff(np.arctan2(right[:, 0], right[:, 1])) > 0)

def contact(phi):
    fraction = np.interp(phi, old_t, old_s)
    return np.column_stack([np.interp(fraction, target_s, right[:, axis]) for axis in range(2)])

nominal_old_r = 1 / np.sqrt((np.sin(old_phi) / a)**2 + (np.cos(old_phi) / c)**2)
relief = old_radius - nominal_old_r
assert relief.min() > 0, "Existing ornament must remain outside its contact contour"
q = contact(old_phi)
q_radius = np.linalg.norm(q, axis=1)
new_radius = q_radius + relief
fitted = np.column_stack((np.sign(old[:, 0]) * q[:, 0] / q_radius * new_radius,
                          old[:, 1], q[:, 1] / q_radius * new_radius))
assert np.all(np.isfinite(fitted))
for vertex, coordinate in zip(full.data.vertices, fitted):
    vertex.co = coordinate
full.data.update()
assert [tuple(p.vertices) for p in full.data.polygons] == old_faces
actual = np.array([v.co[:] for v in full.data.vertices], dtype=np.float64)
assert np.max(np.abs(actual[:, 1] - old[:, 1])) == 0
assert np.max(np.abs(actual - fitted)) < 0.00002
full["fit_status"] = "V2 gauge physical fit confirmed by wearer; complete ornament physical trial pending"
full["nominal_profile_sha256"] = hashlib.sha256(PROFILE_PATH.read_bytes()).hexdigest()
full["source_sha256"] = V1["source_sha256"]
full["gauge_fit_record"] = "../fit_trial_v2.json"
full["full_ornament_physical_fit_validated"] = False
full.hide_set(False)
full.hide_render = False

bm = bmesh.new()
bm.from_mesh(full.data)
assert all(e.is_manifold and e.is_contiguous for e in bm.edges)
assert all(v.is_manifold for v in bm.verts)
assert all(f.calc_area() > 1e-10 for f in bm.faces)
volume = bm.calc_volume(signed=True)
assert volume > 0
bm.free()

scene = bpy.context.scene
scene.unit_settings.system = "METRIC"
scene.unit_settings.scale_length = 0.001
scene.unit_settings.length_unit = "MILLIMETERS"
low, high = actual.min(axis=0), actual.max(axis=0)
print_copy = full.copy()
print_copy.data = full.data.copy()
scene.collection.objects.link(print_copy)
for v in print_copy.data.vertices:
    x, y, z = v.co
    v.co = (x, -z, y-low[1])
for obj in scene.objects:
    obj.select_set(False)
print_copy.select_set(True)
bpy.context.view_layer.objects.active = print_copy
bpy.context.view_layer.update()
dimensions = list(print_copy.dimensions)
temporary_stl = OUT / "Headband_58cm_PLA_fit_v2.building.stl"
bpy.ops.wm.stl_export(filepath=str(temporary_stl), export_selected_objects=True,
                      use_scene_unit=False, global_scale=1.0, apply_modifiers=True)
if (OUT / filename).exists():
    assert (OUT / filename).read_bytes() == temporary_stl.read_bytes(), "Existing STL differs; keep both files for review"
    temporary_stl.unlink()
else:
    temporary_stl.rename(OUT / filename)
bpy.data.objects.remove(print_copy, do_unlink=True)
metadata = {
    "revision": "v2", "artifact": "complete ornament",
    "stl": filename, "editable": blendname,
    "sha256": hashlib.sha256((OUT / filename).read_bytes()).hexdigest(),
    "source_sha256": V1["source_sha256"],
    "input_repaired_blend_sha256": hashlib.sha256((ROOT / "Headband_58cm_editable.blend").read_bytes()).hexdigest(),
    "nominal_profile_sha256": full["nominal_profile_sha256"],
    "gauge_sha256": GAUGE["sha256"], "gauge_fit_record": "../fit_trial_v2.json",
    "gauge_physical_fit_validated": True, "full_ornament_physical_fit_validated": False,
    "transfer": "Monotone arc correspondence between the known v1 contact curve and the approved v2 profile; existing radial relief and y coordinates retained, no remeshing or overall scaling.",
    "nominal_inner_arch_mm": 2*target_half_length,
    "nominal_inner_max_width_mm": float(curve[:, 0].max()-curve[:, 0].min()),
    "nominal_crown_height_mm": float(curve[:, 1].max()),
    "nominal_free_tip_gap_mm": float(curve[-1, 0]-curve[0, 0]),
    "vertices": len(full.data.vertices), "triangles": len(full.data.polygons),
    "topology_preserved": True, "front_back_coordinates_unchanged": True,
    "minimum_radial_relief_mm": float(relief.min()),
    "maximum_coordinate_rounding_mm": float(np.max(np.abs(actual-fitted))),
    "bounds_mm": [low.tolist(), high.tolist()],
    "print_dimensions_mm": dimensions, "volume_mm3": volume,
    "printing": "Millimetres, 100% scale, no fit-to-plate scaling. Supplied arch lies in XY. Review supports for ornament and horns; dimensions exclude brim and supports.",
    "limitation": TRIAL["limitation"],
}
(OUT / "full_delivery_measurements.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
print("FULL_V2_DELIVERY " + json.dumps(metadata), flush=True)

# Keep the confirmed gauge as a hidden, real-mm comparison object in the source.
with bpy.data.libraries.load(str(OUT / "Headband_fit_test_v2_editable.blend"), link=False) as (available, loaded):
    loaded.objects = ["Headband_fit_test_v2_mm"]
gauge = loaded.objects[0]
scene.collection.objects.link(gauge)
gauge["fit_status"] = "Physical fit confirmed by wearer; see ../fit_trial_v2.json"
gauge.hide_set(True)
gauge.hide_render = True

material = bpy.data.materials.new("V2 neutral clay")
material.use_nodes = True
material.node_tree.nodes.get("Principled BSDF").inputs["Roughness"].default_value = 0.48
full.data.materials.clear()
full.data.materials.append(material)
material.node_tree.nodes.get("Principled BSDF").inputs["Base Color"].default_value = (0.13, 0.20, 0.27, 1)
scene.render.engine = "CYCLES"
scene.cycles.samples = 24
scene.cycles.use_denoising = True
scene.render.resolution_x, scene.render.resolution_y = 1200, 1100
scene.render.resolution_percentage = 100
center = Vector((low+high)/2)
for name, position, energy in [("Key", (300,-400,600), 6500000), ("Fill", (-400,-200,200), 3500000), ("Rim", (100,400,400), 7000000)]:
    data = bpy.data.lights.new(name, "AREA")
    light = bpy.data.objects.new(name, data)
    scene.collection.objects.link(light)
    light.location = center + Vector(position)
    light.rotation_euler = (center-light.location).to_track_quat("-Z", "Y").to_euler()
    data.energy, data.size = energy, 400
camera_data = bpy.data.cameras.new("V2 preview camera")
camera = bpy.data.objects.new("V2 preview camera", camera_data)
scene.collection.objects.link(camera)
scene.camera = camera
camera_data.type = "ORTHO"
camera_data.ortho_scale = max(high-low)*1.3
camera_data.clip_end = 10000
for name, position in [("full_front", (0,-800,0)), ("full_perspective", (400,-700,300))]:
    camera.location = center + Vector(position)
    camera.rotation_euler = (center-camera.location).to_track_quat("-Z", "Y").to_euler()
    scene.render.filepath = str(OUT / (name+".png"))
    bpy.ops.render.render(write_still=True)
full.select_set(True)
bpy.context.view_layer.objects.active = full
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type == "VIEW_3D":
            area.spaces.active.region_3d.view_location = center
            area.spaces.active.region_3d.view_distance = max(high-low)*1.6
            area.spaces.active.region_3d.view_rotation = camera.rotation_euler.to_quaternion()
            area.spaces.active.clip_end = 10000
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / blendname))
