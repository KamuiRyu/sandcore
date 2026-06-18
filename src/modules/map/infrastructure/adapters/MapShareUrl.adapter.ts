import type { CustomRoute } from '../../core/entities/MapRoute.entity'
import { decodeMapRoute } from '../../core/usecases/DecodeMapRouteShare.usecase'
import { encodeMapRoute } from '../../core/usecases/EncodeMapRouteShare.usecase'

export function createMapShareUrl(route: CustomRoute): string {
  const url = new URL(window.location.href)

  url.pathname = '/map'
  url.searchParams.delete('debug')
  url.searchParams.set('r', encodeMapRoute(route))

  return url.toString()
}

export function readSharedMapRoute(): CustomRoute | null {
  const encoded = new URLSearchParams(window.location.search).get('r')

  if (!encoded) {
    return null
  }

  try {
    return decodeMapRoute(encoded)
  } catch {
    return null
  }
}
