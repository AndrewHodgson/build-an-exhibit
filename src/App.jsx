import { useProgress } from '@react-three/drei'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  addOns,
  createDefaultAddOnInstances,
  createDefaultAddOnSettings,
  createManualAddOnInstance,
  getActiveAccessories,
  getAddOnById,
} from '../data/addOns.js'
import { boothSizes, getBoothsBySize, getDefaultBooth } from '../data/booths.js'
import { defaultFlooringId, getFlooringById } from '../data/flooring.js'
import { sceneAddOnLimits } from '../data/sceneConfig.js'
import {
  createEmptyGraphicState,
  getGraphicZonesForBooth,
} from '../data/graphicZones.js'
import CanvasScene from './components/CanvasScene.jsx'
import CropModal from './components/CropModal.jsx'
import RightPanel from './components/RightPanel.jsx'
import WelcomeModal from './components/WelcomeModal.jsx'
import { createBoothSummaryPdf } from './utils/exportPdf.js'

const ASPECT_RATIO_TOLERANCE = 0.01
const FEET_TO_METERS = 0.3048
const HORIZONTAL_PLACEMENT_LIMIT = 25 * FEET_TO_METERS
const VERTICAL_PLACEMENT_LIMIT = 25 * FEET_TO_METERS
const HISTORY_LIMIT = 10

function LoadingOverlay({ isBusy = false, busyLabel = '' }) {
  const { active, progress } = useProgress()
  const isVisible = isBusy || active || progress < 100
  const roundedProgress = Math.round(progress)
  const label = isBusy ? busyLabel || 'Preparing PDF...' : `Loading ${roundedProgress}%`

  if (!isVisible) {
    return null
  }

  return (
    <div className="loading-overlay" aria-live="polite" aria-label={label}>
      <div className="loading-progress">
        <div className="loading-progress-track">
          <div
            className="loading-progress-value"
            style={{ width: `${roundedProgress}%` }}
          />
        </div>
        <p>{label}</p>
      </div>
    </div>
  )
}

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

function formatRotation(rotation = 0) {
  const degrees = (rotation * 180) / Math.PI
  return `${(Math.round(degrees * 10) / 10).toFixed(1)}\u00b0`
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum)
}

function clampAccessoryPosition(position) {
  return [
    clamp(position[0], -HORIZONTAL_PLACEMENT_LIMIT, HORIZONTAL_PLACEMENT_LIMIT),
    clamp(position[1], 0, VERTICAL_PLACEMENT_LIMIT),
    clamp(position[2], -HORIZONTAL_PLACEMENT_LIMIT, HORIZONTAL_PLACEMENT_LIMIT),
  ]
}

