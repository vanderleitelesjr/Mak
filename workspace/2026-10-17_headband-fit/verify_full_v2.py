"""Reimport the released ornament, check intersections, scale and source history."""
import bpy
import bmesh
import hashlib
import json
import math
import numpy as np
import struct
from pathlib import Path
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "v2"
metadata = json.loads((OUT / "full_delivery_measurements.json").read_text(encoding="utf-8"))
a1 = json.loads((OUT / "a1_orientation.json").read_text(encoding="utf-8"))
v1 = json.loads((ROOT / "delivery_measurements.json").read_text(encoding="utf-8"))
trial = json.loads((ROOT / "fit_trial_v2.json").read_text(encoding="utf-8"))
artifact_checks = []
for filename, sha256, expected_dimensions in [
    (metadata["stl"], metadata["sha256"], metadata["print_dimensions_mm"]),
    (a1["stl"], a1["sha256"], a1["printDimensionsMM"]),
]:
    raw = (OUT / filename).read_bytes()
    count = struct.unpack_from("<I", raw, 80)[0]
    assert len(raw) == 84+50*count
    assert hashlib.sha256(raw).hexdigest() == sha256
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.wm.stl_import(filepath=str(OUT / filename))
    obj = bpy.context.object
    assert len(obj.data.polygons) == count == metadata["triangles"]
    assert len(obj.data.vertices) == metadata["vertices"]
    assert max(abs(a-b) for a,b in zip(obj.dimensions, expected_dimensions)) < 0.0001
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.verts.ensure_lookup_table()
    bm.verts.index_update()
    assert all(math.isfinite(x) for v in bm.verts for x in v.co)
    assert all(e.is_manifold and e.is_contiguous for e in bm.edges)
    assert all(v.is_manifold for v in bm.verts)
    assert all(f.calc_area() > 1e-10 for f in bm.faces)
    assert bm.calc_volume(signed=True) > 0
    assert abs(min(v.co.z for v in bm.verts)) < 0.00001
    seen, stack = {0}, [bm.verts[0]]
    while stack:
        current = stack.pop()
        for edge in current.link_edges:
            other = edge.other_vert(current)
            if other.index not in seen:
                seen.add(other.index)
                stack.append(other)
    assert len(seen) == len(bm.verts)
    bm.free()
    triangles = [tuple(p.vertices) for p in obj.data.polygons]
    bvh = BVHTree.FromPolygons([v.co[:] for v in obj.data.vertices], triangles, all_triangles=True)
    contacts = [(i,j) for i,j in bvh.overlap(bvh) if i < j and not set(triangles[i]).intersection(triangles[j])]
    assert not contacts, contacts[:10]
    artifact_checks.append({"stl": filename, "sha256": sha256, "print_dimensions_mm": list(obj.dimensions), "closed_manifold": True, "connected_components": 1, "nonadjacent_surface_contacts": 0})
    print("FULL_V2_STL_TOPOLOGY_OK " + filename, flush=True)

assert a1["sourceSHA256"] == metadata["sha256"]
triangle_type = np.dtype([("normal", "<f4", (3,)), ("vertices", "<f4", (3,3)), ("attribute", "<u2")])
base_triangles = np.frombuffer((OUT / metadata["stl"]).read_bytes(), dtype=triangle_type, offset=84)
a1_triangles = np.frombuffer((OUT / a1["stl"]).read_bytes(), dtype=triangle_type, offset=84)
base_xyz = base_triangles["vertices"].astype(float)
a1_xyz = a1_triangles["vertices"].astype(float)
radians = math.radians(a1["rotationAroundZDegrees"])
rotation = np.array([[math.cos(radians),-math.sin(radians),0],[math.sin(radians),math.cos(radians),0],[0,0,1]])
rigid_error = float(np.max(np.abs(a1_xyz-base_xyz @ rotation.T)))
assert rigid_error < 0.00002 and a1["scale"] == 1
assert np.array_equal(a1_xyz[:,:,2],base_xyz[:,:,2])
assert max(a1["printDimensionsMM"]) < 256

# Revisions and original remain byte-for-byte unchanged. The accepted physical
# test is bound to the exact gauge STL, rather than a mutable filename alone.
for name, entry in v1["outputs"].items():
    assert hashlib.sha256((ROOT / name).read_bytes()).hexdigest() == entry["sha256"]
