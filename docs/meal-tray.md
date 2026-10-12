# Stainless meal tray

Open **Plate options → Plate type → Meal tray** to use the stainless tray. The tray has three wells across the top, a large rectangular well at bottom-left, and a round well at bottom-right, following the supplied photograph.

The footprint is fixed at **29 × 23 cm**, based on the comparable product in the [household plate research](indonesian-household-plate-research.md#special-category-compartment-meal-tray--ompreng). The photographed tray's measurements remain unknown. Individual well sizes and the shallow profile are estimates; the model has a 3.3 cm overall height, rather than reproducing the comparable product's 4.5 cm height. The pressed shell has a modeled 2 mm thickness. These are visual estimates, not measured manufacturing specifications.

## Interaction

- Clicking a shelf food distributes it among wells that can accommodate its footprint. Dragging from the shelf targets the visible tray surface.
- Drag food between wells to reposition it. Placement chooses the closest well that accommodates the food's current upright footprint and keeps it clear of rounded corners. The food is lifted above its destination support before release, then settles, tilts, or stacks.
- Select a food and use **Tray compartment** to move it between wells by keyboard. Compartments too small for its upright footprint are unavailable, except the large compartment, which remains the fallback for oversized portions.
- Oversized food retains its portion and physical scale. It is placed over the large well and may span a divider; a note suggests reducing the portion or using the ceramic plate.
- Switching vessels keeps food instances, portions, cooking settings, selection, and nutrition. Food positions are fitted to the new vessel and settle again. Undo restores the previous vessel and captured food positions and rotations.
- Switching back to the ceramic plate restores its diameter and color selection. Clear retains the selected vessel. Reloading starts a fresh session.

Food categories are not assigned to particular wells. Rice, lauk, vegetables, and other foods can use any suitable compartment.

## Geometry and physics

`src/lib/meal-tray.ts` defines the wells, dimensions, rounded bounds, well profile, and footprint-based placement. `src/lib/tray-geometry.ts` builds the continuous perforated top sheet and recessed wells, including the underside of the thin shell. The model uses a metallic material with a locally generated lighting environment; it requires no downloaded image or environment assets.

The tray physics uses the shared shell triangles for sloping walls, separators, and the rim. Flat well floors use overlapping box/cylinder slabs matching the rounded footprints, avoiding triangle seams under thin foods. Food collision hulls, mass, gravity, stacking, and undo behavior use the existing simulation. The tray's rectangular bounds replace the circular spill checks.

The non-WebGL fallback shows the five-well tray outline and retains the food, portion, compartment, and nutrition controls. Compartments do not represent nutritional targets or proportions.

## Validation

`tests/meal-tray.test.ts` checks the five recesses and separator heights, outer dimensions, placement, oversized portions, nutrition and cooking preservation, live-pose undo, corner wells outside the former circular bound, movement across dividers, all regular and maximum food portions, and a mixed tray. `tests/browser/meal-tray.spec.ts` exercises selection, compartment movement, vessel switching, undo, and mobile layout against the production bundle.

Exact dimensions of the supplied tray, consumer-device frame rates, and touch-device behavior have not been measured. Food and well profiles remain approximations.
