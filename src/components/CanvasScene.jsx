import {
  OrbitControls,
  PerspectiveCamera,
  useGLTF,
  useTexture,
} from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Box3,
  ClampToEdgeWrapping,
  Color,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
} from 'three'
import { flooringTexturePreloadPaths } from '../../data/flooring.js'
import { ACCESSORY_ROTATION_STEP } from '../../data/addOns.js'
import AccessoryTransformGizmo from './AccessoryTransformGizmo.jsx'

const CAMERA_TARGET = [0, 1, 0]
const DESKTOP_CAMERA_POSITION = [2.2, 2.25, 7.5]
const MOBILE_CAMERA_POSITION = [2.7, 2.4, 9.6]
const FEET_TO_MODEL_UNITS = 0.3048
const FLOOR_DEPTH_FEET = 10
const FLOOR_THICKNESS = 0.0127
const SCENE_GRID_SIZE = 12
const SCENE_GRID_DIVISIONS = 24
const SCENE_GRID_Y = -FLOOR_THICKNESS - 0.006
const EXPORT_BACKGROUND_COLOR = '#ffffff'
const reportedBoundsKeys = new Set()
const defaultMaterialMaps = new WeakMap()
const uploadedMaterialMaps = new WeakMap()

function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(() =>
    window.matchMedia('(max-width: 767px)').matches,
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)')
    const handleChange = () => setIsMobile(mediaQuery.matches)

    handleChange()
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return isMobile
}

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.82} />
      <hemisphereLight args={['#ffffff', '#d6dee8', 1.05]} />
      <directionalLight position={[4, 7, 5]} intensity={1.45} castShadow />
      <directionalLight position={[-5, 3, -4]} intensity={0.38} />
      <directionalLight position={[0, 3.5, 6]} intensity={0.28} />
    </>
  )
}

function getFloorDimensions(boothSize) {
  const widthFeet = boothSize === '10x20' ? 20 : 10

  return {
    width: widthFeet * FEET_TO_MODEL_UNITS,
    depth: FLOOR_DEPTH_FEET * FEET_TO_MODEL_UNITS,
    widthFeet,
    depthFeet: FLOOR_DEPTH_FEET,
  }
}

function formatBoundsValue(value) {
  return Number(value.toFixed(4))
}

function getObjectBounds(object) {
  object.updateMatrixWorld(true)

  const box = new Box3().setFromObject(object)
  const size = new Vector3()

  box.getSize(size)

  return {
    width: formatBoundsValue(size.x),
    height: formatBoundsValue(size.y),
    depth: formatBoundsValue(size.z),
    min: box.min.toArray().map(formatBoundsValue),
    max: box.max.toArray().map(formatBoundsValue),
  }
}

function reportBoundsOnce(key, label, object) {
  if (!import.meta.env.DEV || reportedBoundsKeys.has(key) || !object) {
    return
  }

  reportedBoundsKeys.add(key)

  const bounds = getObjectBounds(object)

  console.info(
    `${label} bounds: width X = ${bounds.width}, height Y = ${bounds.height}, depth Z = ${bounds.depth}`,
    {
      min: bounds.min,
      max: bounds.max,
    },
  )
}

function SceneGrid() {
  return (
    <gridHelper
      args={[SCENE_GRID_SIZE, SCENE_GRID_DIVISIONS, '#cbd5e1', '#e2e8f0']}
      position={[0, SCENE_GRID_Y, 0]}
    />
  )
}

function waitForAnimationFrame() {
  return new Promise((resolve) => {
    requestAnimationFrame(resolve)
  })
}

function getExportCameraViews(boothSize) {
  const isWide = boothSize === '10x20'

  return [
    {
      id: 'perspective',
      label: 'Perspective View',
      position: isWide ? [3.7, 2.45, 7.35] : [2.05, 2.0, 5.35],
      target: isWide ? [0, 0.92, -0.08] : [0, 0.95, -0.05],
      up: [0, 1, 0],
    },
    {
      id: 'front',
      label: 'Front View',
      position: isWide ? [0, 1.16, 8.05] : [0, 1.12, 5.05],
      target: [0, 1.05, 0],
      up: [0, 1, 0],
    },
    {
      id: 'top',
      label: 'Top View',
      position: isWide ? [0, 7.45, 0.001] : [0, 4.85, 0.001],
      target: [0, 0, 0],
      up: [0, 0, -1],
    },
  ]
}

