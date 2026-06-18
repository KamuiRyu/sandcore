import type { CustomPin, SavedCustomPin } from '../entities/MapRoute.entity'
import type { Paginated } from './MapRoutesRepository.port'

export type CustomPinsRepository = {
  create(pin: CustomPin, ownerId: string): Promise<SavedCustomPin>
  delete(pinId: string): Promise<void>
  listMine(page?: number, perPage?: number): Promise<Paginated<SavedCustomPin>>
  update(pinId: string, pin: CustomPin, ownerId: string): Promise<SavedCustomPin>
}
