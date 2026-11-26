"""Headless Blender starter: 3-point studio lighting, transparent background, orbit camera.

Run (Blender's own Python, not the venv):

  blender -b -P scripts/render_blender_scene.py -- --out assets/3d-renders/orbit --frames 60
  blender -b -P scripts/render_blender_scene.py -- --model assets/3d-renders/phone.glb --frames 90 --res 1080 1920

Without --model it builds a placeholder (rounded "phone" slab with an emissive screen),
so you can see the rig working. Renders PNG frames with alpha (film_transparent) to
<out>_####.png. Composite them in Remotion with <Img>/<OffthreadVideo>, or make a
ProRes 4444 / WebM-alpha clip:

  ffmpeg -framerate 30 -i assets/3d-renders/orbit_%04d.png -c:v prores_ks -profile:v 4444 -pix_fmt yuva444p10le orbit.mov

Engine: Cycles on CPU by default (works on servers without a GPU). --engine EEVEE is
faster on a desktop with a GPU.
"""
import argparse, math, os, sys

import bpy

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument("--model", help=".glb/.gltf/.fbx/.obj to import (else a placeholder phone)")
ap.add_argument("--out", default="assets/3d-renders/orbit")
ap.add_argument("--frames", type=int, default=60)
ap.add_argument("--fps", type=int, default=30)
ap.add_argument("--res", type=int, nargs=2, default=[1080, 1920])
ap.add_argument("--samples", type=int, default=48)
ap.add_argument("--engine", default="CYCLES", choices=["CYCLES", "EEVEE", "BLENDER_EEVEE"])
ap.add_argument("--orbit", type=float, default=50, help="degrees of camera orbit over the clip")
a = ap.parse_args(argv)

# ---- clean scene ----
bpy.ops.wm.read_factory_settings(use_empty=True)
scn = bpy.context.scene
scn.render.engine = "BLENDER_EEVEE" if a.engine.startswith("EEVEE") or a.engine == "BLENDER_EEVEE" else "CYCLES"
if scn.render.engine == "CYCLES":
    scn.cycles.device = "CPU"
    scn.cycles.samples = a.samples
    # Denoise when this Blender build has OpenImageDenoise (distro builds often don't).
    try:
        scn.cycles.use_denoising = bpy.app.build_options.openimagedenoise
    except AttributeError:
        scn.cycles.use_denoising = False
scn.render.resolution_x, scn.render.resolution_y = a.res
scn.render.fps = a.fps
scn.frame_start, scn.frame_end = 1, a.frames
scn.render.film_transparent = True          # alpha background for compositing
scn.render.image_settings.file_format = "PNG"
scn.render.image_settings.color_mode = "RGBA"
scn.view_settings.view_transform = "AgX" if "AgX" in [v.identifier for v in type(scn.view_settings).bl_rna.properties["view_transform"].enum_items] else "Filmic"
world = bpy.data.worlds.new("World"); scn.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.02, 0.018, 0.016, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 0.6


def mat(name, color, rough=0.4, metal=0.0, emit=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    p = m.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = (*color, 1)
    p.inputs["Roughness"].default_value = rough
    p.inputs["Metallic"].default_value = metal
    if emit:
        key = "Emission Color" if "Emission Color" in p.inputs else "Emission"
        p.inputs[key].default_value = (*color, 1)
        p.inputs["Emission Strength"].default_value = emit
    return m


# ---- subject ----
target = bpy.data.objects.new("Target", None); scn.collection.objects.link(target)
if a.model:
    ext = os.path.splitext(a.model)[1].lower()
    {".glb": bpy.ops.import_scene.gltf, ".gltf": bpy.ops.import_scene.gltf,
     ".fbx": bpy.ops.import_scene.fbx, ".obj": bpy.ops.wm.obj_import}[ext](filepath=os.path.abspath(a.model))
else:
    bpy.ops.mesh.primitive_cube_add(size=1)
    body = bpy.context.object; body.name = "Phone"
    body.scale = (0.78, 0.08, 1.62)
    bev = body.modifiers.new("Bevel", "BEVEL"); bev.width = 0.12; bev.segments = 8
    body.data.materials.append(mat("Body", (0.12, 0.11, 0.14), 0.25, 0.8))
    bpy.ops.object.shade_smooth()
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, -0.081, 0), rotation=(math.pi / 2, 0, 0))
    scr = bpy.context.object; scr.scale = (0.72, 1.56, 1)
    scr.data.materials.append(mat("Screen", (0.83, 0.25, 0.0), 0.2, 0, emit=0.8))

# ---- 3-point lighting ----
def area(name, loc, energy, size, color):
    d = bpy.data.lights.new(name, "AREA"); d.energy = energy; d.size = size; d.color = color
    o = bpy.data.objects.new(name, d); o.location = loc; scn.collection.objects.link(o)
    c = o.constraints.new("TRACK_TO"); c.target = target; c.track_axis = "TRACK_NEGATIVE_Z"; c.up_axis = "UP_Y"
    return o

area("Key", (-3.0, -4.0, 3.0), 900, 3.0, (1.0, 0.95, 0.88))
area("Fill", (3.5, -3.0, 0.5), 250, 4.0, (0.75, 0.78, 1.0))
area("Rim", (0.5, 4.0, 3.0), 1200, 2.0, (1.0, 0.55, 0.25))

# ---- orbital camera rig: camera parented to a rotating empty ----
pivot = bpy.data.objects.new("Orbit", None); scn.collection.objects.link(pivot)
cam_d = bpy.data.cameras.new("Cam"); cam_d.lens = 50
cam = bpy.data.objects.new("Cam", cam_d); scn.collection.objects.link(cam)
cam.parent = pivot; cam.location = (0, -7.5, 0.6)
tc = cam.constraints.new("TRACK_TO"); tc.target = target; tc.track_axis = "TRACK_NEGATIVE_Z"; tc.up_axis = "UP_Y"
scn.camera = cam
half = math.radians(a.orbit) / 2
pivot.rotation_euler = (0, 0, -half); pivot.keyframe_insert("rotation_euler", frame=1)
pivot.rotation_euler = (0, 0, half); pivot.keyframe_insert("rotation_euler", frame=a.frames)
for fc in (pivot.animation_data.action.fcurves if pivot.animation_data else []):
    for kp in fc.keyframe_points:
        kp.interpolation = "BEZIER"; kp.easing = "EASE_IN_OUT"

out = os.path.abspath(a.out)
os.makedirs(os.path.dirname(out), exist_ok=True)
scn.render.filepath = out + "_"
bpy.ops.render.render(animation=True)
print("rendered", a.frames, "frames to", out + "_####.png")
