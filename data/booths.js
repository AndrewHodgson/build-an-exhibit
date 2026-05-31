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
    includedAccessories: [INCLUDED_COUNTER],
    preview: {
      walls: PREVIEW_WALLS[previewIndex],
      accent: PREVIEW_ACCENTS[previewIndex],
    },
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
