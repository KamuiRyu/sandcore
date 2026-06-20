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
  approved_by?: string;
  approved_at?: string;
  created: string;
  updated: string;
}
