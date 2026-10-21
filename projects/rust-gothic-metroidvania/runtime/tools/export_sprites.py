"""Blender 5.x: editable rigid armor, keyed clips and unlit/normal sprite atlases.

Run: blender -b --factory-startup --python-exit-code 1 --python tools/export_sprites.py
Coordinates: Blender X=forward, Z=up, -Y=toward sprite camera.
"""
import bpy
import json
import math
import os
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "penitent-proof-v01"
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.samples = 1  # Emission passes have no lighting noise.
scene.cycles.use_denoising = False  # Denoising data passes corrupts unit-length normals.
scene.view_layers[0].cycles.use_denoising = False
scene.cycles.pixel_filter_type = 'BOX'
scene.cycles.filter_width = .01
scene.render.resolution_x = 192
scene.render.resolution_y = 256
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.render.image_settings.color_depth = "8"
scene.render.fps = 32
scene.render.dither_intensity = 0
scene.view_settings.view_transform = "Standard"
scene.world.color = (0, 0, 0)

def material(name, base, rust=False):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*base, 1)
    m.use_nodes = True
    n, links = m.node_tree.nodes, m.node_tree.links
    n.clear()
    out = n.new("ShaderNodeOutputMaterial")
    emit = n.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = (*base, 1)
    links.new(emit.outputs[0], out.inputs["Surface"])
    if rust:
        noise = n.new("ShaderNodeTexNoise")
        noise.inputs["Scale"].default_value = 21
        noise.inputs["Detail"].default_value = 3
        ramp = n.new("ShaderNodeValToRGB")
        ramp.color_ramp.elements[0].position = .40
        ramp.color_ramp.elements[0].color = (*base, 1)
        ramp.color_ramp.elements[1].position = .65
        ramp.color_ramp.elements[1].color = (.19, .065, .026, 1)
        links.new(noise.outputs["Fac"], ramp.inputs[0])
        links.new(ramp.outputs[0], emit.inputs[0])
    return m

steel = material("Unlit silver steel with local pitting", (.30, .34, .39), True)
trim = material("Worn steel edges", (.48, .51, .56))
dark = material("Empty joints and leather", (.018, .022, .027))
rust = material("Oxide patches", (.15, .047, .020))

def empty(name, pos, parent=None):
    obj = bpy.data.objects.new(name, None)
    scene.collection.objects.link(obj)
    obj.location = pos
    obj.parent = parent
    return obj

def cube(name, pos, size, mat=steel, parent=None, bevel=.025):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0))
    obj = bpy.context.object
    obj.name = name
    obj.parent = parent
    obj.location = pos
    obj.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new("Worn bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 1
        obj.modifiers.new("Weighted plate normals", "WEIGHTED_NORMAL")
    return obj

def sphere(name, pos, scale, mat, parent):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=10, ring_count=6)
    obj = bpy.context.object
    obj.name = name
    obj.parent = parent
    obj.location, obj.scale = pos, scale
    obj.data.materials.append(mat)
    return obj

root = empty("GLOBAL / stationary sprite origin", (0, 0, 0))
hip = empty("Pelvis control", (0, 0, 1.02), root)
cube("Hollow belt", (0, 0, .03), (.36, .30, .16), dark, hip)
torso = empty("Chest control", (0, 0, .13), hip)
cube("Tapered breastplate", (0, 0, .22), (.35, .32, .43), steel, torso)
for x in [-.13, 0, .13]:
    cube("Breastplate fluting", (x, -.174, .22), (.025, .025, .37), trim, torso, .008)
# A dark open neck, with no flesh/body inside the armor.
cube("Open neck void", (0, 0, .50), (.16, .15, .13), dark, torso)
head = empty("Angular helmet control", (0, 0, .69), torso)
cube("Angular helmet shell", (0, 0, 0), (.29, .28, .31), steel, head, .065)
cube("Damaged visor snout", (.14, -.01, -.035), (.13, .29, .19), trim, head, .035)
for z in [-.07, -.015, .04]:
    cube("Black visor slit", (.211, -.004, z), (.007, .24, .018), dark, head, 0)
cube("Hollow helmet bottom", (.02, 0, -.174), (.24, .22, .025), dark, head, 0)
cube("Helmet broken crest", (-.06, .01, .20), (.12, .08, .15), steel, head, .02)

