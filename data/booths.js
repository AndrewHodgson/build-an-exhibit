import {
  counterGraphicZone,
  defaultBoothGraphicZones,
  MAX_GRAPHIC_UPLOAD_BYTES,
} from './graphicZones.js'

export const boothSizes = [
  {
    value: '10x10',
    label: '10 x 10',
    description: 'Compact BeMatrix rental exhibit options for single-booth footprints.',
    featuredImagePath: '/thumbnails/booths/10x10/BM10x10_Featured.jpg',
  },
  {
    value: '10x20',
    label: '10 x 20',
    description: 'Linear BeMatrix rental exhibit options for expanded inline presence.',
    featuredImagePath: '/thumbnails/booths/10x20/BM10x20_Featured.jpg',
  },
]

const BM101_MODEL_PATH = '/models/booths/bm101.glb'
const INCLUDED_COUNTER = {
  id: 'included-bm-counter',
  name: 'Reception counter',
  type: 'included-accessory',
  modelPath: '/models/accessories/bm-counter.glb',
  position: [0, 0, 0.30],
  rotation: [0, 0, 0],
  graphicZones: [counterGraphicZone],
}
const BM105_STORAGE_COUNTER = {
  ...INCLUDED_COUNTER,
  name: 'Storage reception counter',
  modelPath: '/models/accessories/bm-counter-storage.glb',
  position: [-0.99, 0, -0.10],
  graphicZones: [
    {
      ...counterGraphicZone,
      materialName: 'MAT_graphic_counter_storage',
      recommendedWidth: 2000,
      recommendedHeight: 2000,
      defaultTexturePath: '/textures/accessories/bm-counter-storage.jpg',
    },
  ],
}
const BOOTH_OVERRIDES = {
  BM102: {
    modelPath: '/models/booths/bm102.glb',
    graphicZones: [
      {
        id: 'backwall',
        label: 'Back Wall Graphic',
        materialName: 'BM102_graphic_backwall',
        recommendedWidth: 2000,
        recommendedHeight: 1621,
        maxBytes: MAX_GRAPHIC_UPLOAD_BYTES,
        defaultTexturePath: '/textures/10x10_booths/bm102-backwall.jpg',
      },
      {
        id: 'header',
        label: 'Header Graphic',
        materialName: 'BM102_graphic_header',
        recommendedWidth: 2000,
        recommendedHeight: 334,
        maxBytes: MAX_GRAPHIC_UPLOAD_BYTES,
        defaultTexturePath: '/textures/10x10_booths/bm102-header.jpg',
      },
    ],
  },
  BM103: {
    modelPath: '/models/booths/bm103.glb',
    graphicZones: [
      {
        id: 'backwall',
        label: 'Back Wall Graphic',
        materialName: 'BM103_graphic_backwall',
        recommendedWidth: 2000,
        recommendedHeight: 1625,
        maxBytes: MAX_GRAPHIC_UPLOAD_BYTES,
        defaultTexturePath: '/textures/10x10_booths/bm103-backwall.jpg',
      },
    ],
  },
  BM104: {
    modelPath: '/models/booths/bm104.glb',
    graphicZones: [
      {
        id: 'backwall',
        label: 'Back Wall Graphic',
        materialName: 'BM104_graphic_backwall',
        recommendedWidth: 2000,
        recommendedHeight: 1625,
        maxBytes: MAX_GRAPHIC_UPLOAD_BYTES,
        defaultTexturePath: '/textures/10x10_booths/bm104-backwall.jpg',
      },
      {
        id: 'header',
        label: 'Header Graphic',
        materialName: 'BM104_graphic_header',
        recommendedWidth: 2000,
        recommendedHeight: 500,
        maxBytes: MAX_GRAPHIC_UPLOAD_BYTES,
        defaultTexturePath: '/textures/10x10_booths/bm104-header.jpg',
      },
    ],
  },
  BM105: {
    modelPath: '/models/booths/bm105.glb',
    includedAccessories: [BM105_STORAGE_COUNTER],
    defaultAddOns: [
      {
        addOnId: 'tv-55',
        position: [-0.97, -0.08, 1.85],
      },
    ],
    graphicZones: [
      {
        id: 'backwall',
        label: 'Back Wall Graphic',
        materialName: 'BM105_graphic_backwall',
        recommendedWidth: 2000,
        recommendedHeight: 1625,
        maxBytes: MAX_GRAPHIC_UPLOAD_BYTES,
        defaultTexturePath: '/textures/10x10_booths/bm105-backwall.jpg',
      },
      {
        id: 'kiosk',
        label: 'Kiosk Graphic',
        materialName: 'BM105_graphic_kiosk',
        recommendedWidth: 708,
        recommendedHeight: 2000,
        maxBytes: MAX_GRAPHIC_UPLOAD_BYTES,
        defaultTexturePath: '/textures/10x10_booths/bm105-kiosk.jpg',
      },
    ],
  },
  BM106: {
    modelPath: '/models/booths/bm106.glb',
    graphicZones: [
      {
        id: 'backwall',
        label: 'Back Wall Graphic',
        materialName: 'BM106_graphic_backwall',
        recommendedWidth: 2000,
        recommendedHeight: 1625,
        maxBytes: MAX_GRAPHIC_UPLOAD_BYTES,
        defaultTexturePath: '/textures/10x10_booths/bm106-backwall.jpg',
      },
    ],
  },
  BM107: {
    modelPath: '/models/booths/bm107.glb',
    graphicZones: [
      {
        id: 'backwall',
        label: 'Back Wall Graphic',
        materialName: 'BM107_graphic_backwall',
        recommendedWidth: 2000,
        recommendedHeight: 1000,
        maxBytes: MAX_GRAPHIC_UPLOAD_BYTES,
        defaultTexturePath: '/textures/10x10_booths/bm107-backwall.jpg',
      },
    ],
  },
  BM108: {
    modelPath: '/models/booths/bm108.glb',
    defaultAddOns: [
      {
        addOnId: 'shelf',
        position: [-0.97, 0.08, -0.33],
        settings: { quantity: 3 },
      },
    ],
    graphicZones: [
      {
        id: 'backwall',
        label: 'Back Wall Graphic',
        materialName: 'BM108_graphic_backwall',
        recommendedWidth: 2000,
        recommendedHeight: 1625,
        maxBytes: MAX_GRAPHIC_UPLOAD_BYTES,
        defaultTexturePath: '/textures/10x10_booths/bm108-backwall.jpg',
      },
    ],
  },
  BM109: {
    modelPath: '/models/booths/bm109.glb',
    includedAccessories: [],
    defaultAddOns: [
      { addOnId: 'octanorm-counter' },
      { addOnId: 'octanorm-table' },
      { addOnId: 'tv-55', position: [0.75, 0.07, -0.07] },
    ],
    graphicZones: [
      {
        id: 'backwall',
        label: 'Back Wall Graphic',
        materialName: 'BM109_graphic_backwall',
        recommendedWidth: 2000,
        recommendedHeight: 1625,
        maxBytes: MAX_GRAPHIC_UPLOAD_BYTES,
        defaultTexturePath: '/textures/10x10_booths/bm109-backwall.jpg',
      },
    ],
  },
  BM110: {
    modelPath: '/models/booths/bm110.glb',
    defaultAddOns: [
      { addOnId: 'slim-counter' },
      {
        addOnId: 'shelf',
        position: [-1.27, 0, 0],
        rotation: [0, Math.PI / 2, 0],
        settings: { quantity: 3 },
      },
      {
        addOnId: 'tv-55',
        position: [0.03, 0.01, -0.10],
      },
    ],
    graphicZones: [
      {
        id: 'backwall',
        label: 'Back Wall Graphic',
        materialName: 'BM110_graphic_backwall',
        recommendedWidth: 2000,
        recommendedHeight: 1625,
        maxBytes: MAX_GRAPHIC_UPLOAD_BYTES,
        defaultTexturePath: '/textures/10x10_booths/bm110-backwall.jpg',
      },
      {
        id: 'return',
        label: 'Return Graphic',
        materialName: 'BM110_graphic_return',
        recommendedWidth: 2000,
        recommendedHeight: 1632,
        maxBytes: MAX_GRAPHIC_UPLOAD_BYTES,
        defaultTexturePath: '/textures/10x10_booths/bm110-return.jpg',
      },
    ],
  },
}

