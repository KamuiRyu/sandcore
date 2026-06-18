import { ClientResponseError } from 'pocketbase'
import { pb } from '../../../../lib/pocketbase'
import type { NotificationSettings } from '../../core/entities/NotificationSettings.entity'
import type { NotificationSettingsRepository } from '../../core/ports/NotificationSettingsRepository.port'
import { logger } from '../../../../lib/utils'

const collectionName = 'map_notification_settings'

export const pocketBaseNotificationSettingsRepository: NotificationSettingsRepository = {
  async read(userId: string): Promise<NotificationSettings | null> {
    try {
      const record = await pb.collection(collectionName).getFirstListItem(`owner = "${userId}"`, {
        requestKey: null,
      })

      if (!record) return null

      return {
        soundEnabled: record.sound_enabled ?? false,
        soundVolume: record.sound_volume ?? 0.5,
        soundType: record.sound_type ?? 'jutsu',
        pushEnabled: record.push_enabled ?? false,
        globalAlertsEnabled: record.global_alerts_enabled ?? false,
        leadTime: record.lead_time ?? 0,
        enabledTypes: record.enabled_types ?? {},
        rememberLastSubtype: record.remember_last_subtype ?? true,
        showReadyAlerts: record.show_ready_alerts ?? true,
        hideUnmarkedResources: record.hide_unmarked_resources ?? false,
        lastSelectedSubTypes: record.last_selected_subtypes ?? {},
        defaultPinVisibility: record.default_pin_visibility ?? 'private',
        showSubRegionNames: record.show_sub_region_names ?? true,
      }
    } catch (error) {
      if (error instanceof ClientResponseError && (error.status === 404 || error.isAbort)) return null
      logger.error('Failed to read notification settings from PocketBase:', error)
      return null
    }
  },

  async update(userId: string, settings: NotificationSettings): Promise<void> {
    try {
      const existing = await this.read(userId)

      const data = {
        owner: userId,
        sound_enabled: settings.soundEnabled,
        sound_volume: settings.soundVolume,
        sound_type: settings.soundType,
        push_enabled: settings.pushEnabled,
        global_alerts_enabled: settings.globalAlertsEnabled,
        lead_time: settings.leadTime,
        enabled_types: settings.enabledTypes,
        remember_last_subtype: settings.rememberLastSubtype,
        show_ready_alerts: settings.showReadyAlerts,
        hide_unmarked_resources: settings.hideUnmarkedResources,
        last_selected_subtypes: settings.lastSelectedSubTypes,
        default_pin_visibility: settings.defaultPinVisibility,
        show_sub_region_names: settings.showSubRegionNames,
      }

      if (existing) {
        const record = await pb.collection(collectionName).getFirstListItem(`owner = "${userId}"`, {
            requestKey: null,
        })
        await pb.collection(collectionName).update(record.id, data, {
          requestKey: null,
        })
      } else {
        await pb.collection(collectionName).create(data, {
          requestKey: null,
        })
      }
    } catch (error) {
      if (error instanceof ClientResponseError && error.isAbort) return
      logger.error('Failed to write notification settings to PocketBase:', error)
    }
  },
}
