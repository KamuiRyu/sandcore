import type { CustomPin, SavedCustomPin } from '../../core/entities/MapRoute.entity'
import type { LocalCustomPinsStorage } from '../../core/ports/LocalCustomPinsStorage.port'
import {
  createSavedCustomPin,
  readSavedCustomPins,
  writeSavedCustomPins,
} from '../../shared/utils/localCustomPins'

export const browserLocalCustomPinsStorage: LocalCustomPinsStorage = {
  create(pin: CustomPin): SavedCustomPin {
    return createSavedCustomPin(pin)
  },

  read(): SavedCustomPin[] {
    return readSavedCustomPins()
  },

  write(savedPins: SavedCustomPin[]) {
    writeSavedCustomPins(savedPins)
  },
}
