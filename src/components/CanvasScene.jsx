import {
  Environment,
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
  useLayoutEffect,
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
  WebGLRenderTarget,
} from 'three'
import { ACCESSORY_ROTATION_STEP } from '../../data/addOns.js'
import { glbMaterialColorOverrides } from '../../data/sceneConfig.js'
import { getAccessoryVerticalMinY } from '../utils/placementBounds.js'
import AccessoryTransformGizmo from './AccessoryTransformGizmo.jsx'

const CAMERA_TARGET = [0, 1, 0]
const DESKTOP_CAMERA_POSITION = [2.2, 2.25, 7.5]
const MOBILE_CAMERA_POSITION = [2.7, 2.4, 9.6]
const DESKTOP_DPR = [1, 1.5]
const MOBILE_DPR = [1, 1.25]
const CANVAS_GL_OPTIONS = {
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
}
const SCENE_CLEAR_COLOR = '#dfe4eb'
const FEET_TO_MODEL_UNITS = 0.3048
const FLOOR_DEPTH_FEET = 10
const FLOOR_THICKNESS = 0.0127
const SCENE_GRID_SIZE = 12
const SCENE_GRID_DIVISIONS = 24
const SCENE_GRID_Y = -FLOOR_THICKNESS - 0.006
const EXPORT_BACKGROUND_COLOR = '#ffffff'
const EXPORT_CAPTURE_WIDTH = 1600
const EXPORT_CAPTURE_HEIGHT = 1000
const reportedBoundsKeys = new Set()
const defaultMaterialMaps = new WeakMap()
const uploadedMaterialMaps = new WeakMap()
const GRAPHIC_HIGHLIGHT_COLOR = new Color('#38bdf8')
const reportedMaterialMappingWarnings = new Set()
const STANDARD_METAL = {
  color: '#cccccc',
  metalness: 0.9909,
  roughness: 0.0773,
}

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

const ENVIRONMENT_HDRI_PATH = '/HDR/dancing_hall_1k.hdr'
// The HDRI is used purely as image-based lighting so PBR metals get real
// reflections. `background` stays false so the app background is unchanged, and
// a sub-1 intensity keeps the polished metal from blowing out.
const ENVIRONMENT_INTENSITY = 0.7

