# Converte um FBX do jogo em GLB leve para o visualizador do card (texturas a 1K, JPEG).
# Uso: blender -b --python-exit-code 1 --python para_glb.py -- <fbx> <glb> [cor.png] [normal.png]
import bpy, sys
from pathlib import Path
a = sys.argv[sys.argv.index("--") + 1:]
fbx, glb = a[0], a[1]
cor = a[2] if len(a) > 2 else None
normal = a[3] if len(a) > 3 else None
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=fbx)
import re
# Só o LOD0: os LODs 1 e 2 ocupam o mesmo lugar e apareceriam sobrepostos.
for o in [o for o in bpy.context.scene.objects if o.type == "MESH" and re.search(r"_LOD[1-9]$", o.name)]:
    bpy.data.objects.remove(o, do_unlink=True)
malhas = [o for o in bpy.context.scene.objects if o.type == "MESH"]

def imagem(caminho, nao_cor):
    im = bpy.data.images.load(caminho)
    if max(im.size) > 1024:
        im.scale(1024, 1024)
    if nao_cor:
        im.colorspace_settings.name = "Non-Color"
    return im

if cor:
    m = bpy.data.materials.new("Material")
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    bsdf.inputs["Roughness"].default_value = 0.85
    t = nt.nodes.new("ShaderNodeTexImage"); t.image = imagem(cor, False)
    nt.links.new(t.outputs["Color"], bsdf.inputs["Base Color"])
    if normal:
        n = nt.nodes.new("ShaderNodeTexImage"); n.image = imagem(normal, True)
        nm = nt.nodes.new("ShaderNodeNormalMap")
        nt.links.new(n.outputs["Color"], nm.inputs["Color"])
        nt.links.new(nm.outputs["Normal"], bsdf.inputs["Normal"])
    # A peça "_Time" recebe a cor do time no jogo; aqui fica no verde do jogador (A1).
    time = bpy.data.materials.new("Time")
    time.use_nodes = True
    time.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.09, 0.42, 0.12, 1)
    for o in malhas:
        o.data.materials.clear()
        o.data.materials.append(time if "_Time" in o.name else m)

else:
    # Sem textura: a cor do FBX é sRGB (como a Unity lê); o glTF espera linear.
    for mat in bpy.data.materials:
        b = mat.node_tree.nodes.get("Principled BSDF") if mat.use_nodes else None
        if b:
            c = b.inputs["Base Color"].default_value
            b.inputs["Base Color"].default_value = (*(x ** 2.2 for x in c[:3]), c[3])

acoes = [x.name for x in bpy.data.actions]
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in malhas)
mats = sorted({s.material.name for o in malhas for s in o.material_slots if s.material})
bpy.ops.export_scene.gltf(filepath=glb, export_format="GLB", export_image_format="JPEG", export_jpeg_quality=82,
                          export_animations=True, export_animation_mode="ACTIONS", export_apply=True)
print(f"RESULTADO {Path(glb).name} malhas={len(malhas)} tris={tris} mats={mats} acoes={acoes} bytes={Path(glb).stat().st_size}")
