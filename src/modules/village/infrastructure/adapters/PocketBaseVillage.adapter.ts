import { pb } from '../../../../lib/pocketbase'
import { VillageSettings } from '../../core/entities/VillageSettings.entity'
import { Title } from '../../core/entities/Title.entity'
import { MissionTemplate } from '../../core/entities/MissionTemplate.entity'
import { MissionAssignment } from '../../core/entities/MissionAssignment.entity'
import { OrganizationRole, OrganizationType } from '../../core/entities/OrganizationRole.entity'
import { OrganizationMember } from '../../core/entities/OrganizationMember.entity'
import { TaxRecord, DonationRecord, BankTransaction } from '../../core/entities/TaxRecord.entity'
import { User } from '../../../authentication/core/entities/User.entity'

// ─── Village Settings ────────────────────────────────────────────────────────

export async function getVillageSettings(): Promise<VillageSettings> {
  const records = await pb.collection('village_settings').getFullList({ perPage: 1 })
  return records[0] as unknown as VillageSettings
}

export async function updateVillageSettings(id: string, data: Partial<VillageSettings>): Promise<VillageSettings> {
  return await pb.collection('village_settings').update(id, data) as unknown as VillageSettings
}

// ─── Titles ──────────────────────────────────────────────────────────────────

export async function getTitles(): Promise<Title[]> {
  return await pb.collection('titles').getFullList({ sort: 'min_points' }) as unknown as Title[]
}

export async function createTitle(data: Omit<Title, 'id'>): Promise<Title> {
  return await pb.collection('titles').create(data) as unknown as Title
}

export async function updateTitle(id: string, data: Partial<Title>): Promise<Title> {
  return await pb.collection('titles').update(id, data) as unknown as Title
}

export async function deleteTitle(id: string): Promise<void> {
  await pb.collection('titles').delete(id)
}

// ─── Mission Templates ───────────────────────────────────────────────────────

export async function getMissionTemplates(activeOnly = true): Promise<MissionTemplate[]> {
  const filter = activeOnly ? 'is_active=true' : ''
  return await pb.collection('mission_templates').getFullList({ filter, sort: 'rank' }) as unknown as MissionTemplate[]
}

export async function createMissionTemplate(data: Omit<MissionTemplate, 'id' | 'created' | 'updated'>): Promise<MissionTemplate> {
  return await pb.collection('mission_templates').create(data) as unknown as MissionTemplate
}

export async function updateMissionTemplate(id: string, data: Partial<MissionTemplate>): Promise<MissionTemplate> {
  return await pb.collection('mission_templates').update(id, data) as unknown as MissionTemplate
}

// ─── Mission Assignments ─────────────────────────────────────────────────────

export async function getMyAssignments(userId: string): Promise<MissionAssignment[]> {
  return await pb.collection('mission_assignments').getFullList({
    filter: `assigned_to="${userId}"`,
    expand: 'template,reviewed_by',
    sort: '-assigned_at',
  }) as unknown as MissionAssignment[]
}

export async function getDayAssignments(day: string): Promise<MissionAssignment[]> {
  return await pb.collection('mission_assignments').getFullList({
    filter: `day="${day}"`,
    expand: 'template,assigned_to',
  }) as unknown as MissionAssignment[]
}

export async function getAllAssignments(filter = ''): Promise<MissionAssignment[]> {
  return await pb.collection('mission_assignments').getFullList({
    filter,
    expand: 'template,assigned_to,reviewed_by',
    sort: '-assigned_at',
  }) as unknown as MissionAssignment[]
}

export async function createAssignment(data: {
  template: string;
  assigned_to: string;
  status: 'in_progress';
  day: string;
  assigned_at: string;
}): Promise<MissionAssignment> {
  return await pb.collection('mission_assignments').create(data) as unknown as MissionAssignment
}

export async function updateAssignment(id: string, data: Partial<MissionAssignment>): Promise<MissionAssignment> {
  return await pb.collection('mission_assignments').update(id, data) as unknown as MissionAssignment
}

// ─── Organization Roles ──────────────────────────────────────────────────────

export async function getOrganizationRoles(org?: OrganizationType): Promise<OrganizationRole[]> {
  const filter = org ? `organization="${org}"` : ''
  return await pb.collection('organization_roles').getFullList({ filter, sort: 'order' }) as unknown as OrganizationRole[]
}

export async function createOrganizationRole(data: Omit<OrganizationRole, 'id'>): Promise<OrganizationRole> {
  return await pb.collection('organization_roles').create(data) as unknown as OrganizationRole
}

export async function updateOrganizationRole(id: string, data: Partial<OrganizationRole>): Promise<OrganizationRole> {
  return await pb.collection('organization_roles').update(id, data) as unknown as OrganizationRole
}

export async function deleteOrganizationRole(id: string): Promise<void> {
  await pb.collection('organization_roles').delete(id)
}

// ─── Organization Members ────────────────────────────────────────────────────

export async function getOrgMembers(org: OrganizationType, weekStart: string): Promise<OrganizationMember[]> {
  return await pb.collection('organization_members').getFullList({
    filter: `organization="${org}" && week_start="${weekStart}"`,
    expand: 'user,role',
  }) as unknown as OrganizationMember[]
}

export async function upsertOrgMember(data: Omit<OrganizationMember, 'id' | 'expand'>): Promise<OrganizationMember> {
  return await pb.collection('organization_members').create(data) as unknown as OrganizationMember
}

export async function removeOrgMember(id: string): Promise<void> {
  await pb.collection('organization_members').delete(id)
}

// ─── Tax & Donations ─────────────────────────────────────────────────────────

export async function getTaxRecord(userId: string, period: string): Promise<TaxRecord | null> {
  try {
    const records = await pb.collection('tax_records').getFullList({
      filter: `user="${userId}" && period="${period}"`,
    })
    return records[0] as unknown as TaxRecord || null
  } catch {
    return null
  }
}

export async function createTaxRecord(data: Omit<TaxRecord, 'id' | 'created'>): Promise<TaxRecord> {
  return await pb.collection('tax_records').create(data) as unknown as TaxRecord
}

export async function getDonationRecord(userId: string, period: string): Promise<DonationRecord | null> {
  try {
    const records = await pb.collection('donation_records').getFullList({
      filter: `user="${userId}" && period="${period}"`,
    })
    return records[0] as unknown as DonationRecord || null
  } catch {
    return null
  }
}

export async function createDonationRecord(data: Omit<DonationRecord, 'id' | 'created'>): Promise<DonationRecord> {
  return await pb.collection('donation_records').create(data) as unknown as DonationRecord
}

export async function getBankTransactions(): Promise<BankTransaction[]> {
  return await pb.collection('bank_transactions').getFullList({ sort: '-created' }) as unknown as BankTransaction[]
}

// ─── User management (admin) ─────────────────────────────────────────────────

export async function getAllUsers(): Promise<User[]> {
  return await pb.collection('users').getFullList({ sort: '-created' }) as unknown as User[]
}

export async function updateUser(id: string, data: Partial<User>): Promise<User> {
  return await pb.collection('users').update(id, data) as unknown as User
}
