# Build an Exhibit — Project Notes

## Project Summary

Build an Exhibit is a SourceOne Events web app for configuring standard rental exhibit packages.

The app is similar in visual style and structure to the existing Build-a-Booth pipe-and-drape configurator, but this app is focused on BeMatrix rental exhibits.

This is a public-facing visual sales tool, not a full booth builder, not a quoting engine, and not a production artwork or preflight tool.

The main purpose is to let exhibitors and internal SourceOne team members preview standard rental exhibit options, apply sample branded graphics, add simple furniture/accessories, export a preview image, and optionally submit a follow-up request to SourceOne Exhibitor Services.

## Project Paths

Existing reference app:

`/Users/andrewhodgson/Documents/build-a-booth`

Current working app:

`/Users/andrewhodgson/Documents/Build an Exhibit`

The Build-a-Booth app should be used only as a visual/layout/code reference unless specifically instructed otherwise.

Do not modify the Build-a-Booth app unless the user explicitly asks for that.

## Relationship To Build-a-Booth

* Build a Booth = pipe-and-drape booth configurator
* Build an Exhibit = rental exhibit configurator

Build an Exhibit should preserve the broad Build-a-Booth feel:

* full-screen 3D canvas
* subtle gradient background
* floor grid
* right-side control panel
* mobile-friendly panel behavior
* button/card styling
* camera/orbit feel

## Intended Users

Primary users:

* Exhibitors
* Internal exhibitor services reps
* Internal account managers
* Internal sales reps

The app can also be open to people who are not currently part of a SourceOne-managed show.

## MVP Scope

The MVP should eventually allow a user to:

1. Choose a 10x10 or 10x20 rental exhibit.
2. Choose a fixed booth layout.
3. View the booth in a polished 3D scene.
4. Select flooring/carpet options.
5. Upload and crop a backwall graphic preview.
6. Upload and crop a counter graphic preview.
7. Add simple furniture/accessories.
8. Move, rotate, and delete added furniture/accessories.
9. Export a clean JPG preview.
10. Optionally submit a follow-up request to SourceOne Exhibitor Services.

## Out Of Scope Until Requested

Do not add these unless specifically requested:

* real form submission
* email confirmation
* captcha
* final JPG export
* database/storage
* WordPress deployment
* all 20 real booth models
* full image upload workflow
* collision detection
* physics
* pricing
* user accounts
* production artwork validation
* PDF export

## Booth Sizes

MVP includes:

* 10x10 inline booths
* 10x20 inline booths

Future possibility:

* 20x20 booths

Do not build 20x20 support yet.

## Booth Layouts

The booth structure is fixed. Users should not be able to build or edit the BeMatrix structure piece by piece.

MVP will eventually include:

* 10 fixed 10x10 booth layouts
* 10 fixed 10x20 booth layouts

Temporary booth options may point to the same BM101 model until final booth models are prepared.

Current booth config includes all 20 MVP booth records:

* BM101-BM110 for 10x10
* BM201-BM210 for 10x20

All current booth records temporarily use `/models/booths/bm101.glb` until final layout-specific models are prepared.

## Booth Naming System

There is no BM100 or BM200.

10x10 booths start at:

* BeMatrix Rental Exhibit 101
* code: BM101

10x20 booths start at:

* BeMatrix Rental Exhibit 201
* code: BM201

Future booth naming should continue from those series:

* 10x10: BM101, BM102, BM103, etc.
* 10x20: BM201, BM202, BM203, etc.

## Current Data Architecture

Booth data currently lives in:

`data/booths.js`

Future cleanup may move app data under `src/data/`, but do not move files solely for neatness unless requested.

Each booth object should include fields like:

* id
* name
* code
* size
* type
* description
* modelPath
* thumbnailPath
* templatePath
* recommendedTemplateWidth
* recommendedTemplateHeight
* includedAccessories
* preview

## Welcome Flow

The app uses a two-step welcome/start modal.

