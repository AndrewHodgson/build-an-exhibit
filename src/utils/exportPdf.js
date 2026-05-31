const LOGO_PATH = '/images/SourceOne-Logo-RGB.svg'

function findCapture(captures, id) {
  return captures.find((capture) => capture.id === id)
}

function addFittedImage(doc, imageData, x, y, maxWidth, maxHeight, format = 'JPEG') {
  const imageProperties = doc.getImageProperties(imageData)
  const ratio = imageProperties.width / imageProperties.height
  let width = maxWidth
  let height = width / ratio

  if (height > maxHeight) {
    height = maxHeight
    width = height * ratio
  }

  const offsetX = x + (maxWidth - width) / 2
  const offsetY = y + (maxHeight - height) / 2

  doc.addImage(imageData, format, offsetX, offsetY, width, height)

  return { width, height, x: offsetX, y: offsetY }
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

export async function createBoothSummaryPdf({
  booth,
  flooring,
  graphicUploads,
  captures,
}) {
  const { default: jsPDF } = await import('jspdf')
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
  const includedAccessories =
    booth.includedAccessories?.map((accessory) => accessory.name).join(', ') || 'None'

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
    ['Included Accessories', includedAccessories],
    ['Backwall Graphic', formatGraphicStatus(graphicUploads.backwall)],
    ['Counter Graphic', formatGraphicStatus(graphicUploads.counter)],
    ['Additional Furniture', 'None'],
  ]
  const labelWidth = 118
  const valueWidth = contentWidth - labelWidth
  let rowY = detailsY + 22

  detailRows.forEach(([label, value]) => {
    rowY +=
      addDetailRow(doc, `${label}:`, value, margin, rowY, labelWidth, valueWidth) + 2
  })

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

  doc.save(`${booth.code}-summary.pdf`)
}