function SceneCaptureBridge({ boothSize, captureRef }) {
  const camera = useThree((state) => state.camera)
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const controls = useThree((state) => state.controls)
  const invalidate = useThree((state) => state.invalidate)

  useImperativeHandle(
    captureRef,
    () => ({
      async capturePresetViews() {
        const originalPosition = camera.position.clone()
        const originalQuaternion = camera.quaternion.clone()
        const originalUp = camera.up.clone()
        const originalAspect = camera.aspect
        const originalTarget = controls?.target?.clone()
        const originalClearColor = gl.getClearColor(new Color()).clone()
        const originalClearAlpha = gl.getClearAlpha()
        const originalRenderTarget = gl.getRenderTarget()
        const captureWidth = gl.domElement.width
        const captureHeight = gl.domElement.height
        const captureAspect = captureWidth / captureHeight
        const gridHelpers = []
        const captures = []

        try {
          scene.traverse((object) => {
            if (object.type === 'GridHelper') {
              gridHelpers.push({
                object,
                visible: object.visible,
              })
              object.visible = false
            }
          })

          gl.setRenderTarget(null)
          gl.setClearColor(EXPORT_BACKGROUND_COLOR, 1)
          camera.aspect = captureAspect
          camera.updateProjectionMatrix()

          for (const view of getExportCameraViews(boothSize)) {
            camera.position.fromArray(view.position)
            camera.up.fromArray(view.up)
            camera.lookAt(...view.target)
            camera.updateProjectionMatrix()

            if (controls?.target) {
              controls.target.fromArray(view.target)
              controls.update()
            }

            invalidate()
            await waitForAnimationFrame()
            gl.setRenderTarget(null)
            gl.clear(true, true, true)
            gl.render(scene, camera)

            captures.push({
              id: view.id,
              label: view.label,
              width: gl.domElement.width,
              height: gl.domElement.height,
              dataUrl: gl.domElement.toDataURL('image/jpeg', 0.92),
            })

            if (import.meta.env.DEV) {
              console.info(
                `PDF capture ${view.id}: live canvas ${gl.domElement.width}x${gl.domElement.height}, ` +
                  `camera aspect ${Number(camera.aspect.toFixed(4))}`,
              )
            }
          }
        } finally {
          camera.position.copy(originalPosition)
          camera.quaternion.copy(originalQuaternion)
          camera.up.copy(originalUp)
          camera.aspect = originalAspect
          camera.updateProjectionMatrix()

          if (controls?.target && originalTarget) {
            controls.target.copy(originalTarget)
            controls.update()
          }

          gridHelpers.forEach(({ object, visible }) => {
            object.visible = visible
          })
          gl.setRenderTarget(originalRenderTarget)
          gl.setClearColor(originalClearColor, originalClearAlpha)
          invalidate()
          await waitForAnimationFrame()
          gl.render(scene, camera)
        }

        return captures
      },
    }),
    [boothSize, camera, controls, gl, invalidate, scene],
  )

  return null
}

function createFloorTexture(baseTexture, repeatX, repeatY) {
  const nextTexture = baseTexture.clone()

  nextTexture.colorSpace = SRGBColorSpace
  nextTexture.wrapS = RepeatWrapping
  nextTexture.wrapT = RepeatWrapping
  nextTexture.repeat.set(repeatX, repeatY)
  nextTexture.needsUpdate = true

  return nextTexture
}

