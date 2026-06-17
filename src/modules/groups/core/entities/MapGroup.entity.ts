export interface MapGroup {
  id: string
  name: string
  inviteCode: string
  ownerId: string
  createdAt: string
  updatedAt: string
}

export interface MapGroupMember {
  id: string
  groupId: string
  userId: string
  userName: string
  userAvatar?: string
  role: 'admin' | 'member'
  joinedAt: string
}
