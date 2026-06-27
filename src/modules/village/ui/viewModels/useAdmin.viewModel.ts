import { useState, useEffect, useCallback } from 'react'
import { pb } from '../../../../lib/pocketbase'
import { User } from '../../../authentication/core/entities/User.entity'
import { Title } from '../../core/entities/Title.entity'
import { MissionTemplate } from '../../core/entities/MissionTemplate.entity'
import { MissionAssignment } from '../../core/entities/MissionAssignment.entity'
import { VillageSettings } from '../../core/entities/VillageSettings.entity'
import { OrganizationRole, OrganizationType } from '../../core/entities/OrganizationRole.entity'
import {
  getAllUsers,
  updateUser,
  updateUserAvatar,
  getTitles,
  createTitle,
  updateTitle,
  deleteTitle,
  getMissionTemplates,
  createMissionTemplate,
  updateMissionTemplate,
  getAllAssignments,
  createAssignment,
  updateAssignment,
  getVillageSettings,
  updateVillageSettings,
  getOrganizationRoles,
  createOrganizationRole,
  updateOrganizationRole,
  deleteOrganizationRole,
  getBankTransactions,
  createDonationRecord,
} from '../../infrastructure/adapters/PocketBaseVillage.adapter'
import { BankTransaction } from '../../core/entities/TaxRecord.entity'