function ExhibitFloor({ boothSize, flooring, hideGrid = false }) {
  const floorRef = useRef(null)
  const texture = useTexture(flooring.texturePath)
  const { width, depth, widthFeet, depthFeet } = useMemo(
    () => getFloorDimensions(boothSize),
    [boothSize],
  )
  const repeatX = widthFeet / 10
  const repeatZ = depthFeet / 10
  const floorTextures = useMemo(
    () => ({
      top: createFloorTexture(texture, repeatX, repeatZ),
      bottom: createFloorTexture(texture, repeatX, repeatZ),
      widthEdge: createFloorTexture(texture, repeatX, 1),
      depthEdge: createFloorTexture(texture, repeatZ, 1),
    }),
    [repeatX, repeatZ, texture],
  )
  const floorMaterials = useMemo(() => {
    const materialSettings = {
      roughness: 0.78,
      metalness: 0.02,
    }
    const rightMaterial = new MeshStandardMaterial({
      ...materialSettings,
      map: floorTextures.depthEdge,
    })
    const leftMaterial = new MeshStandardMaterial({
      ...materialSettings,
      map: floorTextures.depthEdge,
    })
    const topMaterial = new MeshStandardMaterial({
      ...materialSettings,
      map: floorTextures.top,
    })
    const bottomMaterial = new MeshStandardMaterial({
      ...materialSettings,
      map: floorTextures.bottom,
    })
    const frontMaterial = new MeshStandardMaterial({
      ...materialSettings,
      map: floorTextures.widthEdge,
    })
    const backMaterial = new MeshStandardMaterial({
      ...materialSettings,
      map: floorTextures.widthEdge,
    })

    return [
      rightMaterial,
      leftMaterial,
      topMaterial,
      bottomMaterial,
      frontMaterial,
      backMaterial,
    ]
  }, [floorTextures])

  useEffect(() => {
    return () => {
      Object.values(floorTextures).forEach((floorTexture) => floorTexture.dispose())
      floorMaterials.forEach((material, index) => {
        if (floorMaterials.indexOf(material) === index) {
          material.dispose()
        }
      })
    }
  }, [floorMaterials, floorTextures])

  useEffect(() => {
    reportBoundsOnce(
      `floor-${boothSize}`,
      `${boothSize} flooring slab`,
      floorRef.current,
    )
  }, [boothSize])

  return (
    <>
      <mesh
        ref={floorRef}
        position={[0, -FLOOR_THICKNESS / 2, 0]}
        receiveShadow
        material={floorMaterials}
      >
        <boxGeometry args={[width, FLOOR_THICKNESS, depth]} />
      </mesh>
      {!hideGrid && <SceneGrid />}
    </>
  )
}

function WallPanel({ position, rotation = [0, 0, 0], size, color = '#f8fafc' }) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.42} metalness={0.02} />
    </mesh>
  )
}

function FramePost({ position, height }) {
  return (
    <mesh position={position} castShadow>
      <boxGeometry args={[0.07, height, 0.07]} />
      <meshStandardMaterial color="#bec7d1" roughness={0.28} metalness={0.65} />
    </mesh>
  )
}

function FallbackBoothModel({ booth }) {
  const dimensions = useMemo(() => {
    const isWide = booth.size === '10x20'

    return {
      width: isWide ? 5.9 : 3.3,
      depth: 3.05,
      height: 2.35,
    }
  }, [booth.size])

  const accent = booth.preview?.accent ?? '#214670'
  const wallMode = booth.preview?.walls ?? 'backwall'
  const { width, depth, height } = dimensions
  const backZ = -depth / 2
  const halfWidth = width / 2
  const showLeftReturn = wallMode.includes('left')
  const showHeader = wallMode.includes('header')
  const showSplit = wallMode.includes('split')

  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.01, 0]} receiveShadow>
        <boxGeometry args={[width, 0.035, depth]} />
        <meshStandardMaterial color="#f6f7f9" roughness={0.7} />
      </mesh>

      {showSplit ? (
        <>
          <WallPanel
            position={[-width * 0.28, height / 2, backZ]}
            size={[width * 0.36, height, 0.11]}
          />
          <WallPanel
            position={[width * 0.28, height / 2, backZ]}
            size={[width * 0.36, height, 0.11]}
          />
        </>
      ) : (
        <WallPanel position={[0, height / 2, backZ]} size={[width, height, 0.11]} />
      )}

      <WallPanel
        position={[0, height * 0.52, backZ - 0.061]}
        size={[width * 0.72, height * 0.62, 0.03]}
        color={accent}
      />

      {showLeftReturn && (
        <WallPanel
          position={[-halfWidth, height / 2, -depth * 0.05]}
          rotation={[0, Math.PI / 2, 0]}
          size={[depth * 0.78, height, 0.11]}
        />
      )}

      {showHeader && (
        <WallPanel
          position={[0, height + 0.2, backZ + 0.02]}
          size={[width * 0.86, 0.32, 0.16]}
          color={accent}
        />
      )}

      {[-halfWidth, 0, halfWidth].map((x) => (
        <FramePost key={x} position={[x, height / 2, backZ + 0.08]} height={height} />
      ))}
    </group>
  )
}

function hasRenderableGeometry(scene) {
  let hasGeometry = false

  scene.traverse((object) => {
    const positionAttribute = object.geometry?.attributes?.position

    if (object.isMesh && positionAttribute?.count > 0) {
      hasGeometry = true
    }
  })

  return hasGeometry
}

