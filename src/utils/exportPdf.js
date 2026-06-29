const LOGO_PATH = '/images/SourceOne-Logo-RGB.svg'

function findCapture(captures, id) {
  return captures.find((capture) => capture.id === id)
}

function fitImageContain(imageWidth, imageHeight, boxX, boxY, boxWidth, boxHeight) {
  const ratio = imageWidth / imageHeight
  let width = boxWidth
  let height = width / ratio

  if (height > boxHeight) {
    height = boxHeight
    width = height * ratio
  }

  return {
    x: boxX + (boxWidth - width) / 2,
    y: boxY + (boxHeight - height) / 2,
    width,
    height,
  }
}

function getImageDimensions(doc, imageData, dimensions) {
  if (dimensions?.width && dimensions?.height) {
    return dimensions
  }

  const imageProperties = doc.getImageProperties(imageData)

  return {
    width: imageProperties.width,
    height: imageProperties.height,
  }
}

function addFittedImage(
  doc,
  imageData,
  x,
  y,
  maxWidth,
  maxHeight,
  format = 'JPEG',
  dimensions,
  viewName,
) {
  const imageDimensions = getImageDimensions(doc, imageData, dimensions)
  const placement = fitImageContain(
    imageDimensions.width,
    imageDimensions.height,
    x,
    y,
    maxWidth,
    maxHeight,
  )

  if (import.meta.env?.DEV && viewName) {
    console.info(
      `PDF export ${viewName}: captured ${imageDimensions.width}x${imageDimensions.height} ` +
        `(aspect ${Number((imageDimensions.width / imageDimensions.height).toFixed(4))}), ` +
        `box ${maxWidth}x${maxHeight}, ` +
        `draw ${Number(placement.width.toFixed(2))}x${Number(placement.height.toFixed(2))} ` +
        `(aspect ${Number((placement.width / placement.height).toFixed(4))})`,
    )
  }

  doc.addImage(
    imageData,
    format,
    placement.x,
    placement.y,
    placement.width,
    placement.height,
  )

  return placement
}

function formatGraphicStatus(upload) {
  if (!upload) {
    return 'Default'
  }

  return `Uploaded: ${upload.fileName}`
}

function addDetailRow(doc, label, value, x, y, labelWidth, valueWidth) {
  const text = String(value || 'None')
  const lines = doc.splitTextToSize(text, valueWidth)

  doc.setFont('helvetica', 'bold')
  doc.text(label, x, y)
  doc.setFont('helvetica', 'normal')
  doc.text(lines, x + labelWidth, y)

  return Math.max(13, lines.length * 10)
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()

    image.addEventListener('load', () => resolve(image), { once: true })
    image.addEventListener('error', reject, { once: true })
    image.src = src
  })
}

