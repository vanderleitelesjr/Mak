import bpy
import json
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mathutils.geometry import intersect_ray_tri

ROOT = Path(__file__).resolve().parent
for path in [Path(r"C:\Users\vande\Downloads\Meshy_AI_gothic_horn_headband_easy_pla_20261017_generate.stl"), ROOT / "Headband_58cm_PLA_fit_v1.stl"]:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.wm.stl_import(filepath=str(path))
    obj = bpy.context.object
    verts = [v.co.copy() for v in obj.data.vertices]
    triangles = [tuple(p.vertices) for p in obj.data.polygons]
    bvh = BVHTree.FromPolygons(verts, triangles, all_triangles=True)
    pairs = [(i, j) for i, j in bvh.overlap(bvh) if i < j and not set(triangles[i]).intersection(triangles[j])]
    data = []
    for i, j in pairs:
        a, b = [[verts[k] for k in triangles[n]] for n in (i, j)]
        crossings = []
        for edge_triangle, other in [(a, b), (b, a)]:
            for k in range(3):
                start, end = edge_triangle[k], edge_triangle[(k+1)%3]
                hit = intersect_ray_tri(*other, end-start, start, True)
                if hit is not None:
                    fraction = (hit-start).dot(end-start) / (end-start).length_squared
                    if -1e-6 <= fraction <= 1+1e-6:
                        crossings.append({"fraction": fraction, "point": list(hit)})
        data.append({"faces": [i,j], "vertices": [[list(p) for p in a], [list(p) for p in b]], "crossings": crossings})
    print("CONTACTS " + json.dumps({"path": str(path), "contacts": data}), flush=True)
