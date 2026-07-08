import { getPublicAssetUrl } from '../utils/publicAssetPath.js'

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
      <p className="floor-drag-hint">
        Drag arrows to move one axis. Drag the ring to rotate.
      </p>
      <img
        src={getPublicAssetUrl('/controller.svg')}
        alt=""
        className="counter-controller-art"
        draggable="false"
      />

      <ControllerButton
        className="controller-hit-rotate-left"
        label={`Rotate ${accessoryName} counterclockwise`}
        onClick={() => onRotate('counterclockwise')}
      />
      <ControllerButton
        className="controller-hit-rotate-right"
        label={`Rotate ${accessoryName} clockwise`}
        onClick={() => onRotate('clockwise')}
      />
      <ControllerButton
        className="controller-hit-up"
        label={`Move ${accessoryName} forward`}
        onClick={() => onMove('back')}
      />
      <ControllerButton
        className="controller-hit-left"
        label={`Move ${accessoryName} left`}
        onClick={() => onMove('left')}
      />
      <ControllerButton
        className="controller-hit-right"
        label={`Move ${accessoryName} right`}
        onClick={() => onMove('right')}
      />
      <ControllerButton
        className="controller-hit-down"
        label={`Move ${accessoryName} back`}
        onClick={() => onMove('forward')}
      />
      <ControllerButton
        className="controller-hit-reset"
        label={`Reset ${accessoryName} placement`}
        onClick={onReset}
      />
    </div>
  )
}
