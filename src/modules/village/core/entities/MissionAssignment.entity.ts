import { MissionTemplate } from './MissionTemplate.entity'
import { User } from '../../../authentication/core/entities/User.entity'

export type AssignmentStatus = 'in_progress' | 'pending_review' | 'completed'

export interface MissionAssignment {
  id: string;
  template: string;
  assigned_to: string;
  status: AssignmentStatus;
  evidence?: string;
  admin_notes?: string;
  reviewed_by?: string;
  group_id?: string;
  is_imported?: boolean;
  selected_pins?: string[];
  day: string;
  assigned_at: string;
  submitted_at?: string;
  completed_at?: string;
  created: string;
  updated: string;
  // expanded relations
  expand?: {
    template?: MissionTemplate;
    assigned_to?: User;
    reviewed_by?: User;
  };
}
