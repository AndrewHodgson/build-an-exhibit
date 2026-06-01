# Build an Exhibit — Project Notes

## Project Summary

Build an Exhibit is a SourceOne Events web app for configuring standard rental exhibit packages.

The app is similar in visual style and structure to the existing Build-a-Booth pipe-and-drape configurator, but this app is focused on BeMatrix rental exhibits.

This is a public-facing visual sales tool. It is not a full booth builder, not a quoting engine, and not a production artwork or preflight tool.

The intended purpose is to let exhibitors and SourceOne team members preview standard rental exhibit options, apply sample branded graphics, choose flooring, adjust included accessories, and eventually export a preview image or submit a follow-up request.

## Project Paths

Reference app:

`/Users/andrewhodgson/Documents/build-a-booth`

Current working app:

`/Users/andrewhodgson/Documents/Build an Exhibit`

Use Build-a-Booth only as a visual/layout/code reference unless the user explicitly asks otherwise. Do not modify the Build-a-Booth project from this workspace.

## Current Stack

* Vite
* React
* React Three Fiber
* Drei
* Three.js
* react-easy-crop
* jsPDF

Key files:

* `src/App.jsx` - main app state and shell
* `src/components/CanvasScene.jsx` - Three.js scene, GLB loading, floor/grid/camera/orbit, material texture swapping
* `src/components/RightPanel.jsx` - right-side panel and mobile drawer
* `src/components/WelcomeModal.jsx` - two-step start flow
* `src/components/CounterPlacementControls.jsx` - custom SVG counter controller overlay
* `src/components/CropModal.jsx` - fixed-aspect image crop workflow
* `src/components/SourceOneLogo.jsx` - reusable SourceOne SVG logo component
* `src/utils/exportPdf.js` - client-side booth summary PDF generator
* `src/utils/cropImage.js` - browser crop output helper
* `data/booths.js` - central booth/accessory config
* `data/flooring.js` - central carpet/flooring config
* `data/graphicZones.js` - central graphic upload zone config
* `src/index.css` - app styling, layout, responsive behavior, gradient background

## Current Asset Structure

Current real test GLBs:

* `public/models/booths/bm101.glb`
* `public/models/accessories/bm-counter.glb`

Current graphic/default texture assets:

* `public/textures/10x10_booths/bm101-texture.jpg`
* `public/textures/accessories/bm-counter-texture.jpg`
* `public/textures/carpet/*`

Current thumbnails and featured images:

* `public/thumbnails/booths/10x10/BM10x10_Featured.jpg`
* `public/thumbnails/booths/10x20/BM10x20_Featured.jpg`
* `public/thumbnails/booths/10x10/BM101-View-1_Thumbnail.jpg` through `BM110-View-1_Thumbnail.jpg`
* `public/thumbnails/booths/10x20/BM201-View-1_Thumbnail.jpg` through `BM210-View-1_Thumbnail.jpg`

Current UI assets:

* `public/images/SourceOne-Logo-RGB.svg`
* `public/controller.svg`

## MVP Scope

Current and near-term MVP scope:

1. Choose a 10x10 or 10x20 rental exhibit.
2. Choose a fixed BeMatrix rental exhibit layout.
3. View the booth in a polished 3D scene.
4. Select flooring/carpet.
5. Upload and crop a backwall graphic preview.
6. Upload and crop a counter graphic preview.
7. Select and adjust the included counter.
8. Eventually add optional furniture/accessories.
9. Export a first-pass booth summary PDF.
10. Eventually submit a follow-up request to SourceOne Exhibitor Services.

## Out Of Scope Until Requested

Do not add these unless specifically requested:

* real form submission
* email confirmation
* captcha
* final JPG export
* final polished proposal PDF
* database/storage
* WordPress deployment
* all 20 real booth models
* optional furniture system
* collision detection
* out-of-bounds movement limits
* physics
* pricing
* user accounts
* production artwork validation

## Booth Naming And Config

There is no BM100 or BM200.

10x10 booths:

* BeMatrix Rental Exhibit 101 through BeMatrix Rental Exhibit 110
* codes BM101 through BM110

10x20 booths:

* BeMatrix Rental Exhibit 201 through BeMatrix Rental Exhibit 210
* codes BM201 through BM210

Current config:

* `data/booths.js` creates all 20 MVP booth records.
* All booth records temporarily point to `/models/booths/bm101.glb`.
* All booth records currently include the same included counter accessory.
* All booth records currently use real thumbnail paths.
* Template paths still exist in config as placeholders, but the current UI uses upload/crop rather than template downloads.

