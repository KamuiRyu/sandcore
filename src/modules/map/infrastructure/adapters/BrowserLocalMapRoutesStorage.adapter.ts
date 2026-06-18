import type { CustomRoute, SavedMapRoute } from '../../core/entities/MapRoute.entity'
import type { LocalMapRoutesStorage } from '../../core/ports/LocalMapRoutesStorage.port'
import {
  createSavedMapRoute,
  readSavedMapRoutes,
  writeSavedMapRoutes,
} from '../../shared/utils/localMapRoutes'
import { normalizeMapRoute } from '../../core/usecases/NormalizeMapRoute.usecase'

export const browserLocalMapRoutesStorage: LocalMapRoutesStorage = {
  create(route: CustomRoute): SavedMapRoute {
    return createSavedMapRoute(normalizeMapRoute(route))
  },

  read(): SavedMapRoute[] {
    return readSavedMapRoutes().map((savedRoute) => ({
      ...savedRoute,
      route: normalizeMapRoute(savedRoute.route),
      source: 'local',
    }))
  },

  write(savedRoutes: SavedMapRoute[]) {
    writeSavedMapRoutes(savedRoutes)
  },
}
