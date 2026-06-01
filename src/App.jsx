import { useEffect, useMemo, useRef, useState } from 'react'
import { boothSizes, getBoothsBySize, getDefaultBooth } from '../data/booths.js'
import { defaultFlooringId, getFlooringById } from '../data/flooring.js'
import {
  emptyGraphicUploads,
  getGraphicZoneById,
  graphicZones,
} from '../data/graphicZones.js'
import CanvasScene from './components/CanvasScene.jsx'
import CounterPlacementControls from './components/CounterPlacementControls.jsx'
import CropModal from './components/CropModal.jsx'
import RightPanel from './components/RightPanel.jsx'
import WelcomeModal from './components/WelcomeModal.jsx'
import { createBoothSummaryPdf } from './utils/exportPdf.js'

const ASPECT_RATIO_TOLERANCE = 0.01
const COUNTER_MOVE_STEP = 0.1
const COUNTER_ROTATION_STEP = Math.PI / 12

function isSupportedGraphicFile(file) {
  return (
    file.type === 'image/jpeg' ||
    file.type === 'image/png' ||
    /\.(jpe?g|png)$/i.test(file.name)
  )
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.addEventListener(
      'load',
      () => {
        const image = new Image()

        image.addEventListener(
          'load',
          () =>
            resolve({
              imageSrc: reader.result,
              width: image.naturalWidth,
              height: image.naturalHeight,
            }),
          { once: true },
        )
        image.addEventListener('error', reject, { once: true })
        image.src = reader.result
      },
      { once: true },
    )
    reader.addEventListener('error', reject, { once: true })
    reader.readAsDataURL(file)
  })
}

function getUploadWarning(zone, width, height) {
  if (width < zone.recommendedWidth || height < zone.recommendedHeight) {
    return `Image is ${width} x ${height}px and may appear blurry. Recommended: ${zone.recommendedWidth} x ${zone.recommendedHeight}px.`
  }

  return ''
}

function createGraphicUpload(zone, fileName, textureUrl, width, height, warning, wasCropped) {
  return {
    zoneId: zone.id,
    fileName,
    textureUrl,
    width,
    height,
    warning,
    wasCropped,
  }
}

function createDefaultAccessoryPlacements(booth) {
  return Object.fromEntries(
    (booth.includedAccessories ?? []).map((accessory) => [
      accessory.id,
      {
        position: [...accessory.position],
        rotation: [...accessory.rotation],
      },
    ]),
  )
}

