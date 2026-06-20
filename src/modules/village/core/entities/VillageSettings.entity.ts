export type DonationPeriod = 'weekly' | 'monthly'
export type MissionRank = 'D' | 'C' | 'B' | 'A' | 'S'

export interface VillageSettings {
  id: string;
  max_daily_missions: number;
  daily_points_per_ninja: number;
  points_cost: Record<MissionRank, number>;
  min_rank_required: Record<MissionRank, string>;
  min_level_required: Record<MissionRank, number>;
  min_donation_amount: number;
  donation_period: DonationPeriod;
  bank_balance: number;
  updated: string;
}