Step 1:

* Ask the user whether they are looking for a 10x10 or 10x20 booth.

Step 2:

* Show booth layout options for the selected size.
* Include a Back button to return to the size selection step.

After selecting a booth:

* Close the welcome modal.
* Load the main configurator.

Once inside the main configurator:

* The user should still be able to switch between 10x10 and 10x20.
* The right-side panel should update booth thumbnails/layouts based on selected size.

## Right Panel Sections

The right-side panel should include these major sections:

* Booth Selection
* Carpet & Flooring
* Booth Details
* Graphics
* Furniture
* Export
* Contact SourceOne

The panel should follow the Build-a-Booth visual style and remain mobile-friendly.

## Contact / Follow-Up Direction

There should be a visible contact/follow-up button available at all times.

Preferred label for now:

**Request Follow-Up**

This should eventually open a modal form similar to the welcome modal.

Avoid finalizing "Request Quote" language until the form/submission workflow is more defined.

## Current 3D Asset Strategy

Booth wall structure and accessories should be separate.

Current booth wall GLB:

`public/models/booths/bm101.glb`

Current counter accessory GLB:

`public/models/accessories/bm-counter.glb`

The booth package can include a counter from a user/business standpoint, but technically the counter should be loaded as an included accessory so it can eventually be movable, rotatable, and resettable.

Carpet/flooring should be app-controlled and should not be part of the booth GLB.

## Blender / Export Naming Standards

Booth wall object names should be booth-specific.

Example BM101 object names:

* `BM101_ROOT`
* `BM101_structure_metal`
* `BM101_structure_panels`
* `BM101_graphic_backwall`

Counter object names:

* `BM_COUNTER_ROOT`
* `BM_counter_structure_metal`
* `BM_counter_structure_panels`
* `BM_counter_graphic_front`

Object names can be booth/accessory-specific. Material names should remain shared and predictable.

Models should be exported at real scale when possible. Avoid arbitrary app-side scaling unless needed to correct a clear import issue.

## Material Naming Standards

BM101 booth wall uses:

* `MAT_structure_metal`
* `MAT_structure_panels`
* `MAT_graphic_backwall`

BM Counter uses:

* `MAT_structure_metal`
* `MAT_structure_panels`
* `MAT_graphic_counter`

Graphic-specific materials:

* `MAT_graphic_backwall`
* `MAT_graphic_counter`

The app should preserve GLB materials by default.

Do not globally override every mesh with one material or texture.

If material logic is needed, target known material names only:

* `MAT_structure_metal`
* `MAT_structure_panels`
* `MAT_graphic_backwall`
* `MAT_graphic_counter`

The backwall and counter graphic textures are currently working. Be careful not to break them.

## Accessory / Counter Strategy

The BM Counter is included with current booth packages.

It should:

* load automatically with the selected booth
* stay separate from the booth wall model
* use `/models/accessories/bm-counter.glb`
* have a default position in front of the back wall
* have a default rotation
* be treated as an included accessory
* not be deletable yet

Current counter placement controls:

* The included counter is treated as the active included accessory.
* `src/App.jsx` stores counter position and rotation in React state.
* `src/components/CounterPlacementControls.jsx` renders the canvas overlay control pad.
* Movement uses X/Z scene axes only.
* Movement step is 0.1 meter per click/tap.
* Rotation step is 15 degrees per click/tap around the Y axis.
* The control pad supports move left, move right, move forward, move back, rotate left, rotate right, and reset.
* Changing booth layout resets the counter to that booth's default position and rotation.
* Changing carpet/flooring or uploaded graphics does not reset the counter.
* Collision detection is intentionally not implemented yet.
* Out-of-bounds limits are intentionally not implemented yet.
* The included counter cannot be deleted.

## Flooring Strategy

Flooring/carpet is app-controlled, not part of the booth GLB.

Floor should:

