// Shared placement-bound math for accessory movement.
//
// The scene's vertical axis is three.js Y (the app UI labels this axis "Z").
// Nothing may sink below the floor at Y = 0. For floor-standing objects the
// model origin sits on the floor, so a minimum origin Y of 0 is correct. Wall-
// mounted objects (shelves, TVs) are authored with their geometry floating above
// the origin, so origin Y = 0 already leaves them hovering; a hard floor of 0
// then prevents them from ever coming down. For those we derive the minimum
// origin Y from the object's actual bounding box instead of assuming the origin
// is the bottom of the geometry.

const FEET_TO_METERS = 0.3048

export const HORIZONTAL_PLACEMENT_LIMIT = 25 * FEET_TO_METERS
export const VERTICAL_PLACEMENT_LIMIT = 25 * FEET_TO_METERS
// Wall-mounted objects (shelves, TVs) travel over a shorter vertical range than
// the global limit so they cannot be pushed unrealistically high up the booth
// wall. Config-driven: change this factor to retune the ceiling for those types.
export const WALL_MOUNTED_VERTICAL_LIMIT = VERTICAL_PLACEMENT_LIMIT / 2
export const FLOOR_LEVEL_Y = 0

export function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum)
}

// Maximum origin Y for an accessory. Wall-mounted objects (the ones that expose
// vertical movement — shelves and TVs) use the reduced ceiling; every floor-based
// object keeps the full global limit so their movement is unchanged.
export function getAccessoryVerticalMaxY(accessory) {
  return accessory?.allowVerticalMovement
    ? WALL_MOUNTED_VERTICAL_LIMIT
    : VERTICAL_PLACEMENT_LIMIT
}

// Lowest point of a placed accessory measured relative to its origin, in metres.
// Accounts for the two things that move an accessory's bottom away from its
// authored model bounds:
//   - size scaling (TVs scale about their bounding-box centre), and
//   - stacked copies (extra shelves are spaced downward from the origin).
// `bounds` is the single model's local bounding box ({ center, size }) as
// measured before scale/rotation. Returns 0 when bounds are unknown so callers
// fall back to the plain floor.
export function getAccessoryBottomOffsetY({
  bounds,
  sizeScale = 1,
  quantity = 1,
  verticalSpacing = 0,
}) {
  if (!bounds) {
    return FLOOR_LEVEL_Y
  }

  const centerY = bounds.center[1]
  const minY = centerY - bounds.size[1] / 2
  // Scaling happens about the bounding-box centre, so the bottom tracks the
  // scale factor (a bigger TV reaches lower, a smaller one sits higher).
  const scaledMinY = centerY + sizeScale * (minY - centerY)
  // Each additional stacked copy (extra shelf) is placed one spacing below the
  // origin, so the lowest copy defines the bottom of the whole stack.
  const stackDrop = Math.max(quantity - 1, 0) * verticalSpacing

  return scaledMinY - stackDrop
}

// Minimum origin Y that still keeps the object's lowest geometry on the floor.
// Floor objects (bottom at origin) yield 0; wall-mounted objects whose geometry
// floats above the origin yield a negative value, letting them travel downward
// until that geometry — not the invisible origin — reaches the floor.
export function getAccessoryVerticalMinY(options) {
  return -getAccessoryBottomOffsetY(options)
}

export function clampAccessoryPosition(
  position,
  verticalMin = FLOOR_LEVEL_Y,
  verticalMax = VERTICAL_PLACEMENT_LIMIT,
) {
  return [
    clamp(position[0], -HORIZONTAL_PLACEMENT_LIMIT, HORIZONTAL_PLACEMENT_LIMIT),
    clamp(position[1], verticalMin, verticalMax),
    clamp(position[2], -HORIZONTAL_PLACEMENT_LIMIT, HORIZONTAL_PLACEMENT_LIMIT),
  ]
}
