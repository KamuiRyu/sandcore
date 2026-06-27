import { useState, useEffect, useCallback } from 'react'
import { pb } from '../../../../lib/pocketbase'
import { OrganizationType } from '../../core/entities/OrganizationRole.entity'
import { OrganizationMember } from '../../core/entities/OrganizationMember.entity'
import { User } from '../../../authentication/core/entities/User.entity'
import {
  getOrgMembers, upsertOrgMember, removeOrgMember,
  getOrganizationRoles,
  getLatestOrgMemberRecord, updateOrgMemberTaxPaid,
  createTaxRecord,
  getAllUsers,
  getVillageSettings,
} from '../../infrastructure/adapters/PocketBaseVillage.adapter'
import { OrganizationRole } from '../../core/entities/OrganizationRole.entity'
import { VillageSettings } from '../../core/entities/VillageSettings.entity'

function currentWeekStart(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  const year = monday.getFullYear()
  const month = String(monday.getMonth() + 1).padStart(2, '0')
  const date = String(monday.getDate()).padStart(2, '0')
  return `${year}-${month}-${date}`
}

function currentMonth(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function today(): string {
  const d = new Date()
  return d.toISOString().split('T')[0]
}

function isTaxPaidForPeriod(lastTaxPaid: string | null, period: 'weekly' | 'monthly', weekStart: string): boolean {
  if (!lastTaxPaid) return false
  const paid = lastTaxPaid.slice(0, 10)
  if (period === 'weekly') return paid >= weekStart
  return paid.slice(0, 7) === currentMonth()
}

export const useManagerViewModel = () => {
  const user = pb.authStore.model
  const org: OrganizationType = (user?.organization as OrganizationType) || 'policia'

  const [members, setMembers] = useState<(Omit<OrganizationMember, 'id'> & { id: string | null; isActive: boolean })[]>([])
  const [orgRoles, setOrgRoles] = useState<OrganizationRole[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [settings, setSettings] = useState<VillageSettings | null>(null)
  const [latestRecordMap, setLatestRecordMap] = useState<Record<string, OrganizationMember | null>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const weekStart = currentWeekStart()

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [m, roles, users, cfg, allPast] = await Promise.all([
        getOrgMembers(org, weekStart),
        getOrganizationRoles(org),
        getAllUsers(),
        getVillageSettings().catch(() => null),
        pb.collection('organization_members').getFullList({
          filter: `organization="${org}"`,
          sort: '-week_start,-created',
        }).catch(() => []) as unknown as OrganizationMember[]
      ])

      const approvedUsers = users.filter(u => u.status === 'approved')
      const orgUsers = approvedUsers.filter(u => u.organization === org)

      const displayMembers = orgUsers.map(u => {
        const weeklyRecord = m.find(mem => mem.user === u.id)
        if (weeklyRecord) {
          return {
            id: weeklyRecord.id,
            user: u.id,
            organization: org,
            role: weeklyRecord.role,
            week_start: weekStart,
            registered_by: weeklyRecord.registered_by,
            last_tax_paid: weeklyRecord.last_tax_paid ?? null,
            tax_amount: weeklyRecord.tax_amount ?? null,
            isActive: true
          }
        } else {
          const pastRecord = allPast.find(pm => pm.user === u.id)
          return {
            id: pastRecord?.id || null,
            user: u.id,
            organization: org,
            role: pastRecord?.role || roles[0]?.id || '',
            week_start: weekStart,
            registered_by: pastRecord?.registered_by || '',
            last_tax_paid: pastRecord?.last_tax_paid ?? null,
            tax_amount: pastRecord?.tax_amount ?? null,
            isActive: false
          }
        }
      })

      // Build map of latest organization_members record per user (for last_tax_paid)
      const lrm: Record<string, OrganizationMember | null> = {}
      const latestByUser: Record<string, OrganizationMember> = {}
      allPast.forEach(r => {
        if (!latestByUser[r.user]) latestByUser[r.user] = r
      })
      orgUsers.forEach(u => { lrm[u.id] = latestByUser[u.id] || null })

      setMembers(displayMembers)
      setOrgRoles(roles)
      setAllUsers(approvedUsers)
      setSettings(cfg)
      setLatestRecordMap(lrm)
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }, [org, weekStart])

  useEffect(() => { load() }, [load])

  const addMember = async (userId: string, roleId: string) => {
    await upsertOrgMember({
      user: userId,
      organization: org,
      role: roleId,
      week_start: weekStart,
      registered_by: pb.authStore.model?.id || '',
      last_tax_paid: null,
      tax_amount: null,
    })
    await load()
  }

  const removeMember = async (memberIdOrUserId: string) => {
    const member = members.find(m => m.id === memberIdOrUserId)
    if (member && member.id && member.isActive) {
      await removeOrgMember(member.id)
    } else {
      const targetUserId = member ? member.user : memberIdOrUserId
      const records = await pb.collection('organization_members').getFullList({
        filter: `user="${targetUserId}" && organization="${org}"`,
      })
      await Promise.all(records.map(r => removeOrgMember(r.id)))
    }
    await load()
  }

  const registerTax = async (userId: string) => {
    setError('')
    try {
      const member = members.find(m => m.user === userId)
      const role = orgRoles.find(r => r.id === member?.role)
      const amount = (role?.yens_per_minute ?? 0) * 60

      let record = latestRecordMap[userId]
      if (!record) {
        record = await upsertOrgMember({
          user: userId,
          organization: org,
          role: member?.role || orgRoles[0]?.id || '',
          week_start: weekStart,
          registered_by: pb.authStore.model?.id || '',
          last_tax_paid: null,
          tax_amount: null,
        })
      }
      const paid = today()
      await Promise.all([
        updateOrgMemberTaxPaid(record.id, paid, amount),
        createTaxRecord({
          user: userId,
          amount,
          period: taxPeriod === 'weekly' ? weekStart : paid.slice(0, 7),
          verified_by: pb.authStore.model?.id || '',
        }),
      ])
      setLatestRecordMap(m => ({
        ...m,
        [userId]: { ...record!, last_tax_paid: paid, tax_amount: amount }
      }))
      setMembers(prev => prev.map(m =>
        m.user === userId ? { ...m, last_tax_paid: paid, tax_amount: amount } : m
      ))
    } catch (e: any) {
      setError(e.message || 'Erro ao registrar imposto')
      throw e
    }
  }

  const taxPeriod = settings?.tax_period ?? 'weekly'

  const isTaxPaid = (userId: string): boolean => {
    const member = members.find(m => m.user === userId)
    return isTaxPaidForPeriod(member?.last_tax_paid ?? null, taxPeriod, weekStart)
  }

  const isBlocked = (userId: string): { blocked: boolean; reason?: string } => {
    const isMember = members.some(m => m.user === userId)
    if (isMember && !isTaxPaid(userId)) {
      return { blocked: true, reason: 'Imposto pendente' }
    }
    return { blocked: false }
  }

  const availableUsers = allUsers.filter(u => (!u.organization || u.organization === org) && !members.some(m => m.user === u.id))

  return {
    members, orgRoles, allUsers, availableUsers,
    settings, taxPeriod,
    loading, error,
    weekStart,
    reload: load,
    addMember, removeMember,
    registerTax,
    isTaxPaid, isBlocked,
  }
}
