const PUBLIC_BASE_URL = import.meta.env?.BASE_URL ?? '/'
const ABSOLUTE_URL_PATTERN = /^(?:[a-z][a-z\d+\-.]*:|\/\/)/i

export function getPublicAssetUrl(path) {
  if (!path || ABSOLUTE_URL_PATTERN.test(path)) {
    return path
  }

  if (!path.startsWith('/')) {
    return path
  }

  if (PUBLIC_BASE_URL === '/') {
    return path
  }

  return `${PUBLIC_BASE_URL.replace(/\/?$/, '/')}${path.replace(/^\/+/, '')}`
}
