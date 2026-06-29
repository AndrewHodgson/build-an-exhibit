import { MAX_GRAPHIC_UPLOAD_BYTES } from './graphicZones.js'

const PLACEHOLDER_THUMBNAIL = '/thumbnails/booths/10x10/BM10x10_Featured.jpg'

export const INCHES_TO_METERS = 0.0254
export const ACCESSORY_ROTATION_STEP = Math.PI / 12
export const addOnCategories = ['Furniture', 'Counters', 'Accessories']

export const addOns = [
  {
    id: 'standard-counter',
    name: 'Standard Counter',
    category: 'Counters',
    modelPath: '/models/accessories/bm-counter.glb',
    thumbnailPath: PLACEHOLDER_THUMBNAIL,
    position: [0, 0, 0.30],
    manualPosition: [0, 0, 0.30],
    rotation: [0, 0, 0],
    graphicZones: [
      {
        id: 'standard-counter-graphic',
        label: 'Standard Counter Graphic',
        materialName: 'MAT_graphic_counter',
        recommendedWidth: 1000,
        recommendedHeight: 1000,
        maxBytes: MAX_GRAPHIC_UPLOAD_BYTES,
        defaultTexturePath: '/textures/accessories/bm-counter-texture.jpg',
      },
    ],
  },
  {
    id: 'storage-counter',
    name: 'Storage Counter',
    category: 'Counters',
    modelPath: '/models/accessories/bm-counter-storage.glb',
    thumbnailPath: PLACEHOLDER_THUMBNAIL,
    position: [0, 0, 0.30],
    manualPosition: [0, 0, 0.30],
    rotation: [0, 0, 0],
    graphicZones: [
      {
        id: 'storage-counter-graphic',
        label: 'Storage Counter Graphic',
        materialName: 'MAT_graphic_counter_storage',
        recommendedWidth: 2000,
        recommendedHeight: 2000,
        maxBytes: MAX_GRAPHIC_UPLOAD_BYTES,
        defaultTexturePath: '/textures/accessories/bm-counter-storage.jpg',
      },
    ],
  },
  {
    id: 'slim-counter',
    name: 'Slim Counter',
    category: 'Counters',
    modelPath: '/models/accessories/bm-counter-slim.glb',
    thumbnailPath: PLACEHOLDER_THUMBNAIL,
    position: [0, 0, 0],
    manualPosition: [0, 0, 1.22],
    rotation: [0, 0, 0],
    graphicZones: [
      {
        id: 'slim-counter-graphic',
        label: 'Slim Counter Graphic',
        materialName: 'BM_slimcounter_graphic_front',
        recommendedWidth: 1000,
        recommendedHeight: 1000,
        maxBytes: MAX_GRAPHIC_UPLOAD_BYTES,
        defaultTexturePath: '/textures/accessories/bm-counter-texture.jpg',
      },
    ],
  },
  {
    id: 'octanorm-counter',
    name: 'Octanorm Counter',
    category: 'Counters',
    modelPath: '/models/accessories/BM_OctanormCounter.glb',
    thumbnailPath: PLACEHOLDER_THUMBNAIL,
    position: [0, 0, 0],
    manualPosition: [0, 0, 0],
    rotation: [0, 0, 0],
    graphicZones: [
      {
        id: 'octanorm-counter-graphic',
        label: 'Octanorm Counter Graphic',
        materialName: 'BM_octanormcounter_graphic_front',
        recommendedWidth: 1028,
        recommendedHeight: 2000,
        maxBytes: MAX_GRAPHIC_UPLOAD_BYTES,
        defaultTexturePath: '/textures/accessories/bm109-reception-leg.jpg',
      },
    ],
  },
  {
    id: 'octanorm-table',
    name: 'Octanorm Table',
    category: 'Counters',
    modelPath: '/models/accessories/BM_OctanormTable.glb',
    thumbnailPath: PLACEHOLDER_THUMBNAIL,
    position: [0, 0, 0],
    manualPosition: [0, 0, 0],
    rotation: [0, 0, 0],
    graphicZones: [
      {
        id: 'octanorm-table-graphic',
        label: 'Octanorm Table Graphic',
        materialName: 'BM_octanormtable_graphic_front',
        recommendedWidth: 1028,
        recommendedHeight: 2000,
        maxBytes: MAX_GRAPHIC_UPLOAD_BYTES,
        defaultTexturePath: '/textures/accessories/bm109-networking-leg.jpg',
      },
    ],
  },
  {
    id: 'shelf',
    name: 'Shelf',
    category: 'Accessories',
    modelPath: '/models/accessories/shelf.glb',
    thumbnailPath: PLACEHOLDER_THUMBNAIL,
    position: [0, 0, 0],
    manualPosition: [0, 0, 0.97],
    rotation: [0, 0, 0],
    defaultQuantity: 3,
    minQuantity: 0,
    maxQuantity: 4,
    verticalSpacing: 0.38,
    allowVerticalMovement: true,
    summaryFields: [
      { setting: 'quantity', defaultProperty: 'defaultQuantity', label: 'Quantity' },
    ],
  },
  {
    id: 'tv-55',
    name: '55in TV',
    category: 'Accessories',
    modelPath: '/models/accessories/55in-TV.glb',
    thumbnailPath: PLACEHOLDER_THUMBNAIL,
    position: [0, 0, 0],
    manualPosition: [0, 0, 1.31],
    rotation: [0, 0, 0],
    defaultSize: 55,
    sizeOptions: [43, 50, 55, 65, 75],
    allowVerticalMovement: true,
    summaryFields: [
      { setting: 'size', defaultProperty: 'defaultSize', label: 'Size', suffix: 'in' },
    ],
    graphicZones: [
      {
        id: 'tv-screen',
        label: 'TV Screen Graphic',
        materialName: 'screen',
        recommendedWidth: 1000,
        recommendedHeight: 565,
        maxBytes: MAX_GRAPHIC_UPLOAD_BYTES,
        defaultTexturePath: '/textures/accessories/TV-Screen.jpg',
      },
    ],
  },
]

