import type { NotificationSettings } from '../entities/NotificationSettings.entity'

export type NotificationSettingsRepository = {
  read(userId: string): Promise<NotificationSettings | null>
  update(userId: string, settings: NotificationSettings): Promise<void>
}
