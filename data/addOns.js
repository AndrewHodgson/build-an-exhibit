import { MAX_GRAPHIC_UPLOAD_BYTES } from './graphicZones.js'

export const INCHES_TO_METERS = 0.0254
export const ACCESSORY_ROTATION_STEP = Math.PI / 12
export const addOnCategories = ['Furniture', 'Counters', 'Accessories']

export const addOns = [
  {
    id: 'standard-counter',
    limitGroup: 'counter',
    name: 'Standard Counter',
    category: 'Counters',
    modelPath: '/models/accessories/bm-counter.glb',
    thumbnailPath: '/thumbnails/add-on/standard_counter_thumbnail.jpg',
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
    limitGroup: 'counter',
    name: 'Storage Counter',
    category: 'Counters',
    modelPath: '/models/accessories/bm-counter-storage.glb',
    thumbnailPath: '/thumbnails/add-on/standard_counter_storage_thumbnail.jpg',
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
    limitGroup: 'counter',
    name: 'Slim Counter',
    category: 'Counters',
    modelPath: '/models/accessories/bm-counter-slim.glb',
    thumbnailPath: '/thumbnails/add-on/standard_counter_slim_thumbnail.jpg',
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
    id: 'double-counter',
    limitGroup: 'counter',
    name: 'Double Counter',
    category: 'Counters',
    modelPath: '/models/accessories/bm-double-counter.glb',
    thumbnailPath: '/thumbnails/add-on/standard_counter_double_thumbnail.jpg',
    position: [0, 0, 0],
    manualPosition: [0, 0, 0],
    rotation: [0, 0, 0],
  },
  {
    id: 'networking-table',
    limitGroup: 'counter',
    name: 'Networking Table',
    category: 'Counters',
    modelPath: '/models/accessories/bm-networking-table.glb',
    thumbnailPath: '/thumbnails/add-on/networking_table_thumbnail.jpg',
    position: [0, 0, 0],
    manualPosition: [0, 0, 0],
    rotation: [0, 0, 0],
  },
  {
    id: 'octanorm-counter',
    limitGroup: 'counter',
    name: 'Octanorm Counter',
    category: 'Counters',
    modelPath: '/models/accessories/BM_OctanormCounter.glb',
    thumbnailPath: '/thumbnails/add-on/octanorm_counter_thumbnail.jpg',
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
    limitGroup: 'counter',
    name: 'Octanorm Table',
    category: 'Counters',
    modelPath: '/models/accessories/BM_OctanormTable.glb',
    thumbnailPath: '/thumbnails/add-on/octanorm_table_thumbnail.jpg',
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
    thumbnailPath: '/thumbnails/add-on/shelf_thumbnail.jpg',
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
    limitGroup: 'tv',
    name: 'TV',
    category: 'Accessories',
    modelPath: '/models/accessories/55in-TV.glb',
    thumbnailPath: '/thumbnails/add-on/tv_thumbnail.jpg',
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
  {
    id: 'ale-bar-stool',
    name: 'Ale Bar Stool',
    category: 'Furniture',
    modelPath: '/models/accessories/Ale-Bar-Stool.glb',
    thumbnailPath: '/thumbnails/add-on/ale_barstool_thumbnail.jpg',
    position: [0, 0, 0],
    manualPosition: [0, 0, 0],
    rotation: [0, 0, 0],
    defaultColor: 'Black',
    colorSettingLabel: 'Seat color',
    materialMapping: {
      metal: {
        objectNames: ['Ale Bar Stool Base'],
        meshNames: ['Plane.001'],
        materialNames: ['Metal'],
      },
      surface: {
        objectNames: ['Ale Bar Stool Seat'],
        meshNames: ['Ale Bar Stool Black'],
        materialNames: ['Ale Bar Stool'],
      },
    },
    colorOptions: [
      {
        value: 'Black',
        label: 'Black',
        texturePath: '/textures/accessories/Ale_Barstool_Black.png',
      },
      {
        value: 'White',
        label: 'White',
        texturePath: '/textures/accessories/Ale_Barstool_White.png',
      },
    ],
    summaryFields: [
      { setting: 'color', defaultProperty: 'defaultColor', label: 'Color' },
    ],
  },
  {
    id: 'brava-bar-table',
    name: 'Brava Bar Table',
    category: 'Furniture',
    modelPath: '/models/accessories/Brava-Bar-Table.glb',
    thumbnailPath: '/thumbnails/add-on/brava_bar_table_thumbnail.jpg',
    position: [0, 0, 0],
    manualPosition: [0, 0, 0],
    rotation: [0, 0, 0],
    defaultColor: 'Black',
    colorSettingLabel: 'Tabletop color',
    materialMapping: {
      metal: {
        objectNames: ['Brava Bar Table Base'],
        meshNames: ['Cylinder.001'],
        materialNames: ['Metal'],
      },
      surface: {
        objectNames: ['Brava Bar Table Top'],
        meshNames: ['Cylinder.002'],
        materialNames: ['Black metal'],
      },
    },
    colorOptions: [
      {
        value: 'Black',
        label: 'Black',
        color: '#111111',
      },
      {
        value: 'White',
        label: 'White',
        color: '#f2f2f2',
      },
    ],
    summaryFields: [
      { setting: 'color', defaultProperty: 'defaultColor', label: 'Tabletop color' },
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
    ...(addOn?.defaultColor
      ? { color: settings.color ?? addOn.defaultColor }
      : {}),
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
