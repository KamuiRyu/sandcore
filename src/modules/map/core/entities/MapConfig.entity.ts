export { mapRegions, defaultMapRegion, getSubRegions } from './Regions.entity'
export type { MapRegionId } from './Regions.entity'
import type { MapLayerId, MapMarkerIconId, MapMarkerType } from './MapCalibration.entity'

export const mapImageSrc = '/images/map/map_base.webp'
export const mapBaseTextureSrc = '/images/map/base_texture.webp'
export const mapImageWidth = 4485
export const mapImageHeight = 3606
export const mapAspectRatio = mapImageWidth / mapImageHeight
export const minMapZoom = 1
export const maxMapZoom = 24
export const zoomButtonFactor = 1.22

export const markerTypes: MapMarkerType[] = [
  'vila',
  'arena',
  'house',
  'bank',
  'cemetery',
  'clothing_store',
  'cotton',
  'fishing_platform',
  'gunsmith',
  'smith',
  'hibiscus',
  'hospital',
  'jingle_bells',
  'ore',
  'mushroom',
  'ninja_academy',
  'perpetual',
  'police',
  'restaurant',
  'stick',
  'merchant',
  'borago'
]

export type MarkerIconOption = {
  id: MapMarkerIconId
  src: string
}

export const markerTypeLabels: Record<MapMarkerType, string> = {
  vila: 'Vila',
  arena: 'Arena',
  house: 'Casa',
  bank: 'Banco',
  cemetery: 'Cemiterio',
  clothing_store: 'Loja de roupas',
  cotton: 'Algodao',
  fishing_platform: 'Plataforma de pesca',
  gunsmith: 'Armeiro',
  smith: 'Ferreiro',
  hibiscus: 'Hibisco',
  hospital: 'Hospital',
  jingle_bells: 'Sinos',
  ore: 'Pedra',
  mushroom: 'Cogumelo',
  ninja_academy: 'Academia ninja',
  perpetual: 'Perpetua',
  police: 'Policia',
  restaurant: 'Restaurante',
  stick: 'Galho',
  merchant: 'Mercador',
  borago: 'Borago'
}

export const markerIconsByType: Record<MapMarkerType, MapMarkerIconId[]> = {
  vila: ['kumo', 'konoha', 'kiri', 'iwa', 'suna'],
  arena: ['arena'],
  house: ['house'],
  bank: ['bank'],
  cemetery: ['cemetery'],
  clothing_store: ['clothing_store'],
  cotton: ['cotton'],
  fishing_platform: ['fishing_platform'],
  gunsmith: ['gunsmith'],
  smith: ['smith'],
  hibiscus: ['hibiscus'],
  hospital: ['hospital'],
  jingle_bells: ['jingle_bells'],
  ore: ['ore_1', 'ore_2', 'ore_3', 'ore_4', 'ore_5', 'ore_6', 'ore_7', 'ore_8', 'ore_9'],
  mushroom: ['mushroom_1', 'mushroom_2', 'mushroom_3', 'mushroom_4', 'mushroom_5'],
  ninja_academy: ['ninja_academy'],
  perpetual: ['perpetual'],
  police: ['police'],
  restaurant: ['restaurant'],
  stick: ['stick'],
  merchant: ['merchant'],
  borago: ['borago']
}

export const markerIconSrcById: Record<MapMarkerIconId, string> = {
  kumo: '/images/map/icons/kumo.webp',
  konoha: '/images/map/icons/konoha.webp',
  kiri: '/images/map/icons/kiri.webp',
  iwa: '/images/map/icons/iwa.webp',
  suna: '/images/map/icons/suna.webp',
  arena: '/images/map/icons/arena.webp',
  house: '/images/map/icons/house.webp',
  bank: '/images/map/icons/bank.webp',
  cemetery: '/images/map/icons/cemetery.webp',
  clothing_store: '/images/map/icons/clothing_store.webp',
  cotton: '/images/map/icons/cotton.webp',
  fishing_platform: '/images/map/icons/fishing_platform.webp',
  gunsmith: '/images/map/icons/gunsmith.webp',
  smith: '/images/map/icons/smith.webp',
  hibiscus: '/images/map/icons/hibiscus.webp',
  hospital: '/images/map/icons/hospital.webp',
  jingle_bells: '/images/map/icons/jingle_bells.webp',
  mushroom_1: '/images/map/icons/mushroom_1.webp',
  mushroom_2: '/images/map/icons/mushroom_2.webp',
  mushroom_3: '/images/map/icons/mushroom_3.webp',
  mushroom_4: '/images/map/icons/mushroom_4.webp',
  mushroom_5: '/images/map/icons/mushroom_5.webp',
  ninja_academy: '/images/map/icons/ninja_academy.webp',
  ore_1: '/images/map/icons/ore_1.webp',
  ore_2: '/images/map/icons/ore_2.webp',
  ore_3: '/images/map/icons/ore_3.webp',
  ore_4: '/images/map/icons/ore_4.webp',
  ore_5: '/images/map/icons/ore_5.webp',
  ore_6: '/images/map/icons/ore_6.webp',
  ore_7: '/images/map/icons/ore_7.webp',
  ore_8: '/images/map/icons/ore_8.webp',
  ore_9: '/images/map/icons/ore_9.webp',
  perpetual: '/images/map/icons/perpetual.webp',
  police: '/images/map/icons/police.webp',
  restaurant: '/images/map/icons/restaurant.webp',
  stick: '/images/map/icons/stick.webp',
  merchant: '/images/map/icons/merchant.webp',
  borago: '/images/map/icons/borago.webp'
}

