import type { CustomRoute, SavedMapRoute } from '../entities/MapRoute.entity'

export type LocalMapRoutesStorage = {
  create(route: CustomRoute): SavedMapRoute
  read(): SavedMapRoute[]
  write(savedRoutes: SavedMapRoute[]): void
}
