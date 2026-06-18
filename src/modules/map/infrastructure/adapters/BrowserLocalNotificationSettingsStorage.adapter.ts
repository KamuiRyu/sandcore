import type { NotificationSettings } from '../../core/entities/NotificationSettings.entity'
import { defaultNotificationSettings } from '../../core/entities/NotificationSettings.entity'
import type { LocalNotificationSettingsStorage } from '../../core/ports/LocalNotificationSettingsStorage.port'
import { logger } from '../../../../lib/utils'

const STORAGE_KEY = 'shinobi-map-notification-settings'

export const browserLocalNotificationSettingsStorage: LocalNotificationSettingsStorage = {
  read(): NotificationSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        return defaultNotificationSettings
      }
      
      const parsed = JSON.parse(stored)
      // Merge with default settings to ensure new fields are populated if they exist
      return {
        ...defaultNotificationSettings,
        ...parsed,
        enabledTypes: {
          ...defaultNotificationSettings.enabledTypes,
          ...(parsed.enabledTypes || {}),
        },
      }
    } catch {
      return defaultNotificationSettings
    }
  },

  write(settings: NotificationSettings): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch (e) {
      logger.error('Failed to save notification settings:', e)
    }
  },
}
