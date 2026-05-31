# Build an Exhibit — Next Steps

## Current Status

Build an Exhibit has a working early MVP foundation: full-screen React/Three scene, Build-a-Booth-inspired UI, two-step welcome modal, right-side control panel, BM101 real booth wall model loading, BM Counter loading separately as an included controllable accessory, app-controlled carpet/flooring, all 20 MVP booth options in config, and browser-only graphic upload/crop previews.

The current BM101 backwall graphic and BM Counter graphic textures display correctly. A basic performance pass has already been completed, and the carpet/flooring system now uses selectable texture swatches, meter-scale booth-size-based floor resizing, and a thin textured slab instead of a flat plane. The scene grid and gradient background have been refined to more closely match Build-a-Booth, real booth thumbnail images now appear in the welcome flow and right panel, uploaded JPG previews can replace the backwall and counter graphic materials, and the included counter can be moved/rotated with a canvas overlay.

## Active Priority

Next recommended work:

1. Plan optional furniture item support.
2. Then refine export/contact flow planning.
3. Then polish graphic upload UI based on real user testing.

## Immediate Next Task

Plan optional furniture item support without disrupting the current BM101/BM Counter material setup.

Optional furniture work should:

* start with a small set of furniture items
* support selecting, moving, rotating, and deleting user-added items
* prefer button-based movement controls for mobile reliability
* avoid changing the working BM101/BM Counter model setup
* keep the included counter non-deletable
* avoid changing the working flooring/carpet system
* preserve the working graphic upload/crop behavior

## Known Issues / Watch Items

* Monitor performance as more thumbnail and texture assets are added.
* All 20 booth options temporarily point to `/models/booths/bm101.glb` until final GLBs are prepared.
* Back Wall Graphic targets `MAT_graphic_backwall`, recommended 2000 x 1625 px.
* Counter Graphic targets `MAT_graphic_counter`, recommended 2000 x 2000 px.
* Graphic uploads are JPG only, max 2MB, browser-only, and not stored.
* Wrong-ratio graphics use the `react-easy-crop` modal before applying.
* Make sure carpet texture size/repeat does not create sluggishness.
* Counter placement movement step is 0.1 meter per click/tap.
* Counter placement rotation step is 15 degrees per click/tap.
* Counter collision detection and out-of-bounds limits are intentionally not implemented yet.
* Preserve the current practical scene scale: GLBs are meter-scale, so 10x10 flooring is 3.048 x 3.048 and 10x20 flooring is 6.096 x 3.048.
* Keep floor thickness at 0.0127 scene units unless the model export scale changes.
* Keep the larger Build-a-Booth-style grid below the floor slab, not intersecting the carpet.
* Keep the Three.js canvas transparent so the Build-a-Booth-style CSS radial gradient remains visible behind the scene.
* Do not break the working BM101/BM Counter material setup.
* Do not reset flooring when switching booth layouts.
* Make sure the counter stays separate from the booth wall model.
* Preserve the current desktop/mobile layout and orbit controls.
* Keep `MAT_graphic_backwall` and `MAT_graphic_counter` working.
* Keep flooring app-controlled; do not add a flooring GLB.

## Completed

* Foundation app shell
* Welcome modal
* Right panel
* Central booth data/config
* All 20 MVP booth config records: BM101-BM110 and BM201-BM210
* BM101 real model integration
* BM Counter separate accessory integration
* Material naming update
* Backwall graphic texture display
* Counter graphic texture display
* Included booth items shown in right panel
* Performance pass
* Carpet/flooring system
* Standard and premium carpet swatches
* 10x10 floor sizing at 3.048 x 3.048 meter-scale units
* 20x10 floor sizing at 6.096 x 3.048 meter-scale units
* Thin flooring slab with 0.0127 scene-unit thickness
* Carpet texture applied to slab top and visible sides
* Larger Build-a-Booth-style grid below the floor slab
* Build-a-Booth-matched radial gradient background
* Featured welcome size images
* Real booth thumbnails in welcome booth selection
* 5-column desktop welcome booth thumbnail grid
* 3-column right-panel booth thumbnail grid
* Backwall JPG upload and crop preview
* Counter JPG upload and crop preview
* 2MB JPG upload validation
* Small-image warning behavior
* Booth-layout changes clear uploaded graphics
* Included counter movement and rotation overlay controls
* Counter placement reset on booth layout change
* Flooring scale/bounds diagnostic logging
* Flooring persistence across booth layout and size changes
* `npm run lint` passing
* `npm run build` passing
