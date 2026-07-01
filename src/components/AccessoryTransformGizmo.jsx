import { useEffect, useRef, useState } from 'react'
import { Mesh, Plane, Vector3 } from 'three'
import { useThree } from '@react-three/fiber'

const FLOOR_PLANE = new Plane(new Vector3(0, 1, 0), 0)

// Rotate is measured in screen space (what the user actually sees/drags).
// Screen-space atan2 uses y-down, so its angle increases CLOCKWISE, while a
// positive world +Y rotation appears COUNTER-CLOCKWISE from this above/in-front
// camera. So the object's vertical rotation is the negated screen-angle delta.
// This is the single place to flip if drag direction ever feels reversed.
const SCREEN_TO_OBJECT_ROTATION = -1

// The gizmo is drawn on top of the model (depthTest:false), but its invisible
// hit meshes are real 3D objects that physically sit inside the selected model.
// Without help, the raycaster picks the nearer model surface, so a pointer-down
// on the ring lands on the model instead of the handle — rotate never starts and
// OrbitControls keeps the drag. This raycast shrinks the reported hit distance so
// the gizmo handles always win the pick (relative order among handles preserved),
// making the gizmo grabbable even where it overlaps the model.
const GIZMO_PICK_BIAS = 1e-4

function priorityRaycast(raycaster, intersects) {
  const start = intersects.length
  Mesh.prototype.raycast.call(this, raycaster, intersects)
  for (let i = start; i < intersects.length; i += 1) {
    intersects[i].distance *= GIZMO_PICK_BIAS
  }
}

const X_AXIS_COLOR = '#ef4444'
const X_AXIS_ACTIVE_COLOR = '#fca5a5'
const DEPTH_AXIS_COLOR = '#22c55e'
const DEPTH_AXIS_ACTIVE_COLOR = '#86efac'
const VERTICAL_AXIS_COLOR = '#3b82f6'
const VERTICAL_AXIS_ACTIVE_COLOR = '#93c5fd'
const ROTATE_COLOR = '#f59e0b'
const ROTATE_ACTIVE_COLOR = '#fcd34d'
const GIZMO_RENDER_ORDER = 1000

function normalizeAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle))
}

