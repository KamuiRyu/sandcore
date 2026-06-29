import { pb } from '../../../../lib/pocketbase'
import { cacheOrFetch, cacheInvalidate, cacheInvalidatePrefix } from '../../../../lib/cache'
import { VillageSettings } from '../../core/entities/VillageSettings.entity'
import { Title } from '../../core/entities/Title.entity'
import { MissionTemplate } from '../../core/entities/MissionTemplate.entity'
import { MissionAssignment } from '../../core/entities/MissionAssignment.entity'
import { OrganizationRole, OrganizationType } from '../../core/entities/OrganizationRole.entity'
import { OrganizationMember } from '../../core/entities/OrganizationMember.entity'
import { TaxRecord, DonationRecord, BankTransaction } from '../../core/entities/TaxRecord.entity'
import { User } from '../../../authentication/core/entities/User.entity'

// ─── TTLs (milliseconds) ─────────────────────────────────────────────────────
const TTL_SETTINGS   = 5 * 60_000  // 5 min
const TTL_TEMPLATES  = 2 * 60_000  // 2 min
const TTL_TITLES     = 5 * 60_000  // 5 min
const TTL_ORG_ROLES  = 5 * 60_000  // 5 min
const TTL_BANK_TX    = 1 * 60_000  // 1 min

// ─── Village Settings ────────────────────────────────────────────────────────

export async function getVillageSettings(): Promise<VillageSettings> {
  return cacheOrFetch('village_settings', TTL_SETTINGS, async () => {
    const records = await pb.collection('village_settings').getFullList({ perPage: 1 })
    return records[0] as unknown as VillageSettings
  })
}

export async function updateVillageSettings(id: string, data: Partial<VillageSettings>): Promise<VillageSettings> {
  const result = await pb.collection('village_settings').update(id, data) as unknown as VillageSettings
  cacheInvalidate('village_settings')
  return result
}

// ─── Titles ──────────────────────────────────────────────────────────────────

export async function getTitles(): Promise<Title[]> {
  return cacheOrFetch('titles', TTL_TITLES, async () => {
    return await pb.collection('titles').getFullList({ sort: 'min_points' }) as unknown as Title[]
  })
}

export async function createTitle(data: Omit<Title, 'id'>): Promise<Title> {
  const result = await pb.collection('titles').create(data) as unknown as Title
  cacheInvalidate('titles')
  return result
}

export async function updateTitle(id: string, data: Partial<Title>): Promise<Title> {
  const result = await pb.collection('titles').update(id, data) as unknown as Title
  cacheInvalidate('titles')
  return result
}

export async function deleteTitle(id: string): Promise<void> {
  await pb.collection('titles').delete(id)
  cacheInvalidate('titles')
}

// ─── Mission Templates ───────────────────────────────────────────────────────

export async function getMissionTemplates(activeOnly = true): Promise<MissionTemplate[]> {
  const key = activeOnly ? 'mission_templates:active' : 'mission_templates:all'
  return cacheOrFetch(key, TTL_TEMPLATES, async () => {
    const filter = activeOnly ? 'is_active=true && is_imported!=true' : ''
    return await pb.collection('mission_templates').getFullList({ filter, sort: 'rank' }) as unknown as MissionTemplate[]
  })
}

export async function createMissionTemplate(data: any): Promise<MissionTemplate> {
  const result = await pb.collection('mission_templates').create(data) as unknown as MissionTemplate
  cacheInvalidatePrefix('mission_templates:')
  return result
}

export async function updateMissionTemplate(id: string, data: any): Promise<MissionTemplate> {
  const result = await pb.collection('mission_templates').update(id, data) as unknown as MissionTemplate
  cacheInvalidatePrefix('mission_templates:')
  return result
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
  group_id?: string;
  is_imported?: boolean;
  selected_pins?: string[];
}): Promise<MissionAssignment> {
  return await pb.collection('mission_assignments').create(data) as unknown as MissionAssignment
}

export async function createGroupAssignment(
  templateId: string,
  userIds: string[],
  day: string,
  is_imported?: boolean,
  selected_pins?: string[],
): Promise<MissionAssignment[]> {
  const group_id = crypto.randomUUID()
  const now = new Date().toISOString()
  return await Promise.all(
    userIds.map(userId =>
      pb.collection('mission_assignments').create({
        template: templateId,
        assigned_to: userId,
        status: 'in_progress',
        day,
        assigned_at: now,
        group_id,
        ...(is_imported ? { is_imported: true } : {}),
        ...(selected_pins ? { selected_pins } : {}),
      }) as unknown as Promise<MissionAssignment>
    )
  )
}

export async function updateAssignment(id: string, data: Partial<MissionAssignment>): Promise<MissionAssignment> {
  return await pb.collection('mission_assignments').update(id, data) as unknown as MissionAssignment
}