export const useAdminViewModel = () => {
  const [users, setUsers] = useState<User[]>([])
  const [titles, setTitles] = useState<Title[]>([])
  const [templates, setTemplates] = useState<MissionTemplate[]>([])
  const [assignments, setAssignments] = useState<MissionAssignment[]>([])
  const [settings, setSettings] = useState<VillageSettings | null>(null)
  const [orgRoles, setOrgRoles] = useState<OrganizationRole[]>([])
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [taxPaidUserIds, setTaxPaidUserIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const adminId = pb.authStore.model?.id || ''

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [u, t, tpl, cfg, roles, tx] = await Promise.all([
        getAllUsers(),
        getTitles(),
        getMissionTemplates(false),
        getVillageSettings().catch(() => null),
        getOrganizationRoles(),
        getBankTransactions().catch(() => []),
      ])
      setUsers(u)
      setTitles(t)
      setTemplates(tpl)
      setSettings(cfg)
      setOrgRoles(roles)
      setTransactions(tx)

      // Load latest organization_members per user to check tax payment
      const taxPeriod = cfg?.tax_period ?? 'weekly'
      const now = new Date()
      const weekStart = (() => {
        const d = new Date(now)
        const day = d.getDay()
        const diff = d.getDate() - day + (day === 0 ? -6 : 1)
        d.setDate(diff)
        return d.toISOString().split('T')[0]
      })()
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

      try {
        const allMembers = await pb.collection('organization_members').getFullList({
          sort: '-week_start,-created',
        }) as any[]
        const latestByUser: Record<string, any> = {}
        allMembers.forEach(m => { if (!latestByUser[m.user]) latestByUser[m.user] = m })
        const paid = new Set<string>()
        Object.entries(latestByUser).forEach(([userId, m]) => {
          const ltp: string | null = m.last_tax_paid ?? null
          if (!ltp) return
          const date = ltp.slice(0, 10)
          if (taxPeriod === 'weekly' && date >= weekStart) paid.add(userId)
          else if (taxPeriod === 'monthly' && date.slice(0, 7) === currentMonth) paid.add(userId)
        })
        setTaxPaidUserIds(paid)
      } catch {
        setTaxPaidUserIds(new Set())
      }
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar dados admin')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadAssignments = useCallback(async (filter = '') => {
    const a = await getAllAssignments(filter)
    setAssignments(a)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { loadAssignments('status!="completed"') }, [loadAssignments])

  // ─── Users ────────────────────────────────────────────────────────────────

  const approveUser = async (userId: string) => {
    await updateUser(userId, {
      status: 'approved',
      approved_by: adminId,
      approved_at: new Date().toISOString(),
    })
    await load()
  }

  const rejectUser = async (userId: string) => {
    await updateUser(userId, { status: 'rejected' })
    await load()
  }

  const updateUserField = async (userId: string, data: Partial<User>) => {
    await updateUser(userId, data)
    await load()
  }

  const updateUserAvatarField = async (userId: string, avatar: File) => {
    await updateUserAvatar(userId, avatar)
    await load()
  }

  // ─── Titles ───────────────────────────────────────────────────────────────

  const addTitle = async (data: Omit<Title, 'id'>) => {
    await createTitle(data)
    setTitles(await getTitles())
  }

  const editTitle = async (id: string, data: Partial<Title>) => {
    await updateTitle(id, data)
    setTitles(await getTitles())
  }

  const removeTitle = async (id: string) => {
    await deleteTitle(id)
    setTitles(await getTitles())
  }

  // ─── Templates ────────────────────────────────────────────────────────────

  const addTemplate = async (data: any) => {
    if (data instanceof FormData) {
      if (adminId && !data.has('created_by')) {
        data.append('created_by', adminId)
      }
      await createMissionTemplate(data)
    } else {
      await createMissionTemplate({ ...data, created_by: adminId })
    }
    setTemplates(await getMissionTemplates(false))
  }

  const editTemplate = async (id: string, data: any) => {
    await updateMissionTemplate(id, data)
    setTemplates(await getMissionTemplates(false))
  }

  const archiveTemplate = async (id: string) => {
    await updateMissionTemplate(id, { is_active: false })
    setTemplates(await getMissionTemplates(false))
  }

  // ─── Settings ─────────────────────────────────────────────────────────────

  const saveSettings = async (data: Partial<VillageSettings>) => {
    if (!settings) return
    const updated = await updateVillageSettings(settings.id, data)
    setSettings(updated)
  }

  // ─── Assignments ──────────────────────────────────────────────────────────

  const approveAssignment = async (assignmentId: string) => {
    await updateAssignment(assignmentId, {
      status: 'completed',
      reviewed_by: adminId,
      completed_at: new Date().toISOString(),
    } as any)
    await loadAssignments('status!="completed"')
  }

  const rejectAssignment = async (assignmentId: string, notes: string) => {
    await updateAssignment(assignmentId, {
      status: 'in_progress',
      admin_notes: notes,
      reviewed_by: adminId,
    } as any)
    await loadAssignments('status!="completed"')
  }

  const removeAssignment = async (assignmentId: string) => {
    await pb.collection('mission_assignments').delete(assignmentId)
    await loadAssignments('status!="completed"')
  }

  const assignMission = async (templateId: string, userId: string, day: string) => {
    const tpl = templates.find(t => t.id === templateId)
    if (tpl && settings) {
      let costMap = settings.points_cost
      if (typeof costMap === 'string') {
        try {
          costMap = JSON.parse(costMap)
        } catch {}
      }
      if (costMap) {
        const upperRank = tpl.rank.toUpperCase()
        let cost = 0
        for (const [key, val] of Object.entries(costMap)) {
          if (key.toUpperCase() === upperRank) {
            cost = Number(val) || 0
            break
          }
        }
        if (cost > 0) {
          try {
            const u = await pb.collection('users').getOne(userId) as any
            const currentUsed = u.daily_points_used || 0
            await pb.collection('users').update(userId, {
              daily_points_used: currentUsed + cost,
            })
          } catch (e) {
            console.error('Error updating target user daily points:', e)
          }
        }
      }
    }

    await createAssignment({
      template: templateId,
      assigned_to: userId,
      status: 'in_progress',
      day,
      assigned_at: new Date().toISOString(),
    })
    await loadAssignments('status!="completed"')
  }

  // ─── Bank ─────────────────────────────────────────────────────────────────

  const addDonation = async (userId: string, amount: number, period: string) => {
    await createDonationRecord({
      user: userId,
      amount,
      period,
      registered_by: adminId,
    })
    const [tx, cfg] = await Promise.all([
      getBankTransactions().catch(() => []),
      getVillageSettings().catch(() => null),
    ])
    setTransactions(tx)
    if (cfg) setSettings(cfg)
  }

  // ─── Org Roles ────────────────────────────────────────────────────────────

  const addOrgRole = async (data: Omit<OrganizationRole, 'id'>) => {
    await createOrganizationRole(data)
    setOrgRoles(await getOrganizationRoles())
  }

  const editOrgRole = async (id: string, data: Partial<OrganizationRole>) => {
    await updateOrganizationRole(id, data)
    setOrgRoles(await getOrganizationRoles())
  }

  const removeOrgRole = async (id: string) => {
    await deleteOrganizationRole(id)
    setOrgRoles(await getOrganizationRoles())
  }

  const pendingUsers = users.filter(u => u.status === 'pending')
  const approvedUsers = users.filter(u => u.status === 'approved')
  const assignableUsers = approvedUsers.filter(u => !u.organization || taxPaidUserIds.has(u.id))
  const pendingReviews = assignments.filter(a => a.status === 'pending_review')

  const getOrgRolesByType = (org: OrganizationType) =>
    orgRoles.filter(r => r.organization === org)

  return {
    users, pendingUsers, approvedUsers, assignableUsers,
    titles, templates,
    assignments, pendingReviews,
    settings, orgRoles, transactions,
    loading, error,
    reload: load,
    approveUser, rejectUser, updateUserField, updateUserAvatarField,
    addTitle, editTitle, removeTitle,
    addTemplate, editTemplate, archiveTemplate,
    saveSettings,
    approveAssignment, rejectAssignment,
    loadAssignments,
    assignMission, removeAssignment,
    addOrgRole, editOrgRole, removeOrgRole,
    getOrgRolesByType,
    addDonation,
  }
}
