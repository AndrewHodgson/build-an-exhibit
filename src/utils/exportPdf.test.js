import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createDefaultAddOnInstances,
  createDefaultAddOnSettings,
  createManualAddOnInstance,
  getActiveAccessories,
} from '../../data/addOns.js'
import { getBoothsBySize } from '../../data/booths.js'
import { createAccessorySummaryItems, createGraphicDetailRows } from './exportPdf.js'

function getBooth(code) {
  return [...getBoothsBySize('10x10'), ...getBoothsBySize('10x20')].find(
    (booth) => booth.code === code,
  )
}

test('summarizes booth defaults with shelf quantity and TV size', () => {
  const booth = getBooth('BM108')
  const instances = createDefaultAddOnInstances(booth)
  const settings = createDefaultAddOnSettings(instances)
  const accessories = getActiveAccessories(booth, instances)

  assert.deepEqual(createAccessorySummaryItems(accessories, settings), [
    'Reception counter - 1 - No graphic uploaded',
    'Shelf - Quantity: 3',
  ])

  const tvBooth = getBooth('BM109')
  const tvInstances = createDefaultAddOnInstances(tvBooth)
  const tvSettings = createDefaultAddOnSettings(tvInstances)
  const tvAccessories = getActiveAccessories(tvBooth, tvInstances)

  assert.ok(
    createAccessorySummaryItems(tvAccessories, tvSettings).includes(
      'TV - Size: 55in - No graphic uploaded',
    ),
  )
})

test('summarizes manual counters, shelves, multiple TVs, and graphics', () => {
  const booth = { includedAccessories: [] }
  const instances = [
    createManualAddOnInstance('standard-counter', 'standard-1'),
    createManualAddOnInstance('storage-counter', 'storage-1'),
    createManualAddOnInstance('slim-counter', 'slim-1'),
    createManualAddOnInstance('shelf', 'shelf-1'),
    createManualAddOnInstance('tv-55', 'tv-1'),
    createManualAddOnInstance('tv-55', 'tv-2'),
  ]
  const settings = createDefaultAddOnSettings(instances)
  settings['shelf-1'] = { quantity: 4 }
  settings['tv-2'] = { size: 65 }
  const accessories = getActiveAccessories(booth, instances)
  const storageGraphicZone = accessories
    .find((accessory) => accessory.id === 'storage-1')
    .graphicZones[0].id
  const firstTvGraphicZone = accessories
    .find((accessory) => accessory.id === 'tv-1')
    .graphicZones[0].id
  const uploads = {
    [storageGraphicZone]: { fileName: 'storage-art.png' },
    [firstTvGraphicZone]: { fileName: 'tv-art.png' },
  }

  assert.deepEqual(createAccessorySummaryItems(accessories, settings, uploads), [
    'Standard Counter - 1 - No graphic uploaded',
    'Storage Counter - 1 - Graphic uploaded',
    'Slim Counter - 1 - No graphic uploaded',
    'Shelf - Quantity: 4',
    'TV #1 - Size: 55in - Graphic uploaded',
    'TV #2 - Size: 65in - No graphic uploaded',
  ])
})

test('supports empty booths and future furniture metadata', () => {
  assert.deepEqual(createAccessorySummaryItems(), [])

  const furniture = {
    id: 'chair-1',
    name: 'Lounge Chair',
    catalogId: 'lounge-chair',
    summaryFields: [
      { setting: 'quantity', defaultProperty: 'defaultQuantity', label: 'Quantity' },
    ],
    defaultQuantity: 2,
  }

  assert.deepEqual(createAccessorySummaryItems([furniture]), [
    'Lounge Chair - Quantity: 2',
  ])
})

test('keeps stool and table colors per instance and includes them in details', () => {
  const booth = { includedAccessories: [] }
  const instances = [
    createManualAddOnInstance('ale-bar-stool', 'stool-1'),
    createManualAddOnInstance('ale-bar-stool', 'stool-2'),
    createManualAddOnInstance('brava-bar-table', 'table-1'),
    createManualAddOnInstance('brava-bar-table', 'table-2'),
  ]
  const settings = createDefaultAddOnSettings(instances)
  settings['stool-2'] = { color: 'White' }
  settings['table-1'] = { color: 'White' }
  const accessories = getActiveAccessories(booth, instances)

  assert.deepEqual(createAccessorySummaryItems(accessories, settings), [
    'Ale Bar Stool #1 - Color: Black',
    'Ale Bar Stool #2 - Color: White',
    'Brava Bar Table #1 - Tabletop color: White',
    'Brava Bar Table #2 - Tabletop color: Black',
  ])
})

test('creates independent white default stools for BM205 and BM206', () => {
  for (const [code, expectedCount] of [['BM205', 3], ['BM206', 6]]) {
    const booth = getBooth(code)
    const instances = createDefaultAddOnInstances(booth)
    const stoolInstances = instances.filter(
      (instance) => instance.addOnId === 'ale-bar-stool',
    )
    const accessories = getActiveAccessories(booth, instances)
    const stoolAccessories = accessories.filter(
      (accessory) => accessory.addOnId === 'ale-bar-stool',
    )
    const settings = createDefaultAddOnSettings(instances)

    assert.equal(stoolInstances.length, expectedCount)
    assert.equal(new Set(stoolInstances.map((instance) => instance.id)).size, expectedCount)
    assert.ok(stoolInstances.every((instance) => instance.settings.color === 'White'))
    assert.ok(
      createAccessorySummaryItems(stoolAccessories, settings).every((item) =>
        item.endsWith('Color: White'),
      ),
    )
  }
})

test('creates dynamic PDF graphic rows for multi-zone booths and accessories', () => {
  const booth = getBooth('BM205')
  const instances = [
    ...createDefaultAddOnInstances(booth),
    createManualAddOnInstance('standard-counter', 'standard-counter-1'),
  ]
  const accessories = getActiveAccessories(booth, instances)
  const counterZone = accessories.find(
    (accessory) => accessory.id === 'standard-counter-1',
  ).graphicZones[0]
  const rows = createGraphicDetailRows({
    booth,
    accessories,
    graphicUploads: {
      'left-wall': { fileName: 'left-wall-art.jpg' },
      [counterZone.id]: { fileName: 'counter-art.png' },
    },
  })

  assert.deepEqual(rows, [
    ['Left Wall Graphic', 'Uploaded: left-wall-art.jpg'],
    ['Right Wall Graphic', 'Default'],
    ['Counter Graphic', 'Default'],
    ['TV 1 — TV Screen Graphic', 'Default'],
    [counterZone.label, 'Uploaded: counter-art.png'],
  ])
  assert.equal(rows.some(([label]) => label === 'Backwall Graphic'), false)
})
