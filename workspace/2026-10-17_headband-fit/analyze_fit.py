"""Infer an initial head envelope from three tape measurements; inspect band profile."""
import bpy
import bmesh
import json
import math
import numpy as np
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT / "inspection.blend"))
obj = bpy.data.objects["Original_STL_unscaled"]
verts = np.array([v.co[:] for v in obj.data.vertices])
bvh = BVHTree.FromPolygons([v.co for v in obj.data.vertices], [p.vertices for p in obj.data.polygons])
samples = []
for degrees in np.arange(0, 175.01, 0.5):
    angle = math.radians(degrees)
    distances = []
    for side in (-1, 1):
        best = None
        for y in np.arange(-9.5, 9.51, 0.25):
            p, _, _, distance = bvh.ray_cast(Vector((0, y, 15.5)), Vector((side * math.sin(angle), 0, math.cos(angle))), 100)
            if p is not None and (best is None or distance < best[0]):
                best = (distance, list(p))
        distances.append(best)
    samples.append({"angle_degrees": float(degrees), "hits": distances})

def perimeter(a, b):
    # Numerical integration avoids treating tape arcs as straight diameters.
    t = np.linspace(0, math.pi / 2, 4097)
    return float(4 * np.trapezoid(np.sqrt((a * np.sin(t)) ** 2 + (b * np.cos(t)) ** 2), t))

axes = np.array([73.0, 111.0, 130.0])
target = np.array([580.0, 760.0, 640.0])
def equations(v):
    a, b, c = v
    return np.array([perimeter(a, b), perimeter(b, c), perimeter(a, c)])
for _ in range(12):
    error = equations(axes) - target
    if np.max(np.abs(error)) < 0.00001:
        break
    jacobian = np.column_stack([(equations(axes + np.eye(3)[j] * 0.01) - equations(axes)) / 0.01 for j in range(3)])
    axes -= np.linalg.solve(jacobian, error)
bm = bmesh.new()
bm.from_mesh(obj.data)
bad_edges = [{"faces": len(e.link_faces), "coordinates": [list(v.co) for v in e.verts]} for e in bm.edges if not e.is_manifold]
bm.free()
result = {
    "measurements_mm": {"horizontal_circumference": 580, "forehead_to_nape_arc": 380, "ear_to_ear_arc": 320},
    "model_assumption": "Three mutually perpendicular ellipses sharing semi-axes; all tape endpoints assumed to share a baseline. Initial estimate only, not a body scan.",
    "ellipsoid_semi_axes_mm": {"left_right": float(axes[0]), "front_back": float(axes[1]), "vertical": float(axes[2])},
    "predicted_arcs_mm": equations(axes).tolist(),
    "source_profile_origin": [0, 15.5],
    "source_radial_profile": samples,
    "source_nonmanifold_edges": bad_edges,
}
(ROOT / "fit_analysis.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
print("ELLIPSOID " + json.dumps({k: v for k, v in result.items() if k not in ("source_radial_profile", "source_nonmanifold_edges")}))
print("PROFILE " + json.dumps(samples[::20]))
print("DEFECTS " + json.dumps(bad_edges))
