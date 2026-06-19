export type ResourceType = 'ore' | 'mushroom' | 'stick' | 'perpetual' | 'hibiscus' | 'cotton' | 'borago'

export interface ResourceDefinition {
  id: string
  name: string
  timer: number // em segundos
  iconId: string
  type: ResourceType
  yields: number // quantidade de itens/picaretadas por nó
}

export const ORE_DEFINITIONS: Record<string, ResourceDefinition> = {
  ore_1: { id: 'ore_1', name: 'Pedra', timer: 0, iconId: 'ore_1', type: 'ore', yields: 1 },
  ore_2: { id: 'ore_2', name: 'Minério de Alumínio', timer: 2400, iconId: 'ore_2', type: 'ore', yields: 8 },
  ore_3: { id: 'ore_3', name: 'Minério de Ametista', timer: 3600, iconId: 'ore_3', type: 'ore', yields: 8 },
  ore_4: { id: 'ore_4', name: 'Minério de Cobre', timer: 2400, iconId: 'ore_4', type: 'ore', yields: 8 },
  ore_5: { id: 'ore_5', name: 'Minério de Diamante', timer: 3600, iconId: 'ore_5', type: 'ore', yields: 8 },
  ore_6: { id: 'ore_6', name: 'Minério de Ferro', timer: 2400, iconId: 'ore_6', type: 'ore', yields: 8 },
  ore_7: { id: 'ore_7', name: 'Minério de Ouro', timer: 2400, iconId: 'ore_7', type: 'ore', yields: 8 },
  ore_8: { id: 'ore_8', name: 'Minério de Platina', timer: 2400, iconId: 'ore_8', type: 'ore', yields: 8 },
  ore_9: { id: 'ore_9', name: 'Minério de Rubi', timer: 3600, iconId: 'ore_9', type: 'ore', yields: 8 },
}

export const MUSHROOM_DEFINITIONS: Record<string, ResourceDefinition> = {
  mushroom_1: { id: 'mushroom_1', name: 'Cogumelo Enoki', timer: 0, iconId: 'mushroom_1', type: 'mushroom', yields: 1 },
  mushroom_2: { id: 'mushroom_2', name: 'Cogumelo Shimeji', timer: 2400, iconId: 'mushroom_2', type: 'mushroom', yields: 1 },
  mushroom_3: { id: 'mushroom_3', name: 'Cogumelo Shitake', timer: 2400, iconId: 'mushroom_3', type: 'mushroom', yields: 1 },
  mushroom_4: { id: 'mushroom_4', name: 'Cogumelo Eryngii', timer: 2400, iconId: 'mushroom_4', type: 'mushroom', yields: 1 },
  mushroom_5: { id: 'mushroom_5', name: 'Cogumelo Kikurage', timer: 3600, iconId: 'mushroom_5', type: 'mushroom', yields: 1 },
}

export const STICK_DEFINITIONS: Record<string, ResourceDefinition> = {
  stick: { id: 'stick', name: 'Graveto', timer: 300, iconId: 'stick', type: 'stick', yields: 1 },
}

export const PLANT_DEFINITIONS: Record<string, ResourceDefinition> = {
  perpetual: { id: 'perpetual', name: 'Perpétua', timer: 600, iconId: 'perpetual', type: 'perpetual', yields: 1 },
  hibiscus: { id: 'hibiscus', name: 'Hibisco', timer: 600, iconId: 'hibiscus', type: 'hibiscus', yields: 1 },
  cotton: { id: 'cotton', name: 'Algodão', timer: 600, iconId: 'cotton', type: 'cotton', yields: 1 },
  borago: { id: 'borago', name: 'Borago', timer: 600, iconId: 'borago', type: 'borago', yields: 1 },
}

export const RESOURCE_DEFINITIONS: Record<string, ResourceDefinition> = {
  ...ORE_DEFINITIONS,
  ...MUSHROOM_DEFINITIONS,
  ...STICK_DEFINITIONS,
  ...PLANT_DEFINITIONS,
}

export function getResourceData(id: string): ResourceDefinition | undefined {
  return RESOURCE_DEFINITIONS[id]
}

export function getResourceName(id: string, fallback: string): string {
  return RESOURCE_DEFINITIONS[id]?.name || fallback
}