function prepareSceneForPreview(scene, { castsShadow = false } = {}) {
  scene.traverse((object) => {
    if (!object.isMesh) {
      return
    }

    object.castShadow = castsShadow
    object.receiveShadow = false
  })
}

function getMaterials(object) {
  if (Array.isArray(object.material)) {
    return object.material
  }

  return object.material ? [object.material] : []
}

function restoreDefaultMaterialMap(material, invalidate) {
  const uploadedTexture = uploadedMaterialMaps.get(material)

  if (uploadedTexture) {
    uploadedTexture.dispose()
    uploadedMaterialMaps.delete(material)
  }

  material.map = defaultMaterialMaps.get(material) ?? null
  material.needsUpdate = true
  invalidate()
}

function applyGraphicTextures(scene, graphicTextureUrls, invalidate) {
  const loader = new TextureLoader()
  const pendingLoads = []
  let isActive = true

  scene.traverse((object) => {
    if (!object.isMesh) {
      return
    }

    getMaterials(object).forEach((material) => {
      const textureUrl = graphicTextureUrls[material.name]

      if (!Object.hasOwn(graphicTextureUrls, material.name)) {
        return
      }

      if (!defaultMaterialMaps.has(material)) {
        defaultMaterialMaps.set(material, material.map ?? null)
      }

      if (!textureUrl) {
        restoreDefaultMaterialMap(material, invalidate)
        return
      }

      const pendingLoad = loader
        .loadAsync(textureUrl)
        .then((texture) => {
          if (!isActive) {
            texture.dispose()
            return
          }

          const uploadedTexture = uploadedMaterialMaps.get(material)

          if (uploadedTexture) {
            uploadedTexture.dispose()
          }

          texture.colorSpace = SRGBColorSpace
          texture.flipY = false
          texture.wrapS = ClampToEdgeWrapping
          texture.wrapT = ClampToEdgeWrapping
          texture.needsUpdate = true

          material.map = texture
          material.needsUpdate = true
          uploadedMaterialMaps.set(material, texture)
          invalidate()
        })
        .catch(() => {
          if (isActive) {
            restoreDefaultMaterialMap(material, invalidate)
          }
        })

      pendingLoads.push(pendingLoad)
    })
  })

  return () => {
    isActive = false
    Promise.allSettled(pendingLoads)
  }
}

function getLocalObjectBounds(object) {
  if (!object) {
    return null
  }

  object.updateWorldMatrix(true, true)

  const objectWorldInverse = object.matrixWorld.clone().invert()
  const box = new Box3()
  const meshBox = new Box3()

  object.traverse((child) => {
    if (!child.isMesh || !child.geometry?.attributes?.position) {
      return
    }

    if (!child.geometry.boundingBox) {
      child.geometry.computeBoundingBox()
    }

    meshBox
      .copy(child.geometry.boundingBox)
      .applyMatrix4(child.matrixWorld)
      .applyMatrix4(objectWorldInverse)
    box.union(meshBox)
  })

  if (box.isEmpty()) {
    return null
  }

  const size = new Vector3()
  const center = new Vector3()

  box.getSize(size)
  box.getCenter(center)

  return {
    center: center.toArray(),
    size: size.toArray(),
  }
}

function cloneModelScene(scene) {
  const clone = scene.clone(true)

  clone.traverse((object) => {
    if (!object.isMesh || !object.material) {
      return
    }

    object.material = Array.isArray(object.material)
      ? object.material.map((material) => material.clone())
      : object.material.clone()
  })

  return clone
}

