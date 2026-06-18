import { ClientResponseError } from 'pocketbase'
import { pb } from '../../../../lib/pocketbase'
import { logger } from '../../../../lib/utils'
import type { RespawnRecord, RespawnRepository } from '../../core/ports/RespawnRepository.port'

const collectionName = 'map_respawns'

export const pocketBaseRespawnRepository: RespawnRepository = {
  async listActive(): Promise<RespawnRecord[]> {
    try {
      // Get all respawns from the last 24 hours (to avoid loading too many old records)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const records = await pb.collection(collectionName).getFullList({
        filter: `completed_at >= "${oneDayAgo}"`,
        requestKey: null,
      })

      return records.map((r) => ({
        pinId: r.pin_id,
        completedAt: r.completed_at,
        name: r.name,
        ownerId: r.owner,
        timer: r.timer,
        iconUrl: r.icon_url,
        region: r.region,
        subRegion: r.sub_region,
        type: r.type,
        subType: r.sub_type,
        status: r.status,
        groupId: r.group_id,
      }))
    } catch (error) {
      if (error instanceof ClientResponseError && error.isAbort) return []
      logger.error('Failed to list active respawns from PocketBase:', error)
      return []
    }
  },

  async record(
    pinId: string,
    completedAt: string,
    name: string,
    ownerId: string,
    timer: number,
    iconUrl?: string,
    region?: string,
    subRegion?: string,
    type?: string,
    subType?: string,
    status: 'cooldown' | 'ready' = 'cooldown',
    groupId?: string
  ): Promise<void> {
    try {
      // Find ANY existing record for this pin that I can manage:
      // 1. My private record
      // 2. My group's record
      
      // Get my group first
      let myGroupId = groupId;
      if (!myGroupId) {
          const membership = await pb.collection('map_group_members').getList(1, 1, {
            filter: `user = "${ownerId}"`,
            requestKey: null,
          });
          myGroupId = membership.items[0]?.group;
      }

      const filter = myGroupId 
        ? `pin_id = "${pinId}" && (owner = "${ownerId}" || group_id = "${myGroupId}")`
        : `pin_id = "${pinId}" && owner = "${ownerId}"`;

      const existing = await pb.collection(collectionName).getList(1, 1, {
        filter: filter,
        sort: '-group_id', // prioritize group record if both exist for some reason
        requestKey: null,
      })

      const data = {
        pin_id: pinId,
        completed_at: completedAt,
        name: name,
        owner: ownerId,
        timer: timer,
        icon_url: iconUrl,
        notified: false,
        is_global: false,
        region: region,
        sub_region: subRegion,
        type: type,
        sub_type: subType,
        status: status,
        group_id: groupId || "",
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
      logger.error('Failed to record respawn in PocketBase:', error)
    }
  },

  async cancel(pinId: string): Promise<void> {
    try {
      const userId = pb.authStore.record?.id
      if (!userId) return

      const membership = await pb.collection('map_group_members').getList(1, 1, {
        filter: `user = "${userId}"`,
        requestKey: null,
      })
      const groupId = membership.items[0]?.group

      const filter = groupId
        ? `pin_id = "${pinId}" && (owner = "${userId}" || group_id = "${groupId}")`
        : `pin_id = "${pinId}" && owner = "${userId}"`

      const existing = await pb.collection(collectionName).getFullList({
        filter: filter,
        requestKey: null,
      })

      if (existing.length > 0) {
        // Delete all matching records to clean up any duplicates
        await Promise.all(existing.map(item => 
          pb.collection(collectionName).delete(item.id, { requestKey: null })
        ))
      }
    } catch (error) {
      if (error instanceof ClientResponseError && error.isAbort) return
      logger.error('Failed to cancel respawn in PocketBase:', error)
    }
  },

  subscribe(onUpdate: (record: RespawnRecord | { pinId: string; deleted: true }) => void): () => void {
    let isCancelled = false
    let unsubscribeFn: (() => void) | null = null
    let subscriptionPromise: Promise<unknown> | null = null

    // Delay subscription slightly to allow authentication and other initial fetches to settle
    const timeoutId = setTimeout(() => {
        if (isCancelled) return

        subscriptionPromise = pb.collection(collectionName).subscribe('*', (e) => {
          if (isCancelled) return

          if (e.action === 'create' || e.action === 'update') {
            onUpdate({
              pinId: e.record.pin_id,
              completedAt: e.record.completed_at,
              name: e.record.name,
              ownerId: e.record.owner,
              timer: e.record.timer,
              iconUrl: e.record.icon_url,
              region: e.record.region,
              subRegion: e.record.sub_region,
              type: e.record.type,
              subType: e.record.sub_type,
              status: e.record.status,
              groupId: e.record.group_id,
            })
          } else if (e.action === 'delete') {
            onUpdate({
              pinId: e.record.pin_id,
              deleted: true,
            })
          }
        }).then((unsub: unknown) => {
          unsubscribeFn = unsub as () => void
          if (isCancelled && unsubscribeFn) {
            unsubscribeFn()
          }
          return unsub
        }).catch((err) => {
          if (!err.isAbort) {
            logger.error('PocketBase Realtime Subscription Error:', err)
          }
        })
    }, 500)

    return () => {
      isCancelled = true
      clearTimeout(timeoutId)
      if (unsubscribeFn) {
        unsubscribeFn()
      } else if (subscriptionPromise) {
        subscriptionPromise.then((unsub: unknown) => {
          if (typeof unsub === 'function') unsub()
        }).catch(() => {})
      }
    }
  },
}
