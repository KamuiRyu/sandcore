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
  getTitles,
  createTitle,
  updateTitle,
  deleteTitle,
  getMissionTemplates,
  createMissionTemplate,
  updateMissionTemplate,
  getAllAssignments,
  updateAssignment,
  getVillageSettings,
  updateVillageSettings,
  getOrganizationRoles,
  createOrganizationRole,
  updateOrganizationRole,
  deleteOrganizationRole,
  getBankTransactions,
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

  const addTemplate = async (data: Omit<MissionTemplate, 'id' | 'created' | 'updated'>) => {
    await createMissionTemplate({ ...data, created_by: adminId })
    setTemplates(await getMissionTemplates(false))
  }

  const editTemplate = async (id: string, data: Partial<MissionTemplate>) => {
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
  const pendingReviews = assignments.filter(a => a.status === 'pending_review')

  const getOrgRolesByType = (org: OrganizationType) =>
    orgRoles.filter(r => r.organization === org)

  return {
    users, pendingUsers, approvedUsers,
    titles, templates,
    assignments, pendingReviews,
    settings, orgRoles, transactions,
    loading, error,
    reload: load,
    approveUser, rejectUser, updateUserField,
    addTitle, editTitle, removeTitle,
    addTemplate, editTemplate, archiveTemplate,
    saveSettings,
    approveAssignment, rejectAssignment,
    loadAssignments,
    addOrgRole, editOrgRole, removeOrgRole,
    getOrgRolesByType,
  }
}
