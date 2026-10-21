"""Measure the actual inner band rather than the horn silhouette."""
import bpy
import json
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT / "inspection.blend"))
obj = bpy.data.objects["Original_STL_unscaled"]
bvh = BVHTree.FromPolygons([v.co for v in obj.data.vertices], [p.vertices for p in obj.data.polygons])
samples = []
for z in range(1, 41):
    hits = []
    for sign in (-1, 1):
        point, normal, index, distance = bvh.ray_cast(Vector((0, 0, z)), Vector((sign, 0, 0)), 100)
        hits.append(None if point is None else list(point))
    samples.append({"z": z, "hits": hits, "width": None if any(p is None for p in hits) else hits[1][0] - hits[0][0]})
vertical, _, _, _ = bvh.ray_cast(Vector((0, 0, 1)), Vector((0, 0, 1)), 100)
result = {"section_plane": "y=0", "horizontal_rays_from_center": samples, "inner_top_at_x0": list(vertical) if vertical else None}
(ROOT / "opening_measurements.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
print("OPENING " + json.dumps(result))
