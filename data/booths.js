export const boothSizes = [
  {
    value: '10x10',
    label: '10 x 10',
    description: 'Compact BeMatrix rental exhibit options for single-booth footprints.',
  },
  {
    value: '10x20',
    label: '10 x 20',
    description: 'Linear BeMatrix rental exhibit options for expanded inline presence.',
  },
]

export const booths = [
  {
    id: 'bm100',
    name: 'BeMatrix Rental Exhibit 100',
    code: 'BM100',
    size: '10x10',
    type: 'BeMatrix rental exhibit',
    description:
      'A clean 10x10 inline exhibit starter layout with a branded backwall and open floor.',
    modelPath: '/models/bm100.glb',
    thumbnailPath: '/images/exhibits/bm100.jpg',
    templatePath: '/templates/bm100-graphic-template.pdf',
    recommendedTemplateWidth: 4800,
    recommendedTemplateHeight: 2400,
    preview: {
      walls: 'backwall',
      accent: '#214670',
    },
  },
  {
    id: 'bm101',
    name: 'BeMatrix Rental Exhibit 101',
    code: 'BM101',
    size: '10x10',
    type: 'BeMatrix rental exhibit',
    description:
      'A 10x10 exhibit with a partial return wall for a more dimensional product story.',
    modelPath: '/models/bm101.glb',
    thumbnailPath: '/images/exhibits/bm101.jpg',
    templatePath: '/templates/bm101-graphic-template.pdf',
    recommendedTemplateWidth: 5400,
    recommendedTemplateHeight: 2400,
    preview: {
      walls: 'left-return',
      accent: '#2f6f73',
    },
  },
  {
    id: 'bm102',
    name: 'BeMatrix Rental Exhibit 102',
    code: 'BM102',
    size: '10x10',
    type: 'BeMatrix rental exhibit',
    description:
      'A 10x10 rental exhibit concept with a simple header and reception counter zone.',
    modelPath: '/models/bm102.glb',
    thumbnailPath: '/images/exhibits/bm102.jpg',
    templatePath: '/templates/bm102-graphic-template.pdf',
    recommendedTemplateWidth: 4800,
    recommendedTemplateHeight: 2700,
    preview: {
      walls: 'header',
      accent: '#5f6470',
    },
  },
  {
    id: 'bm200',
    name: 'BeMatrix Rental Exhibit 200',
    code: 'BM200',
    size: '10x20',
    type: 'BeMatrix rental exhibit',
    description:
      'A 10x20 inline exhibit with a wide continuous graphic wall and open demo space.',
    modelPath: '/models/bm200.glb',
    thumbnailPath: '/images/exhibits/bm200.jpg',
    templatePath: '/templates/bm200-graphic-template.pdf',
    recommendedTemplateWidth: 9600,
    recommendedTemplateHeight: 2400,
    preview: {
      walls: 'wide-backwall',
      accent: '#214670',
    },
  },
  {
    id: 'bm201',
    name: 'BeMatrix Rental Exhibit 201',
    code: 'BM201',
    size: '10x20',
    type: 'BeMatrix rental exhibit',
    description:
      'A 10x20 rental exhibit with split feature walls and a central presentation area.',
    modelPath: '/models/bm201.glb',
    thumbnailPath: '/images/exhibits/bm201.jpg',
    templatePath: '/templates/bm201-graphic-template.pdf',
    recommendedTemplateWidth: 10200,
    recommendedTemplateHeight: 2400,
    preview: {
      walls: 'split-backwall',
      accent: '#2f6f73',
    },
  },
  {
    id: 'bm202',
    name: 'BeMatrix Rental Exhibit 202',
    code: 'BM202',
    size: '10x20',
    type: 'BeMatrix rental exhibit',
    description:
      'A 10x20 exhibit starter layout with a header element and balanced accessory zones.',
    modelPath: '/models/bm202.glb',
    thumbnailPath: '/images/exhibits/bm202.jpg',
    templatePath: '/templates/bm202-graphic-template.pdf',
    recommendedTemplateWidth: 9600,
    recommendedTemplateHeight: 2700,
    preview: {
      walls: 'wide-header',
      accent: '#5f6470',
    },
  },
]

export function getBoothsBySize(size) {
  return booths.filter((booth) => booth.size === size)
}

export function getDefaultBooth(size = boothSizes[0].value) {
  return getBoothsBySize(size)[0] ?? booths[0]
}