legs, arms, soles = [], [], []
for side, y in [("Far", .105), ("Near", -.105)]:
    leg = empty(side + " hip", (0, y, 0), hip)
    cube(side + " thigh plate", (0, 0, -.20), (.20, .19, .33), steel, leg)
    knee = empty(side + " knee", (0, 0, -.39), leg)
    sphere(side + " knee cap", (.015, -.01, 0), (.12, .115, .11), trim, knee)
    cube(side + " greave", (0, 0, -.20), (.15, .17, .34), steel, knee)
    sphere(side + " ankle joint", (0, 0, -.40), (.065, .065, .075), dark, knee)
    foot = empty(side + " ankle", (0, 0, -.43), knee)
    soles.append(cube(side + " pointed sabaton", (.07, 0, -.07), (.31, .19, .13), steel, foot))
    legs.append((leg, knee, foot))
    arm = empty(side + " shoulder", (0, y * 1.8, .41), torso)
    sphere(side + " layered pauldron", (0, 0, -.02), (.23 if side == "Near" else .17, .17, .14), steel, arm)
    cube(side + " upper arm", (0, 0, -.19), (.15, .16, .24), steel, arm)
    elbow = empty(side + " elbow", (0, 0, -.34), arm)
    sphere(side + " elbow joint", (0, 0, 0), (.075, .07, .075), dark, elbow)
    cube(side + " bracer", (0, 0, -.14), (.15, .15, .24), steel, elbow)
    cube(side + " empty gauntlet", (0, 0, -.29), (.13, .14, .12), dark, elbow)
    if side == "Near":
        bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=.24, depth=.045)
        shield = bpy.context.object
        shield.name = "Round buckler"
        shield.parent = elbow
        shield.location = (.02, -.11, -.12)
        shield.rotation_euler[0] = math.pi / 2
        shield.data.materials.append(steel)
        sphere("Buckler boss", (.02, -.15, -.12), (.08, .045, .08), trim, elbow)
    else:
        sword = empty("Straight sword grip", (0, 0, -.29), elbow)
        sword.rotation_euler[1] = -.55
        cube("Straight blade", (0, 0, -.44), (.065, .028, .77), trim, sword, .01)
        cube("Crossguard", (0, 0, -.035), (.28, .07, .04), dark, sword)
    arms.append((arm, elbow))

for frame in range(1, 66):
    walk = frame <= 25
    phase = 2 * math.pi * ((frame - 1) / 24 if walk else (frame - 33) / 32)
    hip.location.z = 1.02 + (.025 * (1 - math.cos(phase * 2)) if walk else .007 * math.sin(phase))
    hip.keyframe_insert("location", frame=frame)
    torso.rotation_euler[1] = .04 if walk else 0
    torso.keyframe_insert("rotation_euler", frame=frame)
    for i, (leg, knee, foot) in enumerate(legs):
        p = phase + i * math.pi
        leg.rotation_euler[1] = .42 * math.sin(p) if walk else .025 * (i * 2 - 1)
        knee.rotation_euler[1] = -.52 * max(0, math.sin(p)) if walk else -.035
        foot.rotation_euler[1] = -leg.rotation_euler[1] - knee.rotation_euler[1]
        for obj in [leg, knee, foot]:
            obj.keyframe_insert("rotation_euler", frame=frame)
    for i, (arm, elbow) in enumerate(arms):
        arm.rotation_euler[1] = -.20 * math.sin(phase + i * math.pi) if walk else -.05
        elbow.rotation_euler[1] = -.25
        for obj in [arm, elbow]:
            obj.keyframe_insert("rotation_euler", frame=frame)
    # Preserve a real support contact in every sampled pose, from sole geometry.
    bpy.context.view_layer.update()
    minimum_sole = min((sole.matrix_world @ Vector(corner)).z for sole in soles for corner in sole.bound_box)
    hip.location.z -= minimum_sole
    hip.keyframe_insert("location", frame=frame)

bpy.ops.object.camera_add(location=(0, -7, 1.05))
camera = bpy.context.object
camera.rotation_euler = (Vector((0, 0, 1.05)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera.data.type = "ORTHO"
camera.data.ortho_scale = 2.60
scene.camera = camera
scene.frame_start, scene.frame_end = 1, 25
scene.frame_set(1)
# Save a useful ordinary material-preview viewport and an editable source before overrides.
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type == 'VIEW_3D':
            area.spaces.active.region_3d.view_distance = 3.6
            area.spaces.active.region_3d.view_location = (0, 0, 1)
            area.spaces.active.shading.type = 'MATERIAL'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / "penitent-proof-v01.blend"))

