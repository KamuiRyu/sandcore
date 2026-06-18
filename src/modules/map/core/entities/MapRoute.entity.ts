import type { MapLayerId, MapMarkerIconId, MapMarkerType } from './MapCalibration.entity'

export type MapPointReference = {
  iconId: MapMarkerIconId
  id: string
  layerIds: MapLayerId[]
  markerId?: string
  name: string
  regionId: string
  subRegionId?: string
  type: MapMarkerType
  x: number
  y: number
  timer?: number | null
  description?: string
}

export type CustomPin = {
  color: string
  description?: string
  iconId: MapMarkerIconId
  id: string
  name: string
  tags: string[]
  x: number
  y: number
  imageUrl?: string
  isPlaced?: boolean
  checked?: boolean
}

export type SavedCustomPin = {
  id: string
  owner?: string
  ownerName?: string
  name: string
  description?: string
  color: string
  iconId: MapMarkerIconId
  tags: string[]
  x: number
  y: number
  imageUrl?: string
  isPlaced: boolean
  isHidden?: boolean
  source: 'local' | 'remote'
  createdAt: string
  updatedAt: string
  checked?: boolean
}

export type RouteCheckpoint = {
  customPinId?: string
  id: string
  label?: string
  pointId?: string
  x: number
  y: number
}

export type CustomRoute = {
  checkpoints: RouteCheckpoint[]
  color: string
  createdAt: string
  customPins: CustomPin[]
  description?: string
  id: string
  name: string
  updatedAt: string
}

export type SharedMapRoutePayload = {
  route: CustomRoute
  version: 1
}

export type SavedMapRouteCreator = {
  avatarUrl?: string
  id: string
  name: string
  username?: string
}

export type SavedMapRouteSource = 'local' | 'remote'

export type SavedMapRoute = {
  color: string
  createdAt: string
  creator?: SavedMapRouteCreator
  description?: string
  id: string
  isPublic?: boolean
  isHidden?: boolean
  name: string
  owner?: string
  publicSlug?: string
  route: CustomRoute
  source?: SavedMapRouteSource
  updatedAt: string
}
