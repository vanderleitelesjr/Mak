"""Build a wider crown and gently converging arms from the physical v1 trial.

Run in an isolated Blender process. Never overwrites the original or v1 files.
The straight 170 mm measurement owns crown width; the tape arc owns length.
Tip preload remains a conservative fit trial, not a measured force prediction.
"""
import bpy
import bmesh
import hashlib
import json
import math
import numpy as np
from pathlib import Path
from mathutils import Vector
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "v2"
OUT.mkdir(exist_ok=True)
V1 = json.loads((ROOT / "delivery_measurements.json").read_text(encoding="utf-8"))
HEAD_WIDTH = 170.0
CLEARANCE = 1.0
RADIUS = HEAD_WIDTH / 2 + CLEARANCE
TIP_GAP = 138.0  # 3.79 mm less than the loose v1 gap, not a measured head width.
ARC_LENGTH = 320.0 + math.pi * CLEARANCE
THICKNESS = 3.0
BAND_WIDTH = 12.0
ARM_LENGTH = (ARC_LENGTH - math.pi * RADIUS) / 2
INSET = RADIUS - TIP_GAP / 2
assert ARM_LENGTH > INSET > 0

def arm(height, t):
    control = np.array([
        [RADIUS, height],
        [RADIUS, height * 0.55],
        [TIP_GAP / 2 + INSET * 0.35, height * 0.10],
        [TIP_GAP / 2, 0.0],
    ])
    t = np.asarray(t)[:, None]
    p = (1-t)**3 * control[0] + 3*(1-t)**2*t*control[1] + 3*(1-t)*t**2*control[2] + t**3*control[3]
    derivative = 3*(1-t)**2*(control[1]-control[0]) + 6*(1-t)*t*(control[2]-control[1]) + 3*t**2*(control[3]-control[2])
    return p, derivative

# The C1-continuous cubic arm must preserve the over-head tape arc while
# moving the free ends inward independently of crown width.
t_dense = np.linspace(0, 1, 8001)
low, high = 0.0, ARC_LENGTH
for _ in range(60):
    height = (low + high) / 2
    _, derivative = arm(height, t_dense)
    length = float(np.trapezoid(np.linalg.norm(derivative, axis=1), t_dense))
    if length < ARM_LENGTH:
        low = height
    else:
        high = height
arm_height = (low + high) / 2
alpha = np.linspace(0, math.pi / 2, 193)
cap = np.column_stack((RADIUS * np.sin(alpha), arm_height + RADIUS * np.cos(alpha)))
cap_tangent = np.column_stack((np.cos(alpha), -np.sin(alpha)))
lower, lower_tangent = arm(arm_height, np.linspace(0, 1, 97))
lower_tangent /= np.linalg.norm(lower_tangent, axis=1)[:, None]
right = np.vstack((cap, lower[1:]))
right_tangent = np.vstack((cap_tangent, lower_tangent[1:]))
right_normal = np.column_stack((-right_tangent[:, 1], right_tangent[:, 0]))
curve = np.vstack((right[:0:-1] * [-1, 1], right))
normals = np.vstack((right_normal[:0:-1] * [-1, 1], right_normal))
nominal_arc = float(np.sum(np.linalg.norm(np.diff(curve, axis=0), axis=1)))
assert abs(nominal_arc - ARC_LENGTH) < 0.005
assert abs(curve[:, 0].max() - RADIUS) < 1e-9
assert abs(curve[-1, 0] - curve[0, 0] - TIP_GAP) < 1e-9
assert np.all(np.diff(np.arctan2(right[:, 0], right[:, 1])) > 0), "Profile must remain open and monotone"
assert np.dot(cap_tangent[-1], lower_tangent[0]) > 0.999999

bpy.ops.wm.read_factory_settings(use_empty=True)
vertices, faces = [], []
for point, normal in zip(curve, normals):
    for outward, y in [(0, -BAND_WIDTH/2), (THICKNESS, -BAND_WIDTH/2), (THICKNESS, BAND_WIDTH/2), (0, BAND_WIDTH/2)]:
        p = point + outward * normal
        vertices.append((p[0], y, p[1]))
for i in range(len(curve)-1):
    for j in range(4):
        faces.append((4*i+j, 4*i+(j+1)%4, 4*(i+1)+(j+1)%4, 4*(i+1)+j))
