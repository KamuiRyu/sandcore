import { browserLocalMapRoutesStorage } from '../infrastructure/adapters/BrowserLocalMapRoutesStorage.adapter'
import { pocketBaseMapRoutesRepository } from '../infrastructure/adapters/PocketBaseMapRoutes.adapter'
import { browserLocalCustomPinsStorage } from '../infrastructure/adapters/BrowserLocalCustomPinsStorage.adapter'
import { pocketBaseCustomPinsRepository } from '../infrastructure/adapters/PocketBaseCustomPins.adapter'
import { browserLocalNotificationSettingsStorage } from '../infrastructure/adapters/BrowserLocalNotificationSettingsStorage.adapter'
import { pocketBaseNotificationSettingsRepository } from '../infrastructure/adapters/PocketBaseNotificationSettings.adapter'
import { pocketBaseRespawnRepository } from '../infrastructure/adapters/PocketBaseRespawn.adapter'
import { PocketBaseMapFeedbackRepository } from '../infrastructure/adapters/PocketBaseMapFeedbackRepository.adapter'
import { pbGroupRepository } from '../../groups/infrastructure/adapters/PocketBaseGroup.adapter'
import { pocketBaseMapStatsRepository } from '../infrastructure/adapters/PocketBaseMapStats.adapter'

export const mapDependencies = {
  localMapRoutesStorage: browserLocalMapRoutesStorage,
  mapRoutesRepository: pocketBaseMapRoutesRepository,
  localCustomPinsStorage: browserLocalCustomPinsStorage,
  customPinsRepository: pocketBaseCustomPinsRepository,
  localNotificationSettingsStorage: browserLocalNotificationSettingsStorage,
  notificationSettingsRepository: pocketBaseNotificationSettingsRepository,
  respawnRepository: pocketBaseRespawnRepository,
  mapFeedbackRepository: new PocketBaseMapFeedbackRepository(),
  groupRepository: pbGroupRepository,
  mapStatsRepository: pocketBaseMapStatsRepository,
}

