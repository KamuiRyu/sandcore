import type { CustomRoute, SavedMapRoute } from '../entities/MapRoute.entity'

export type MapRoutesRepository = {
  create(route: CustomRoute, ownerId: string): Promise<SavedMapRoute>
  delete(routeId: string): Promise<void>
  getPublicBySlug(publicSlug: string): Promise<SavedMapRoute>
  listMine(): Promise<SavedMapRoute[]>
  publish(savedRoute: SavedMapRoute, ownerId: string): Promise<string>
  searchPublic(query: string): Promise<SavedMapRoute[]>
  unpublish(routeId: string): Promise<void>
  update(routeId: string, route: CustomRoute, ownerId: string): Promise<SavedMapRoute>
}