faces += [(3, 2, 1, 0), tuple(4*(len(curve)-1)+j for j in range(4))]
mesh = bpy.data.meshes.new("V2 rounded crown gauge mesh")
mesh.from_pydata(vertices, [], faces)
mesh.update()
gauge = bpy.data.objects.new("Headband_fit_test_v2_mm", mesh)
bpy.context.collection.objects.link(gauge)
gauge.select_set(True)
bpy.context.view_layer.objects.active = gauge
bevel = gauge.modifiers.new("Soft contact edges", "BEVEL")
bevel.width = 0.5
bevel.segments = 3
bevel.limit_method = "ANGLE"
bpy.ops.object.modifier_apply(modifier=bevel.name)
bm = bmesh.new()
bm.from_mesh(gauge.data)
bmesh.ops.dissolve_degenerate(bm, dist=0.00001, edges=list(bm.edges))
bmesh.ops.triangulate(bm, faces=list(bm.faces))
bmesh.ops.dissolve_degenerate(bm, dist=0.00001, edges=list(bm.edges))
bmesh.ops.triangulate(bm, faces=list(bm.faces))
bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
assert all(e.is_manifold for e in bm.edges)
assert all(v.is_manifold for v in bm.verts)
assert all(f.calc_area() > 1e-10 for f in bm.faces)
volume = bm.calc_volume(signed=True)
assert volume > 0
bm.to_mesh(gauge.data)
bm.free()
gauge["fit_status"] = "V2 physical fit trial pending; v1 failed"
gauge["straight_head_width_mm"] = HEAD_WIDTH
gauge["nominal_free_tip_gap_mm"] = TIP_GAP
gauge["nominal_inner_arch_mm"] = ARC_LENGTH
gauge["arm_gap_reason"] = "V1 sides reported slightly loose; modest 3.79 mm reduction in total free-end gap."

scene = bpy.context.scene
scene.unit_settings.system = "METRIC"
scene.unit_settings.scale_length = 0.001
scene.unit_settings.length_unit = "MILLIMETERS"
print_copy = gauge.copy()
print_copy.data = gauge.data.copy()
scene.collection.objects.link(print_copy)
for v in print_copy.data.vertices:
    x, y, z = v.co
    v.co = (x, -z, y + BAND_WIDTH/2)
gauge.select_set(False)
print_copy.select_set(True)
bpy.context.view_layer.objects.active = print_copy
bpy.context.view_layer.update()
filename = "Headband_58cm_fit_test_v2.stl"
dimensions = list(print_copy.dimensions)
bpy.ops.wm.stl_export(filepath=str(OUT / filename), export_selected_objects=True, use_scene_unit=False, global_scale=1.0, apply_modifiers=True)
bpy.data.objects.remove(print_copy, do_unlink=True)
metadata = {
    "revision": "v2", "physical_fit_validated": False,
    "input_measurements_mm": {"straight_head_width": HEAD_WIDTH, "ear_to_ear_tape_arc": 320, "circumference_reference": 580, "forehead_nape_tape_arc_reference": 380},
    "physical_v1_feedback": {"crown": "Too narrow and suspended above the head", "sides": "Slightly loose"},
    "profile": "Circular crown with tangent-continuous cubic arms converging toward the ends; not the rejected shared-axis ellipsoid.",
    "nominal_inner_arch_mm": ARC_LENGTH, "tessellated_inner_arch_mm": nominal_arc,
    "nominal_inner_max_width_mm": 2*RADIUS,
    "nominal_crown_height_mm": RADIUS + arm_height,
    "crown_radius_mm": RADIUS, "arm_vertical_drop_mm": arm_height,
    "nominal_free_tip_gap_mm": TIP_GAP,
    "nominal_crown_clearance_each_side_mm": CLEARANCE,
    "tip_gap_reduction_from_v1_mm": V1["nominal_inner_width_mm"] - TIP_GAP,
    "tip_gap_limit": "Empirical trial setting from loose-side feedback, not a measured lower-head width or holding-force guarantee. Do not force apart in PLA.",
    "band_thickness_mm": THICKNESS, "band_width_mm": BAND_WIDTH,
    "edge_rounding_mm": 0.5,
    "print_dimensions_mm": dimensions,
    "triangles": len(gauge.data.polygons), "volume_mm3": volume,
    "test_stl": filename, "sha256": hashlib.sha256((OUT / filename).read_bytes()).hexdigest(),
    "previous_revision_preserved": True,
    "scope": "Fit gauge only. The complete ornament still requires this new contour after the gauge fits."
}
trial_path = ROOT / "fit_trial_v2.json"
if trial_path.exists():
    trial = json.loads(trial_path.read_text(encoding="utf-8"))
    assert trial["test_sha256"] == metadata["sha256"], "Do not transfer physical acceptance to a changed gauge"
    metadata["physical_fit_validated"] = trial["result"] == "passed"
    metadata["physical_fit_record"] = "../fit_trial_v2.json"
    metadata["scope"] = "Plain gauge physical fit confirmed; complete ornament comfort requires a separate physical trial."
    gauge["fit_status"] = "Physical fit confirmed by wearer; see ../fit_trial_v2.json"