Important temporary assumption:

* BM101 is the only real booth wall GLB currently integrated.
* BM101 is used as the temporary model for BM102-BM110 and BM201-BM210 until final layout-specific GLBs are prepared.

## Welcome Flow

The app uses a two-step welcome modal.

Step 1:

* Choose 10 x 10 Rental Exhibits or 10 x 20 Rental Exhibits.
* Size cards use featured images from `public/thumbnails/booths`.
* Featured images are shown uncropped with `object-fit: contain`.

Step 2:

* Choose a specific booth layout for the selected size.
* Desktop booth grid is 5 columns.
* Mobile booth grid is 2 columns.
* Booth cards show thumbnail plus booth name.
* A Back button returns to size selection.

After a booth is selected:

* The modal closes.
* The main configurator remains available.
* Changing booth size/layout later is done from the right panel.

## Right Panel

Header branding uses:

`public/images/SourceOne-Logo-RGB.svg`

Current section order:

1. Booth Selection
2. Booth Details
3. Graphics
4. Furniture
5. Carpet & Flooring
6. Export
7. Contact SourceOne

Accordion behavior:

* `Booth Selection` is open by default.
* At most one section can be open at a time.
* Opening a closed section closes the previously open section.
* Clicking the currently open section collapses it.
* Zero open sections is allowed.

Current section status:

* Booth Selection is wired to size/layout state.
* Booth Details shows code, size, type, description, and included items.
* Graphics is wired to backwall/counter JPG or PNG upload and crop behavior.
* Furniture is placeholder-only.
* Carpet & Flooring is wired to flooring swatches.
* Export creates a first-pass booth summary PDF.
* Contact SourceOne is placeholder-only.

Mobile behavior:

* Mobile uses a top bar with the SourceOne SVG logo and Configure button.
* The right panel becomes a full-screen drawer.
* The drawer has a Close button.

## Graphic Upload And Crop

Graphic zones live in:

`data/graphicZones.js`

Current zones:

* Back Wall Graphic
  * target material: `MAT_graphic_backwall`
  * recommendation: `2000 × 1625 px`
  * aspect ratio: `2000 / 1625`
* Counter Graphic
  * target material: `MAT_graphic_counter`
  * recommendation: `1000 × 1000 px`
  * aspect ratio: `1 / 1`

Upload constraints:

* JPG/JPEG or PNG only
* max 4 MB per graphic
* browser-only preview
* no database
* no permanent storage

Current behavior:

* Files that are not JPG/JPEG or PNG are rejected.
* Files over 4 MB are rejected.
* Smaller-than-recommended images are allowed with a warning.
* Correct-ratio images apply directly.
* Wrong-ratio images open `CropModal`.
* Crop uses `react-easy-crop`.
* Cropped output is generated in-browser as a JPG blob URL.
* Changing booth size/layout clears uploaded graphics.
* Changing flooring does not clear uploaded graphics.
* Default GLB material textures remain visible until replaced by user uploads.

Material handling:

* GLB materials are preserved by default.
* The app only swaps maps on targeted material names.
* Do not globally override all GLB materials or textures.

## Material Naming Standards

BM101 booth wall:

* `MAT_structure_metal`
* `MAT_structure_panels`
* `MAT_graphic_backwall`

BM Counter:

* `MAT_structure_metal`
* `MAT_structure_panels`
* `MAT_graphic_counter`

Graphic-specific materials:

* `MAT_graphic_backwall`
* `MAT_graphic_counter`

Expected object naming direction:

* booth objects should be booth-specific, such as `BM101_structure_panels`
* counter objects should be accessory-specific, such as `BM_counter_graphic_front`
* material names should remain shared and predictable

## 3D Scene

Scene component:

`src/components/CanvasScene.jsx`

Current behavior:

* Loads the selected booth wall GLB.
* Loads included accessories separately from the booth wall.
* Loads BM Counter as a separate included accessory.
* Uses fallback placeholder booth geometry only if the booth GLB is empty or fails.
* Uses a transparent Three.js canvas over a CSS radial gradient.
* Uses a larger scene grid under the floor slab.
* Uses OrbitControls with pan disabled.
* Uses separate desktop/mobile camera positions.

Current camera/grid/environment:

* Camera target: `[0, 1, 0]`
* Desktop camera position: `[2.2, 2.25, 7.5]`
* Mobile camera position: `[2.7, 2.4, 9.6]`
* Grid size: `12`
* Grid divisions: `24`
* Grid colors: `#cbd5e1` and `#e2e8f0`
* Grid Y: `-0.0187`

