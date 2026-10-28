# Isometric construction and rendering

This research governs the Cook renderer and future asset revisions. It does not establish that the current art matches the supplied references. Projection errors, artwork inconsistencies and game logic are different problems and need different validators.

## Projection and the asset camera

Pixel-art games commonly use a 2:1 diamond rather than the 30-degree ground edges of mathematical isometry. Raymond Schlitter builds objects from cuboids on a two-pixel-horizontal, one-pixel-vertical grid, including character construction guides. He also cautions against mixing detailed textures with simpler styles. For this game, keep the established 60×30 floor tile and vertical uprights. Do not scale distant furniture smaller. [Pixelblog 41](https://www.slynyrd.com/blog/2022/11/28/pixelblog-41-isometric-pixel-art).

Clint Bellanger derives forward and inverse tile transforms. Cook now owns those transforms in `src/isometric.ts`: screen X is origin X plus `(x-y)*30`; screen Y is origin Y plus `(x+y)*15` minus elevation. Picking reverses the same transform at the target surface height. A tabletop is not a tall screen-aligned rectangle extending above its chair. [Isometric Tiles Math](https://clintbellanger.net/articles/isometric_math/).

For a future model-rendered sprite pipeline, Bellanger uses an orthographic camera, a 60-degree X rotation and 45-degree Z rotation to obtain a 2:1 tile. Uniform orthographic scale and shared lighting are essential; export transparent imagery with room for tall silhouettes. His Blender UI instructions target version 2.6, so use the geometric setup rather than treating the old UI steps as current. A footprint guide must fit the render before detail is added. [Isometric Tiles in Blender](https://clintbellanger.net/articles/isometric_tiles/).

## Anchors, footprints and artwork

Tiled separates object alignment, drawing offset, atlas rectangles and collision geometry. Isometric objects default to bottom-centre alignment, but that default is not necessarily the centre of a projecting table's feet. Store the intended floor contact independently of transparent image margins. Atlas cropping must preserve complete silhouettes; changing a crop must not change an object's world position. [Working with Objects](https://doc.mapeditor.org/en/stable/manual/objects/) and [Editing Tilesets](https://doc.mapeditor.org/en/stable/manual/editing-tilesets/).

Cook's `TileProp` specifies a tile centre, footprint, visual width and floor anchor. This round uses those footprints for projected contact shadows and draw-order constraints. Earlier screen-aligned elliptical shadows could contradict long rectangular props. Sprite floor anchors are still individually calibrated values; no code formula can prove that the painted feet or tabletop corners are correct.

Asset authoring sequence:

1. Draw the footprint and vertical bounding prism on the 2:1 guide.
2. Establish floor contact, tabletop/seat height and the front-facing direction.
3. Construct the silhouette, then material detail and consistent lighting.
4. Compare it beside the same scale reference actor and existing furniture.
5. Export complete silhouettes with gutters and a fixed anchor. Preview every animation direction and both ends of modular runs.
6. Check at normal camera scale before accepting close-up detail. Mirroring also mirrors baked lighting and asymmetric details; it is only an approximation when a separate direction has not been authored.

These are project decisions informed by the sources, not a claim that generated imagery automatically satisfies them. The current independently generated sheets have not been rebuilt from one orthographic model scene, so exact angle and lighting agreement remains a visual limitation.

## Occlusion

Godot's Y-sorting orders objects by their origin and can keep children together as one unit. This is appropriate for compact sprites with correct floor origins. It does not make a centre-only sort correct for arbitrary large footprints. [CanvasItem](https://docs.godotengine.org/en/stable/classes/class_canvasitem.html).

Shaun LeBron explains the more general case: test projected prism overlap, determine which separated world-space bounds are behind, and draw in dependency order. Cyclic overlaps require splitting artwork or clipping; no scalar depth value solves every arrangement. Cook's new `src/depth.ts` applies footprint constraints to overlapping silhouettes, with stable centre order for intersecting bounds or cycles. The restaurant's counters remain tile-sized modules so they can sort independently. A regression covers a guest behind a long prop's rear corner and in front of its near corner; the previous centre-only rule reverses both cases. [Drawing isometric boxes in the correct order](https://shaunlebron.github.io/IsometricBlocks/).

Painted silhouettes can extend beyond their logical footprint. A bounding prism is conservative, not a per-pixel intersection solver. Keep attached dishes with their table, and preserve explicit ordering for objects that share the same surface. A future intertwining structure must be split into independently sorted parts rather than patched with a large arbitrary depth offset.

## Tiles, collision and navigation

Godot distinguishes tile imagery from physics, navigation and occlusion shapes. A visual tile can overhang its floor cell; a collision shape should describe the occupied ground. Image margins, atlas separation and texture padding address different sampling issues. [Using TileSets](https://docs.godotengine.org/en/stable/tutorials/2d/using_tilesets.html).

Cook retains its existing tile-based routes and collision rules. This round does not change service lanes or occupied furniture cells. Material textures remain projected onto the floor and wall planes, rather than used as whole-scene pictures. Their actual repetition must be reviewed in assembled runs; a prompt requesting seamless texture is not proof of seamless output.

## Applied changes and verification

- Shared projection and inverse projection now define elevated tabletop picking.
- Floor-prop shadows follow their rectangular world footprints.
- Tables, chairs, counters and fixtures provide their footprints to occlusion ordering.
- Regression checks cover long-object corner ordering and independent known projection coordinates.
- Existing browser checks exercise service, prepared-food picking under zoom, density changes, crop integrity and pause behavior.
- Actual restaurant playback is inspected at normal and zoomed scale. Passing geometry tests is not visual approval of the sprite artwork.