(OUT / "delivery_measurements.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
(OUT / "nominal_profile.json").write_text(json.dumps({"plane": "x,z in millimetres", "points": curve.tolist(), "normals": normals.tolist()}, indent=2), encoding="utf-8")
print("V2_DELIVERY " + json.dumps(metadata), flush=True)

# A dimensionally faithful diagram compares the real profiles, not portraits.
canvas = Image.new("RGB", (1350, 1150), "#f7f8fa")
draw = ImageDraw.Draw(canvas)
font_path = r"C:\Windows\Fonts\segoeui.ttf"
title_font = ImageFont.truetype(font_path, 36)
font = ImageFont.truetype(font_path, 25)
small = ImageFont.truetype(font_path, 22)
origin = np.array([675, 900])
scale = 4.8
def plot(points, color, line_width=9):
    xy = origin + points * [scale, -scale]
    draw.line([tuple(p) for p in xy], fill=color, width=line_width, joint="curve")
draw.text((50, 32), "Fit revision: broader crown, closer tips", font=title_font, fill="#1c2633")
draw.text((50, 92), "Both profiles shown at the same scale and ear baseline", font=small, fill="#505b70")
for height in range(0, 141, 20):
    y = origin[1] - height*scale
    draw.line((165, y, 1185, y), fill="#dde2e9", width=1)
    draw.text((95, y-14), str(height), font=small, fill="#606c7a")
draw.text((50, 180), "mm", font=small, fill="#606c7a")
old_t = np.linspace(math.pi, 0, 601)
old_a = V1["nominal_inner_width_mm"]/2
old_c = V1["nominal_inner_height_mm"]
old_curve = np.column_stack((old_a*np.cos(old_t), old_c*np.sin(old_t)))
plot(old_curve, "#c85359")
plot(curve, "#236b9c")
draw.line((origin[0], 225, origin[0], 925), fill="#b6c0cd", width=2)
draw.text((60, 975), f"V1: width {old_a*2:.1f} / height {old_c:.1f} mm; physical fit failed", font=font, fill="#ad3e45")
draw.text((60, 1020), f"V2: width {2*RADIUS:.1f} / height {RADIUS+arm_height:.1f} mm; tips {TIP_GAP:.1f} mm apart", font=font, fill="#195b87")
trial_caption = "Nominal inner profiles. V2 gauge physical fit confirmed." if metadata["physical_fit_validated"] else "Nominal inner profiles. V2 fit still needs a physical trial."
draw.text((60, 1072), trial_caption, font=small, fill="#505b70")
canvas.save(OUT / "profile_comparison.png")

# Render the actual mm-sized gauge and save the editable geometry.
gauge.select_set(True)
bpy.context.view_layer.objects.active = gauge
mat = bpy.data.materials.new("Gauge blue clay")
mat.use_nodes = True
shader = mat.node_tree.nodes.get("Principled BSDF")
shader.inputs["Base Color"].default_value = (0.10, 0.22, 0.32, 1)
shader.inputs["Roughness"].default_value = 0.48
gauge.data.materials.append(mat)
for poly in gauge.data.polygons:
    poly.use_smooth = True
scene.render.engine = "CYCLES"
scene.cycles.samples = 24
scene.cycles.use_denoising = True
scene.render.resolution_x = 1200
scene.render.resolution_y = 900
scene.render.resolution_percentage = 100
scene.world = bpy.data.worlds.new("Gauge studio")
scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs[0].default_value = (0.50, 0.54, 0.60, 1)
scene.world.node_tree.nodes["Background"].inputs[1].default_value = 0.5
center = Vector((0, 0, (RADIUS+arm_height)/2))
for name, position, energy in [("Key", (200,-250,350), 1800000), ("Fill", (-250,-150,100), 950000), ("Rim", (100,250,250), 1600000)]:
    data = bpy.data.lights.new(name, "AREA")
    light = bpy.data.objects.new(name, data)
    scene.collection.objects.link(light)
    light.location = center + Vector(position)
    light.rotation_euler = (center-light.location).to_track_quat("-Z", "Y").to_euler()
    data.energy, data.size = energy, 220
camera_data = bpy.data.cameras.new("Gauge camera")
camera = bpy.data.objects.new("Gauge camera", camera_data)
scene.collection.objects.link(camera)
scene.camera = camera
camera_data.type = "ORTHO"
camera_data.ortho_scale = 212
camera_data.clip_end = 10000
for name, position in [("fit_test_front", (0,-500,0)), ("fit_test_perspective", (110,-500,110))]:
    camera.location = center + Vector(position)
    camera.rotation_euler = (center-camera.location).to_track_quat("-Z", "Y").to_euler()
    scene.render.filepath = str(OUT / (name+".png"))
    bpy.ops.render.render(write_still=True)
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type == "VIEW_3D":
            area.spaces.active.region_3d.view_location = center
            area.spaces.active.region_3d.view_distance = 260
            area.spaces.active.region_3d.view_rotation = camera.rotation_euler.to_quaternion()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / "Headband_fit_test_v2_editable.blend"))
