import type { CustomPin, SavedCustomPin } from '../entities/MapRoute.entity'

export type CustomPinsRepository = {
  create(pin: CustomPin, ownerId: string): Promise<SavedCustomPin>
  delete(pinId: string): Promise<void>
  listMine(): Promise<SavedCustomPin[]>
  update(pinId: string, pin: CustomPin, ownerId: string): Promise<SavedCustomPin>
}
