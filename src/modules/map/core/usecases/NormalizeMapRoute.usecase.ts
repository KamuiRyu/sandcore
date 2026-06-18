import type {
  CustomPin,
  CustomRoute,
  RouteCheckpoint,
} from '../entities/MapRoute.entity'
import { validateMapRoute } from './ValidateMapRoute.usecase'

function normalizeCustomPin(pin: Partial<CustomPin>, index: number): CustomPin {
  return {
    color: pin.color?.trim() || '#00d6a3',
    description: pin.description !== undefined ? pin.description : undefined,
    iconId: pin.iconId?.trim() || 'arena',
    id: pin.id !== undefined ? String(pin.id).trim() : `pin-${index + 1}`,
    name: pin.name !== undefined ? pin.name : `Pin ${index + 1}`,
    tags: Array.isArray(pin.tags) ? pin.tags : [],
    x: typeof pin.x === 'number' ? pin.x : 50,
    y: typeof pin.y === 'number' ? pin.y : 50,
    imageUrl: pin.imageUrl?.trim() || undefined,
    isPlaced: typeof pin.isPlaced === 'boolean' ? pin.isPlaced : true,
    checked: typeof pin.checked === 'boolean' ? pin.checked : false,
  }
}

function normalizeCheckpoint(
  checkpoint: Partial<RouteCheckpoint>,
  index: number,
): RouteCheckpoint {
  return {
    customPinId: checkpoint.customPinId !== undefined ? String(checkpoint.customPinId).trim() : undefined,
    id: checkpoint.id !== undefined ? String(checkpoint.id).trim() : `checkpoint-${index + 1}`,
    label: checkpoint.label !== undefined ? checkpoint.label : undefined,
    pointId: checkpoint.pointId !== undefined ? String(checkpoint.pointId).trim() : undefined,
    x: typeof checkpoint.x === 'number' ? checkpoint.x : 50,
    y: typeof checkpoint.y === 'number' ? checkpoint.y : 50,
  }
}

export const DEFAULT_MAP_ROUTE: CustomRoute = {
  checkpoints: [],
  color: '#00d6a3',
  createdAt: new Date(0).toISOString(),
  customPins: [],
  description: '',
  id: 'draft-route',
  name: 'Nova rota',
  updatedAt: new Date(0).toISOString(),
}

export function normalizeMapRoute(route: Partial<CustomRoute>): CustomRoute {
  return validateMapRoute({
    ...DEFAULT_MAP_ROUTE,
    ...route,
    checkpoints: Array.isArray(route.checkpoints)
      ? route.checkpoints.map(normalizeCheckpoint)
      : [],
    customPins: Array.isArray(route.customPins)
      ? route.customPins.map(normalizeCustomPin)
      : [],
    createdAt: route.createdAt || new Date().toISOString(),
    id: route.id !== undefined ? String(route.id).trim() : crypto.randomUUID?.() || `route-${Date.now()}`,
    name: route.name !== undefined ? route.name : 'Nova rota',
    updatedAt: route.updatedAt || new Date().toISOString(),
  })
}
