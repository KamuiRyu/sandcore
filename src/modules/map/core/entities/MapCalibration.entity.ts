export type MapMarkerType =
  | 'vila'
  | 'arena'
  | 'house'
  | 'bank'
  | 'cemetery'
  | 'clothing_store'
  | 'cotton'
  | 'fishing_platform'
  | 'gunsmith'
  | 'smith'
  | 'hibiscus'
  | 'hospital'
  | 'jingle_bells'
  | 'merchant'
  | 'ore'
  | 'mushroom'
  | 'ninja_academy'
  | 'perpetual'
  | 'police'
  | 'restaurant'
  | 'stick'
  | 'borago'

export type MapMarkerIconId = string

export type MapLayerId =
  | 'officialPins'
  | 'customPins'
  | 'routes'
  | 'regions'
  | 'dangerZones'
  | 'events'

export type EditablePointField =
  | 'description'
  | 'iconId'
  | 'markerId'
  | 'name'
  | 'regionId'
  | 'subRegionId'
  | 'timer'
  | 'type'
  | 'x'
  | 'y'

export type MapCoords = {
  x: number
  y: number
}

export type MapCamera = {
  scale: number
  x: number
  y: number
}

export type DragState = {
  hasMoved: boolean
  pointerId: number
  startClientX: number
  startClientY: number
  startX: number
  startY: number
}

export type CalibrationPoint = {
  description: string
  iconId: MapMarkerIconId
  id: string
  markerId?: string
  name: string
  regionId: string
  subRegionId?: string
  timer: number | null
  type: MapMarkerType
  x: number
  y: number
  layerIds: MapLayerId[]
}

export type PointDefinition = Omit<CalibrationPoint, 'id'>
