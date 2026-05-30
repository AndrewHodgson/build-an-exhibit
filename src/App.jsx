import { useMemo, useState } from 'react'
import { boothSizes, getBoothsBySize, getDefaultBooth } from '../data/booths.js'
import CanvasScene from './components/CanvasScene.jsx'
import RightPanel from './components/RightPanel.jsx'
import WelcomeModal from './components/WelcomeModal.jsx'

export default function App() {
  const defaultBooth = getDefaultBooth()
  const [selectedSize, setSelectedSize] = useState(defaultBooth.size)
  const [selectedBoothId, setSelectedBoothId] = useState(defaultBooth.id)
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(true)

  const availableBooths = useMemo(() => getBoothsBySize(selectedSize), [selectedSize])
  const selectedBooth =
    availableBooths.find((booth) => booth.id === selectedBoothId) ??
    availableBooths[0] ??
    defaultBooth

  function selectSize(size) {
    const nextBooth = getDefaultBooth(size)

    setSelectedSize(size)
    setSelectedBoothId(nextBooth.id)
  }

  function selectBooth(boothId) {
    setSelectedBoothId(boothId)
  }

  function completeWelcome({ size, boothId }) {
    setSelectedSize(size)
    setSelectedBoothId(boothId)
    setIsWelcomeOpen(false)
  }

  return (
    <main className="app-shell">
      <section className="scene-layer" aria-label="3D rental exhibit preview">
        <CanvasScene booth={selectedBooth} />
      </section>

      <div className="orbit-hint" aria-hidden="true">
        <p>Left click + drag: orbit / rotate</p>
        <p>Scroll wheel: zoom in / out</p>
      </div>

      <RightPanel
        boothSizes={boothSizes}
        booths={availableBooths}
        selectedSize={selectedSize}
        selectedBooth={selectedBooth}
        onSizeChange={selectSize}
        onBoothChange={selectBooth}
        onOpenWelcome={() => setIsWelcomeOpen(true)}
      />

      {isWelcomeOpen && (
        <WelcomeModal
          boothSizes={boothSizes}
          initialSize={selectedSize}
          initialBoothId={selectedBooth.id}
          onComplete={completeWelcome}
        />
      )}
    </main>
  )
}
