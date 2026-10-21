"""Fit the original ornament to a measured open arch; export in millimetres."""
import bpy
import bmesh
import hashlib
import json
import math
import numpy as np
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parent
SOURCE = Path(r"C:\Users\vande\Downloads\Meshy_AI_gothic_horn_headband_easy_pla_20261017_generate.stl")
ANALYSIS = json.loads((ROOT / "fit_analysis.json").read_text(encoding="utf-8"))
source_hash = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.wm.stl_import(filepath=str(SOURCE))
full = bpy.context.object
full.name = "Headband_58cm_fitted_mm"

# Collapse only the microscopic malformed edge clusters in the source. This
# retains surrounding surface triangles and avoids patch faces crossing the
# ornament's opposite surface.
bm = bmesh.new()
bm.from_mesh(full.data)
bad = [e for e in bm.edges if not e.is_manifold]
bm.verts.ensure_lookup_table()
original_triangles = [tuple(p.vertices) for p in full.data.polygons]
source_bvh = BVHTree.FromPolygons([v.co[:] for v in full.data.vertices], original_triangles, all_triangles=True)
source_contacts = [(i, j) for i, j in source_bvh.overlap(source_bvh) if i < j and not set(original_triangles[i]).intersection(original_triangles[j])]
pending_groups = [{v for v in e.verts} for e in bad]
pending_groups += [{bm.verts[k] for face in (i, j) for k in original_triangles[face]} for i, j in source_contacts]
groups = []
while pending_groups:
    group = pending_groups.pop()
    changed = True
    while changed:
        changed = False
        for other in pending_groups[:]:
            if group.intersection(other):
                group |= other
                pending_groups.remove(other)
                changed = True
    groups.append(group)
before_faces = len(bm.faces)
for group in groups:
    center_vertex = sum((v.co for v in group), Vector()) / len(group)
    assert max((v.co - center_vertex).length for v in group) < 0.1
    bmesh.ops.pointmerge(bm, verts=list(group), merge_co=center_vertex)
bmesh.ops.dissolve_degenerate(bm, dist=0.000001, edges=list(bm.edges))
removed_faces = before_faces - len(bm.faces)
filled_count = 0
bmesh.ops.triangulate(bm, faces=list(bm.faces))
bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
print("REPAIR_CHECK " + json.dumps({"removed": removed_faces, "filled": filled_count, "remaining_nonmanifold_edges": sum(not e.is_manifold for e in bm.edges)}), flush=True)
assert all(e.is_manifold for e in bm.edges), "Local repair did not close the source mesh"
bm.to_mesh(full.data)
bm.free()

vertices = np.array([v.co[:] for v in full.data.vertices], dtype=np.float64)
theta = np.arctan2(vertices[:, 0], vertices[:, 2] - 15.5)
radius = np.hypot(vertices[:, 0], vertices[:, 2] - 15.5)
theta_abs = np.abs(theta)
theta_end = float(theta_abs.max())
profile = [s for s in ANALYSIS["source_radial_profile"] if all(h is not None for h in s["hits"])]
profile_theta = np.radians([s["angle_degrees"] for s in profile])
profile_radius = np.array([sum(h[0] for h in s["hits"]) / 2 for s in profile])
if theta_end > profile_theta[-1]:
    end_radius = float(np.min(radius[theta_abs > profile_theta[-1]]))
    profile_theta = np.append(profile_theta, theta_end)
    profile_radius = np.append(profile_radius, end_radius)

# Use a lower envelope so that even the source's slight asymmetry stays outside
# the intended clearance. This is a smooth, monotone polar deformation, not a
# projection/clamp that would collapse triangles onto the contact surface.
raw_offset = radius - np.interp(theta_abs, profile_theta, profile_radius)
envelope_margin = max(0.0, -float(raw_offset.min())) + 0.001
profile_radius -= envelope_margin
raw_offset = radius - np.interp(theta_abs, profile_theta, profile_radius)

def cumulative_length(points):
    return np.r_[0.0, np.cumsum(np.linalg.norm(np.diff(points, axis=0), axis=1))]

