import type { CustomPin, SavedCustomPin } from '../entities/MapRoute.entity'

export type LocalCustomPinsStorage = {
  create(pin: CustomPin): SavedCustomPin
  read(): SavedCustomPin[]
  write(savedPins: SavedCustomPin[]): void
}
