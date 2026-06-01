# Build an Exhibit — Next Steps

## Current Status

Build an Exhibit is a working early MVP foundation for configuring SourceOne Events BeMatrix rental exhibits.

Currently working:

* full-screen React/Three scene with Build-a-Booth-inspired gradient, grid, camera, and orbit behavior
* two-step welcome modal for booth size and booth layout selection
* SourceOne SVG logo in the header, welcome modal, and mobile drawer
* right-side panel with one-or-zero-open-section accordion behavior
* all 20 MVP booth options in config: BM101-BM110 and BM201-BM210
* BM101 booth wall GLB loading as the current real test booth asset
* BM Counter GLB loading separately as an included accessory
* app-controlled meter-scale flooring/carpet slab with selectable textures
* JPG or PNG upload/crop previews for the backwall and counter graphic materials
* counter selection, orange object-level outline, movement, rotation, and reset
* selected-only custom SVG counter controller using `public/controller.svg`
* refined one-page client-side PDF export using jsPDF

Graphic recommendations:

* Back Wall Graphic: `2000 × 1625 px`, JPG or PNG, max 4 MB per file
* Counter Graphic: `1000 × 1000 px`, JPG or PNG, max 4 MB per file

## Known Issues / Watch Items

* All booth options temporarily use `/models/booths/bm101.glb`.
* Real BM102-BM110 and BM201-BM210 booth models have not been added yet.
* The included counter is separate from the booth wall GLB and should stay that way.
* No bounds limits exist for counter movement yet.
* No collision detection exists yet.
* No optional furniture/accessory system exists yet.
* PDF export is a refined first working version, not a final polished proposal output.
* No JPG export workflow exists yet.
* No contact/follow-up form or submission workflow exists yet.
* Graphic previews are browser-only and are not production artwork validation.
* Flooring is app-controlled, not a GLB.
* App/model scale is meters: 10x10 floor is `3.048 × 3.048`, 10x20 floor is `6.096 × 3.048`, floor thickness is `0.0127`.
* Carpet textures should be monitored for performance and repeat quality as more texture assets are added.
* Counter/controller/outline behavior should be retested when additional accessories are introduced.
* Continue mobile testing as the right panel, crop modal, and controller become denser.
* Preserve the current material targeting; do not globally override GLB materials.
* PDF export includes the SourceOne SVG logo, captures perspective/front/top views from the visible WebGL canvas with a white export background, hides grid/selection/controller UI during capture, and uses size-specific camera presets plus explicit-dimension contain-style image placement for 10x10 and 10x20 booths.
* PDF image squishing/darkness was traced to the export render path rather than PDF placement. Export now avoids both live-canvas resizing and offscreen render-target readback.
* Mobile portrait PDF exports preserve aspect ratio but may have larger margins because captures now use the visible canvas aspect.
* PDF export should be retested as model complexity grows.
* The Vite production build may warn about large chunks as Three.js dependencies grow.

## Recommended Next Tasks

1. Add an optional furniture/accessory system.
2. Add movement bounds for the included counter and future furniture.
3. Continue PDF export polish or add a dedicated JPG export workflow if still needed.
4. Add the contact/follow-up form.
5. Replace temporary BM101 model references with real booth-specific GLBs.
6. Refine right panel content and booth details.
7. Continue mobile polish and testing.

## Guardrails

Do not modify the old Build-a-Booth reference project unless specifically requested.

Do not add form submission, export, pricing, user accounts, database/storage, production artwork validation, or additional real booth models unless specifically requested.

Preserve the working BM101/BM Counter material setup, flooring system, graphic upload/crop workflow, counter controller, and mobile drawer behavior while making future changes.
