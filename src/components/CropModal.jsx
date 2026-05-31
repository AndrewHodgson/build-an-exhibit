import Cropper from 'react-easy-crop'
import { useState } from 'react'
import { createCroppedImageUrl } from '../utils/cropImage.js'

export default function CropModal({ cropRequest, onApply, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [isApplying, setIsApplying] = useState(false)
  const { zone } = cropRequest

  async function applyCrop() {
    if (!croppedAreaPixels) {
      return
    }

    setIsApplying(true)

    try {
      const textureUrl = await createCroppedImageUrl(
        cropRequest.imageSrc,
        croppedAreaPixels,
        {
          width: zone.recommendedWidth,
          height: zone.recommendedHeight,
        },
      )

      onApply(textureUrl)
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <div className="modal-backdrop crop-modal-backdrop" role="presentation">
      <section
        className="crop-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="crop-modal-title"
      >
        <div className="modal-heading crop-modal-heading">
          <p className="eyebrow">{zone.label}</p>
          <h1 id="crop-modal-title">Crop graphic preview</h1>
          <p>
            Reposition and zoom your JPG to fit {zone.recommendedWidth} x{' '}
            {zone.recommendedHeight}px.
          </p>
        </div>

        <div className="crop-stage">
          <Cropper
            image={cropRequest.imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={zone.recommendedWidth / zone.recommendedHeight}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, nextCroppedAreaPixels) =>
              setCroppedAreaPixels(nextCroppedAreaPixels)
            }
          />
        </div>

        <label className="zoom-control">
          <span>Zoom</span>
          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
        </label>

        <div className="modal-actions crop-modal-actions">
          <button
            type="button"
            className="primary-button"
            onClick={applyCrop}
            disabled={isApplying}
          >
            {isApplying ? 'Applying...' : 'Apply Crop'}
          </button>
          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </section>
    </div>
  )
}
