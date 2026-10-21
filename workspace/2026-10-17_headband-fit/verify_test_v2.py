"""Reimport the delivered v2 file and check actual geometry, scale and history."""
import bpy
import bmesh
import hashlib
import json
import math
import struct
from pathlib import Path
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "v2"
metadata = json.loads((OUT / "delivery_measurements.json").read_text(encoding="utf-8"))
path = OUT / metadata["test_stl"]
raw = path.read_bytes()
count = struct.unpack_from("<I", raw, 80)[0]
assert len(raw) == 84 + 50*count
assert hashlib.sha256(raw).hexdigest() == metadata["sha256"]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.wm.stl_import(filepath=str(path))
obj = bpy.context.object
assert len(obj.data.polygons) == count == metadata["triangles"]
assert max(abs(a-b) for a,b in zip(obj.dimensions, metadata["print_dimensions_mm"])) < 0.0001
bm = bmesh.new()
bm.from_mesh(obj.data)
bm.verts.index_update()
assert all(math.isfinite(x) for v in bm.verts for x in v.co)
assert all(e.is_manifold and e.is_contiguous for e in bm.edges)
assert all(v.is_manifold for v in bm.verts)
assert all(f.calc_area() > 1e-10 for f in bm.faces)
assert bm.calc_volume(signed=True) > 0
assert abs(min(v.co.z for v in bm.verts)) < 0.00001
bm.verts.ensure_lookup_table()
stack = [bm.verts[0]]
seen = {stack[0].index}
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
assert not contacts
v1 = json.loads((ROOT / "delivery_measurements.json").read_text(encoding="utf-8"))
for name, entry in v1["outputs"].items():
    assert hashlib.sha256((ROOT / name).read_bytes()).hexdigest() == entry["sha256"]
source = Path(r"C:\Users\vande\Downloads\Meshy_AI_gothic_horn_headband_easy_pla_20261017_generate.stl")
assert hashlib.sha256(source.read_bytes()).hexdigest() == v1["source_sha256"]
dimensions = list(obj.dimensions)
bpy.ops.wm.open_mainfile(filepath=str(OUT / "Headband_fit_test_v2_editable.blend"))
gauge = bpy.data.objects["Headband_fit_test_v2_mm"]
assert not gauge.hide_get() and not gauge.hide_render
assert abs(bpy.context.scene.unit_settings.scale_length - 0.001) < 1e-9
trial_path = ROOT / "fit_trial_v2.json"
physical_fit_validated = False
if trial_path.exists():
    trial = json.loads(trial_path.read_text(encoding="utf-8"))
    assert trial["test_sha256"] == metadata["sha256"]
    physical_fit_validated = trial["result"] == "passed"
assert metadata["physical_fit_validated"] == physical_fit_validated
result = {
    "triangles": count, "closed_manifold": True,
    "consistent_face_winding": True, "connected_components": 1,
    "degenerate_faces": 0, "nonadjacent_surface_contacts": 0,
    "print_dimensions_mm": dimensions,
    "original_unchanged": True, "v1_deliverables_unchanged": True,
    "editable_actual_mm_gauge_visible": True,
    "physical_fit_validated": physical_fit_validated,
    "physical_fit_record": "../fit_trial_v2.json" if trial_path.exists() else None,
}
(OUT / "export_verification.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
print("V2_EXPORT_VERIFIED " + json.dumps(result), flush=True)
