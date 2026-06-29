export type DonationPeriod = 'weekly' | 'monthly'
export type TaxPeriod = 'weekly' | 'monthly'
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
  title_point_per_donation: number;
  tax_period: TaxPeriod;
  bank_balance: number;
  rank_quota_enabled: boolean;
  rank_quota: Record<MissionRank, number>;
  updated: string;
}