Scale:

* The app/model scale is treated as meters.
* 10x10 floor size is `3.048 × 3.048`.
* 10x20 floor size is `6.096 × 3.048`.
* Floor thickness is `0.0127`, equal to 0.5 inches.

## Flooring And Carpet

Flooring config lives in:

`data/flooring.js`

Current carpet texture folder:

`public/textures/carpet`

Current behavior:

* Flooring is app-controlled, not a GLB.
* The floor is a thin Three.js box/slab, not a plane.
* The floor receives shadows.
* Selected carpet texture is applied to top, bottom, and visible sides.
* 10x10 repeat is effectively `1 × 1`.
* 10x20 repeat is effectively `2 × 1`.
* Texture clones are used so repeat/wrapping settings do not mutate shared loaded textures.
* Flooring selection persists when switching booth layouts and booth sizes.
* Switching booth size resizes the floor but keeps the selected flooring option.

Current flooring categories:

* Standard Carpet
* Premium Carpet & Flooring

Default flooring:

* `silver-dollar`

## Included Counter Accessory

The counter is an included accessory from a user/business standpoint, but technically it is separate from the booth wall GLB.

Counter config:

* id: `included-bm-counter`
* model path: `/models/accessories/bm-counter.glb`
* default position: `[0, 0, 0.30]`
* default rotation: `[0, 0, 0]`
* movement step: `0.1` meter
* rotation step: `15` degrees

Current behavior:

* The counter loads automatically with the selected booth.
* The counter can be selected directly in the 3D scene.
* Clicking/tapping empty canvas deselects the counter.
* The controller appears only when the counter is selected.
* The counter cannot be deleted.
* Collision detection is not implemented.
* Out-of-bounds limits are not implemented.
* Booth wall, flooring, and multi-select are not selectable.

Pivot/outline behavior:

* Counter placement uses an outer movable group for position.
* Counter rotation uses an inner centered pivot group.
* The pivot group is placed at the loaded counter bounds center on X/Z.
* The visible GLB is offset back inside the pivot group so existing placement values stay stable.
* Rotation is around the vertical Y axis.
* The orange selected outline is a single padded object-level bounding box.
* The outline is attached to the same centered pivot group and rotates with the counter.

## Custom SVG Controller

Controller asset:

`public/controller.svg`

Component:

`src/components/CounterPlacementControls.jsx`

Current behavior:

* Rendered as an image with transparent HTML button hit regions.
* Hidden until the included counter is selected.
* Centered near the bottom of the canvas.
* Desktop width: `clamp(150px, 13vw, 190px)`.
* Mobile width: `clamp(160px, 48vw, 210px)`.
* Uses a soft drop shadow.
* Pointer events are stopped so controller taps do not orbit the scene.

Control mapping:

* Left arrow moves left.
* Right arrow moves right.
* Upper-left rotate arrow rotates counterclockwise.
* Upper-right rotate arrow rotates clockwise.
* Reset calls the existing counter reset function.
* The visual up/down movement mapping has been reversed to feel correct:
  * visual up button calls back movement
  * visual down button calls forward movement

## Header And Branding

Current logo component:

`src/components/SourceOneLogo.jsx`

Current logo asset:

`public/images/SourceOne-Logo-RGB.svg`

Used in:

* welcome modal header
* mobile top bar
* right panel header

## PDF Export

The app has a first-pass client-side PDF export.

PDF utility:

`src/utils/exportPdf.js`

Library:

`jsPDF`

Current export entry point:

* The Export section in `src/components/RightPanel.jsx`.
* The export action is coordinated in `src/App.jsx`.
* `src/components/CanvasScene.jsx` exposes an imperative `capturePresetViews()` API through a ref.

Captured views:

1. Perspective
2. Front
3. Top

Current PDF contents:

* SourceOne Events logo in the top-left header, using `public/images/SourceOne-Logo-RGB.svg`
* large perspective view image on the left
* smaller front view image on the right top
* smaller top view image on the right bottom
* booth name
* booth code
* booth description
* booth size
* booth type
* carpet/flooring selection
* included accessories
* backwall graphic status, uploaded or default
* counter graphic status, uploaded or default
* additional furniture, currently None

Export behavior:

* Uses the current booth, flooring, included counter placement, and uploaded graphic textures.
* Temporarily hides the custom SVG controller and orange selected outline from captured images.
* Temporarily hides the Three.js scene grid from captured images.
* Temporarily moves the existing Three.js camera through preset export views.
* Temporarily uses a plain white export clear background so the normal CSS gradient is not part of exported images.
* Captures from the visible WebGL canvas so export uses the same renderer color/tone-mapping/output path as normal app rendering.
* Does not resize or restyle the live R3F canvas during capture.
* Updates the camera aspect to the actual visible canvas drawing-buffer aspect before rendering each export view.
* Each captured image stores its actual pixel width/height.
* PDF image placement uses `fitImageContain()` with the stored capture dimensions instead of stretching images to fixed box dimensions.
* Hides grid helpers imperatively during capture as a fallback in addition to the React export-mode grid toggle.
* Restores the user's camera position, camera orientation, camera up vector, OrbitControls target, and normal clear background after capture.
* Does not change the normal app gradient, grid, camera controls, model placement, or material setup.
* The PDF is designed as a one-page, portrait, letter-size 8.5 x 11 layout.
* 10x10 and 10x20 use separate export camera presets; 10x10 presets are tighter and 10x20 presets pull back enough to fit the wider booth/floor.
* Images are placed into the PDF with contain-style sizing to avoid cropping wide views.
* PDF image placement uses reduced inner padding so captures sit larger inside their bordered frames.

Known export limitations:

* This is a first working PDF, not a final proposal template.
* No server storage or email flow exists.
* No PDF export gating or form workflow exists.
* Export capture resolution currently depends on the visible canvas drawing-buffer size and DPR cap.
* Mobile portrait exports preserve aspect ratio, but the portrait canvas can create larger margins inside the landscape-oriented PDF image boxes. Desktop or tablet-width export gives the best current PDF composition.
* Optional furniture is not included yet because optional furniture does not exist yet.
* The logo SVG is converted to a PNG data URL in the browser before insertion into the PDF for compatibility.
* Prior image squishing/darkness came from the export render path, not PDF placement. The offscreen render target readback could differ from the live renderer color/output path, and earlier live-canvas resizing allowed CSS canvas size, R3F internal size, device pixel ratio, and manual camera aspect to disagree. Export now captures the visible canvas without resizing it and uses explicit-dimension contain-fit PDF placement.

## Performance Settings

Current performance-related settings:

* Canvas DPR capped with `dpr={[1, 1.5]}`.
* `frameloop="demand"` is enabled.
* WebGL context uses `powerPreference: 'high-performance'`.
* Canvas alpha is enabled and clear alpha is set to 0.
* GLB scene cloning has been avoided.
* GLB materials are preserved by default.
* Shadows are reduced: accessory models can cast shadows; GLB meshes do not all receive shadows.
* Flooring texture clones are disposed on cleanup.
* Uploaded textures are disposed/revoked when replaced or cleared.
* GLB and flooring textures are preloaded.
* PDF export captures preset views on demand and restores the live camera afterward.

## Current Known Limitations

* All booth options temporarily use BM101 model geometry.
* Real BM102-BM110 and BM201-BM210 GLBs are not integrated yet.
* Optional furniture has not been implemented.
* Counter/furniture bounds limits are not implemented.
* Collision detection is not implemented.
* Final JPG export workflow is not implemented.
* PDF export exists only as a first-pass booth summary.
* Contact/follow-up form is not implemented.
* No database or storage exists.
* No production artwork validation exists.
* Continued mobile testing is needed as controls and assets evolve.
* Controller/outline behavior should be monitored as more selectable accessories are added.

## Deployment Direction

The app will eventually be hosted on the main SourceOne Events website.

Current deployment assumptions:

* Develop locally first.
* Build as a standalone app.
* No Vercel.
* No subdomain.
* Not embedded directly inside the WordPress theme.
* Likely deployed similarly to Build-a-Booth.
* Need to confirm the existing Build-a-Booth deployment/update process.

## Guardrails For Future Codex Work

Only work inside:

`/Users/andrewhodgson/Documents/Build an Exhibit`

Do not modify:

`/Users/andrewhodgson/Documents/build-a-booth`

Preserve:

* BM101 model loading
* BM Counter separate accessory loading
* GLB material names and targeted texture swapping
* app-controlled flooring
* selected counter controller/outline behavior
* welcome flow
* right panel structure
* mobile drawer behavior
* capped DPR and `frameloop="demand"`

Do not overbuild. Keep the app phased, stable, and easy to understand.

When making app changes:

* run `npm run lint`
* run `npm run build`
* visually check the app when practical