const PREVIEW_ACCENTS = ['#2f6f73', '#5f6470', '#214670', '#7a5c33', '#4f5f80']
const PREVIEW_WALLS = [
  'left-return',
  'header',
  'backwall',
  'split-backwall',
  'wide-header',
]

function createBooth({ codeNumber, size }) {
  const code = `BM${codeNumber}`
  const boothOverrides = BOOTH_OVERRIDES[code] ?? {}
  const sizeFolder = size === '10x20' ? '10x20' : '10x10'
  const recommendedTemplateWidth = size === '10x20' ? 10200 : 5400
  const previewIndex = codeNumber % PREVIEW_ACCENTS.length

  return {
    id: code.toLowerCase(),
    name: `BeMatrix Rental Exhibit ${codeNumber}`,
    code,
    size,
    type: 'BeMatrix rental exhibit',
    description:
      size === '10x20'
        ? 'A 10x20 BeMatrix rental exhibit package with a branded backwall and included reception counter.'
        : 'A 10x10 BeMatrix rental exhibit package with a branded backwall and included reception counter.',
    modelPath: BM101_MODEL_PATH,
    thumbnailPath: `/thumbnails/booths/${sizeFolder}/${code}-View-1_Thumbnail.jpg`,
    templatePath: `/templates/${code.toLowerCase()}-graphic-template.pdf`,
    recommendedTemplateWidth,
    recommendedTemplateHeight: 2400,
    graphicZones: defaultBoothGraphicZones,
    defaultAddOns: [],
    includedAccessories: [INCLUDED_COUNTER],
    preview: {
      walls: PREVIEW_WALLS[previewIndex],
      accent: PREVIEW_ACCENTS[previewIndex],
    },
    ...boothOverrides,
  }
}

export const booths = [
  ...Array.from({ length: 10 }, (_, index) =>
    createBooth({ codeNumber: 101 + index, size: '10x10' }),
  ),
  ...Array.from({ length: 10 }, (_, index) =>
    createBooth({ codeNumber: 201 + index, size: '10x20' }),
  ),
]

export function getBoothsBySize(size) {
  return booths.filter((booth) => booth.size === size)
}

export function getDefaultBooth(size = boothSizes[0].value) {
  return getBoothsBySize(size)[0] ?? booths[0]
}
