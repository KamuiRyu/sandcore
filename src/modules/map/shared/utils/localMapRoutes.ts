import type { CustomRoute, SavedMapRoute } from '../../core/entities/MapRoute.entity'
import { normalizeMapRoute } from '../../core/usecases/NormalizeMapRoute.usecase'
import { mapRouteSchema } from '../../core/usecases/ValidateMapRoute.usecase'
import { logger } from '../../../../lib/utils'

const STORAGE_KEY = 'shinobi-builder:saved-map-routes'

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

function createSavedRouteId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function readSavedMapRoutes(): SavedMapRoute[] {
  if (!canUseStorage()) {
    return []
  }

  const rawRoutes = window.localStorage.getItem(STORAGE_KEY)

  if (!rawRoutes) {
    return []
  }

  try {
    const parsed = JSON.parse(rawRoutes) as unknown[]

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.reduce<SavedMapRoute[]>((acc, item) => {
      try {
        const savedRoute = item as SavedMapRoute
        const route = mapRouteSchema.parse(normalizeMapRoute(savedRoute.route))

        acc.push({
          ...savedRoute,
          color: savedRoute.color || route.color,
          createdAt: savedRoute.createdAt || route.createdAt,
          description: savedRoute.description || route.description,
          id: savedRoute.id || route.id,
          name: savedRoute.name?.trim() || route.name,
          route,
          source: 'local',
          updatedAt: savedRoute.updatedAt || route.updatedAt,
        })
      } catch (error) {
        logger.warn('Shinobi Builder: Removendo rota corrompida do localStorage', error)
      }

      return acc
    }, [])
  } catch {
    return []
  }
}

export function writeSavedMapRoutes(savedRoutes: SavedMapRoute[]): void {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedRoutes))
}

export function createSavedMapRoute(route: CustomRoute): SavedMapRoute {
  const normalizedRoute = normalizeMapRoute(route)
  const now = new Date().toISOString()

  return {
    color: normalizedRoute.color,
    createdAt: now,
    description: normalizedRoute.description,
    id: createSavedRouteId(),
    name: normalizedRoute.name.trim() || 'Rota sem nome',
    isDisposable: normalizedRoute.isDisposable,
    route: {
      ...normalizedRoute,
      createdAt: normalizedRoute.createdAt || now,
      updatedAt: now,
    },
    updatedAt: now,
  }
}
