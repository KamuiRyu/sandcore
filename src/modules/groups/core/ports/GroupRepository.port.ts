import type { MapGroup, MapGroupMember } from '../entities/MapGroup.entity'

export interface GroupRepository {
  createGroup(name: string, userId: string): Promise<MapGroup>
  joinGroupByCode(inviteCode: string, userId: string): Promise<MapGroup>
  leaveGroup(groupId: string, userId: string): Promise<void>
  getMyGroup(userId: string): Promise<MapGroup | null>
  getGroupMembers(groupId: string): Promise<MapGroupMember[]>
  deleteGroup(groupId: string): Promise<void>
}
