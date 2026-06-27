import { MissionRank } from './VillageSettings.entity'

export interface MissionTemplate {
  id: string;
  title: string;
  description?: string;
  rank: MissionRank;
  min_ninja_rank?: string;
  min_level: number;
  reward_yens: number;
  reward_items?: string;
  reward_points: number;
  is_active: boolean;
  location_image?: string | string[];
  created_by: string;
  created: string;
  updated: string;
}