function LoadedModel({
  debugLabel,
  modelPath,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  onStatusChange,
  graphicTextureUrls = {},
  castsShadow = false,
  onSelect,
  dragPosition = position,
  onPositionChange,
  onRotationChange,
  onDragStart,
  onDragEnd,
  showTransformGizmo = false,
  allowVerticalMovement = false,
  gizmoCenterOffsetY = 0,
  centerPivot = false,
}) {
  const { scene } = useGLTF(modelPath)
  const modelScene = useMemo(() => cloneModelScene(scene), [scene])
  const invalidate = useThree((state) => state.invalidate)
  const isRenderable = useMemo(() => hasRenderableGeometry(modelScene), [modelScene])
  const bounds = useMemo(() => getLocalObjectBounds(modelScene), [modelScene])
  const pivotOffset = centerPivot && bounds ? bounds.center : [0, 0, 0]
  const modelOffset = centerPivot
    ? [-pivotOffset[0], -pivotOffset[1], -pivotOffset[2]]
    : [0, 0, 0]
  const pivotPosition = centerPivot ? pivotOffset : [0, 0, 0]

  useEffect(() => {
    prepareSceneForPreview(modelScene, { castsShadow })
  }, [castsShadow, modelScene])

  useEffect(() => {
    return applyGraphicTextures(modelScene, graphicTextureUrls, invalidate)
  }, [graphicTextureUrls, invalidate, modelScene])

  useEffect(() => {
    onStatusChange?.(isRenderable ? 'ready' : 'empty')
  }, [isRenderable, onStatusChange])

  useEffect(() => {
    if (isRenderable) {
      reportBoundsOnce(modelPath, debugLabel ?? modelPath, modelScene)
    }
  }, [debugLabel, isRenderable, modelPath, modelScene])

  if (!isRenderable) {
    return null
  }

  return (
    <group
      position={position}
      onClick={(event) => {
        if (!onSelect) {
          return
        }

        event.stopPropagation()
        onSelect()
      }}
      onPointerDown={(event) => {
        if (onSelect) {
          event.stopPropagation()
        }
      }}
    >
      <group position={pivotPosition} rotation={rotation} scale={scale}>
        <primitive object={modelScene} position={modelOffset} />
      </group>
      {showTransformGizmo && (
        <AccessoryTransformGizmo
          position={[
            pivotOffset[0],
            pivotOffset[1] + gizmoCenterOffsetY,
            pivotOffset[2],
          ]}
          placementPosition={dragPosition}
          placementRotation={rotation}
          rotationStep={ACCESSORY_ROTATION_STEP}
          allowVerticalMovement={allowVerticalMovement}
          onPositionChange={onPositionChange}
          onRotationChange={onRotationChange}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        />
      )}
    </group>
  )
}

class ModelErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch() {
    this.props.onError?.()
  }

  componentDidUpdate(previousProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (this.state.hasError) {
      return null
    }

    return this.props.children
  }
}

