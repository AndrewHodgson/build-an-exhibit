export const MAX_GRAPHIC_UPLOAD_BYTES = 4 * 1024 * 1024

export const defaultBoothGraphicZones = [
  {
    id: 'backwall',
    label: 'Back Wall Graphic',
    materialName: 'MAT_graphic_backwall',
    recommendedWidth: 2000,
    recommendedHeight: 1625,
    maxBytes: MAX_GRAPHIC_UPLOAD_BYTES,
  },
]

export const counterGraphicZone = {
  id: 'counter',
  label: 'Counter Graphic',
  materialName: 'MAT_graphic_counter',
  recommendedWidth: 1000,
  recommendedHeight: 1000,
  maxBytes: MAX_GRAPHIC_UPLOAD_BYTES,
}

export function getGraphicZonesForBooth(booth, accessories = booth?.includedAccessories ?? []) {
  return [
    ...(booth?.graphicZones ?? defaultBoothGraphicZones),
    ...accessories.flatMap((accessory) => accessory.graphicZones ?? []),
  ]
}

export function createEmptyGraphicState(zones) {
  return Object.fromEntries(zones.map((zone) => [zone.id, null]))
}
