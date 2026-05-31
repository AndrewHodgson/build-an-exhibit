export default function CounterPlacementControls({
  accessoryName,
  onMove,
  onRotate,
  onReset,
}) {
  return (
    <div className="counter-controls" aria-label={`${accessoryName} placement controls`}>
      <div className="counter-controls-header">
        <p>Counter Placement</p>
        <span>{accessoryName}</span>
      </div>

      <div className="counter-move-grid" aria-label="Move counter">
        <button type="button" onClick={() => onMove('forward')}>
          Forward
        </button>
        <button type="button" onClick={() => onMove('left')}>
          Left
        </button>
        <button type="button" onClick={() => onMove('right')}>
          Right
        </button>
        <button type="button" onClick={() => onMove('back')}>
          Back
        </button>
      </div>

      <div className="counter-rotate-row" aria-label="Rotate counter">
        <button type="button" onClick={() => onRotate('counterclockwise')}>
          Rotate Left
        </button>
        <button type="button" onClick={() => onRotate('clockwise')}>
          Rotate Right
        </button>
      </div>

      <button type="button" className="counter-reset-button" onClick={onReset}>
        Reset
      </button>
    </div>
  )
}