source = Path(r"C:\Users\vande\Downloads\Meshy_AI_gothic_horn_headband_easy_pla_20261017_generate.stl")
assert hashlib.sha256(source.read_bytes()).hexdigest() == v1["source_sha256"]
assert hashlib.sha256((ROOT / trial["test_file"]).read_bytes()).hexdigest() == trial["test_sha256"] == metadata["gauge_sha256"]
profile_raw = (OUT / "nominal_profile.json").read_bytes()
assert hashlib.sha256(profile_raw).hexdigest() == metadata["nominal_profile_sha256"]
assert trial["result"] == "passed" and all(trial[k] for k in ["crown_sits_on_head", "tips_hold_without_pressure"])
assert not trial["remaining_gap"]

# Check the editable release against its input with identical vertex identity.
assert hashlib.sha256((ROOT / "Headband_58cm_editable.blend").read_bytes()).hexdigest() == metadata["input_repaired_blend_sha256"]
bpy.ops.wm.open_mainfile(filepath=str(ROOT / "Headband_58cm_editable.blend"))
old_mesh = bpy.data.objects["Headband_58cm_fitted_mm"].data
old = np.array([v.co[:] for v in old_mesh.vertices], dtype=float)
old_faces = [tuple(p.vertices) for p in old_mesh.polygons]
bpy.ops.wm.open_mainfile(filepath=str(OUT / metadata["editable"]))
full = bpy.data.objects["Headband_58cm_v2_fitted_mm"]
assert not full.hide_get() and not full.hide_render
assert abs(bpy.context.scene.unit_settings.scale_length-0.001) < 1e-9
new = np.array([v.co[:] for v in full.data.vertices], dtype=float)
assert [tuple(p.vertices) for p in full.data.polygons] == old_faces
assert np.max(np.abs(new[:, 1]-old[:, 1])) == 0

# Reconstruct contact at the old arc fraction and recover the target polar
# radius from the approved profile. This detects translation, uniform scaling,
# a wrong contour, and ornament relief lost during the transfer.
phi = np.arctan2(np.abs(old[:,0]), old[:,2])
a, c = v1["nominal_inner_width_mm"]/2, v1["nominal_inner_height_mm"]
old_relief = np.hypot(old[:,0], old[:,2])-1/np.sqrt((np.sin(phi)/a)**2+(np.cos(phi)/c)**2)
grid = np.linspace(0, math.pi/2, 32001)
r = 1/np.sqrt((np.sin(grid)/a)**2+(np.cos(grid)/c)**2)
p = np.column_stack((r*np.sin(grid),r*np.cos(grid)))
s = np.r_[0,np.cumsum(np.linalg.norm(np.diff(p,axis=0),axis=1))]
fraction = np.interp(phi,grid,s/s[-1])
curve = np.array(json.loads(profile_raw)["points"],dtype=float)
right = curve[len(curve)//2:]
t = np.r_[0,np.cumsum(np.linalg.norm(np.diff(right,axis=0),axis=1))]
q = np.column_stack([np.interp(fraction,t/t[-1],right[:,axis]) for axis in range(2)])
new_phi = np.arctan2(np.abs(new[:,0]),new[:,2])
angle_error = float(np.max(np.abs(new_phi-np.arctan2(q[:,0],q[:,1]))))
relief_error = float(np.max(np.abs(np.hypot(new[:,0],new[:,2])-np.linalg.norm(q,axis=1)-old_relief)))
assert angle_error < 0.000001 and relief_error < 0.00003
assert old_relief.min() > 0
assert abs(curve[:,0].max()*2-172) < 0.000001
assert abs(curve[-1,0]-curve[0,0]-138) < 0.000001
result = {
    "triangles": count, "closed_manifold": True, "consistent_face_winding": True,
    "connected_components": 1, "degenerate_faces": 0, "nonadjacent_surface_contacts": 0,
    "print_dimensions_mm": metadata["print_dimensions_mm"],
    "topology_identical_to_repaired_input": True, "front_back_coordinates_unchanged": True,
    "maximum_radial_relief_error_mm": relief_error, "maximum_contact_angle_error_radians": angle_error,
    "approved_profile_hash_matches": True, "original_and_previous_stls_unchanged": True,
    "editable_actual_mm_ornament_visible": True, "gauge_physical_fit_validated": True,
    "full_ornament_physical_fit_validated": False,
    "artifacts": artifact_checks,
    "a1_rigid_transform_maximum_error_mm": rigid_error,
    "a1_nominal_build_volume_fits": True,
}
(OUT / "full_export_verification.json").write_text(json.dumps(result,indent=2),encoding="utf-8")
print("FULL_V2_EXPORT_VERIFIED "+json.dumps(result),flush=True)
