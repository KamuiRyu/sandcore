export type UserStatus = 'pending' | 'approved' | 'rejected'
export type UserRole = 'ninja' | 'manager' | 'admin'
export type NinjaRank = 'genin' | 'chunin' | 'jonin' | 'anbu' | 'kage' | ''

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  push_token?: string;
  status: UserStatus;
  role: UserRole;
  ninja_rank: NinjaRank;
  level: number;
  title_points: number;
  current_title?: string;
  daily_points_used?: number;
  last_points_reset?: string;
  daily_missions_used?: number;
  daily_missions_date?: string;
  approved_by?: string;
  approved_at?: string;
  organization?: string;
  created: string;
  updated: string;
}