export const defaultMarkerType = markerTypes[0]
export const markerIcons: MapMarkerIconId[] = Array.from(
  new Set(markerTypes.flatMap((type) => markerIconsByType[type])),
)

export function getMarkerIconsByType(type: MapMarkerType) {
  return markerIconsByType[type]
}

export function getMarkerIconOptionsByType(type: MapMarkerType): MarkerIconOption[] {
  return getMarkerIconsByType(type).map((id) => ({
    id,
    src: markerIconSrcById[id],
  }))
}

export function getMarkerTypeLabel(type: MapMarkerType) {
  return markerTypeLabels[type]
}

export function getMarkerIconLabel(iconId: MapMarkerIconId) {
  if (RESOURCE_DEFINITIONS[iconId]) {
    return RESOURCE_DEFINITIONS[iconId].name
  }

  const oreMatch = /^ore_(\d+)$/.exec(iconId)

  if (oreMatch) {
    return `Minerio ${oreMatch[1]}`
  }

  const mushroomMatch = /^mushroom_(\d+)$/.exec(iconId)

  if (mushroomMatch) {
    return `Cogumelo ${mushroomMatch[1]}`
  }

  if (iconId === 'fishing_platform') {
    return 'Plataforma de pesca'
  }

  if (iconId === 'kumo') {
    return 'Kumo'
  }

  if (iconId === 'konoha') {
    return 'Konoha'
  }

  if (iconId === 'kiri') {
    return 'Kiri'
  }

  if (iconId === 'iwa') {
    return 'Iwa'
  }

  if (iconId === 'suna') {
    return 'Suna'
  }

  if (iconId === 'arena') {
    return 'Arena'
  }

  const typeLabel = markerTypeLabels[iconId as MapMarkerType]

  return typeLabel ?? iconId
}

export function getDefaultMarkerIcon(type: MapMarkerType) {
  return getMarkerIconsByType(type)[0]
}

export function getMarkerIconSrc(iconId: string): string {
  return markerIconSrcById[iconId as MapMarkerIconId] || getCustomPinIconSrc(iconId) || ''
}

export const mapLayers: MapLayerId[] = [
  'officialPins',
  'customPins',
  'routes',
  'regions',
  'dangerZones',
  'events',
]

// ─── Custom Pin Icons ────────────────────────────────────────────────────────
// Ícones exclusivos para pins customizados pelo usuário.
// Para adicionar um novo ícone:
//   1. Coloque o arquivo em: /public/images/map/custom_pin_icons/<nome>.webp
//   2. Adicione uma nova entrada no array abaixo com { id, src, label }
// ─────────────────────────────────────────────────────────────────────────────

export type CustomPinIcon = {
  id: string
  src: string
  label: string
}

export const customPinIcons: CustomPinIcon[] = [
  // Adicione aqui os ícones quando os assets estiverem prontos. Exemplo:
  { id: 'pin', src: '/images/map/custom_pin_icons/pin.webp', label: 'Pin' },
  { id: 'exclamation', src: '/images/map/custom_pin_icons/exclamation.webp', label: 'Exclamacao' },
  { id: 'flag', src: '/images/map/custom_pin_icons/flag.webp', label: 'Bandeira' },
  { id: 'interrogation', src: '/images/map/custom_pin_icons/interrogation.webp', label: 'Interrogacao' },
]

export function getCustomPinIconSrc(iconId: string): string | undefined {
  return customPinIcons.find((icon) => icon.id === iconId)?.src
}

import { RESOURCE_DEFINITIONS } from './ResourceDefinitions.entity'

// Timers padrão em segundos para cada subtipo de recurso
export const resourceTimers: Record<string, number> = Object.fromEntries(
  Object.values(RESOURCE_DEFINITIONS).map(d => [d.id, d.timer])
)

export function getResourceTimer(iconId: string): number | undefined {
  // Recursos padrão (Pedra/Cogumelo comum) não possuem timer para ficarem marcados até o reset global
  if (iconId === 'ore_1' || iconId === 'mushroom_1') return 0
  
  return RESOURCE_DEFINITIONS[iconId]?.timer || resourceTimers[iconId]
}

// Categorias/Tipos de marcadores que NÃO podem ser marcados como concluídos (por serem estáticos/permanentes)
export const uncompletableTypes: MapMarkerType[] = [
  'vila',
  'arena',
  'house',
  'bank',
  'cemetery',
  'clothing_store',
  'gunsmith',
  'smith',
  'hospital',
  'ninja_academy',
  'police',
  'restaurant',
  'fishing_platform',
  'jingle_bells'
]

