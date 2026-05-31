const MAX_GRAPHIC_UPLOAD_BYTES = 2 * 1024 * 1024

export const graphicZones = [
  {
    id: 'backwall',
    label: 'Back Wall Graphic',
    materialName: 'MAT_graphic_backwall',
    recommendedWidth: 2000,
    recommendedHeight: 1625,
    maxBytes: MAX_GRAPHIC_UPLOAD_BYTES,
  },
  {
    id: 'counter',
    label: 'Counter Graphic',
    materialName: 'MAT_graphic_counter',
    recommendedWidth: 1000,
    recommendedHeight: 1000,
    maxBytes: MAX_GRAPHIC_UPLOAD_BYTES,
  },
]

export const emptyGraphicUploads = Object.fromEntries(
  graphicZones.map((zone) => [zone.id, null]),
)

export function getGraphicZoneById(zoneId) {
  return graphicZones.find((zone) => zone.id === zoneId)
}
