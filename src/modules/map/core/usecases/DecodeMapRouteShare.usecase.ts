import type { CustomRoute, SharedMapRoutePayload } from '../entities/MapRoute.entity'
import { assertMapRouteBase64Size } from './EncodeMapRouteShare.usecase'
import { mapRouteSchema } from './ValidateMapRoute.usecase'

function decodeBase64(encoded: string): string {
  assertMapRouteBase64Size(encoded)

  const normalized = encoded.replaceAll('-', '+').replaceAll('_', '/')
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    '=',
  )
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))

  return new TextDecoder().decode(bytes)
}

function isSharedMapRoutePayload(value: unknown): value is SharedMapRoutePayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    'version' in value &&
    value.version === 1 &&
    'route' in value
  )
}

export function decodeMapRoute(encoded: string): CustomRoute {
  const decoded = JSON.parse(decodeBase64(encoded)) as unknown

  if (isSharedMapRoutePayload(decoded)) {
    return mapRouteSchema.parse(decoded.route)
  }

  return mapRouteSchema.parse(decoded)
}