* be 10x10 for 10x10 booths
* be 20x10 for 10x20 booths
* use selectable carpet/floor options similar to Build-a-Booth
* remain selected when switching booth layouts
* keep the same flooring selection when switching booth size, but resize the floor
* receive shadows if shadows are enabled

Current flooring config:

`data/flooring.js`

Current carpet texture folder:

`public/textures/carpet`

Runtime texture paths:

`/textures/carpet/<filename>`

Current implementation details:

* `src/App.jsx` owns selected flooring state.
* `src/components/RightPanel.jsx` renders Build-a-Booth-style Standard Carpet and Premium Carpet & Flooring swatches.
* `src/components/CanvasScene.jsx` creates the carpet as a thin Three.js slab/box, not a GLB.
* The loaded BM101 and counter GLBs are currently treated as meter-scale assets.
* BM101 measured bounds are approximately 2.9777 wide x 2.4182 high x 0.0623 deep.
* BM Counter measured bounds are approximately 1.0414 wide x 1.0172 high x 0.6467 deep.
* The floor slab is 3.048 x 3.048 for 10x10 booths.
* The floor slab is 6.096 x 3.048 for 10x20 booths.
* The floor slab thickness is 0.0127, which represents 0.5 inches in meter-scale scene units.
* The carpet texture is applied to the slab's top, bottom, and visible sides.
* Texture repeat is 1 x 1 for 10x10 and 2 x 1 for 10x20 to avoid stretching the 1:1 texture files.
* Slab edge materials use cloned versions of the selected carpet texture with simple edge repeat settings.
* The cached loaded texture is cloned before repeat/wrapping is configured, so repeat settings do not leak between booth sizes.
* Development-only bounds logging reports booth, counter, and floor dimensions once per loaded item/size.

Use `public/textures` for actual 3D textures.

## Scene Environment Direction

The scene environment should closely mirror the existing Build-a-Booth visual style.

Current environment details:

* `src/index.css` uses the same subtle radial gradient background style as Build-a-Booth.
* The Three.js canvas remains transparent so the CSS gradient sits behind the scene.
* `src/components/CanvasScene.jsx` uses a larger `gridHelper`, similar to Build-a-Booth, instead of a floor-footprint-only grid.
* The scene grid is 12 meter-scale units wide with 24 divisions.
* The grid uses Build-a-Booth-style colors: `#cbd5e1` and `#e2e8f0`.
* The grid is positioned at `-0.0187`, just below the flooring slab bottom, so the floor appears to sit on top of the larger grid.
* The grid should remain visible around the outside of both 10x10 and 10x20 flooring footprints.
* Preserve the current camera/orbit setup unless the user specifically asks to change it.

## Thumbnail Strategy

Booth thumbnails should use images from:

`public/thumbnails/booths`

Thumbnails are for the welcome modal and right-side booth selection cards.

Current thumbnail implementation:

* Featured welcome size cards use `BM10x10_Featured.jpg` and `BM10x20_Featured.jpg`.
* 10x10 booth thumbnails use `public/thumbnails/booths/10x10/BM###-View-1_Thumbnail.jpg`.
* 10x20 booth thumbnails use `public/thumbnails/booths/10x20/BM###-View-1_Thumbnail.jpg`.
* Featured and booth thumbnail images use `object-fit: contain` so the full render is visible.
* The welcome size cards show only the size title, such as `10 x 10 Rental Exhibits`.
* The welcome booth selection step uses a 5-column thumbnail grid on desktop.
* Welcome booth cards show only the full booth name below the thumbnail.
* The right panel booth selection uses a 3-column thumbnail grid.
* Mobile keeps responsive behavior with fewer columns.

## Graphic Upload Direction

Each booth layout will have graphic upload surfaces based on known material names.

Current graphic zones:

* Back Wall Graphic targets `MAT_graphic_backwall`.
* Back Wall Graphic recommended preview size is 2000 x 1625 px.
* Counter Graphic targets `MAT_graphic_counter`.
* Counter Graphic recommended preview size is 2000 x 2000 px.