export function getAddOnById(id) {
  return addOns.find((addOn) => addOn.id === id)
}

function createInstanceSettings(addOn, settings = {}) {
  return {
    ...(Number.isInteger(addOn?.defaultQuantity)
      ? { quantity: settings.quantity ?? addOn.defaultQuantity }
      : {}),
    ...(addOn?.defaultSize ? { size: settings.size ?? addOn.defaultSize } : {}),
  }
}

export function createDefaultAddOnInstances(booth) {
  const typeCounts = new Map()

  return (booth.defaultAddOns ?? []).flatMap((defaultAddOn) => {
    const addOn = getAddOnById(defaultAddOn.addOnId)

    if (!addOn) {
      return []
    }

    const typeCount = (typeCounts.get(addOn.id) ?? 0) + 1
    typeCounts.set(addOn.id, typeCount)

    return [
      {
        id: `default-${booth.id}-${addOn.id}-${typeCount}`,
        addOnId: addOn.id,
        position: [...(defaultAddOn.position ?? addOn.position)],
        rotation: [...(defaultAddOn.rotation ?? addOn.rotation)],
        settings: createInstanceSettings(addOn, defaultAddOn.settings),
      },
    ]
  })
}

export function createManualAddOnInstance(addOnId, instanceId) {
  const addOn = getAddOnById(addOnId)

  if (!addOn) {
    return null
  }

  return {
    id: instanceId,
    addOnId,
    position: [...(addOn.manualPosition ?? addOn.position)],
    rotation: [...addOn.rotation],
    settings: createInstanceSettings(addOn),
  }
}

export function createDefaultAddOnSettings(instances) {
  return Object.fromEntries(instances.map((instance) => [instance.id, instance.settings]))
}

export function getActiveAccessories(booth, instances) {
  const typeOrdinals = new Map()

  const addOnAccessories = instances.flatMap((instance) => {
    const addOn = getAddOnById(instance.addOnId)

    if (!addOn) {
      return []
    }

    const ordinal = (typeOrdinals.get(addOn.id) ?? 0) + 1
    typeOrdinals.set(addOn.id, ordinal)

    return [
      {
        ...addOn,
        id: instance.id,
        addOnId: addOn.id,
        summaryName: addOn.name,
        name: `${addOn.name} ${ordinal}`,
        position: instance.position,
        rotation: instance.rotation,
        graphicZones: (addOn.graphicZones ?? []).map((zone) => ({
          ...zone,
          id: `${zone.id}-${instance.id}`,
          label: `${addOn.name} ${ordinal} — ${zone.label}`,
        })),
      },
    ]
  })

  return [...(booth.includedAccessories ?? []), ...addOnAccessories]
}