normal = bpy.data.materials.new("WORLD normals: X, Z, -Y encoded linearly")
normal.use_nodes = True
n, links = normal.node_tree.nodes, normal.node_tree.links
n.clear()
geo, sep, comb = n.new("ShaderNodeNewGeometry"), n.new("ShaderNodeSeparateXYZ"), n.new("ShaderNodeCombineXYZ")
unit = n.new("ShaderNodeVectorMath")
unit.operation = 'NORMALIZE'
links.new(geo.outputs["Normal"], unit.inputs[0])
links.new(unit.outputs[0], sep.inputs[0])
for src, dest, scale in [("X", "X", .5), ("Z", "Y", .5), ("Y", "Z", -.5)]:
    mathnode = n.new("ShaderNodeMath")
    mathnode.operation = 'MULTIPLY_ADD'
    mathnode.inputs[1].default_value = scale
    mathnode.inputs[2].default_value = .5
    links.new(sep.outputs[src], mathnode.inputs[0])
    links.new(mathnode.outputs[0], comb.inputs[dest])
emit, output = n.new("ShaderNodeEmission"), n.new("ShaderNodeOutputMaterial")
links.new(comb.outputs[0], emit.inputs[0])
links.new(emit.outputs[0], output.inputs['Surface'])

frames = list(range(33, 65, 4)) + list(range(1, 25, 2))
# Blender bundles Python but not Pillow; assemble RGBA atlas through bpy image pixels.
for pass_name in ['albedo', 'normal']:
    scene.view_layers[0].material_override = normal if pass_name == 'normal' else None
    scene.view_settings.view_transform = 'Raw' if pass_name == 'normal' else 'Standard'
    width, height, cols = 192, 256, 5
    atlas = bpy.data.images.new(pass_name + '-atlas', width=width * cols, height=height * 4, alpha=True)
    atlas.colorspace_settings.name = 'Non-Color' if pass_name == 'normal' else 'sRGB'
    pixels = [0.0] * (width * height * 20 * 4)
    for index, frame in enumerate(frames):
        scene.frame_set(frame)
        scene.render.filepath = str(OUT / '_frame.png')
        bpy.ops.render.render(write_still=True)
        img = bpy.data.images.load(scene.render.filepath, check_existing=False)
        if pass_name == 'normal':
            img.colorspace_settings.name = 'Non-Color'
        source = list(img.pixels[:])
        # bpy pixels are bottom-up, PNG rows are top-down. Runtime index zero is top-left.
        ox, oy = (index % cols) * width, (3 - index // cols) * height
        for row in range(height):
            dest = ((oy + row) * width * cols + ox) * 4
            pixels[dest:dest + width * 4] = source[row * width * 4:(row + 1) * width * 4]
        bpy.data.images.remove(img)
    atlas.pixels.foreach_set(pixels)
    atlas.filepath_raw = str(OUT / (pass_name + '.png'))
    atlas.file_format = 'PNG'
    atlas.save()
    bpy.data.images.remove(atlas)
(OUT / '_frame.png').unlink(missing_ok=True)
manifest = {
    'version': 1, 'source': 'penitent-proof-v01.blend', 'generator': 'tools/export_sprites.py',
    'blender_version': bpy.app.version_string,
    'albedo': 'albedo.png', 'normal': 'normal.png', 'columns': 5, 'rows': 4,
    'frame_size': [192, 256], 'world_size': [1.95, 2.60], 'pivot': [.5, .09615385],
    'normal_basis': 'world: X right, Y up, Z toward camera; linear RGB [-1,1] to [0,1]',
    'root_motion': False, 'source_fps': 32,
    'clips': {
        'idle': {'start': 0, 'count': 8, 'fps': 8, 'source_range': [33, 65], 'duration_seconds': 1.0, 'loop': True},
        'walk': {'start': 8, 'count': 12, 'fps': 16, 'source_range': [1, 25], 'duration_seconds': .75, 'loop': True}
    },
    'status': 'Simple technical proxy informed by VIS02; not an approved final character model.'
}
(OUT / 'sprite.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print('RUSTED_EXPORT_COMPLETE ' + str(OUT))