Current user workflow:

1. Select booth layout.
2. Upload a JPG for the backwall.
3. Upload a JPG for the counter front.
4. If the aspect ratio does not match, crop the image in-browser.
5. App applies images to the corresponding graphic materials.

Constraints:

* JPG only
* max file size: 2MB per graphic
* browser-only preview
* no database
* no permanent storage
* changing booth layout should clear uploaded booth-specific graphics
* changing carpet/flooring should not clear uploaded graphics
* uploaded file is for preview only, not final production artwork

Current implementation details:

* `react-easy-crop` provides the fixed-aspect crop modal.
* Users can reposition and zoom wrong-ratio images before applying the crop.
* Cropped previews are generated in-browser as JPG blob URLs.
* The scene preserves GLB materials by default and only swaps the targeted graphic material map.
* Default model graphic textures remain visible until replaced by user uploads.
* Uploaded/cropped graphic state lives only in React/browser memory and is not persisted.

### Wrong Image Dimensions

The app checks uploaded JPG dimensions against the zone's recommended preview dimensions.

Current behavior:

* Reject non-JPG files.
* Reject files over 2MB.
* Warn if an image is smaller than the recommended preview size because it may appear blurry.
* Apply images directly when the aspect ratio matches closely.
* Open the crop modal when the aspect ratio does not match.

## Furniture Direction

MVP furniture should start small.

Initial furniture items:

* Bar table
* Bar stool

Later furniture/accessory possibilities:

* Coffee tables
* Cafe tables
* Couches
* Loveseats
* Chairs
* Standard chairs
* Other accessories

Furniture requirements:

* Users can add multiple instances.
* Users can select an item.
* Users can rotate selected item.
* Users can delete selected item.
* Furniture should stay within the booth footprint.
* Do not enforce collision between furniture items in MVP.
* Do not enforce collision with walls/counters in MVP.
* No physics.

Preferred MVP movement approach:

* Button-based move controls instead of 3D transform arrows
* Move forward/back/left/right
* Rotate left/right by 15 degrees
* Delete selected item

Button controls are preferred because they are more reliable on mobile and less likely to conflict with orbit controls.

Changing booth size/layout should probably reset added furniture placement.

## Export Direction

The app should eventually support JPG export.

Preferred export behavior:

* 4:3 image
* white background
* grid hidden
* gradient hidden
* shadows visible
* uploaded graphics visible
* furniture/accessories visible
* SourceOne Events watermark always visible

Export options to consider:

* Export current view
* Export preset views: front, perspective, top
* Export all preset views as separate JPGs

Potential strategy:

* Allow users to configure freely.
* Gate high-quality export behind the follow-up form.
* After successful form submission, download the JPG preview automatically.

This export gating is not final and can be revisited.

## Form Submission Direction

The form will eventually send a follow-up request to:

`exhibitorservices@sourceoneevents.com`

Internal email should include:

* name
* company
* email
* phone
* show name
* show date
* booth number
* selected booth name
* selected booth code
* booth size
* booth type
* selected furniture/accessories
* uploaded JPG filename
* notes
* preview image if feasible

User should receive a simple confirmation email.

Captcha/spam protection will be considered later, likely Cloudflare or Google reCAPTCHA.

Do not build form submission yet unless specifically requested.

## Deployment Direction

The app will eventually be hosted on the main SourceOne Events website.

Current plan:

* Develop locally first.
* Build as a standalone app.
* No Vercel.
* No subdomain.
* Not embedded directly inside the WordPress theme.
* Likely deployed similarly to the existing Build-a-Booth app.
* Updates may be handled by local build and FTP upload.

Need to confirm with the dev team how the existing Build-a-Booth app is currently deployed.

## Current Architecture

Current app stack:

* Vite
* React
* React Three Fiber
* Drei
* Three.js

Key files:

* `src/App.jsx` - app state and main shell
* `src/components/CanvasScene.jsx` - Three.js scene, GLB loading, floor/grid/camera/orbit
* `src/components/WelcomeModal.jsx` - two-step start flow
* `src/components/RightPanel.jsx` - right-side/mobile control panel
* `src/index.css` - app styling
* `data/booths.js` - current central booth config
* `data/flooring.js` - current central carpet/flooring config

## Current Completed Milestones

The first app foundation is complete.

Current working foundation includes:

* full-screen React/Three configurator shell
* gradient background
* floor grid
* orbit controls
* two-step welcome modal
* size selection
* booth layout selection
* right-side panel
* central booth data/config
* all 20 MVP booth options in config, BM101-BM110 and BM201-BM210
* BM101 real booth wall model loading
* BM Counter loading separately as an included accessory
* app-controlled carpet/flooring system
* meter-scale 10x10 and 20x10 carpet floor resizing
* thin flooring slab replacing the previous flat plane
* larger Build-a-Booth-style scene grid below the floor slab
* Build-a-Booth-matched radial gradient scene background
* selected carpet texture applied to slab top and sides
* featured welcome size images
* booth thumbnail images in welcome layout selection
* 3-column right-panel booth thumbnail grid
* browser-only JPG graphic uploads for backwall and counter
* fixed-aspect crop workflow for wrong-ratio graphics
* targeted texture replacement for `MAT_graphic_backwall` and `MAT_graphic_counter`
* included counter movement and rotation overlay controls
* Build-a-Booth-style carpet/flooring right-panel swatches
* right panel showing included booth items
* graphic textures working for backwall and counter
* performance pass completed
* flooring scale/bounds diagnostic pass completed

Performance improvements already made:

* Canvas DPR capped with `dpr={[1, 1.5]}`
* `frameloop="demand"` added
* GLB scene cloning removed
* fallback placeholder wall only renders when real GLB is empty or fails
* shadow cost reduced
* GLB materials preserved instead of mutated globally
* flooring textures configured from cached texture clones to avoid mutating shared texture instances

Verification from latest pass:

* `npm run lint` passes
* `npm run build` passes
* BM101 loads once
* BM Counter loads once
* carpet/flooring options render in the right panel
* welcome size cards use featured 10x10 and 10x20 images
* welcome booth selection shows 10 booth thumbnails per selected size in a 5-column desktop grid
* right panel booth selection shows 10 booth thumbnails per selected size in a 3-column grid
* backwall upload replaces `MAT_graphic_backwall`
* counter upload replaces `MAT_graphic_counter`
* wrong-ratio uploads open the crop workflow
* small images show a warning but are allowed
* non-JPG and over-2MB files are rejected
* changing booth layout clears uploaded graphics
* counter can move left/right/front/back by 0.1 meter per click
* counter can rotate left/right by 15 degrees per click
* changing booth layout resets counter placement
* selected carpet persists when switching booth layouts and booth sizes
* 10x10 booths show a 3.048 x 3.048 meter-scale carpet slab
* 10x20 booths show a 6.096 x 3.048 meter-scale carpet slab
* flooring no longer disappears when orbiting below the scene
* larger grid extends beyond the flooring footprint and sits below the slab
* carpet texture appears on visible slab edges
* backwall and counter graphic textures display correctly
* welcome flow, right panel, and mobile drawer still work

## Guardrails For Future Codex Work

Only work inside:

`/Users/andrewhodgson/Documents/Build an Exhibit`

Do not modify:

`/Users/andrewhodgson/Documents/build-a-booth`

Preserve the working GLB material setup unless there is a clear bug.

Do not globally overwrite GLB materials or textures.

Do not overbuild. Keep the app phased, stable, and easy to understand.

When making frontend/scene changes:

* preserve the desktop/mobile layout
* preserve the welcome flow
* preserve the right panel structure
* preserve orbit controls unless specifically asked
* run `npm run lint`
* run `npm run build`
* visually check the app when practical