export default function App() {
  const defaultBooth = getDefaultBooth()
  const sceneRef = useRef(null)
  const [selectedSize, setSelectedSize] = useState(defaultBooth.size)
  const [selectedBoothId, setSelectedBoothId] = useState(defaultBooth.id)
  const [selectedFlooringId, setSelectedFlooringId] = useState(defaultFlooringId)
  const [accessoryPlacements, setAccessoryPlacements] = useState(() =>
    createDefaultAccessoryPlacements(defaultBooth),
  )
  const [selectedAccessoryId, setSelectedAccessoryId] = useState(null)
  const [graphicUploads, setGraphicUploads] = useState(emptyGraphicUploads)
  const [graphicErrors, setGraphicErrors] = useState(emptyGraphicUploads)
  const [cropRequest, setCropRequest] = useState(null)
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(true)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [exportStatus, setExportStatus] = useState('')
  const graphicUploadsRef = useRef(graphicUploads)

  const availableBooths = useMemo(() => getBoothsBySize(selectedSize), [selectedSize])
  const selectedFlooring = useMemo(
    () => getFlooringById(selectedFlooringId),
    [selectedFlooringId],
  )
  const selectedBooth =
    availableBooths.find((booth) => booth.id === selectedBoothId) ??
    availableBooths[0] ??
    defaultBooth
  const activeCounter = selectedBooth.includedAccessories?.[0]

  function revokeGraphicUrl(upload) {
    if (upload?.textureUrl) {
      URL.revokeObjectURL(upload.textureUrl)
    }
  }

  function clearGraphicUploads() {
    setGraphicUploads((currentUploads) => {
      Object.values(currentUploads).forEach(revokeGraphicUrl)
      return { ...emptyGraphicUploads }
    })
    setGraphicErrors({ ...emptyGraphicUploads })
    setCropRequest(null)
  }

  function resetAccessoryPlacements(booth) {
    if (!booth) {
      return
    }

    setAccessoryPlacements(createDefaultAccessoryPlacements(booth))
  }

  function selectSize(size) {
    const nextBooth = getDefaultBooth(size)

    if (size !== selectedSize) {
      clearGraphicUploads()
    }

    resetAccessoryPlacements(nextBooth)
    setSelectedAccessoryId(null)
    setSelectedSize(size)
    setSelectedBoothId(nextBooth.id)
  }

  function selectBooth(boothId) {
    if (boothId !== selectedBoothId) {
      clearGraphicUploads()
      resetAccessoryPlacements(availableBooths.find((booth) => booth.id === boothId))
      setSelectedAccessoryId(null)
    }

    setSelectedBoothId(boothId)
  }

  function completeWelcome({ size, boothId }) {
    const nextBooth =
      getBoothsBySize(size).find((booth) => booth.id === boothId) ?? getDefaultBooth(size)

    if (size !== selectedSize || boothId !== selectedBoothId) {
      clearGraphicUploads()
      resetAccessoryPlacements(nextBooth)
      setSelectedAccessoryId(null)
    }

    setSelectedSize(size)
    setSelectedBoothId(boothId)
    setIsWelcomeOpen(false)
  }

  function setGraphicError(zoneId, message) {
    setGraphicErrors((currentErrors) => ({
      ...currentErrors,
      [zoneId]: message,
    }))
  }

  function setGraphicUpload(zone, upload) {
    setGraphicUploads((currentUploads) => {
      revokeGraphicUrl(currentUploads[zone.id])

      return {
        ...currentUploads,
        [zone.id]: upload,
      }
    })
    setGraphicError(zone.id, '')
  }

  async function handleGraphicFile(zoneId, file) {
    if (!file) {
      return
    }

    const zone = getGraphicZoneById(zoneId)

    if (!zone) {
      return
    }

    if (!isSupportedGraphicFile(file)) {
      setGraphicError(zone.id, 'Please upload a JPG or PNG file.')
      return
    }

    if (file.size > zone.maxBytes) {
      setGraphicError(
        zone.id,
        'File is too large. JPG and PNG uploads must be 4 MB or smaller.',
      )
      return
    }

    let imageDetails

    try {
      imageDetails = await readImageFile(file)
    } catch {
      setGraphicError(
        zone.id,
        'Unable to read that JPG or PNG. Please choose a different file.',
      )
      return
    }
    const warning = getUploadWarning(zone, imageDetails.width, imageDetails.height)
    const requiredRatio = zone.recommendedWidth / zone.recommendedHeight
    const imageRatio = imageDetails.width / imageDetails.height
    const ratioMatches =
      Math.abs(imageRatio - requiredRatio) / requiredRatio <= ASPECT_RATIO_TOLERANCE

    if (ratioMatches) {
      setGraphicUpload(
        zone,
        createGraphicUpload(
          zone,
          file.name,
          URL.createObjectURL(file),
          imageDetails.width,
          imageDetails.height,
          warning,
          false,
        ),
      )
      return
    }

    setCropRequest({
      zone,
      fileName: file.name,
      imageSrc: imageDetails.imageSrc,
      width: imageDetails.width,
      height: imageDetails.height,
      warning,
    })
    setGraphicError(zone.id, '')
  }

  function applyCroppedGraphic(textureUrl) {
    if (!cropRequest) {
      return
    }

    setGraphicUpload(
      cropRequest.zone,
      createGraphicUpload(
        cropRequest.zone,
        cropRequest.fileName,
        textureUrl,
        cropRequest.zone.recommendedWidth,
        cropRequest.zone.recommendedHeight,
        cropRequest.warning,
        true,
      ),
    )
    setCropRequest(null)
  }

  function clearGraphicUpload(zoneId) {
    const zone = getGraphicZoneById(zoneId)

    if (!zone) {
      return
    }

    setGraphicUploads((currentUploads) => {
      revokeGraphicUrl(currentUploads[zone.id])

      return {
        ...currentUploads,
        [zone.id]: null,
      }
    })
    setGraphicError(zone.id, '')
  }

  function updateCounterPlacement(updater) {
    if (!activeCounter) {
      return
    }

    setAccessoryPlacements((currentPlacements) => {
      const currentPlacement = currentPlacements[activeCounter.id] ?? {
        position: [...activeCounter.position],
        rotation: [...activeCounter.rotation],
      }

      return {
        ...currentPlacements,
        [activeCounter.id]: updater(currentPlacement),
      }
    })
  }

  function moveCounter(direction) {
    const deltas = {
      left: [-COUNTER_MOVE_STEP, 0],
      right: [COUNTER_MOVE_STEP, 0],
      forward: [0, COUNTER_MOVE_STEP],
      back: [0, -COUNTER_MOVE_STEP],
    }
    const [deltaX, deltaZ] = deltas[direction] ?? [0, 0]

    updateCounterPlacement((currentPlacement) => ({
      ...currentPlacement,
      position: [
        currentPlacement.position[0] + deltaX,
        currentPlacement.position[1],
        currentPlacement.position[2] + deltaZ,
      ],
    }))
  }

  function rotateCounter(direction) {
    const deltaY =
      direction === 'clockwise' ? -COUNTER_ROTATION_STEP : COUNTER_ROTATION_STEP

    updateCounterPlacement((currentPlacement) => ({
      ...currentPlacement,
      rotation: [
        currentPlacement.rotation[0],
        currentPlacement.rotation[1] + deltaY,
        currentPlacement.rotation[2],
      ],
    }))
  }

  function resetCounterPlacement() {
    if (!activeCounter) {
      return
    }

    setAccessoryPlacements((currentPlacements) => ({
      ...currentPlacements,
      [activeCounter.id]: {
        position: [...activeCounter.position],
        rotation: [...activeCounter.rotation],
      },
    }))
  }

  async function exportPdf() {
    if (!sceneRef.current || isExportingPdf) {
      return
    }

    setIsExportingPdf(true)
    setExportStatus('Preparing PDF views...')

    try {
      await new Promise((resolve) => {
        requestAnimationFrame(resolve)
      })
      await new Promise((resolve) => {
        requestAnimationFrame(resolve)
      })

      const captures = await sceneRef.current.capturePresetViews()

      setExportStatus('Building PDF...')
      await createBoothSummaryPdf({
        booth: selectedBooth,
        flooring: selectedFlooring,
        graphicUploads,
        captures,
      })
      setExportStatus('PDF downloaded.')
    } catch (error) {
      console.error('Unable to export PDF.', error)
      setExportStatus('Unable to export PDF. Please try again.')
    } finally {
      setIsExportingPdf(false)
    }
  }

  useEffect(() => {
    graphicUploadsRef.current = graphicUploads
  }, [graphicUploads])

  useEffect(() => {
    return () => {
      Object.values(graphicUploadsRef.current).forEach(revokeGraphicUrl)
    }
  }, [])

  return (
    <main className="app-shell">
      <section className="scene-layer" aria-label="3D rental exhibit preview">
        <CanvasScene
          ref={sceneRef}
          booth={selectedBooth}
          flooring={selectedFlooring}
          graphicUploads={graphicUploads}
          accessoryPlacements={accessoryPlacements}
          selectedAccessoryId={selectedAccessoryId}
          onAccessorySelect={setSelectedAccessoryId}
          onSceneDeselect={() => setSelectedAccessoryId(null)}
          hideSelectionOutline={isExportingPdf}
          hideGrid={isExportingPdf}
        />
      </section>

      <div className="orbit-hint" aria-hidden="true">
        <p>Left click + drag: orbit / rotate</p>
        <p>Scroll wheel: zoom in / out</p>
      </div>

      {activeCounter &&
        selectedAccessoryId === activeCounter.id &&
        !isWelcomeOpen &&
        !isExportingPdf && (
          <CounterPlacementControls
            accessoryName={activeCounter.name}
            onMove={moveCounter}
            onRotate={rotateCounter}
            onReset={resetCounterPlacement}
          />
        )}

      <RightPanel
        boothSizes={boothSizes}
        booths={availableBooths}
        selectedSize={selectedSize}
        selectedBooth={selectedBooth}
        selectedFlooringId={selectedFlooring.id}
        graphicZones={graphicZones}
        graphicUploads={graphicUploads}
        graphicErrors={graphicErrors}
        onSizeChange={selectSize}
        onBoothChange={selectBooth}
        onFlooringChange={setSelectedFlooringId}
        onGraphicFileChange={handleGraphicFile}
        onGraphicClear={clearGraphicUpload}
        onExportPdf={exportPdf}
        isExportingPdf={isExportingPdf}
        exportStatus={exportStatus}
      />

      {isWelcomeOpen && (
        <WelcomeModal
          boothSizes={boothSizes}
          initialSize={selectedSize}
          initialBoothId={selectedBooth.id}
          onComplete={completeWelcome}
        />
      )}

      {cropRequest && (
        <CropModal
          cropRequest={cropRequest}
          onApply={applyCroppedGraphic}
          onCancel={() => setCropRequest(null)}
        />
      )}
    </main>
  )
}