export async function getCompletedTodayByRank(userId: string, day: string): Promise<Record<string, number>> {
  const records = await pb.collection('mission_assignments').getFullList({
    filter: `assigned_to="${userId}" && status="completed" && day="${day}"`,
    expand: 'template',
  }) as unknown as MissionAssignment[]
  const counts: Record<string, number> = {}
  for (const r of records) {
    const rank = (r as any).expand?.template?.rank as string | undefined
    if (rank) counts[rank] = (counts[rank] ?? 0) + 1
  }
  return counts
}

export interface ActiveMissionPin {
  assignmentId: string
  templateId: string
  templateTitle: string
  x: number
  y: number
  category: string
  label: string
  pinId: string
}

export async function getActiveMissionPins(userId: string): Promise<ActiveMissionPin[]> {
  const records = await pb.collection('mission_assignments').getFullList({
    filter: `assigned_to="${userId}" && (status="in_progress" || status="pending_review")`,
    expand: 'template',
  }) as unknown as MissionAssignment[]

  const pins: ActiveMissionPin[] = []
  for (const r of records) {
    const tpl = (r as any).expand?.template
    if (!tpl) continue
    const rawSelected = (r as any).selected_pins
    const selectedPins: string[] | undefined = typeof rawSelected === 'string'
      ? (() => { try { return JSON.parse(rawSelected) } catch { return undefined } })()
      : Array.isArray(rawSelected) ? rawSelected : undefined
    const allPins: any[] = typeof tpl.pins === 'string'
      ? (() => { try { return JSON.parse(tpl.pins) } catch { return [] } })()
      : (tpl.pins ?? [])
    if (!allPins.length) continue
    const visiblePins = selectedPins?.length
      ? allPins.filter(p => selectedPins.includes(p.id))
      : allPins
    for (const pin of visiblePins) {
      pins.push({
        assignmentId: r.id,
        templateId: tpl.id,
        templateTitle: tpl.title,
        x: pin.x,
        y: pin.y,
        category: pin.category,
        label: pin.label,
        pinId: `mission-${r.id}-${pin.id}`,
      })
    }
  }
  return pins
}

export async function incrementDailyMissionsUsed(userId: string, day: string, count = 1): Promise<void> {
  const user = await pb.collection('users').getOne(userId) as any
  const sameDay = user.daily_missions_date === day
  const current = sameDay ? (user.daily_missions_used ?? 0) : 0
  await pb.collection('users').update(userId, {
    daily_missions_used: current + count,
    daily_missions_date: day,
  })
}

// ─── Organization Roles ──────────────────────────────────────────────────────

export async function getOrganizationRoles(org?: OrganizationType): Promise<OrganizationRole[]> {
  const key = `org_roles:${org ?? 'all'}`
  return cacheOrFetch(key, TTL_ORG_ROLES, async () => {
    const filter = org ? `organization="${org}"` : ''
    return await pb.collection('organization_roles').getFullList({ filter, sort: 'order' }) as unknown as OrganizationRole[]
  })
}

export async function createOrganizationRole(data: Omit<OrganizationRole, 'id'>): Promise<OrganizationRole> {
  const result = await pb.collection('organization_roles').create(data) as unknown as OrganizationRole
  cacheInvalidatePrefix('org_roles:')
  return result
}

export async function updateOrganizationRole(id: string, data: Partial<OrganizationRole>): Promise<OrganizationRole> {
  const result = await pb.collection('organization_roles').update(id, data) as unknown as OrganizationRole
  cacheInvalidatePrefix('org_roles:')
  return result
}

export async function deleteOrganizationRole(id: string): Promise<void> {
  await pb.collection('organization_roles').delete(id)
  cacheInvalidatePrefix('org_roles:')
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

export async function getLatestOrgMemberRecord(userId: string, org: OrganizationType): Promise<OrganizationMember | null> {
  try {
    const records = await pb.collection('organization_members').getFullList({
      filter: `user="${userId}" && organization="${org}"`,
      sort: '-week_start,-created',
    })
    return records[0] as unknown as OrganizationMember || null
  } catch {
    return null
  }
}

export async function updateOrgMemberTaxPaid(id: string, date: string, amount: number): Promise<OrganizationMember> {
  return await pb.collection('organization_members').update(id, { last_tax_paid: date, tax_amount: amount }) as unknown as OrganizationMember
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
  return cacheOrFetch('bank_transactions', TTL_BANK_TX, async () => {
    return await pb.collection('bank_transactions').getFullList({ sort: '-created' }) as unknown as BankTransaction[]
  })
}

// ─── User management (admin) ─────────────────────────────────────────────────

export async function getAllUsers(): Promise<User[]> {
  return await pb.collection('users').getFullList({ sort: '-created' }) as unknown as User[]
}

export async function updateUser(id: string, data: Partial<User>): Promise<User> {
  return await pb.collection('users').update(id, data) as unknown as User
}

export async function updateUserAvatar(id: string, avatar: File): Promise<User> {
  const form = new FormData()
  form.append('avatar', avatar)
  return await pb.collection('users').update(id, form) as unknown as User
}