source_t = np.linspace(0, theta_end, 8001)
source_r = np.interp(source_t, profile_theta, profile_radius)
source_curve = np.column_stack((source_r * np.sin(source_t), source_r * np.cos(source_t)))
source_s = cumulative_length(source_curve)
axes = ANALYSIS["ellipsoid_semi_axes_mm"]
clearance = 1.0
a = axes["left_right"] + clearance
c = axes["vertical"] + clearance
target_t = np.linspace(0, math.pi / 2, 8001)
target_r = 1 / np.sqrt((np.sin(target_t) / a) ** 2 + (np.cos(target_t) / c) ** 2)
target_curve = np.column_stack((target_r * np.sin(target_t), target_r * np.cos(target_t)))
target_s = cumulative_length(target_curve)
detail_scale = float(target_s[-1] / source_s[-1])
fraction = np.interp(theta_abs, source_t, source_s / source_s[-1])
phi = np.interp(fraction, target_s / target_s[-1], target_t)
new_r = 1 / np.sqrt((np.sin(phi) / a) ** 2 + (np.cos(phi) / c) ** 2) + raw_offset * detail_scale
fitted = np.column_stack((np.sign(theta) * np.sin(phi) * new_r, vertices[:, 1] * detail_scale, np.cos(phi) * new_r))
assert np.all(np.isfinite(fitted))
assert np.min(raw_offset) > 0
for vert, coordinate in zip(full.data.vertices, fitted):
    vert.co = coordinate
full.data.update()
full["measurements_mm"] = "Circumference 580; forehead-nape tape arc 380; ear-ear tape arc 320"
full["fit_status"] = "Initial fit candidate: physical test required"
full["clearance_mm"] = clearance
full["source_sha256"] = source_hash

# A light gauge has the same nominal inner arch. It validates size and position,
# not the stiffness or weight of the complete ornament.
segments = 320
width = 12.0
thickness = 3.0
test_verts = []
test_faces = []
for i in range(segments + 1):
    t = math.pi * i / segments
    x, z = a * math.cos(t), c * math.sin(t)
    normal = np.array([math.cos(t) / a, math.sin(t) / c])
    normal /= np.linalg.norm(normal)
    for outward, y in [(0, -width / 2), (thickness, -width / 2), (thickness, width / 2), (0, width / 2)]:
        test_verts.append((x + outward * normal[0], y, z + outward * normal[1]))
for i in range(segments):
    for j in range(4):
        test_faces.append((4 * i + j, 4 * i + (j + 1) % 4, 4 * (i + 1) + (j + 1) % 4, 4 * (i + 1) + j))
test_faces.extend([(3, 2, 1, 0), tuple(4 * segments + j for j in range(4))])
test_mesh = bpy.data.meshes.new("Fit gauge mesh")
test_mesh.from_pydata(test_verts, [], test_faces)
test_mesh.update()
test = bpy.data.objects.new("Fit_gauge_58cm_nominal_arch_mm", test_mesh)
bpy.context.collection.objects.link(test)
for o in bpy.context.selected_objects:
    o.select_set(False)
test.select_set(True)
bpy.context.view_layer.objects.active = test
bevel = test.modifiers.new("Comfort edges", "BEVEL")
bevel.width = 0.5
bevel.segments = 3
bevel.limit_method = "ANGLE"
bpy.ops.object.modifier_apply(modifier=bevel.name)
bm = bmesh.new()
bm.from_mesh(test.data)
bmesh.ops.triangulate(bm, faces=list(bm.faces))
bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
bm.to_mesh(test.data)
bm.free()

