"""
Procedural chibi astronaut for the 3D Game Test project.

Builds the character matching the Nano Banana Pro reference sheet:
- Rounded white spacesuit (smooth shaded)
- Backpack life-support unit
- Chest control panel with colored buttons
- Helmet with a FLAT gray visor named 'Visor' (placeholder mesh
  for in-engine photo texture mapping)
- Chibi proportions: head + helmet ~ 40% of total height

Run inside Blender's Scripting workspace (Alt+P) or from CLI:
    blender --background --python tools/build_astronaut.py

Exports the model to:
    public/astronaut.glb
"""

import bpy
import math
import os

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
PROJECT_DIR = r"C:\Users\BRICKOUILLE\3d game test"
EXPORT_PATH = os.path.join(PROJECT_DIR, "public", "astronaut.glb")

SUIT_COLOR    = (0.95, 0.95, 0.94, 1.0)
ACCENT_COLOR  = (0.86, 0.86, 0.84, 1.0)
VISOR_COLOR   = (0.533, 0.533, 0.533, 1.0)  # #888888 — placeholder gray
PANEL_COLOR   = (0.18, 0.18, 0.20, 1.0)
SCREEN_COLOR  = (0.08, 0.10, 0.12, 1.0)

BUTTON_COLORS = [
    (0.89, 0.34, 0.34, 1.0),  # red
    (0.34, 0.75, 0.38, 1.0),  # green
    (0.29, 0.56, 0.86, 1.0),  # blue
    (0.90, 0.73, 0.26, 1.0),  # yellow
]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def make_material(name, color, roughness=0.55, metallic=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    bsdf = nt.nodes.new(type="ShaderNodeBsdfPrincipled")
    out = nt.nodes.new(type="ShaderNodeOutputMaterial")
    out.location = (300, 0)
    nt.links.new(bsdf.outputs[0], out.inputs[0])
    bsdf.inputs["Base Color"].default_value = color
    if "Roughness" in bsdf.inputs:
        bsdf.inputs["Roughness"].default_value = roughness
    if "Metallic" in bsdf.inputs:
        bsdf.inputs["Metallic"].default_value = metallic
    return mat


def smooth_shade(obj, levels=2):
    """Add Subdivision Surface + smooth shading to round out a cube."""
    for poly in obj.data.polygons:
        poly.use_smooth = True
    mod = obj.modifiers.new(name="Subsurf", type="SUBSURF")
    mod.levels = levels
    mod.render_levels = levels


def bevel(obj, width=0.04, segments=4):
    mod = obj.modifiers.new(name="Bevel", type="BEVEL")
    mod.width = width
    mod.segments = segments
    mod.limit_method = "ANGLE"


def set_material(obj, mat):
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        for b in list(block):
            if b.users == 0:
                block.remove(b)


# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------
def build():
    clear_scene()

    suit_mat   = make_material("Suit",   SUIT_COLOR)
    accent_mat = make_material("Accent", ACCENT_COLOR)
    visor_mat  = make_material("VisorMat", VISOR_COLOR, roughness=0.95)
    panel_mat  = make_material("Panel",  PANEL_COLOR, roughness=0.4)
    screen_mat = make_material("Screen", SCREEN_COLOR, roughness=0.2)

    # --- Helmet ----------------------------------------------------------
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.42, location=(0, 0, 1.32))
    helmet = bpy.context.object
    helmet.name = "Helmet"
    bpy.ops.object.shade_smooth()
    set_material(helmet, suit_mat)

    # Visor — flat plane slightly in front of helmet sphere.
    # Named 'Visor' so the Three.js code can grab it by name and swap its
    # texture with the player's photo at runtime.
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0.415, 1.32))
    visor = bpy.context.object
    visor.name = "Visor"
    visor.rotation_euler = (math.pi / 2, 0, 0)
    visor.scale = (0.52, 0.36, 1.0)
    set_material(visor, visor_mat)

    # Visor frame — slightly larger rectangle behind to give a clean border
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0.41, 1.32))
    frame = bpy.context.object
    frame.name = "VisorFrame"
    frame.scale = (0.58, 0.005, 0.42)
    bevel(frame, width=0.015, segments=3)
    smooth_shade(frame, levels=1)
    set_material(frame, accent_mat)

    # Ear pieces on the side of the helmet
    for x, name in [(-0.42, "EarL"), (0.42, "EarR")]:
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.08, location=(x, 0.0, 1.27))
        ear = bpy.context.object
        ear.name = name
        bpy.ops.object.shade_smooth()
        set_material(ear, accent_mat)

    # --- Torso -----------------------------------------------------------
    # Build a rounded "potato" torso: cube + heavy subsurf + scale
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.78))
    torso = bpy.context.object
    torso.name = "Torso"
    torso.scale = (0.72, 0.66, 0.74)
    bevel(torso, width=0.18, segments=6)
    smooth_shade(torso, levels=2)
    set_material(torso, suit_mat)

    # Belt (small darker accent at the waist)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.48))
    belt = bpy.context.object
    belt.name = "Belt"
    belt.scale = (0.74, 0.68, 0.05)
    bevel(belt, width=0.02, segments=3)
    smooth_shade(belt, levels=1)
    set_material(belt, accent_mat)

    # --- Chest control panel --------------------------------------------
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.35, 0.78))
    panel = bpy.context.object
    panel.name = "ChestPanel"
    panel.scale = (0.24, 0.03, 0.14)
    bevel(panel, width=0.015, segments=3)
    set_material(panel, panel_mat)

    # Tiny screen
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.08, 0.367, 0.80))
    screen = bpy.context.object
    screen.name = "PanelScreen"
    screen.scale = (0.08, 0.005, 0.06)
    set_material(screen, screen_mat)

    # 4 colored buttons in a 2x2 grid on the right side of the panel
    for i, col in enumerate(BUTTON_COLORS):
        cx = 0.04 + (i % 2) * 0.05
        cz = 0.81 - (i // 2) * 0.05
        mat = make_material(f"Btn_{i}", col, roughness=0.35)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.018, location=(cx, 0.37, cz))
        btn = bpy.context.object
        btn.name = f"PanelBtn_{i}"
        bpy.ops.object.shade_smooth()
        set_material(btn, mat)

    # --- Backpack --------------------------------------------------------
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.36, 0.82))
    backpack = bpy.context.object
    backpack.name = "Backpack"
    backpack.scale = (0.5, 0.18, 0.48)
    bevel(backpack, width=0.06, segments=4)
    smooth_shade(backpack, levels=1)
    set_material(backpack, accent_mat)

    # --- Arms ------------------------------------------------------------
    arm_geom = [(-0.5, "ArmL"), (0.5, "ArmR")]
    for x, name in arm_geom:
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.16, location=(x, 0, 0.78))
        arm = bpy.context.object
        arm.name = name
        arm.scale = (0.7, 0.7, 1.5)
        bpy.ops.object.shade_smooth()
        set_material(arm, suit_mat)

    # --- Gloves ----------------------------------------------------------
    for x, name in [(-0.5, "GloveL"), (0.5, "GloveR")]:
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.13, location=(x, 0, 0.5))
        glove = bpy.context.object
        glove.name = name
        bpy.ops.object.shade_smooth()
        set_material(glove, accent_mat)

    # --- Legs ------------------------------------------------------------
    for x, name in [(-0.18, "LegL"), (0.18, "LegR")]:
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.16, location=(x, 0, 0.25))
        leg = bpy.context.object
        leg.name = name
        leg.scale = (0.85, 0.85, 1.25)
        bpy.ops.object.shade_smooth()
        set_material(leg, suit_mat)

    # --- Boots -----------------------------------------------------------
    for x, name in [(-0.18, "BootL"), (0.18, "BootR")]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x, 0.03, 0.07))
        boot = bpy.context.object
        boot.name = name
        boot.scale = (0.18, 0.26, 0.12)
        bevel(boot, width=0.04, segments=4)
        smooth_shade(boot, levels=1)
        set_material(boot, accent_mat)

    # --- Parent everything to an empty for clean GLB hierarchy ----------
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0, 0, 0))
    root = bpy.context.object
    root.name = "Astronaut"

    for obj in bpy.data.objects:
        if obj.type == "MESH" and obj.parent is None:
            obj.parent = root
            obj.matrix_parent_inverse = root.matrix_world.inverted()

    # Lighting + camera so the viewport looks decent when the script runs
    bpy.ops.object.light_add(type="SUN", location=(4, -6, 8))
    bpy.context.object.data.energy = 3.0
    bpy.ops.object.light_add(type="AREA", location=(-3, -4, 4))
    bpy.context.object.data.energy = 100
    bpy.context.object.data.size = 4

    bpy.ops.object.camera_add(location=(2.5, -3.5, 1.6),
                               rotation=(math.radians(78), 0, math.radians(35)))
    bpy.context.scene.camera = bpy.context.object

    return root


# ---------------------------------------------------------------------------
# Export
# ---------------------------------------------------------------------------
def export_glb(root):
    os.makedirs(os.path.dirname(EXPORT_PATH), exist_ok=True)

    bpy.ops.object.select_all(action="DESELECT")
    root.select_set(True)
    for obj in bpy.data.objects:
        if obj.type == "MESH":
            obj.select_set(True)
    bpy.context.view_layer.objects.active = root

    bpy.ops.export_scene.gltf(
        filepath=EXPORT_PATH,
        export_format="GLB",
        use_selection=True,
        export_apply=True,         # apply modifiers (subsurf, bevel) on export
        export_yup=True,           # Three.js expects Y up
    )
    print(f"[astronaut] Exported to {EXPORT_PATH}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    root = build()
    export_glb(root)