const CanvasScene = forwardRef(function CanvasScene({
  booth,
  flooring,
  graphicUploads,
  accessories,
  accessoryPlacements,
  addOnSettings,
  selectedAccessoryId,
  onAccessorySelect,
  onAccessoryPositionChange,
  onAccessoryRotationChange,
  onAccessoryTransformStart,
  onAccessoryTransformEnd,
  onSceneDeselect,
  hideSelectionOutline = false,
  hideGrid = false,
}, ref) {
  const isMobile = useIsMobileViewport()
  const orbitControlsRef = useRef(null)
  const [isDraggingAccessory, setIsDraggingAccessory] = useState(false)
  const [boothModelState, setBoothModelState] = useState({
    status: 'loading',
    modelPath: null,
  })

  const boothModelStatus =
    boothModelState.modelPath === booth.modelPath ? boothModelState.status : 'loading'

  const handleBoothStatusChange = useCallback(
    (status) => {
      setBoothModelState({ status, modelPath: booth.modelPath })
    },
    [booth.modelPath],
  )

  const handleBoothError = useCallback(() => {
    setBoothModelState({ status: 'failed', modelPath: booth.modelPath })
  }, [booth.modelPath])
  const handleAccessoryDragStart = useCallback(() => {
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = false
    }
    setIsDraggingAccessory(true)
    onAccessoryTransformStart?.()
  }, [onAccessoryTransformStart])
  const handleAccessoryDragEnd = useCallback(() => {
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = true
    }
    setIsDraggingAccessory(false)
    onAccessoryTransformEnd?.()
  }, [onAccessoryTransformEnd])
  const boothGraphicTextureUrls = useMemo(
    () =>
      Object.fromEntries(
        (booth.graphicZones ?? []).map((zone) => [
          zone.materialName,
          graphicUploads[zone.id]?.textureUrl ?? zone.defaultTexturePath,
        ]),
      ),
    [booth.graphicZones, graphicUploads],
  )
  return (
    <Canvas
      shadows="basic"
      dpr={[1, 1.5]}
      frameloop="demand"
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => gl.setClearAlpha(0)}
      onPointerMissed={() => {
        if (!isDraggingAccessory) {
          onSceneDeselect?.()
        }
      }}
    >
      <PerspectiveCamera
        makeDefault
        position={isMobile ? MOBILE_CAMERA_POSITION : DESKTOP_CAMERA_POSITION}
        fov={36}
      />
      <SceneLights />
      <Suspense fallback={null}>
        <ModelErrorBoundary
          resetKey={booth.modelPath}
          onError={handleBoothError}
        >
          <LoadedModel
            debugLabel={booth.code}
            modelPath={booth.modelPath}
            graphicTextureUrls={boothGraphicTextureUrls}
            onStatusChange={handleBoothStatusChange}
          />
        </ModelErrorBoundary>

        {accessories.flatMap((accessory) => {
          const placement = accessoryPlacements[accessory.id] ?? accessory
          const settings = addOnSettings[accessory.id] ?? {}
          const quantity = Number.isInteger(accessory.defaultQuantity)
            ? settings.quantity ?? accessory.defaultQuantity
            : 1
          const sizeScale = accessory.defaultSize
            ? (settings.size ?? accessory.defaultSize) / accessory.defaultSize
            : 1
          const graphicTextureUrls = Object.fromEntries(
            (accessory.graphicZones ?? []).map((zone) => [
              zone.materialName,
              graphicUploads[zone.id]?.textureUrl ?? zone.defaultTexturePath,
            ]),
          )

          return Array.from({ length: quantity }, (_, index) => (
            <ModelErrorBoundary
              key={`${accessory.id}-${index}`}
              resetKey={accessory.modelPath}
            >
              <LoadedModel
                debugLabel={accessory.name}
                modelPath={accessory.modelPath}
                position={[
                  placement.position[0],
                  placement.position[1] - index * (accessory.verticalSpacing ?? 0),
                  placement.position[2],
                ]}
                rotation={placement.rotation}
                scale={[sizeScale, sizeScale, sizeScale]}
                graphicTextureUrls={graphicTextureUrls}
                castsShadow
                onSelect={() => onAccessorySelect?.(accessory.id)}
                dragPosition={placement.position}
                onPositionChange={(position) =>
                  onAccessoryPositionChange?.(accessory.id, position)
                }
                onRotationChange={(rotation) =>
                  onAccessoryRotationChange?.(accessory.id, rotation)
                }
                onDragStart={handleAccessoryDragStart}
                onDragEnd={handleAccessoryDragEnd}
                showTransformGizmo={
                  index === 0 &&
                  selectedAccessoryId === accessory.id &&
                  !hideSelectionOutline
                }
                allowVerticalMovement={Boolean(accessory.allowVerticalMovement)}
                gizmoCenterOffsetY={
                  -((quantity - 1) * (accessory.verticalSpacing ?? 0)) / 2
                }
                centerPivot
              />
            </ModelErrorBoundary>
          ))
        })}
      </Suspense>
      {(boothModelStatus === 'empty' || boothModelStatus === 'failed') && (
        <FallbackBoothModel booth={booth} />
      )}
      <ExhibitFloor boothSize={booth.size} flooring={flooring} hideGrid={hideGrid} />
      <OrbitControls
        ref={orbitControlsRef}
        makeDefault
        enabled={!isDraggingAccessory}
        enablePan={false}
        minDistance={4.8}
        maxDistance={11}
        target={CAMERA_TARGET}
      />
      <SceneCaptureBridge boothSize={booth.size} captureRef={ref} />
    </Canvas>
  )
})

export default CanvasScene

useGLTF.preload('/models/booths/bm101.glb')
useGLTF.preload('/models/booths/bm102.glb')
useGLTF.preload('/models/booths/bm103.glb')
useGLTF.preload('/models/booths/bm104.glb')
useGLTF.preload('/models/booths/bm105.glb')
useGLTF.preload('/models/booths/bm106.glb')
useGLTF.preload('/models/booths/bm107.glb')
useGLTF.preload('/models/booths/bm108.glb')
useGLTF.preload('/models/booths/bm109.glb')
useGLTF.preload('/models/booths/bm110.glb')
useGLTF.preload('/models/accessories/bm-counter.glb')
useGLTF.preload('/models/accessories/bm-counter-storage.glb')
useGLTF.preload('/models/accessories/bm-counter-slim.glb')
useGLTF.preload('/models/accessories/BM_OctanormCounter.glb')
useGLTF.preload('/models/accessories/BM_OctanormTable.glb')
useGLTF.preload('/models/accessories/shelf.glb')
useGLTF.preload('/models/accessories/55in-TV.glb')
flooringTexturePreloadPaths.forEach((path) => useTexture.preload(path))
