import type { NotificationSettings } from '../entities/NotificationSettings.entity'

export type LocalNotificationSettingsStorage = {
  read(): NotificationSettings
  write(settings: NotificationSettings): void
}