// Loads the HDRI once and applies it as `scene.environment` (never the visible
// background). Kept in its own Suspense boundary so it is not remounted when
// booths/accessories change. Lower cubemap resolution on mobile for perf.
function SceneEnvironment({ isMobile }) {
  return (
    <Environment
      files={ENVIRONMENT_HDRI_PATH}
      environmentIntensity={ENVIRONMENT_INTENSITY}
      resolution={isMobile ? 128 : 256}
    />
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
        const captureAspect = EXPORT_CAPTURE_WIDTH / EXPORT_CAPTURE_HEIGHT
        const renderTarget = new WebGLRenderTarget(
          EXPORT_CAPTURE_WIDTH,
          EXPORT_CAPTURE_HEIGHT,
        )
        renderTarget.texture.colorSpace = SRGBColorSpace
        const pixelBuffer = new Uint8Array(
          EXPORT_CAPTURE_WIDTH * EXPORT_CAPTURE_HEIGHT * 4,
        )
        const exportCanvas = document.createElement('canvas')
        exportCanvas.width = EXPORT_CAPTURE_WIDTH
        exportCanvas.height = EXPORT_CAPTURE_HEIGHT
        const exportContext = exportCanvas.getContext('2d')
        const gridHelpers = []
        const captures = []

        try {
          if (!exportContext) {
            throw new Error('Unable to create the PDF export canvas context.')
          }

          scene.traverse((object) => {
            if (object.type === 'GridHelper') {
              gridHelpers.push({
                object,
                visible: object.visible,
              })
              object.visible = false
            }
          })

          gl.setRenderTarget(renderTarget)
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

            gl.setRenderTarget(renderTarget)
            gl.clear(true, true, true)
            gl.render(scene, camera)
            gl.readRenderTargetPixels(
              renderTarget,
              0,
              0,
              EXPORT_CAPTURE_WIDTH,
              EXPORT_CAPTURE_HEIGHT,
              pixelBuffer,
            )

            const imageData = exportContext.createImageData(
              EXPORT_CAPTURE_WIDTH,
              EXPORT_CAPTURE_HEIGHT,
            )
            const rowLength = EXPORT_CAPTURE_WIDTH * 4

            // WebGL pixels start at the bottom-left; canvas image data starts at
            // the top-left, so copy the rows in reverse order.
            for (let y = 0; y < EXPORT_CAPTURE_HEIGHT; y += 1) {
              const sourceStart =
                (EXPORT_CAPTURE_HEIGHT - y - 1) * rowLength
              imageData.data.set(
                pixelBuffer.subarray(sourceStart, sourceStart + rowLength),
                y * rowLength,
              )
            }
            exportContext.putImageData(imageData, 0, 0)

            captures.push({
              id: view.id,
              label: view.label,
              width: EXPORT_CAPTURE_WIDTH,
              height: EXPORT_CAPTURE_HEIGHT,
              dataUrl: exportCanvas.toDataURL('image/jpeg', 0.92),
            })

            if (import.meta.env.DEV) {
              console.info(
                `PDF capture ${view.id}: offscreen ${EXPORT_CAPTURE_WIDTH}x${EXPORT_CAPTURE_HEIGHT}, ` +
                  `camera aspect ${Number(camera.aspect.toFixed(4))}`,
              )
            }
          }
        } finally {
          camera.position.copy(originalPosition)
          camera.quaternion.copy(originalQuaternion)
          camera.up.copy(originalUp)
          camera.aspect = originalAspect

          if (controls?.target && originalTarget) {
            controls.target.copy(originalTarget)
            controls.update()
          }

          // OrbitControls.update() recomputes camera orientation. Restore the
          // exact saved camera transform after syncing its target.
          camera.position.copy(originalPosition)
          camera.quaternion.copy(originalQuaternion)
          camera.up.copy(originalUp)
          camera.aspect = originalAspect
          camera.updateProjectionMatrix()
          camera.updateMatrixWorld(true)

          gridHelpers.forEach(({ object, visible }) => {
            object.visible = visible
          })
          gl.setRenderTarget(originalRenderTarget)
          gl.setClearColor(originalClearColor, originalClearAlpha)
          renderTarget.dispose()
        }

        return captures
      },
    }),
    [boothSize, camera, controls, gl, scene],
  )

  return null
}