def stats(obj):
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    groups = 0
    seen = set()
    bm.verts.index_update()
    for vertex in bm.verts:
        if vertex.index in seen:
            continue
        groups += 1
        stack = [vertex]
        seen.add(vertex.index)
        while stack:
            current = stack.pop()
            for edge in current.link_edges:
                other = edge.other_vert(current)
                if other.index not in seen:
                    seen.add(other.index)
                    stack.append(other)
    result = {
        "vertices": len(bm.verts), "triangles": len(bm.faces),
        "nonmanifold_edges": sum(not e.is_manifold for e in bm.edges),
        "nonmanifold_vertices": sum(not v.is_manifold for v in bm.verts),
        "boundary_edges": sum(e.is_boundary for e in bm.edges),
        "degenerate_faces": sum(f.calc_area() < 1e-10 for f in bm.faces),
        "connected_components": groups, "volume_mm3": bm.calc_volume(signed=True),
        "bounds_mm": [list(min(v.co[axis] for v in bm.verts) for axis in range(3)), list(max(v.co[axis] for v in bm.verts) for axis in range(3))],
    }
    bm.free()
    assert result["nonmanifold_edges"] == result["nonmanifold_vertices"] == result["degenerate_faces"] == 0, result
    assert result["connected_components"] == 1 and result["volume_mm3"] > 0, result
    return result

scene = bpy.context.scene
scene.unit_settings.system = "METRIC"
scene.unit_settings.scale_length = 0.001
scene.unit_settings.length_unit = "MILLIMETERS"
outputs = {}
for obj, filename in [(full, "Headband_58cm_PLA_fit_v1.stl"), (test, "Headband_58cm_fit_test_v1.stl")]:
    outputs[filename] = stats(obj)
    display_copy = obj.copy()
    display_copy.data = obj.data.copy()
    scene.collection.objects.link(display_copy)
    # Put the band plane on XY; layers follow the arch rather than cutting it.
    y_low = min(v.co.y for v in display_copy.data.vertices)
    for vert in display_copy.data.vertices:
        x, y, z = vert.co
        vert.co = (x, -z, y - y_low)
    for other in bpy.context.selected_objects:
        other.select_set(False)
    display_copy.select_set(True)
    bpy.context.view_layer.objects.active = display_copy
    bpy.context.view_layer.update()
    outputs[filename]["print_dimensions_mm"] = list(display_copy.dimensions)
    bpy.ops.wm.stl_export(filepath=str(ROOT / filename), export_selected_objects=True, apply_modifiers=True, global_scale=1.0, use_scene_unit=False)
    outputs[filename]["sha256"] = hashlib.sha256((ROOT / filename).read_bytes()).hexdigest()
    bpy.data.objects.remove(display_copy, do_unlink=True)
