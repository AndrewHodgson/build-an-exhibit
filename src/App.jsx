import { useEffect, useMemo, useRef, useState } from 'react'
import {
  addOns,
  ACCESSORY_ROTATION_STEP,
  createDefaultAddOnInstances,
  createDefaultAddOnSettings,
  createManualAddOnInstance,
  getActiveAccessories,
  getAddOnById,
  INCHES_TO_METERS,
} from '../data/addOns.js'
import { boothSizes, getBoothsBySize, getDefaultBooth } from '../data/booths.js'
import { defaultFlooringId, getFlooringById } from '../data/flooring.js'
import {
  createEmptyGraphicState,
  getGraphicZonesForBooth,
} from '../data/graphicZones.js'
import CanvasScene from './components/CanvasScene.jsx'
import CounterPlacementControls from './components/CounterPlacementControls.jsx'
import CropModal from './components/CropModal.jsx'
import RightPanel from './components/RightPanel.jsx'
import WelcomeModal from './components/WelcomeModal.jsx'
import { createBoothSummaryPdf } from './utils/exportPdf.js'

const ASPECT_RATIO_TOLERANCE = 0.01
const ACCESSORY_MOVE_STEP = 0.5 * INCHES_TO_METERS

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

function createDefaultAccessoryPlacements(accessories) {
  return Object.fromEntries(
    accessories.map((accessory) => [
      accessory.id,
      {
        position: [...accessory.position],
        rotation: [...accessory.rotation],
      },
    ]),
  )
}

function formatPositionCoordinate(value) {
  const rounded = Math.round((value ?? 0) * 100) / 100
  return (Object.is(rounded, -0) ? 0 : rounded).toFixed(2)
}

