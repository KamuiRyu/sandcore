import { ClientResponseError } from 'pocketbase'
import { pb } from '../../../../lib/pocketbase'
import { logger } from '../../../../lib/utils'
import type { MapCollectionStats } from '../../core/entities/MapStats.entity'
import type { MapStatsRepository } from '../../core/ports/MapStatsRepository.port'

const collectionName = 'user_map_stats'

export const pocketBaseMapStatsRepository: MapStatsRepository = {
  async getStats(userId: string): Promise<MapCollectionStats[]> {
    try {
      const records = await pb.collection(collectionName).getFullList({
        filter: `owner = "${userId}"`,
        requestKey: null,
      })

      return records.map((r) => ({
        ore_count: r.ore_count || {},
        mushroom_count: r.mushroom_count || {},
        plant_count: r.plant_count || {},
        stick_count: r.stick_count || 0,
        date: r.date,
      }))
    } catch (error) {
      if (error instanceof ClientResponseError && error.isAbort) return []
      logger.error('Failed to get map stats from PocketBase:', error)
      return []
    }
  },

  async saveDailyStats(userId: string, stats: MapCollectionStats): Promise<void> {
    try {
      // Find if there is already a record for this user and date
      const existing = await pb.collection(collectionName).getList(1, 1, {
        filter: `owner = "${userId}" && date = "${stats.date}"`,
        requestKey: null,
      })

      const data = {
        owner: userId,
        date: stats.date,
        ore_count: stats.ore_count,
        mushroom_count: stats.mushroom_count,
        plant_count: stats.plant_count,
        stick_count: stats.stick_count,
      }

      if (existing.items.length > 0) {
        await pb.collection(collectionName).update(existing.items[0].id, data, {
          requestKey: null,
        })
      } else {
        await pb.collection(collectionName).create(data, {
          requestKey: null,
        })
      }
    } catch (error) {
      if (error instanceof ClientResponseError && error.isAbort) return
      logger.error('Failed to save daily stats to PocketBase:', error)
    }
  },
}