metadata = {
    "source_sha256": source_hash,
    "input_measurements_mm": ANALYSIS["measurements_mm"],
    "fit_assumption": ANALYSIS["model_assumption"],
    "head_semi_axes_mm": axes,
    "nominal_clearance_mm": clearance,
    "nominal_inner_arch_mm": float(target_s[-1] * 2),
    "nominal_inner_width_mm": float(a * 2),
    "nominal_inner_height_mm": float(c),
    "original_half_arch_raw_units": float(source_s[-1]),
    "detail_scale": detail_scale,
    "source_profile_envelope_margin_raw_units": envelope_margin,
    "source_repair": {"removed_local_faces": removed_faces, "filled_patch_faces": filled_count, "microscopic_self_intersections_repaired": len(source_contacts)},
    "test_gauge": {"thickness_mm": thickness, "width_mm": width, "edge_radius_mm": 0.5, "limitation": "Same nominal arch only; does not reproduce full ornament stiffness, weight, or front-back sweep."},
    "physical_fit_validated": False,
    "outputs": outputs,
}
(ROOT / "delivery_measurements.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest() == source_hash
print("DELIVERY " + json.dumps(metadata), flush=True)

# Editable millimetre source plus clean, normalized visual previews.
full.hide_render = True
full.hide_set(True)
test.hide_render = True
test.hide_set(True)
display = full.copy()
display.data = full.data.copy()
scene.collection.objects.link(display)
display.name = "Fitted_display_normalized"
display.hide_render = False
display.hide_set(False)
low, high = outputs["Headband_58cm_PLA_fit_v1.stl"]["bounds_mm"]
center = (Vector(low) + Vector(high)) / 2
render_scale = 3.0 / max(np.array(high) - np.array(low))
for vert in display.data.vertices:
    vert.co = (vert.co - center) * render_scale
material = bpy.data.materials.new("Fitted neutral clay")
material.use_nodes = True
shader = material.node_tree.nodes.get("Principled BSDF")
shader.inputs["Base Color"].default_value = (0.13, 0.20, 0.27, 1)
shader.inputs["Roughness"].default_value = 0.48
display.data.materials.clear()
display.data.materials.append(material)
for polygon in display.data.polygons:
    polygon.use_smooth = True
scene.render.engine = "CYCLES"
scene.cycles.samples = 32
scene.cycles.use_denoising = True
scene.render.resolution_x = 1200
scene.render.resolution_y = 1100
scene.render.resolution_percentage = 100
scene.world = bpy.data.worlds.new("Fit preview world")
scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs[0].default_value = (0.5, 0.54, 0.6, 1)
scene.world.node_tree.nodes["Background"].inputs[1].default_value = 0.5
for name, position, energy in [("Key", (3, -4, 6), 650), ("Fill", (-4, -2, 2), 350), ("Rim", (1, 4, 4), 700)]:
    data = bpy.data.lights.new(name, "AREA")
    light = bpy.data.objects.new(name, data)
    scene.collection.objects.link(light)
    light.location = position
    light.rotation_euler = (-light.location).to_track_quat("-Z", "Y").to_euler()
    data.energy = energy
    data.shape = "DISK"
    data.size = 4
camera_data = bpy.data.cameras.new("Fit preview camera")
camera = bpy.data.objects.new("Fit preview camera", camera_data)
scene.collection.objects.link(camera)
scene.camera = camera
camera_data.type = "ORTHO"
camera_data.ortho_scale = 3.65
for name, position in [("fitted_front", (0, -8, 0)), ("fitted_perspective", (4, -7, 3))]:
    camera.location = position
    camera.rotation_euler = (-camera.location).to_track_quat("-Z", "Y").to_euler()
    scene.render.filepath = str(ROOT / (name + ".png"))
    bpy.ops.render.render(write_still=True)
display.hide_render = True
display.hide_set(True)
gauge_display = test.copy()
gauge_display.data = test.data.copy()
scene.collection.objects.link(gauge_display)
gauge_display.name = "Gauge_display_normalized"
gauge_display.hide_render = False
gauge_display.hide_set(False)
for vert in gauge_display.data.vertices:
    vert.co = (vert.co - Vector((0, 0, c / 2))) * (3 / (2 * a + 2 * thickness))
gauge_display.data.materials.clear()
gauge_display.data.materials.append(material)
camera.location = (2, -8, 2)
camera.rotation_euler = (-camera.location).to_track_quat("-Z", "Y").to_euler()
scene.render.filepath = str(ROOT / "fit_test_preview.png")
bpy.ops.render.render(write_still=True)
# The editable file opens on the real, millimetre-sized mesh, never on the
# normalized render helper. Keep the physical gauge separate and hidden.
bpy.data.objects.remove(gauge_display, do_unlink=True)
bpy.data.objects.remove(display, do_unlink=True)
full.hide_render = False
full.hide_set(False)
for light in [o for o in scene.objects if o.type == "LIGHT"]:
    light.location = center + light.location / render_scale
    light.data.energy /= render_scale ** 2
    light.data.size /= render_scale
camera.location = center + Vector((4, -7, 3)) / render_scale
camera.rotation_euler = (center - camera.location).to_track_quat("-Z", "Y").to_euler()
camera_data.ortho_scale /= render_scale
camera_data.clip_end = 10000
for other in bpy.context.selected_objects:
    other.select_set(False)
full.select_set(True)
bpy.context.view_layer.objects.active = full
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type == "VIEW_3D":
            area.spaces.active.region_3d.view_location = center
            area.spaces.active.region_3d.view_distance = 340
            area.spaces.active.region_3d.view_rotation = camera.rotation_euler.to_quaternion()
            area.spaces.active.clip_end = 10000
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / "Headband_58cm_editable.blend"))