export default function App() {
  const defaultBooth = getDefaultBooth()
  const initialAddOnInstances = createDefaultAddOnInstances(defaultBooth)
  const initialAccessories = getActiveAccessories(defaultBooth, initialAddOnInstances)
  const sceneRef = useRef(null)
  const nextAddOnInstanceId = useRef(1)
  const [selectedSize, setSelectedSize] = useState(defaultBooth.size)
  const [selectedBoothId, setSelectedBoothId] = useState(defaultBooth.id)
  const [selectedFlooringId, setSelectedFlooringId] = useState(defaultFlooringId)
  const [addOnInstances, setAddOnInstances] = useState(initialAddOnInstances)
  const [addOnSettings, setAddOnSettings] = useState(() =>
    createDefaultAddOnSettings(initialAddOnInstances),
  )
  const [accessoryPlacements, setAccessoryPlacements] = useState(() =>
    createDefaultAccessoryPlacements(initialAccessories),
  )
  const [selectedAccessoryId, setSelectedAccessoryId] = useState(null)
  const [graphicUploads, setGraphicUploads] = useState(() =>
    createEmptyGraphicState(getGraphicZonesForBooth(defaultBooth, initialAccessories)),
  )
  const [graphicErrors, setGraphicErrors] = useState(() =>
    createEmptyGraphicState(getGraphicZonesForBooth(defaultBooth, initialAccessories)),
  )
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
  const activeAccessories = useMemo(
    () => getActiveAccessories(selectedBooth, addOnInstances),
    [addOnInstances, selectedBooth],
  )
  const graphicZones = useMemo(
    () => getGraphicZonesForBooth(selectedBooth, activeAccessories),
    [activeAccessories, selectedBooth],
  )
  const selectedAccessory = activeAccessories.find(
    (accessory) => accessory.id === selectedAccessoryId,
  )
  const selectedAccessoryPlacement = selectedAccessory
    ? accessoryPlacements[selectedAccessory.id] ?? selectedAccessory
    : null

  function revokeGraphicUrl(upload) {
    if (upload?.textureUrl) {
      URL.revokeObjectURL(upload.textureUrl)
    }
  }

  function clearGraphicUploads(nextBooth = selectedBooth, nextAccessories = activeAccessories) {
    const emptyGraphicState = createEmptyGraphicState(
      getGraphicZonesForBooth(nextBooth, nextAccessories),
    )

    setGraphicUploads((currentUploads) => {
      Object.values(currentUploads).forEach(revokeGraphicUrl)
      return emptyGraphicState
    })
    setGraphicErrors({ ...emptyGraphicState })
    setCropRequest(null)
  }

  function resetBoothAccessories(booth) {
    if (!booth) {
      return []
    }

    const nextAddOnInstances = createDefaultAddOnInstances(booth)
    const nextAccessories = getActiveAccessories(booth, nextAddOnInstances)

    setAddOnInstances(nextAddOnInstances)
    setAddOnSettings(createDefaultAddOnSettings(nextAddOnInstances))
    setAccessoryPlacements(createDefaultAccessoryPlacements(nextAccessories))

    return nextAccessories
  }

  function selectSize(size) {
    if (size === selectedSize) {
      return
    }

    const nextBooth = getDefaultBooth(size)
    const nextAccessories = resetBoothAccessories(nextBooth)

    clearGraphicUploads(nextBooth, nextAccessories)

    setSelectedAccessoryId(null)
    setSelectedSize(size)
    setSelectedBoothId(nextBooth.id)
  }

  function selectBooth(boothId) {
    const nextBooth = availableBooths.find((booth) => booth.id === boothId)

    if (boothId !== selectedBoothId) {
      const nextAccessories = resetBoothAccessories(nextBooth)
      clearGraphicUploads(nextBooth, nextAccessories)
      setSelectedAccessoryId(null)
    }

    setSelectedBoothId(boothId)
  }

  function completeWelcome({ size, boothId }) {
    const nextBooth =
      getBoothsBySize(size).find((booth) => booth.id === boothId) ?? getDefaultBooth(size)

    if (size !== selectedSize || boothId !== selectedBoothId) {
      const nextAccessories = resetBoothAccessories(nextBooth)
      clearGraphicUploads(nextBooth, nextAccessories)
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

    const zone = graphicZones.find((graphicZone) => graphicZone.id === zoneId)

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
    const zone = graphicZones.find((graphicZone) => graphicZone.id === zoneId)

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

  function addAddOn(addOnId) {
    const addOn = getAddOnById(addOnId)

    if (!addOn) {
      return
    }

    const instanceId = `manual-${addOnId}-${nextAddOnInstanceId.current}`
    nextAddOnInstanceId.current += 1
    const instance = createManualAddOnInstance(addOnId, instanceId)
    const nextInstances = [...addOnInstances, instance]
    const accessory = getActiveAccessories(selectedBooth, nextInstances).find(
      (item) => item.id === instanceId,
    )

    setAddOnInstances(nextInstances)
    setAddOnSettings((currentSettings) => ({
      ...currentSettings,
      [instanceId]: instance.settings,
    }))
    setAccessoryPlacements((currentPlacements) => ({
      ...currentPlacements,
      [instanceId]: {
        position: [...instance.position],
        rotation: [...instance.rotation],
      },
    }))
    setGraphicUploads((currentUploads) => ({
      ...currentUploads,
      ...createEmptyGraphicState(accessory?.graphicZones ?? []),
    }))
    setGraphicErrors((currentErrors) => ({
      ...currentErrors,
      ...createEmptyGraphicState(accessory?.graphicZones ?? []),
    }))
    setSelectedAccessoryId(instanceId)
  }

  function removeAddOn(instanceId) {
    const accessory = activeAccessories.find((item) => item.id === instanceId)

    setAddOnInstances((currentInstances) =>
      currentInstances.filter((instance) => instance.id !== instanceId),
    )
    setAddOnSettings((currentSettings) => {
      const nextSettings = { ...currentSettings }
      delete nextSettings[instanceId]
      return nextSettings
    })
    setAccessoryPlacements((currentPlacements) => {
      const nextPlacements = { ...currentPlacements }
      delete nextPlacements[instanceId]
      return nextPlacements
    })
    setGraphicUploads((currentUploads) => {
      const nextUploads = { ...currentUploads }
      ;(accessory?.graphicZones ?? []).forEach((zone) => {
        revokeGraphicUrl(nextUploads[zone.id])
        delete nextUploads[zone.id]
      })
      return nextUploads
    })
    setGraphicErrors((currentErrors) => {
      const nextErrors = { ...currentErrors }
      ;(accessory?.graphicZones ?? []).forEach((zone) => delete nextErrors[zone.id])
      return nextErrors
    })

    if (selectedAccessoryId === instanceId) {
      setSelectedAccessoryId(null)
    }
  }

  function updateAddOnSetting(instanceId, setting, value) {
    setAddOnSettings((currentSettings) => ({
      ...currentSettings,
      [instanceId]: {
        ...currentSettings[instanceId],
        [setting]: value,
      },
    }))
  }

  function updateAccessoryPlacement(accessoryId, updater) {
    setAccessoryPlacements((currentPlacements) => {
      const accessory = activeAccessories.find((item) => item.id === accessoryId)
      const currentPlacement = currentPlacements[accessoryId] ?? accessory

      if (!currentPlacement) {
        return currentPlacements
      }

      return {
        ...currentPlacements,
        [accessoryId]: updater(currentPlacement),
      }
    })
  }

  function updateSelectedAccessoryPlacement(updater) {
    if (selectedAccessory) {
      updateAccessoryPlacement(selectedAccessory.id, updater)
    }
  }

  function moveAccessory(direction) {
    const deltas = {
      left: [-ACCESSORY_MOVE_STEP, 0],
      right: [ACCESSORY_MOVE_STEP, 0],
      forward: [0, ACCESSORY_MOVE_STEP],
      back: [0, -ACCESSORY_MOVE_STEP],
    }
    const [deltaX, deltaZ] = deltas[direction] ?? [0, 0]

    updateSelectedAccessoryPlacement((currentPlacement) => ({
      ...currentPlacement,
      position: [
        currentPlacement.position[0] + deltaX,
        currentPlacement.position[1],
        currentPlacement.position[2] + deltaZ,
      ],
    }))
  }

  function transformAccessoryPosition(accessoryId, position) {
    updateAccessoryPlacement(accessoryId, (currentPlacement) => ({
      ...currentPlacement,
      position: [...position],
    }))
  }

  function rotateAccessoryById(accessoryId, direction) {
    const deltaY =
      direction === 'clockwise' ? -ACCESSORY_ROTATION_STEP : ACCESSORY_ROTATION_STEP

    updateAccessoryPlacement(accessoryId, (currentPlacement) => ({
      ...currentPlacement,
      rotation: [
        currentPlacement.rotation[0],
        currentPlacement.rotation[1] + deltaY,
        currentPlacement.rotation[2],
      ],
    }))
  }

  function setAccessoryRotation(accessoryId, rotation) {
    updateAccessoryPlacement(accessoryId, (currentPlacement) => ({
      ...currentPlacement,
      rotation,
    }))
  }

  function rotateAccessory(direction) {
    if (selectedAccessory) {
      rotateAccessoryById(selectedAccessory.id, direction)
    }
  }

  function resetAccessoryPlacement() {
    if (!selectedAccessory) {
      return
    }

    setAccessoryPlacements((currentPlacements) => ({
      ...currentPlacements,
      [selectedAccessory.id]: {
        position: [...selectedAccessory.position],
        rotation: [...selectedAccessory.rotation],
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
          accessories={activeAccessories}
          accessoryPlacements={accessoryPlacements}
          addOnSettings={addOnSettings}
          selectedAccessoryId={selectedAccessoryId}
          onAccessorySelect={setSelectedAccessoryId}
          onAccessoryPositionChange={transformAccessoryPosition}
          onAccessoryRotationChange={setAccessoryRotation}
          onSceneDeselect={() => setSelectedAccessoryId(null)}
          hideSelectionOutline={isExportingPdf}
          hideGrid={isExportingPdf}
        />
      </section>

      <div className="orbit-hint" aria-hidden="true">
        <p>Left click + drag: orbit / rotate</p>
        <p>Scroll wheel: zoom in / out</p>
      </div>

      {selectedAccessoryPlacement && (
        <output className="selected-position-indicator" aria-label="Selected position">
          <span>X: {formatPositionCoordinate(selectedAccessoryPlacement.position[0])}</span>
          <span>Y: {formatPositionCoordinate(selectedAccessoryPlacement.position[2])}</span>
          <span>Z: {formatPositionCoordinate(selectedAccessoryPlacement.position[1])}</span>
        </output>
      )}

      {selectedAccessory &&
        !isWelcomeOpen &&
        !isExportingPdf && (
          <CounterPlacementControls
            accessoryName={selectedAccessory.name}
            onMove={moveAccessory}
            onRotate={rotateAccessory}
            onReset={resetAccessoryPlacement}
          />
        )}

      <RightPanel
        boothSizes={boothSizes}
        booths={availableBooths}
        selectedSize={selectedSize}
        selectedBooth={selectedBooth}
        accessories={activeAccessories}
        addOns={addOns}
        selectedAccessoryId={selectedAccessoryId}
        addOnSettings={addOnSettings}
        selectedFlooringId={selectedFlooring.id}
        graphicZones={graphicZones}
        graphicUploads={graphicUploads}
        graphicErrors={graphicErrors}
        onSizeChange={selectSize}
        onBoothChange={selectBooth}
        onAddOnAdd={addAddOn}
        onAddOnRemove={removeAddOn}
        onAddOnSelect={setSelectedAccessoryId}
        onAddOnSettingChange={updateAddOnSetting}
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
