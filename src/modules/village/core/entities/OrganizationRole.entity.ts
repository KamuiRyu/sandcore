export type OrganizationType = 'policia' | 'hospital' | 'assistente'

export interface OrganizationRole {
  id: string;
  organization: OrganizationType;
  role_name: string;
  yens_per_minute: number;
  is_manager: boolean;
  order: number;
}