function getAddOnLimitMessage(addOn, activeSceneAddOns) {
  if (activeSceneAddOns.length >= sceneAddOnLimits.total) {
    return 'Limit reached. Remove an item before adding another.'
  }

  const groupConfig = sceneAddOnLimits.groups[addOn.limitGroup]

  if (!groupConfig) {
    return ''
  }

  const groupCount = activeSceneAddOns.filter(
    (sceneAddOn) => sceneAddOn.limitGroup === addOn.limitGroup,
  ).length

  return groupCount >= groupConfig.limit
    ? `${groupConfig.label} limit reached. Remove a ${groupConfig.label.toLowerCase()} before adding another.`
    : ''
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
  const [hiddenAccessoryIds, setHiddenAccessoryIds] = useState([])
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
  const [addOnLimitMessage, setAddOnLimitMessage] = useState('')
  const ownedGraphicUrlsRef = useRef(new Set())
  const historyRef = useRef([])
  const isTransformingAccessoryRef = useRef(false)
  const removeAddOnRef = useRef(null)

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
    () =>
      getActiveAccessories(selectedBooth, addOnInstances).filter(
        (accessory) => !hiddenAccessoryIds.includes(accessory.id),
      ),
    [addOnInstances, hiddenAccessoryIds, selectedBooth],
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

  const createHistorySnapshot = useCallback(
    () => ({
      selectedSize,
      selectedBoothId,
      selectedFlooringId,
      addOnInstances,
      hiddenAccessoryIds,
      addOnSettings,
      accessoryPlacements,
      graphicUploads,
      graphicErrors,
    }),
    [
      accessoryPlacements,
      addOnInstances,
      addOnSettings,
      graphicErrors,
      graphicUploads,
      hiddenAccessoryIds,
      selectedBoothId,
      selectedFlooringId,
      selectedSize,
    ],
  )
  const [highlightedGraphicZoneId, setHighlightedGraphicZoneId] = useState(null)

  const recordHistory = useCallback(() => {
    historyRef.current = [...historyRef.current, createHistorySnapshot()].slice(
      -HISTORY_LIMIT,
    )
  }, [createHistorySnapshot])

  const undo = useCallback(() => {
    const snapshot = historyRef.current.at(-1)

    if (!snapshot) {
      return
    }

    historyRef.current = historyRef.current.slice(0, -1)
    setSelectedSize(snapshot.selectedSize)
    setSelectedBoothId(snapshot.selectedBoothId)
    setSelectedFlooringId(snapshot.selectedFlooringId)
    setAddOnInstances(snapshot.addOnInstances)
    setHiddenAccessoryIds(snapshot.hiddenAccessoryIds)
    setAddOnSettings(snapshot.addOnSettings)
    setAccessoryPlacements(snapshot.accessoryPlacements)
    setGraphicUploads(snapshot.graphicUploads)
    setGraphicErrors(snapshot.graphicErrors)
    setCropRequest(null)
    setSelectedAccessoryId(null)
  }, [])

  function revokeGraphicUrl(upload) {
    if (upload?.textureUrl) {
      URL.revokeObjectURL(upload.textureUrl)
    }
  }

  function clearGraphicUploads(nextBooth = selectedBooth, nextAccessories = activeAccessories) {
    const emptyGraphicState = createEmptyGraphicState(
      getGraphicZonesForBooth(nextBooth, nextAccessories),
    )

    setGraphicUploads(emptyGraphicState)
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
    setHiddenAccessoryIds([])
    setAddOnSettings(createDefaultAddOnSettings(nextAddOnInstances))
    setAccessoryPlacements(createDefaultAccessoryPlacements(nextAccessories))

    return nextAccessories
  }

  function resetCurrentBooth() {
    recordHistory()
    const nextBooth = getDefaultBooth()
    const nextAccessories = resetBoothAccessories(nextBooth)

    clearGraphicUploads(nextBooth, nextAccessories)
    setSelectedSize(nextBooth.size)
    setSelectedBoothId(nextBooth.id)
    setSelectedFlooringId(defaultFlooringId)
    setSelectedAccessoryId(null)
    setExportStatus('')
    setIsWelcomeOpen(true)
  }

  function selectSize(size) {
    if (size === selectedSize) {
      return
    }

    recordHistory()

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
      recordHistory()
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
      recordHistory()
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
    recordHistory()
    if (upload?.textureUrl) {
      ownedGraphicUrlsRef.current.add(upload.textureUrl)
    }
    setGraphicUploads((currentUploads) => {
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

    recordHistory()

    setGraphicUploads((currentUploads) => {
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

    const limitMessage = getAddOnLimitMessage(addOn, activeAccessories)

    if (limitMessage) {
      setAddOnLimitMessage(limitMessage)
      return
    }

    recordHistory()
    setAddOnLimitMessage('')

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

    if (!accessory) {
      return
    }

    recordHistory()
    setAddOnLimitMessage('')

    if (!addOnInstances.some((instance) => instance.id === instanceId)) {
      setHiddenAccessoryIds((currentIds) => [...currentIds, instanceId])
      setAccessoryPlacements((currentPlacements) => {
        const nextPlacements = { ...currentPlacements }
        delete nextPlacements[instanceId]
        return nextPlacements
      })
      setSelectedAccessoryId(null)
      return
    }

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
    recordHistory()
    setAddOnSettings((currentSettings) => ({
      ...currentSettings,
      [instanceId]: {
        ...currentSettings[instanceId],
        [setting]: value,
      },
    }))
  }

  function updateAccessoryPlacement(accessoryId, updater, shouldRecord = true) {
    if (shouldRecord) {
      recordHistory()
    }
    setAccessoryPlacements((currentPlacements) => {
      const accessory = activeAccessories.find((item) => item.id === accessoryId)
      const currentPlacement = currentPlacements[accessoryId] ?? accessory

      if (!currentPlacement) {
        return currentPlacements
      }

      return {
        ...currentPlacements,
        [accessoryId]: (() => {
          const nextPlacement = updater(currentPlacement)

          return {
            ...nextPlacement,
            position: clampAccessoryPosition(nextPlacement.position),
          }
        })(),
      }
    })
  }

  function transformAccessoryPosition(accessoryId, position) {
    updateAccessoryPlacement(accessoryId, (currentPlacement) => ({
      ...currentPlacement,
      position: [...position],
    }), false)
  }

  function setAccessoryRotation(accessoryId, rotation) {
    updateAccessoryPlacement(accessoryId, (currentPlacement) => ({
      ...currentPlacement,
      rotation,
    }), false)
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
        accessories: activeAccessories,
        addOnSettings,
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
    const ownedGraphicUrls = ownedGraphicUrlsRef.current

    return () => {
      ownedGraphicUrls.forEach((textureUrl) => revokeGraphicUrl({ textureUrl }))
    }
  }, [])

  useEffect(() => {
    removeAddOnRef.current = removeAddOn
  })

  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target
      const isEditing =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')

      if (isEditing) {
        return
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        undo()
        return
      }

      if (event.key === 'Delete' && selectedAccessoryId) {
        event.preventDefault()
        removeAddOnRef.current?.(selectedAccessoryId)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedAccessoryId, undo])

  return (
    <main className="app-shell">
      <section className="scene-layer" aria-label="3D rental exhibit preview">
        <CanvasScene
          ref={sceneRef}
          booth={selectedBooth}
          flooring={selectedFlooring}
          graphicUploads={graphicUploads}
          highlightedGraphicZoneId={highlightedGraphicZoneId}
          accessories={activeAccessories}
          accessoryPlacements={accessoryPlacements}
          addOnSettings={addOnSettings}
          selectedAccessoryId={selectedAccessoryId}
          onAccessorySelect={setSelectedAccessoryId}
          onAccessoryPositionChange={transformAccessoryPosition}
          onAccessoryRotationChange={setAccessoryRotation}
          onAccessoryTransformStart={() => {
            if (!isTransformingAccessoryRef.current) {
              recordHistory()
              isTransformingAccessoryRef.current = true
            }
          }}
          onAccessoryTransformEnd={() => {
            isTransformingAccessoryRef.current = false
          }}
          onSceneDeselect={() => setSelectedAccessoryId(null)}
          hideSelectionOutline={isExportingPdf}
          hideGrid={isExportingPdf}
        />
      </section>

      <LoadingOverlay isBusy={isExportingPdf} busyLabel={exportStatus} />

      <div className="orbit-hint" aria-hidden="true">
        <p>Left click + drag: orbit / rotate</p>
        <p>Scroll wheel: zoom in / out</p>
      </div>

      {selectedAccessoryPlacement && (
        // Displays floor-plan axes for the user: X = left/right (world X),
        // Y = forward/back depth (world Z), Z = vertical height (world Y).
        // The gizmo translate handles follow the same convention: X arrow = world X,
        // depth (green) arrow = world Z shown here as Y, vertical (blue) = world Y shown as Z.
        <output className="selected-position-indicator" aria-label="Selected position">
          <span>X: {formatPositionCoordinate(selectedAccessoryPlacement.position[0])}</span>
          <span>Y: {formatPositionCoordinate(selectedAccessoryPlacement.position[2])}</span>
          <span>Z: {formatPositionCoordinate(selectedAccessoryPlacement.position[1])}</span>
          <span>
            Rotation: {formatRotation(selectedAccessoryPlacement.rotation[1])}
          </span>
        </output>
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
        addOnLimitMessage={addOnLimitMessage}
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
        onFlooringChange={(flooringId) => {
          if (flooringId !== selectedFlooringId) {
            recordHistory()
            setSelectedFlooringId(flooringId)
          }
        }}
        onGraphicFileChange={handleGraphicFile}
        onGraphicClear={clearGraphicUpload}
        onGraphicHighlightChange={setHighlightedGraphicZoneId}
        onExportPdf={exportPdf}
        onResetBooth={resetCurrentBooth}
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
