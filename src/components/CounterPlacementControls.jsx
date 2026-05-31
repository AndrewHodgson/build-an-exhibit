function ControllerButton({ className, label, onClick }) {
  return (
    <button
      type="button"
      className={`controller-hit ${className}`}
      aria-label={label}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
    />
  )
}

export default function CounterPlacementControls({ accessoryName, onMove, onRotate, onReset }) {
  return (
    <div
      className="counter-controller"
      role="group"
      aria-label={`${accessoryName} placement`}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <img
        src="/controller.svg"
        alt=""
        className="counter-controller-art"
        draggable="false"
      />

      <ControllerButton
        className="controller-hit-rotate-left"
        label="Rotate counter counterclockwise"
        onClick={() => onRotate('counterclockwise')}
      />
      <ControllerButton
        className="controller-hit-rotate-right"
        label="Rotate counter clockwise"
        onClick={() => onRotate('clockwise')}
      />
      <ControllerButton
        className="controller-hit-up"
        label="Move counter forward"
        onClick={() => onMove('back')}
      />
      <ControllerButton
        className="controller-hit-left"
        label="Move counter left"
        onClick={() => onMove('left')}
      />
      <ControllerButton
        className="controller-hit-right"
        label="Move counter right"
        onClick={() => onMove('right')}
      />
      <ControllerButton
        className="controller-hit-down"
        label="Move counter back"
        onClick={() => onMove('forward')}
      />
      <ControllerButton
        className="controller-hit-reset"
        label="Reset counter placement"
        onClick={onReset}
      />
    </div>
  )
}
