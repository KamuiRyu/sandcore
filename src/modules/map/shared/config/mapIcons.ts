import {
  getMarkerIconLabel,
  getMarkerIconSrc,
  markerIcons,
  type MarkerIconOption,
} from '../../core/entities/MapConfig.entity'

export type MapIconDefinition = MarkerIconOption & {
  label: string
}

export const mapIconCatalog: MapIconDefinition[] = markerIcons.map((id) => ({
  id,
  label: getMarkerIconLabel(id),
  src: getMarkerIconSrc(id),
}))

export const featuredMapIcons = mapIconCatalog.filter((icon) =>
  ['konoha', 'suna', 'kiri', 'kumo', 'iwa', 'arena'].includes(icon.id),
)
