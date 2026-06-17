import { ClientResponseError } from 'pocketbase'
import { pb } from '../../../../lib/pocketbase'
import type { MapGroup, MapGroupMember } from '../../core/entities/MapGroup.entity'
import type { GroupRepository } from '../../core/ports/GroupRepository.port'

const groupsCollection = 'map_groups'
const membersCollection = 'map_group_members'

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export class PocketBaseGroupAdapter implements GroupRepository {
  async createGroup(name: string, userId: string): Promise<MapGroup> {
    try {
      const inviteCode = generateInviteCode()
      
      const groupRecord = await pb.collection(groupsCollection).create({
        name,
        invite_code: inviteCode,
        owner: userId,
      })

      // Auto join as admin
      await pb.collection(membersCollection).create({
        group: groupRecord.id,
        user: userId,
        role: 'admin',
      })

      return {
        id: groupRecord.id,
        name: groupRecord.name,
        inviteCode: groupRecord.invite_code,
        ownerId: groupRecord.owner,
        createdAt: groupRecord.created,
        updatedAt: groupRecord.updated,
      }
    } catch (error) {
      console.error('Failed to create group in PocketBase:', error)
      throw error
    }
  }

  async joinGroupByCode(inviteCode: string, userId: string): Promise<MapGroup> {
    try {
      const groupRecord = await pb.collection(groupsCollection).getFirstListItem(`invite_code = "${inviteCode.toUpperCase()}"`, {
        requestKey: null,
      })
      
      // Check if already a member
      const existing = await pb.collection(membersCollection).getList(1, 1, {
        filter: `group = "${groupRecord.id}" && user = "${userId}"`,
        requestKey: null,
      })

      if (existing.totalItems === 0) {
        await pb.collection(membersCollection).create({
          group: groupRecord.id,
          user: userId,
          role: 'member',
        })
      }

      return {
        id: groupRecord.id,
        name: groupRecord.name,
        inviteCode: groupRecord.invite_code,
        ownerId: groupRecord.owner,
        createdAt: groupRecord.created,
        updatedAt: groupRecord.updated,
      }
    } catch (error) {
      if (error instanceof ClientResponseError && (error.status === 404 || error.isAbort)) {
        throw new Error('Código de convite inválido.', { cause: error })
      }
      console.error('Failed to join group in PocketBase:', error)
      throw error
    }
  }

  async leaveGroup(groupId: string, userId: string): Promise<void> {
    try {
      const memberRecord = await pb.collection(membersCollection).getFirstListItem(`group = "${groupId}" && user = "${userId}"`, {
        requestKey: null,
      })
      await pb.collection(membersCollection).delete(memberRecord.id)
    } catch (error) {
      if (error instanceof ClientResponseError && error.isAbort) return
      console.error('Failed to leave group in PocketBase:', error)
      throw error
    }
  }

  async getMyGroup(userId: string): Promise<MapGroup | null> {
    try {
      // Find a membership record for this user
      const membership = await pb.collection(membersCollection).getFirstListItem(`user = "${userId}"`, {
        expand: 'group',
        requestKey: null,
      })

      const group = membership.expand?.group

      if (!group) return null

      return {
        id: group.id,
        name: group.name,
        inviteCode: group.invite_code,
        ownerId: group.owner,
        createdAt: group.created,
        updatedAt: group.updated,
      }
    } catch (error) {
      if (error instanceof ClientResponseError && (error.status === 404 || error.isAbort)) {
        return null
      }
      console.error('Failed to get my group from PocketBase:', error)
      return null
    }
  }

  async getGroupMembers(groupId: string): Promise<MapGroupMember[]> {
    try {
      const records = await pb.collection(membersCollection).getFullList({
        filter: `group = "${groupId}"`,
        expand: 'user',
        requestKey: null,
      })

      return records.map((r) => ({
        id: r.id,
        groupId: r.group,
        userId: r.user,
        userName: r.expand?.user?.username || r.expand?.user?.name || 'Membro',
        userAvatar: r.expand?.user?.avatar,
        role: r.role,
        joinedAt: r.created,
      }))
    } catch (error) {
      if (error instanceof ClientResponseError && error.isAbort) return []
      console.error('Failed to get group members from PocketBase:', error)
      return []
    }
  }

  async deleteGroup(groupId: string): Promise<void> {
    try {
      await pb.collection(groupsCollection).delete(groupId)
    } catch (error) {
      if (error instanceof ClientResponseError && error.isAbort) return
      console.error('Failed to delete group in PocketBase:', error)
      throw error
    }
  }
}

export const pbGroupRepository = new PocketBaseGroupAdapter()
