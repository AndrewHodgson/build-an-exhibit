import { useMemo, useState } from 'react'
import { getBoothsBySize } from '../../data/booths.js'

export default function WelcomeModal({
  boothSizes,
  initialSize,
  initialBoothId,
  onComplete,
}) {
  const [step, setStep] = useState(1)
  const [selectedSize, setSelectedSize] = useState(initialSize)
  const [selectedBoothId, setSelectedBoothId] = useState(initialBoothId)
  const availableBooths = useMemo(() => getBoothsBySize(selectedSize), [selectedSize])

  function chooseSize(size) {
    const nextBooths = getBoothsBySize(size)

    setSelectedSize(size)
    setSelectedBoothId(nextBooths[0]?.id)
    setStep(2)
  }

  function chooseBooth(boothId) {
    setSelectedBoothId(boothId)
    onComplete({ size: selectedSize, boothId })
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="welcome-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
      >
        <div className="modal-brand">
          <span className="brand-mark">S1</span>
          <span>SourceOne Events</span>
        </div>

        <div className="modal-heading">
          <p className="eyebrow">Build an Exhibit</p>
          <h1 id="welcome-title">
            {step === 1 ? 'Choose your exhibit footprint' : 'Choose a rental layout'}
          </h1>
          <p>
            Start with a BeMatrix rental exhibit size and one of the starter layouts.
          </p>
        </div>

        {step === 1 && (
          <div className="choice-grid size-choice-grid">
            {boothSizes.map((size) => (
              <button
                key={size.value}
                type="button"
                className="choice-card"
                onClick={() => chooseSize(size.value)}
              >
                <span className="choice-preview footprint-preview">
                  <img src={size.featuredImagePath} alt="" />
                </span>
                <span className="choice-title">{size.label} Rental Exhibits</span>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <>
            <div className="choice-grid booth-choice-grid">
              {availableBooths.map((booth) => {
                const isSelected = selectedBoothId === booth.id

                return (
                  <button
                    key={booth.id}
                    type="button"
                    className={`choice-card ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => chooseBooth(booth.id)}
                  >
                    <span className="choice-preview booth-preview">
                      <img src={booth.thumbnailPath} alt="" />
                    </span>
                    <span className="choice-title">{booth.name}</span>
                  </button>
                )
              })}
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setStep(1)}>
                Back
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
