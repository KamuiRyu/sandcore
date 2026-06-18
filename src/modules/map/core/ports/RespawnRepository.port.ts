export type RespawnRecord = {
  pinId: string
  completedAt: string
  name?: string
  ownerId?: string
  timer?: number
  iconUrl?: string
  region?: string
  subRegion?: string
  type?: string
  subType?: string
  status?: 'cooldown' | 'ready'
  groupId?: string
}

export type RespawnRepository = {
  listActive(): Promise<RespawnRecord[]>
  record(
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
    status?: 'cooldown' | 'ready',
    groupId?: string
  ): Promise<void>
  cancel(pinId: string): Promise<void>
  subscribe(onUpdate: (record: RespawnRecord | { pinId: string; deleted: true }) => void): () => void
}