function createFloorTexture(
  baseTexture,
  repeatX,
  repeatY,
  repeatMultiplier = 1,
  rotationDegrees = 0,
) {
  const nextTexture = baseTexture.clone()

  nextTexture.colorSpace = SRGBColorSpace
  nextTexture.wrapS = RepeatWrapping
  nextTexture.wrapT = RepeatWrapping
  nextTexture.repeat.set(
    repeatX * repeatMultiplier,
    repeatY * repeatMultiplier,
  )
  nextTexture.center.set(0.5, 0.5)
  nextTexture.rotation = (rotationDegrees * Math.PI) / 180
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
  const repeatMultiplier = flooring.textureRepeatMultiplier ?? 1
  const rotationDegrees = flooring.textureRotationDegrees ?? 0
  const floorTextures = useMemo(
    () => ({
      top: createFloorTexture(
        texture,
        repeatX,
        repeatZ,
        repeatMultiplier,
        rotationDegrees,
      ),
      bottom: createFloorTexture(
        texture,
        repeatX,
        repeatZ,
        repeatMultiplier,
        rotationDegrees,
      ),
      widthEdge: createFloorTexture(
        texture,
        repeatX,
        1,
        repeatMultiplier,
        rotationDegrees,
      ),
      depthEdge: createFloorTexture(
        texture,
        repeatZ,
        1,
        repeatMultiplier,
        rotationDegrees,
      ),
    }),
    [repeatMultiplier, repeatX, repeatZ, rotationDegrees, texture],
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

    getMaterials(object).forEach((material) => {
      const colorOverride = glbMaterialColorOverrides[material.name]

      if (colorOverride && material.color) {
        material.color.set(colorOverride)
        material.needsUpdate = true
      }
    })
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

function describeSceneMeshes(scene) {
  const descriptions = []

  scene.traverse((object) => {
    if (!object.isMesh) {
      return
    }

    descriptions.push(
      `${object.name || '(unnamed)'} [mesh: ${object.geometry?.name || '(unnamed)'}, materials: ${getMaterials(object).map((material) => material.name || '(unnamed)').join(', ')}]`,
    )
  })

  return descriptions.join('; ')
}

function warnMaterialMapping(debugLabel, role, scene) {
  if (!import.meta.env.DEV) {
    return
  }

  const warningKey = `${debugLabel}:${role}`

  if (reportedMaterialMappingWarnings.has(warningKey)) {
    return
  }

  reportedMaterialMappingWarnings.add(warningKey)
  console.warn(
    `[Accessory materials] ${debugLabel}: unable to find the ${role} mesh. Available meshes: ${describeSceneMeshes(scene)}`,
  )
}

// GLTFLoader sanitizes node names (spaces become underscores) and often drops
// geometry names entirely, so exact-string matching against the authoring names
// in the GLB fails at runtime. Normalize both sides to a space-collapsed,
// lower-cased form so 'Ale Bar Stool Base' matches the loaded 'Ale_Bar_Stool_Base'.
function normalizeStructuralName(name) {
  return (name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function findMappedMeshes(scene, mapping, debugLabel, role) {
  if (!mapping) {
    return []
  }

  const meshes = []
  scene.traverse((object) => {
    if (object.isMesh) {
      meshes.push(object)
    }
  })

  const objectNameSet = new Set(
    (mapping.objectNames ?? []).map(normalizeStructuralName).filter(Boolean),
  )
  const meshNameSet = new Set(
    (mapping.meshNames ?? []).map(normalizeStructuralName).filter(Boolean),
  )

  // Match on the object (node) name first: it is stable across material swaps,
  // so re-applying a colour after the surface material has already been renamed
  // still resolves to the same mesh.
  const structuralMatches = meshes.filter((mesh) => {
    const objectName = normalizeStructuralName(mesh.name)
    const geometryName = normalizeStructuralName(mesh.geometry?.name)

    return (
      (objectName && objectNameSet.has(objectName)) ||
      (geometryName && meshNameSet.has(geometryName))
    )
  })
  const matches = structuralMatches.length
    ? structuralMatches
    : meshes.filter((mesh) =>
        getMaterials(mesh).some((material) =>
          mapping.materialNames?.includes(material.name),
        ),
      )

  if (!matches.length) {
    warnMaterialMapping(debugLabel, role, scene)
  }

  return matches
}

function replaceMeshMaterial(mesh, createMaterial) {
  const previousMaterials = getMaterials(mesh)
  const nextMaterials = previousMaterials.map((_, index) => createMaterial(index))

  mesh.material = Array.isArray(mesh.material) ? nextMaterials : nextMaterials[0]
  previousMaterials.forEach((material) => {
    const uploadedTexture = uploadedMaterialMaps.get(material)

    if (uploadedTexture) {
      uploadedTexture.dispose()
      uploadedMaterialMaps.delete(material)
    }

    material.dispose()
  })

  return nextMaterials
}

function applyStandardMetal(scene, mapping, debugLabel) {
  findMappedMeshes(scene, mapping, debugLabel, 'metal/base').forEach((mesh) => {
    replaceMeshMaterial(
      mesh,
      () =>
        new MeshStandardMaterial({
          name: 'Metal',
          color: STANDARD_METAL.color,
          metalness: STANDARD_METAL.metalness,
          roughness: STANDARD_METAL.roughness,
        }),
    )
  })
}

function applyAccessoryMaterialOption(
  scene,
  mapping,
  option,
  debugLabel,
  invalidate,
  onReady,
) {
  if (!option) {
    onReady?.()
    return undefined
  }

  const matchedMeshes = findMappedMeshes(scene, mapping, debugLabel, 'configurable surface')
  if (!matchedMeshes.length) {
    onReady?.()
    return undefined
  }

  if (option.color) {
    matchedMeshes.forEach((mesh) => {
      replaceMeshMaterial(
        mesh,
        () =>
          new MeshStandardMaterial({
            name: `Accessory tabletop ${option.value}`,
            color: option.color,
            metalness: 0,
            roughness: 0.55,
          }),
      )
    })
    invalidate()
    onReady?.()
    return undefined
  }

  if (!option.texturePath) {
    return undefined
  }

  let isActive = true
  const loader = new TextureLoader()

  loader
    .loadAsync(option.texturePath)
    .then((texture) => {
      if (!isActive) {
        texture.dispose()
        return
      }

      texture.colorSpace = SRGBColorSpace
      texture.flipY = false
      texture.wrapS = ClampToEdgeWrapping
      texture.wrapT = ClampToEdgeWrapping
      texture.needsUpdate = true

      matchedMeshes.forEach((mesh, meshIndex) => {
        const materials = replaceMeshMaterial(mesh, (materialIndex) => {
          const map = meshIndex === 0 && materialIndex === 0 ? texture : texture.clone()
          const material = new MeshStandardMaterial({
            name: `Ale Bar Stool Seat ${option.value}`,
            color: '#ffffff',
            map,
            metalness: 0,
            roughness: 0.5,
          })
          uploadedMaterialMaps.set(material, map)
          return material
        })
        materials.forEach((material) => {
          material.needsUpdate = true
        })
      })
      invalidate()
      if (isActive) {
        onReady?.()
      }
    })
    .catch((error) => {
      if (isActive && import.meta.env.DEV) {
        console.warn(
          `[Accessory materials] ${debugLabel}: unable to load ${option.texturePath}.`,
          error,
        )
      }
      if (isActive) {
        onReady?.()
      }
    })

  return () => {
    isActive = false
  }
}

function applyGraphicHighlight(scene, materialName, invalidate) {
  if (!materialName) {
    return undefined
  }

  const restorations = []

  scene.traverse((object) => {
    if (!object.isMesh) {
      return
    }

    getMaterials(object).forEach((material) => {
      if (material.name !== materialName) {
        return
      }

      if (material.emissive) {
        const emissive = material.emissive.clone()
        const emissiveIntensity = material.emissiveIntensity
        material.emissive.copy(GRAPHIC_HIGHLIGHT_COLOR)
        material.emissiveIntensity = 0.75
        restorations.push(() => {
          material.emissive.copy(emissive)
          material.emissiveIntensity = emissiveIntensity
        })
      } else if (material.color) {
        const color = material.color.clone()
        material.color.lerp(GRAPHIC_HIGHLIGHT_COLOR, 0.55)
        restorations.push(() => material.color.copy(color))
      }

      material.needsUpdate = true
    })
  })

  invalidate()

  return () => {
    restorations.forEach((restore) => restore())
    invalidate()
  }
}

function disposeClonedModelMaterials(scene) {
  scene.traverse((object) => {
    if (!object.isMesh) {
      return
    }

    getMaterials(object).forEach((material) => {
      const uploadedTexture = uploadedMaterialMaps.get(material)

      if (uploadedTexture) {
        uploadedTexture.dispose()
        uploadedMaterialMaps.delete(material)
      }

      material.dispose()
    })
  })
}

function useGraphicTextureUrls(graphicZones = [], graphicUploads = {}) {
  const textureSignature = JSON.stringify(
    graphicZones.map(
      (zone) => graphicUploads[zone.id]?.textureUrl ?? zone.defaultTexturePath ?? null,
    ),
  )

  return useMemo(() => {
    const textureUrls = JSON.parse(textureSignature)

    return Object.fromEntries(
      graphicZones.map((zone, index) => [zone.materialName, textureUrls[index]]),
    )
  }, [graphicZones, textureSignature])
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
  materialMapping,
  materialOption,
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
  highlightedMaterialName,
  onBoundsChange,
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
  const materialOptionKey = materialOption?.texturePath ?? materialOption?.value ?? null
  const [readyMaterialOptionKey, setReadyMaterialOptionKey] = useState(null)
  const isMaterialReady =
    !materialOption?.texturePath || readyMaterialOptionKey === materialOptionKey

  useEffect(() => {
    prepareSceneForPreview(modelScene, { castsShadow })
  }, [castsShadow, modelScene])

  useEffect(() => {
    return () => disposeClonedModelMaterials(modelScene)
  }, [modelScene])

  useEffect(() => {
    return applyGraphicTextures(modelScene, graphicTextureUrls, invalidate)
  }, [graphicTextureUrls, invalidate, modelScene])

  useLayoutEffect(() => {
    applyStandardMetal(modelScene, materialMapping?.metal, debugLabel)
    invalidate()
  }, [debugLabel, invalidate, materialMapping, modelScene])

  useLayoutEffect(() => {
    return applyAccessoryMaterialOption(
      modelScene,
      materialMapping?.surface,
      materialOption,
      debugLabel,
      invalidate,
      () => setReadyMaterialOptionKey(materialOptionKey),
    )
  }, [debugLabel, invalidate, materialMapping, materialOption, materialOptionKey, modelScene])

  useEffect(() => {
    return applyGraphicHighlight(modelScene, highlightedMaterialName, invalidate)
  }, [highlightedMaterialName, invalidate, modelScene])

  useEffect(() => {
    onStatusChange?.(isRenderable ? 'ready' : 'empty')
  }, [isRenderable, onStatusChange])

  // Surface the model's measured local bounds so placement clamping can derive a
  // per-object floor limit from real geometry instead of assuming origin==bottom.
  useEffect(() => {
    onBoundsChange?.(bounds)
  }, [bounds, onBoundsChange])

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
      <group
        position={pivotPosition}
        rotation={rotation}
        scale={scale}
        visible={isMaterialReady}
      >
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

function AccessoryModels({
  accessory,
  placement,
  settings,
  graphicUploads,
  selectedAccessoryId,
  hideSelectionOutline,
  onAccessorySelect,
  onAccessoryPositionChange,
  onAccessoryRotationChange,
  onDragStart,
  onDragEnd,
  highlightedGraphicZoneId,
  onVerticalMinChange,
}) {
  const graphicTextureUrls = useGraphicTextureUrls(
    accessory.graphicZones,
    graphicUploads,
  )
  const quantity = Number.isInteger(accessory.defaultQuantity)
    ? settings.quantity ?? accessory.defaultQuantity
    : 1
  const sizeScale = accessory.defaultSize
    ? (settings.size ?? accessory.defaultSize) / accessory.defaultSize
    : 1
  const verticalSpacing = accessory.verticalSpacing ?? 0
  // Bounds of a single model copy; all stacked shelf copies share the same box.
  const [modelBounds, setModelBounds] = useState(null)

  // Report how far this accessory may be lowered before its geometry reaches the
  // floor. Only wall-mounted objects (shelves, TVs) use a bounds-derived limit;
  // floor-based objects keep the plain floor at 0 so their movement is unchanged.
  // Recomputes when the shelf count or TV size changes, since both shift the
  // object's lowest point relative to its origin.
  useEffect(() => {
    if (!onVerticalMinChange) {
      return
    }

    const verticalMin = accessory.allowVerticalMovement
      ? getAccessoryVerticalMinY({
          bounds: modelBounds,
          sizeScale,
          quantity,
          verticalSpacing,
        })
      : 0

    onVerticalMinChange(accessory.id, verticalMin)
  }, [
    accessory.allowVerticalMovement,
    accessory.id,
    modelBounds,
    onVerticalMinChange,
    quantity,
    sizeScale,
    verticalSpacing,
  ])

  const materialOption = useMemo(() => {
    if (!accessory.defaultColor) {
      return null
    }

    const selectedColor = settings.color ?? accessory.defaultColor
    const option = accessory.colorOptions?.find(
      (colorOption) => colorOption.value === selectedColor,
    )

    return option ?? null
  }, [accessory.colorOptions, accessory.defaultColor, settings.color])

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
        materialMapping={accessory.materialMapping}
        materialOption={materialOption}
        onBoundsChange={index === 0 ? setModelBounds : undefined}
        castsShadow
        onSelect={() => onAccessorySelect?.(accessory.id)}
        dragPosition={placement.position}
        onPositionChange={(position) =>
          onAccessoryPositionChange?.(accessory.id, position)
        }
        onRotationChange={(rotation) =>
          onAccessoryRotationChange?.(accessory.id, rotation)
        }
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
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
        highlightedMaterialName={
          accessory.graphicZones?.find(
            (zone) => zone.id === highlightedGraphicZoneId,
          )?.materialName
        }
      />
    </ModelErrorBoundary>
  ))
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
  highlightedGraphicZoneId,
  onBoothLoadingChange,
  onAccessoryVerticalMinChange,
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

  // Report only the *booth* model's load state upward. The full-screen loading
  // overlay is driven by this signal, so it appears for the initial load and
  // real booth/model changes -- but never for add-ons, carpet swaps, or graphic
  // uploads, which load inside their own Suspense boundaries below.
  useEffect(() => {
    onBoothLoadingChange?.(boothModelStatus === 'loading')
  }, [boothModelStatus, onBoothLoadingChange])
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
  const boothGraphicTextureUrls = useGraphicTextureUrls(
    booth.graphicZones,
    graphicUploads,
  )
  return (
    <Canvas
      shadows="basic"
      dpr={isMobile ? MOBILE_DPR : DESKTOP_DPR}
      frameloop="demand"
      gl={CANVAS_GL_OPTIONS}
      onCreated={({ gl }) => gl.setClearColor(SCENE_CLEAR_COLOR, 0)}
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
        <SceneEnvironment isMobile={isMobile} />
      </Suspense>
      {/*
        Each loadable part of the scene lives in its own Suspense boundary. A
        Suspense boundary reverts to its fallback whenever ANY descendant
        suspends, so keeping booth, accessories, and flooring separate means a
        newly loading asset (an add-on GLB, a carpet texture) can never blank
        the rest of the already-loaded scene.
      */}

      {/*
        Booth model. Keyed by booth.id so it remounts only on a real booth
        change (the one case where the full overlay is expected). Its load state
        is what drives the overlay via handleBoothStatusChange.
      */}
      <Suspense key={booth.id} fallback={null}>
        <ModelErrorBoundary
          resetKey={booth.modelPath}
          onError={handleBoothError}
        >
          <LoadedModel
            debugLabel={booth.code}
            modelPath={booth.modelPath}
            graphicTextureUrls={boothGraphicTextureUrls}
            onStatusChange={handleBoothStatusChange}
            highlightedMaterialName={
              booth.graphicZones?.find(
                (zone) => zone.id === highlightedGraphicZoneId,
              )?.materialName
            }
          />
        </ModelErrorBoundary>
      </Suspense>

      {/*
        One Suspense boundary per accessory. Adding an add-on suspends only its
        own boundary while its model loads; the booth and every other accessory
        stay visible. Already-loaded GLBs are served from drei's useGLTF cache,
        so re-adding an accessory does not suspend at all.
      */}
      {accessories.map((accessory) => {
        const placement = accessoryPlacements[accessory.id] ?? accessory
        const settings = addOnSettings[accessory.id] ?? {}
        return (
          <Suspense key={accessory.id} fallback={null}>
            <group>
              <AccessoryModels
                accessory={accessory}
                placement={placement}
                settings={settings}
                graphicUploads={graphicUploads}
                selectedAccessoryId={selectedAccessoryId}
                hideSelectionOutline={hideSelectionOutline}
                onAccessorySelect={onAccessorySelect}
                onAccessoryPositionChange={onAccessoryPositionChange}
                onAccessoryRotationChange={onAccessoryRotationChange}
                onDragStart={handleAccessoryDragStart}
                onDragEnd={handleAccessoryDragEnd}
                highlightedGraphicZoneId={highlightedGraphicZoneId}
                onVerticalMinChange={onAccessoryVerticalMinChange}
              />
            </group>
          </Suspense>
        )
      })}

      {/*
        Flooring. Its own boundary so switching carpet color only re-suspends
        the floor slab (briefly, and only the first time each texture loads),
        never the booth scene.
      */}
      <Suspense fallback={null}>
        <ExhibitFloor boothSize={booth.size} flooring={flooring} hideGrid={hideGrid} />
      </Suspense>
      {(boothModelStatus === 'empty' || boothModelStatus === 'failed') && (
        <FallbackBoothModel booth={booth} />
      )}
      <OrbitControls
        ref={orbitControlsRef}
        makeDefault
        enabled={!isDraggingAccessory}
        enablePan={false}
        minDistance={4.8}
        maxDistance={22}
        target={CAMERA_TARGET}
      />
      <SceneCaptureBridge boothSize={booth.size} captureRef={ref} />
    </Canvas>
  )
})

export default CanvasScene