async function loadLogoDataUrl() {
  const response = await fetch(LOGO_PATH)

  if (!response.ok) {
    throw new Error('Unable to load SourceOne logo for PDF export.')
  }

  const svg = await response.text()
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const objectUrl = URL.createObjectURL(blob)

  try {
    const image = await loadImage(objectUrl)
    const width = image.naturalWidth || 340
    const height = image.naturalHeight || 92
    const canvas = document.createElement('canvas')
    const scale = 2

    canvas.width = width * scale
    canvas.height = height * scale

    const context = canvas.getContext('2d')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    return {
      dataUrl: canvas.toDataURL('image/png'),
      width,
      height,
    }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function addImageFrame(doc, x, y, width, height) {
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(x, y, width, height, 5, 5, 'F')
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(x, y, width, height, 5, 5, 'S')
}

function addImageLabel(doc, label, x, y) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(75, 85, 99)
  doc.text(label, x, y)
}

function getAccessorySummaryKey(accessory) {
  return (
    accessory.summaryKey ??
    accessory.addOnId ??
    accessory.catalogId ??
    `${accessory.type ?? 'accessory'}:${accessory.modelPath ?? accessory.name}`
  )
}

function getAccessorySummaryName(accessory) {
  return accessory.summaryName ?? accessory.catalogName ?? accessory.name ?? 'Accessory'
}

function hasUploadedGraphic(accessory, graphicUploads) {
  return (accessory.graphicZones ?? []).some((zone) => graphicUploads[zone.id])
}

export function createAccessorySummaryItems(
  accessories = [],
  addOnSettings = {},
  graphicUploads = {},
) {
  const typeCounts = new Map()

  accessories.forEach((accessory) => {
    const key = getAccessorySummaryKey(accessory)
    typeCounts.set(key, (typeCounts.get(key) ?? 0) + 1)
  })

  const typeOrdinals = new Map()

  return accessories.map((accessory) => {
    const key = getAccessorySummaryKey(accessory)
    const count = typeCounts.get(key) ?? 1
    const ordinal = (typeOrdinals.get(key) ?? 0) + 1
    typeOrdinals.set(key, ordinal)
    const settings = addOnSettings[accessory.id] ?? {}
    const summaryFields = accessory.summaryFields ?? []
    const name = `${getAccessorySummaryName(accessory)}${count > 1 ? ` #${ordinal}` : ''}`
    const details = summaryFields.flatMap((field) => {
      const value = settings[field.setting] ?? accessory[field.defaultProperty]

      if (value === undefined || value === null || value === '') {
        return []
      }

      return [`${field.label}: ${value}${field.suffix ?? ''}`]
    })

    if (details.length === 0 && count === 1) {
      details.push('1')
    }

    if ((accessory.graphicZones ?? []).length > 0) {
      details.push(
        hasUploadedGraphic(accessory, graphicUploads)
          ? 'Graphic uploaded'
          : 'No graphic uploaded',
      )
    }

    return [name, ...details].join(' - ')
  })
}

function addFooter(doc, margin, pageWidth, pageHeight) {
  doc.setDrawColor(229, 231, 235)
  doc.line(margin, pageHeight - 47, pageWidth - margin, pageHeight - 47)
  doc.setTextColor(107, 114, 128)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.text(
    'Preview only. Uploaded graphics are not considered final production artwork.',
    margin,
    pageHeight - 31,
  )
}

export async function buildBoothSummaryPdf({
  booth,
  flooring,
  graphicUploads = {},
  accessories = [],
  addOnSettings = {},
  captures = [],
}) {
  const jsPdfModule = await import('jspdf')
  const jsPDF = jsPdfModule.jsPDF ?? jsPdfModule.default?.jsPDF ?? jsPdfModule.default
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 34
  const contentWidth = pageWidth - margin * 2
  const gap = 12
  const logoMaxWidth = 150
  const logoMaxHeight = 34
  const imageBlockY = 88
  const imageBlockHeight = 252
  const rightColumnWidth = 168
  const leftColumnWidth = contentWidth - rightColumnWidth - gap
  const stackedImageHeight = (imageBlockHeight - gap) / 2
  const perspectiveCapture = findCapture(captures, 'perspective')
  const frontCapture = findCapture(captures, 'front')
  const topCapture = findCapture(captures, 'top')
  const accessorySummaryItems = createAccessorySummaryItems(
    accessories,
    addOnSettings,
    graphicUploads,
  )

  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

  try {
    const logo = await loadLogoDataUrl()

    addFittedImage(
      doc,
      logo.dataUrl,
      margin,
      30,
      logoMaxWidth,
      logoMaxHeight,
      'PNG',
      {
        width: logo.width,
        height: logo.height,
      },
    )
  } catch {
    doc.setTextColor(33, 70, 112)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.text('SourceOne Events', margin, 47)
  }

  doc.setTextColor(33, 70, 112)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Build an Exhibit Summary', margin + 174, 40)

  doc.setTextColor(75, 85, 99)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`${booth.name} · ${booth.code}`, margin + 174, 56)

  addImageFrame(doc, margin, imageBlockY, leftColumnWidth, imageBlockHeight)
  addImageFrame(
    doc,
    margin + leftColumnWidth + gap,
    imageBlockY,
    rightColumnWidth,
    stackedImageHeight,
  )
  addImageFrame(
    doc,
    margin + leftColumnWidth + gap,
    imageBlockY + stackedImageHeight + gap,
    rightColumnWidth,
    stackedImageHeight,
  )

  if (perspectiveCapture) {
    addFittedImage(
      doc,
      perspectiveCapture.dataUrl,
      margin + 4,
      imageBlockY + 14,
      leftColumnWidth - 8,
      imageBlockHeight - 18,
      'JPEG',
      {
        width: perspectiveCapture.width,
        height: perspectiveCapture.height,
      },
      perspectiveCapture.id,
    )
  }

  if (frontCapture) {
    addFittedImage(
      doc,
      frontCapture.dataUrl,
      margin + leftColumnWidth + gap + 4,
      imageBlockY + 14,
      rightColumnWidth - 8,
      stackedImageHeight - 18,
      'JPEG',
      {
        width: frontCapture.width,
        height: frontCapture.height,
      },
      frontCapture.id,
    )
  }

  if (topCapture) {
    addFittedImage(
      doc,
      topCapture.dataUrl,
      margin + leftColumnWidth + gap + 4,
      imageBlockY + stackedImageHeight + gap + 14,
      rightColumnWidth - 8,
      stackedImageHeight - 18,
      'JPEG',
      {
        width: topCapture.width,
        height: topCapture.height,
      },
      topCapture.id,
    )
  }

  addImageLabel(doc, 'Perspective', margin + 9, imageBlockY + 12)
  addImageLabel(
    doc,
    'Front',
    margin + leftColumnWidth + gap + 8,
    imageBlockY + 12,
  )
  addImageLabel(
    doc,
    'Top',
    margin + leftColumnWidth + gap + 8,
    imageBlockY + stackedImageHeight + gap + 12,
  )

  const detailsY = imageBlockY + imageBlockHeight + 30

  doc.setDrawColor(217, 222, 231)
  doc.line(margin, detailsY - 17, pageWidth - margin, detailsY - 17)

  doc.setTextColor(17, 24, 39)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Booth Details', margin, detailsY)

  doc.setTextColor(55, 65, 81)
  doc.setFontSize(8.8)

  const detailRows = [
    ['Booth Name', booth.name],
    ['Booth Code', booth.code],
    ['Booth Description', booth.description],
    ['Booth Size', booth.size],
    ['Booth Type', booth.type],
    ['Carpet / Flooring', flooring.label],
    ['Backwall Graphic', formatGraphicStatus(graphicUploads.backwall)],
    ['Counter Graphic', formatGraphicStatus(graphicUploads.counter)],
  ]
  const labelWidth = 118
  const valueWidth = contentWidth - labelWidth
  let rowY = detailsY + 22

  detailRows.forEach(([label, value]) => {
    rowY +=
      addDetailRow(doc, `${label}:`, value, margin, rowY, labelWidth, valueWidth) + 2
  })

  const summaryItems = accessorySummaryItems.length ? accessorySummaryItems : ['None']
  const footerLimit = pageHeight - 65
  let summaryY = rowY + 20

  function addSummaryHeading(isContinuation = false) {
    doc.setDrawColor(217, 222, 231)
    doc.line(margin, summaryY - 14, pageWidth - margin, summaryY - 14)
    doc.setTextColor(17, 24, 39)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(
      `Add-Ons / Furniture${isContinuation ? ' (continued)' : ''}`,
      margin,
      summaryY,
    )
    summaryY += 21
  }

  function continueSummaryOnNewPage() {
    doc.addPage()
    summaryY = 48
    addSummaryHeading(true)
  }

  if (summaryY + 34 > footerLimit) {
    continueSummaryOnNewPage()
  } else {
    addSummaryHeading()
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.8)
  doc.setTextColor(55, 65, 81)

  summaryItems.forEach((item) => {
    const lines = doc.splitTextToSize(item, contentWidth - 14)
    const itemHeight = Math.max(14, lines.length * 10 + 4)

    if (summaryY + itemHeight > footerLimit) {
      continueSummaryOnNewPage()
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.8)
      doc.setTextColor(55, 65, 81)
    }

    doc.text('-', margin + 2, summaryY)
    doc.text(lines, margin + 14, summaryY)
    summaryY += itemHeight
  })

  const pageCount = doc.getNumberOfPages()

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    doc.setPage(pageNumber)
    addFooter(doc, margin, pageWidth, pageHeight)
    doc.text(`Page ${pageNumber} of ${pageCount}`, pageWidth - margin, pageHeight - 31, {
      align: 'right',
    })
  }

  return doc
}

export async function createBoothSummaryPdf(options) {
  const doc = await buildBoothSummaryPdf(options)

  doc.save(`${options.booth.code}-summary.pdf`)
}
