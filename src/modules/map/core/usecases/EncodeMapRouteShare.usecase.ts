import type { CustomRoute, SharedMapRoutePayload } from '../entities/MapRoute.entity'
import { validateMapRoute } from './ValidateMapRoute.usecase'

export const MAX_MAP_ROUTE_BASE64_LENGTH = 50_000

function encodeBase64Url(json: string): string {
  const bytes = new TextEncoder().encode(json)
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')

  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

export function assertMapRouteBase64Size(encoded: string): void {
  if (encoded.length > MAX_MAP_ROUTE_BASE64_LENGTH) {
    throw new Error(
      `A rota ficou grande demais para salvar ou compartilhar. Limite: ${MAX_MAP_ROUTE_BASE64_LENGTH} caracteres em Base64.`,
    )
  }
}

export function encodeMapRoute(route: CustomRoute): string {
  const payload: SharedMapRoutePayload = {
    route: validateMapRoute(route),
    version: 1,
  }
  const encoded = encodeBase64Url(JSON.stringify(payload))

  assertMapRouteBase64Size(encoded)
  return encoded
}
