"""Independently reimport actual exported STLs and verify their topology/scale."""
import bpy
import bmesh
import hashlib
import json
import math
import struct
from pathlib import Path
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parent
metadata = json.loads((ROOT / "delivery_measurements.json").read_text(encoding="utf-8"))
results = {}
for name, expected in metadata["outputs"].items():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    path = ROOT / name
    raw = path.read_bytes()
    count = struct.unpack_from("<I", raw, 80)[0]
    assert len(raw) == 84 + 50 * count
    assert hashlib.sha256(raw).hexdigest() == expected["sha256"]
    bpy.ops.wm.stl_import(filepath=str(path))
    obj = bpy.context.object
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    assert len(bm.faces) == count == expected["triangles"], "Triangles changed on reimport"
    assert all(math.isfinite(value) for v in bm.verts for value in v.co)
    assert all(e.is_manifold for e in bm.edges)
    assert all(v.is_manifold for v in bm.verts)
    assert all(f.calc_area() > 1e-10 for f in bm.faces)
    assert bm.calc_volume(signed=True) > 0
    dimensions = list(obj.dimensions)
    assert max(abs(a-b) for a, b in zip(dimensions, expected["print_dimensions_mm"])) < 0.0001
    assert abs(min(v.co.z for v in bm.verts)) < 0.00001
    # BVH reports non-neighbour face contacts. These are examined separately
    # from the watertightness check; sharing a vertex is normal mesh adjacency.
    verts = [v.co[:] for v in obj.data.vertices]
    triangles = [tuple(p.vertices) for p in obj.data.polygons]
    bvh = BVHTree.FromPolygons(verts, triangles, all_triangles=True, epsilon=0.0)
    pairs = [(i, j) for i, j in bvh.overlap(bvh) if i < j and not set(triangles[i]).intersection(triangles[j])]
    assert not pairs, "Non-adjacent surface contact remains in exported STL"
    results[name] = {"triangles": count, "closed_manifold": True, "dimensions_mm": dimensions, "nonadjacent_bvh_contacts": len(pairs), "contact_examples": pairs[:10]}
    bm.free()
source = Path(r"C:\Users\vande\Downloads\Meshy_AI_gothic_horn_headband_easy_pla_20261017_generate.stl")
assert hashlib.sha256(source.read_bytes()).hexdigest() == metadata["source_sha256"]
results["original_unchanged"] = True
results["physical_fit_validated"] = False
bpy.ops.wm.open_mainfile(filepath=str(ROOT / "Headband_58cm_editable.blend"))
editable = bpy.data.objects["Headband_58cm_fitted_mm"]
assert not editable.hide_get() and not editable.hide_render
assert bpy.context.scene.unit_settings.scale_length == 0.0010000000474974513
assert max(abs(a-b) for a, b in zip(editable.dimensions, [217.5858612060547, 72.0208740234375, 207.87660217285156])) < 0.001
assert not any("display_normalized" in obj.name.lower() for obj in bpy.context.scene.objects)
results["editable_file_actual_millimetre_mesh_visible"] = True
(ROOT / "export_verification.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
print("EXPORT_VERIFIED " + json.dumps(results), flush=True)