export default function AccessoryTransformGizmo({
  position,
  placementPosition,
  placementRotation,
  rotationStep,
  allowVerticalMovement = false,
  onPositionChange,
  onRotationChange,
  onDragStart,
  onDragEnd,
}) {
  const camera = useThree((state) => state.camera)
  const gl = useThree((state) => state.gl)
  const groupRef = useRef(null)
  const interaction = useRef(null)
  const intersectionPoint = useRef(new Vector3())
  const worldCenter = useRef(new Vector3())
  const verticalPlane = useRef(new Plane())
  const verticalPlaneNormal = useRef(new Vector3())
  const projection = useRef(new Vector3())
  const [hoveredHandle, setHoveredHandle] = useState(null)
  const [activeHandle, setActiveHandle] = useState(null)

  const isHighlighted = (handle) =>
    hoveredHandle === handle || activeHandle === handle

  const stopNativePointerHandling = (event) => {
    event.nativeEvent.preventDefault()
    event.nativeEvent.stopPropagation()
    event.nativeEvent.stopImmediatePropagation?.()
  }

  const capturePointer = (event) => {
    event.target.setPointerCapture?.(event.pointerId)
    event.nativeEvent.target?.setPointerCapture?.(event.pointerId)
  }

  const getInteractionPlane = (axis) => {
    if (axis !== 'y') {
      return FLOOR_PLANE
    }

    groupRef.current.getWorldPosition(worldCenter.current)
    verticalPlaneNormal.current.set(
      camera.position.x - worldCenter.current.x,
      0,
      camera.position.z - worldCenter.current.z,
    )

    if (verticalPlaneNormal.current.lengthSq() < 0.0001) {
      verticalPlaneNormal.current.set(0, 0, 1)
    } else {
      verticalPlaneNormal.current.normalize()
    }

    return verticalPlane.current.setFromNormalAndCoplanarPoint(
      verticalPlaneNormal.current,
      worldCenter.current,
    )
  }

  const beginAxisDrag = (axis, handle, event) => {
    event.stopPropagation()
    stopNativePointerHandling(event)
    const plane = getInteractionPlane(axis)
    const intersection = event.ray.intersectPlane(plane, intersectionPoint.current)

    if (!intersection) {
      return
    }

    capturePointer(event)
    interaction.current = {
      mode: 'translate',
      axis,
      plane,
      pointerId: event.pointerId,
      startPoint: intersection.clone(),
      startPlacement: [...placementPosition],
    }
    setActiveHandle(handle)
    onDragStart?.()
  }

  // Project a world-space point to canvas pixel coordinates (client space, to
  // match pointer event clientX/clientY).
  const projectToScreen = (worldPoint) => {
    projection.current.copy(worldPoint).project(camera)
    const rect = gl.domElement.getBoundingClientRect()
    return {
      x: rect.left + (projection.current.x * 0.5 + 0.5) * rect.width,
      y: rect.top + (projection.current.y * -0.5 + 0.5) * rect.height,
    }
  }

  // Rotation is driven by window-level pointer events and measured purely in
  // screen space around the object's projected center. The object spins about
  // its own vertical axis and the camera is locked during the drag, so the
  // screen pivot is fixed — we compute it once. Each move accumulates the
  // shortest signed screen-angle step (no ±π wrap, no >180° sign flip), and we
  // rotate smoothly while dragging and snap to the increment on release.
  const beginRotate = (event) => {
    event.stopPropagation()
    stopNativePointerHandling(event)
    groupRef.current.getWorldPosition(worldCenter.current)
    const screenCenter = projectToScreen(worldCenter.current)

    const pointerId = event.pointerId
    const startRotation = [...placementRotation]
    let previousAngle = Math.atan2(
      event.nativeEvent.clientY - screenCenter.y,
      event.nativeEvent.clientX - screenCenter.x,
    )
    let accumulatedRotation = 0

    const applyRotation = (snap) => {
      const rawRotation =
        startRotation[1] + SCREEN_TO_OBJECT_ROTATION * accumulatedRotation
      const nextRotation = [...startRotation]
      nextRotation[1] = snap
        ? Math.round(rawRotation / rotationStep) * rotationStep
        : rawRotation
      onRotationChange(nextRotation)
    }

    const onMove = (nativeEvent) => {
      if (nativeEvent.pointerId !== pointerId) {
        return
      }

      nativeEvent.preventDefault()
      const angle = Math.atan2(
        nativeEvent.clientY - screenCenter.y,
        nativeEvent.clientX - screenCenter.x,
      )
      accumulatedRotation += normalizeAngle(angle - previousAngle)
      previousAngle = angle
      applyRotation(false)
    }

    const finishRotate = (snap) => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      gl.domElement.releasePointerCapture?.(pointerId)
      if (snap) {
        applyRotation(true)
      }
      interaction.current = null
      setActiveHandle(null)
      onDragEnd?.()
    }

    const onUp = (nativeEvent) => {
      if (nativeEvent.pointerId !== pointerId) {
        return
      }

      finishRotate(true)
    }

    interaction.current = { mode: 'rotate', pointerId, finishRotate }
    gl.domElement.setPointerCapture?.(pointerId)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    setActiveHandle('rotate')
    onDragStart?.()
  }

  useEffect(() => {
    return () => {
      if (interaction.current?.mode === 'rotate') {
        // Component unmounted mid-drag (e.g. deselected): snap and restore.
        interaction.current.finishRotate(true)
      }
    }
  }, [])

  useEffect(() => {
    groupRef.current?.traverse((object) => {
      object.renderOrder = GIZMO_RENDER_ORDER
    })
  }, [])

  const moveInteraction = (event) => {
    const current = interaction.current

    if (
      !current ||
      current.mode !== 'translate' ||
      current.pointerId !== event.pointerId
    ) {
      return
    }

    event.stopPropagation()
    stopNativePointerHandling(event)

    const intersection = event.ray.intersectPlane(
      current.plane,
      intersectionPoint.current,
    )

    if (!intersection) {
      return
    }

    const nextPosition = [...current.startPlacement]
    const coordinateIndex = current.axis === 'x' ? 0 : current.axis === 'y' ? 1 : 2
    nextPosition[coordinateIndex] +=
      intersection[current.axis] - current.startPoint[current.axis]
    onPositionChange(nextPosition)
  }

  const finishInteraction = (event) => {
    const current = interaction.current

    if (!current || current.pointerId !== event.pointerId) {
      return
    }

    event.stopPropagation()
    stopNativePointerHandling(event)
    interaction.current = null
    setActiveHandle(null)
    event.target.releasePointerCapture?.(event.pointerId)
    event.nativeEvent.target?.releasePointerCapture?.(event.pointerId)
    onDragEnd?.()
  }

  const handlePointerOver = (handle, event) => {
    event.stopPropagation()
    setHoveredHandle(handle)
  }

  const handlePointerOut = (handle, event) => {
    event.stopPropagation()
    setHoveredHandle((current) => (current === handle ? null : current))
  }

  return (
    <group ref={groupRef} position={position}>
      <mesh position={[0.35, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, 0.7, 10]} />
        <meshBasicMaterial
          color={isHighlighted('x') ? X_AXIS_ACTIVE_COLOR : X_AXIS_COLOR}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0.75, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.065, 0.17, 14]} />
        <meshBasicMaterial
          color={isHighlighted('x') ? X_AXIS_ACTIVE_COLOR : X_AXIS_COLOR}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
      <mesh
        position={[0.4, 0, 0]}
        rotation={[0, 0, -Math.PI / 2]}
        raycast={priorityRaycast}
        onPointerOver={(event) => handlePointerOver('x', event)}
        onPointerOut={(event) => handlePointerOut('x', event)}
        onPointerDown={(event) => beginAxisDrag('x', 'x', event)}
        onPointerMove={moveInteraction}
        onPointerUp={finishInteraction}
        onPointerCancel={finishInteraction}
      >
        <cylinderGeometry args={[0.09, 0.09, 0.9, 10]} />
        <meshBasicMaterial
          transparent
          opacity={0.001}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[0, 0, 0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.7, 10]} />
        <meshBasicMaterial
          color={
            isHighlighted('depth') ? DEPTH_AXIS_ACTIVE_COLOR : DEPTH_AXIS_COLOR
          }
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, 0, 0.75]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.065, 0.17, 14]} />
        <meshBasicMaterial
          color={
            isHighlighted('depth') ? DEPTH_AXIS_ACTIVE_COLOR : DEPTH_AXIS_COLOR
          }
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
      <mesh
        position={[0, 0, 0.4]}
        rotation={[Math.PI / 2, 0, 0]}
        raycast={priorityRaycast}
        onPointerOver={(event) => handlePointerOver('depth', event)}
        onPointerOut={(event) => handlePointerOut('depth', event)}
        onPointerDown={(event) => beginAxisDrag('z', 'depth', event)}
        onPointerMove={moveInteraction}
        onPointerUp={finishInteraction}
        onPointerCancel={finishInteraction}
      >
        <cylinderGeometry args={[0.09, 0.09, 0.9, 10]} />
        <meshBasicMaterial
          transparent
          opacity={0.001}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      {allowVerticalMovement && (
        <>
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.7, 10]} />
            <meshBasicMaterial
              color={
                isHighlighted('vertical')
                  ? VERTICAL_AXIS_ACTIVE_COLOR
                  : VERTICAL_AXIS_COLOR
              }
              depthTest={false}
              depthWrite={false}
            />
          </mesh>
          <mesh position={[0, 0.75, 0]}>
            <coneGeometry args={[0.065, 0.17, 14]} />
            <meshBasicMaterial
              color={
                isHighlighted('vertical')
                  ? VERTICAL_AXIS_ACTIVE_COLOR
                  : VERTICAL_AXIS_COLOR
              }
              depthTest={false}
              depthWrite={false}
            />
          </mesh>
          <mesh
            position={[0, 0.4, 0]}
            raycast={priorityRaycast}
            onPointerOver={(event) => handlePointerOver('vertical', event)}
            onPointerOut={(event) => handlePointerOut('vertical', event)}
            onPointerDown={(event) => beginAxisDrag('y', 'vertical', event)}
            onPointerMove={moveInteraction}
            onPointerUp={finishInteraction}
            onPointerCancel={finishInteraction}
          >
            <cylinderGeometry args={[0.09, 0.09, 0.9, 10]} />
            <meshBasicMaterial
              transparent
              opacity={0.001}
              depthTest={false}
              depthWrite={false}
            />
          </mesh>
        </>
      )}

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.32, 0.018, 10, 48]} />
        <meshBasicMaterial
          color={isHighlighted('rotate') ? ROTATE_ACTIVE_COLOR : ROTATE_COLOR}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        raycast={priorityRaycast}
        onPointerOver={(event) => handlePointerOver('rotate', event)}
        onPointerOut={(event) => handlePointerOut('rotate', event)}
        onPointerDown={beginRotate}
      >
        <torusGeometry args={[0.32, 0.17, 12, 48]} />
        <meshBasicMaterial
          transparent
          opacity={0.001}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
