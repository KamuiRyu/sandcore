import { MissionRank } from './VillageSettings.entity'

export const MISSION_PIN_CATEGORIES = [
  { value: 'mission',          label: 'Local da Missão' },
  { value: 'mushroom',         label: 'Cogumelo' },
  { value: 'ore',              label: 'Minério / Pedra' },
  { value: 'fishing_platform', label: 'Plataforma de Pesca' },
  { value: 'cotton',           label: 'Algodão' },
  { value: 'hibiscus',         label: 'Hibisco' },
  { value: 'borago',           label: 'Borago' },
  { value: 'stick',            label: 'Graveto' },
  { value: 'other',            label: 'Outro' },
] as const

export type MissionPinCategory = typeof MISSION_PIN_CATEGORIES[number]['value']

export interface MissionPin {
  id: string
  x: number
  y: number
  category: MissionPinCategory
  label: string
}

export interface MissionTemplate {
  id: string;
  title: string;
  description?: string;
  objective?: string;
  rank: MissionRank;
  min_ninja_rank?: string;
  min_level: number;
  party_size: number;
  reward_yens: number;
  reward_items?: string;
  reward_points: number;
  is_active: boolean;
  is_imported?: boolean;
  location_image?: string | string[];
  pins?: MissionPin[];
  pins_pick_count?: number;
  created_by: string;
  created: string;
  updated: string;
}
