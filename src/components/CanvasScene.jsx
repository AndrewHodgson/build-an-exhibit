import {
  Edges,
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
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Box3,
  ClampToEdgeWrapping,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
} from 'three'
import { flooringTexturePreloadPaths } from '../../data/flooring.js'

const CAMERA_TARGET = [0, 1, 0]
const DESKTOP_CAMERA_POSITION = [2.2, 2.25, 7.5]
const MOBILE_CAMERA_POSITION = [2.7, 2.4, 9.6]
const FEET_TO_MODEL_UNITS = 0.3048
const FLOOR_DEPTH_FEET = 10
const FLOOR_THICKNESS = 0.0127
const SCENE_GRID_SIZE = 12
const SCENE_GRID_DIVISIONS = 24
const SCENE_GRID_Y = -FLOOR_THICKNESS - 0.006
const SELECTED_OUTLINE_COLOR = '#f97316'
const SELECTED_OUTLINE_PADDING = 0.035
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
      <ambientLight intensity={0.65} />
      <hemisphereLight args={['#ffffff', '#c5ced8', 0.82]} />
      <directionalLight position={[4, 7, 5]} intensity={1.25} castShadow />
      <directionalLight position={[-5, 3, -4]} intensity={0.3} />
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

function createFloorTexture(baseTexture, repeatX, repeatY) {
  const nextTexture = baseTexture.clone()

  nextTexture.colorSpace = SRGBColorSpace
  nextTexture.wrapS = RepeatWrapping
  nextTexture.wrapT = RepeatWrapping
  nextTexture.repeat.set(repeatX, repeatY)
  nextTexture.needsUpdate = true

  return nextTexture
}

function ExhibitFloor({ boothSize, flooring }) {
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
      <SceneGrid />
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
    size: [
      size.x + SELECTED_OUTLINE_PADDING,
      size.y + SELECTED_OUTLINE_PADDING,
      size.z + SELECTED_OUTLINE_PADDING,
    ],
  }
}

function SelectionOutline({ bounds }) {
  if (!bounds) {
    return null
  }

  const outlineCenter = [0, bounds.center[1], 0]

  return (
    <mesh position={outlineCenter} renderOrder={10}>
      <boxGeometry args={bounds.size} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      <Edges
        color={SELECTED_OUTLINE_COLOR}
        linewidth={2}
        threshold={15}
        renderOrder={11}
      />
    </mesh>
  )
}

function LoadedModel({
  debugLabel,
  modelPath,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  onStatusChange,
  graphicTextureUrls = {},
  castsShadow = false,
  isSelected = false,
  onSelect,
  centerPivot = false,
}) {
  const { scene } = useGLTF(modelPath)
  const invalidate = useThree((state) => state.invalidate)
  const isRenderable = useMemo(() => hasRenderableGeometry(scene), [scene])
  const bounds = useMemo(() => getLocalObjectBounds(scene), [scene])
  const pivotOffset = centerPivot && bounds ? bounds.center : [0, 0, 0]
  const modelOffset = centerPivot
    ? [-pivotOffset[0], 0, -pivotOffset[2]]
    : [0, 0, 0]
  const pivotPosition = centerPivot ? [pivotOffset[0], 0, pivotOffset[2]] : [0, 0, 0]

  useEffect(() => {
    prepareSceneForPreview(scene, { castsShadow })
  }, [castsShadow, scene])

  useEffect(() => {
    return applyGraphicTextures(scene, graphicTextureUrls, invalidate)
  }, [graphicTextureUrls, invalidate, scene])

  useEffect(() => {
    onStatusChange?.(isRenderable ? 'ready' : 'empty')
  }, [isRenderable, onStatusChange])

  useEffect(() => {
    if (isRenderable) {
      reportBoundsOnce(modelPath, debugLabel ?? modelPath, scene)
    }
  }, [debugLabel, isRenderable, modelPath, scene])

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
      <group position={pivotPosition} rotation={rotation}>
        <primitive object={scene} position={modelOffset} />
        {isSelected && <SelectionOutline bounds={bounds} />}
      </group>
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

export default function CanvasScene({
  booth,
  flooring,
  graphicUploads,
  accessoryPlacements,
  selectedAccessoryId,
  onAccessorySelect,
  onSceneDeselect,
}) {
  const isMobile = useIsMobileViewport()
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
  const boothGraphicTextureUrls = useMemo(
    () => ({
      MAT_graphic_backwall: graphicUploads.backwall?.textureUrl,
    }),
    [graphicUploads.backwall?.textureUrl],
  )
  const counterGraphicTextureUrls = useMemo(
    () => ({
      MAT_graphic_counter: graphicUploads.counter?.textureUrl,
    }),
    [graphicUploads.counter?.textureUrl],
  )

  return (
    <Canvas
      shadows="basic"
      dpr={[1, 1.5]}
      frameloop="demand"
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => gl.setClearAlpha(0)}
      onPointerMissed={onSceneDeselect}
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

        {booth.includedAccessories?.map((accessory) => (
          <ModelErrorBoundary key={accessory.id} resetKey={accessory.modelPath}>
            <LoadedModel
              debugLabel={accessory.name}
              modelPath={accessory.modelPath}
              position={accessoryPlacements[accessory.id]?.position ?? accessory.position}
              rotation={accessoryPlacements[accessory.id]?.rotation ?? accessory.rotation}
              graphicTextureUrls={counterGraphicTextureUrls}
              castsShadow
              isSelected={selectedAccessoryId === accessory.id}
              onSelect={() => onAccessorySelect?.(accessory.id)}
              centerPivot
            />
          </ModelErrorBoundary>
        ))}
      </Suspense>
      {(boothModelStatus === 'empty' || boothModelStatus === 'failed') && (
        <FallbackBoothModel booth={booth} />
      )}
      <ExhibitFloor boothSize={booth.size} flooring={flooring} />
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={4.8}
        maxDistance={11}
        target={CAMERA_TARGET}
      />
    </Canvas>
  )
}

useGLTF.preload('/models/booths/bm101.glb')
useGLTF.preload('/models/accessories/bm-counter.glb')
flooringTexturePreloadPaths.forEach((path) => useTexture.preload(path))
