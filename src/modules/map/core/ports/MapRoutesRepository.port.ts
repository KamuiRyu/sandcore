import type { CustomRoute, SavedMapRoute } from '../entities/MapRoute.entity'

export type Paginated<T> = {
  items: T[]
  totalItems: number
  totalPages: number
}

export type MapRoutesRepository = {
  create(route: CustomRoute, ownerId: string): Promise<SavedMapRoute>
  delete(routeId: string): Promise<void>
  getPublicBySlug(publicSlug: string): Promise<SavedMapRoute>
  listMine(page?: number, perPage?: number): Promise<Paginated<SavedMapRoute>>
  publish(savedRoute: SavedMapRoute, ownerId: string): Promise<string>
  searchPublic(query: string, page?: number, perPage?: number): Promise<Paginated<SavedMapRoute>>
  unpublish(routeId: string): Promise<void>
  update(routeId: string, route: CustomRoute, ownerId: string): Promise<SavedMapRoute>
}
