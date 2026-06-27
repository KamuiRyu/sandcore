import { OrganizationType } from './OrganizationRole.entity'

export interface OrganizationMember {
  id: string;
  user: string;
  organization: OrganizationType;
  role: string;
  week_start: string;
  registered_by: string;
  last_tax_paid: string | null;
  tax_amount: number | null;
  expand?: {
    user?: { id: string; name: string; ninja_rank: string; level: number };
    role?: { id: string; role_name: string; yens_per_minute: number; is_manager: boolean };
  };
}
