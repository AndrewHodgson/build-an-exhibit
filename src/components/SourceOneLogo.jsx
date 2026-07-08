import { getPublicAssetUrl } from '../utils/publicAssetPath.js'

export default function SourceOneLogo({ className = '' }) {
  return (
    <img
      src={getPublicAssetUrl('/images/SourceOne-Logo-RGB.svg')}
      alt="SourceOne Events"
      className={`sourceone-logo ${className}`.trim()}
    />
  )
}
