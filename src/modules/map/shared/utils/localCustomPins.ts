import type { CustomPin, SavedCustomPin } from '../../core/entities/MapRoute.entity'
import { logger } from '../../../../lib/utils'

const STORAGE_KEY = 'shinobi-builder:saved-custom-pins'

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

function createSavedPinId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function readSavedCustomPins(): SavedCustomPin[] {
  if (!canUseStorage()) {
    return []
  }

  const rawPins = window.localStorage.getItem(STORAGE_KEY)

  if (!rawPins) {
    return []
  }

  try {
    const parsed = JSON.parse(rawPins) as unknown[]

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.reduce<SavedCustomPin[]>((acc, item) => {
      try {
        const savedPin = item as SavedCustomPin
        acc.push({
          ...savedPin,
          color: savedPin.color || '#00d6a3',
          createdAt: savedPin.createdAt || new Date().toISOString(),
          description: savedPin.description || undefined,
          id: savedPin.id,
          name: savedPin.name || 'Pin sem nome',
          iconId: savedPin.iconId || 'arena',
          tags: Array.isArray(savedPin.tags) ? savedPin.tags : [],
          x: typeof savedPin.x === 'number' ? savedPin.x : 50,
          y: typeof savedPin.y === 'number' ? savedPin.y : 50,
          isPlaced: typeof savedPin.isPlaced === 'boolean' ? savedPin.isPlaced : true,
          checked: typeof savedPin.checked === 'boolean' ? savedPin.checked : false,
          source: 'local',
          updatedAt: savedPin.updatedAt || new Date().toISOString(),
        })
      } catch (error) {
        logger.warn('Shinobi Builder: Removendo pin corrompido do localStorage', error)
      }

      return acc
    }, [])
  } catch {
    return []
  }
}

export function writeSavedCustomPins(savedPins: SavedCustomPin[]): void {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPins))
}

export function createSavedCustomPin(pin: CustomPin): SavedCustomPin {
  const now = new Date().toISOString()

  return {
    ...pin,
    createdAt: now,
    id: pin.id || createSavedPinId(),
    isPlaced: typeof pin.isPlaced === 'boolean' ? pin.isPlaced : true,
    checked: typeof pin.checked === 'boolean' ? pin.checked : false,
    source: 'local',
    updatedAt: now,
  }
}
