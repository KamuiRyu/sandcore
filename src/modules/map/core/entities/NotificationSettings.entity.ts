import type { MapMarkerType } from './MapCalibration.entity'

export type NotificationSoundType =
  | 'confrontation'
  | 'dattebayo'
  | 'good_morning'
  | 'jutsu'
  | 'obito'
  | 'naruto_iyoo'

export type MinimapCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
export type MinimapSize = 'small' | 'medium' | 'large'

export type NotificationSettings = {
  minimapEnabled?: boolean
  minimapSize?: MinimapSize
  minimapOpacity?: number
  minimapCorner?: MinimapCorner
  minimapShowCompleted?: boolean
  soundEnabled: boolean
  soundVolume: number
  soundType: NotificationSoundType
  pushEnabled: boolean
  globalAlertsEnabled: boolean
  leadTime: number // lead time in seconds (e.g. 0, 10, 30, 60, 120)
  enabledTypes: Record<MapMarkerType | 'custom', boolean>
  rememberLastSubtype: boolean
  showReadyAlerts: boolean
  hideUnmarkedResources: boolean
  lastSelectedSubTypes: Record<string, string> // type -> iconId (e.g. { ore: 'ore_5' })
  showSubRegionNames?: boolean
  defaultPinVisibility?: 'private' | 'group'
}

export const defaultNotificationSettings: NotificationSettings = {
  minimapEnabled: false,
  minimapSize: 'medium',
  minimapOpacity: 85,
  minimapCorner: 'bottom-right',
  minimapShowCompleted: true,
  soundEnabled: false,
  soundVolume: 0.5,
  soundType: 'jutsu',
  pushEnabled: false,
  globalAlertsEnabled: false,
  leadTime: 0,
  rememberLastSubtype: true,
  showReadyAlerts: true,
  hideUnmarkedResources: false,
  showSubRegionNames: true,
  defaultPinVisibility: 'private',
  lastSelectedSubTypes: {},
  enabledTypes: {
    vila: false,
    arena: false,
    house: false,
    bank: false,
    cemetery: false,
    clothing_store: false,
    cotton: true,
    fishing_platform: false,
    gunsmith: false,
    smith: false,
    hibiscus: true,
    hospital: false,
    jingle_bells: false,
    ore: true,
    mushroom: true,
    ninja_academy: false,
    perpetual: true,
    police: false,
    restaurant: false,
    stick: true,
    borago: true,
    merchant: false,
    custom: true,
  },
}
