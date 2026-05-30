import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'

const CAMERA_TARGET = [0, 1, 0]
const DESKTOP_CAMERA_POSITION = [2.2, 2.25, 7.5]
const MOBILE_CAMERA_POSITION = [2.7, 2.4, 9.6]

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

function Floor() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow>
        <planeGeometry args={[14, 10]} />
        <meshStandardMaterial color="#eef1f5" roughness={0.78} metalness={0.02} />
      </mesh>
      <gridHelper
        args={[14, 14, '#b9c4d1', '#dfe5ec']}
        position={[0, 0, 0]}
      />
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

function Counter({ position, accent }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.95, 0.58, 0.42]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.02, -0.215]} castShadow>
        <boxGeometry args={[0.96, 0.48, 0.02]} />
        <meshStandardMaterial color={accent} roughness={0.35} />
      </mesh>
    </group>
  )
}

function ExhibitPlaceholder({ booth }) {
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

      <Counter position={[width * 0.23, 0.32, 0.65]} accent={accent} />

      {[-halfWidth, 0, halfWidth].map((x) => (
        <FramePost key={x} position={[x, height / 2, backZ + 0.08]} height={height} />
      ))}

      <mesh position={[-width * 0.24, 0.42, 0.82]} castShadow>
        <cylinderGeometry args={[0.33, 0.33, 0.05, 32]} />
        <meshStandardMaterial color="#cbd3dc" roughness={0.52} metalness={0.22} />
      </mesh>
      <mesh position={[-width * 0.24, 0.22, 0.82]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.4, 16]} />
        <meshStandardMaterial color="#aeb8c4" roughness={0.38} metalness={0.5} />
      </mesh>
    </group>
  )
}

export default function CanvasScene({ booth }) {
  const isMobile = useIsMobileViewport()

  return (
    <Canvas
      shadows
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => gl.setClearAlpha(0)}
    >
      <PerspectiveCamera
        makeDefault
        position={isMobile ? MOBILE_CAMERA_POSITION : DESKTOP_CAMERA_POSITION}
        fov={36}
      />
      <SceneLights />
      <ExhibitPlaceholder booth={booth} />
      <Floor />
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
