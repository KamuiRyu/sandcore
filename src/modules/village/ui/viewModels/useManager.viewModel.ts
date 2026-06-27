import { useState, useEffect, useCallback } from 'react'
import { pb } from '../../../../lib/pocketbase'
import { OrganizationType } from '../../core/entities/OrganizationRole.entity'
import { OrganizationMember } from '../../core/entities/OrganizationMember.entity'
import { TaxRecord, DonationRecord } from '../../core/entities/TaxRecord.entity'
import { User } from '../../../authentication/core/entities/User.entity'
import {
  getOrgMembers, upsertOrgMember, removeOrgMember,
  getOrganizationRoles,
  getTaxRecord, createTaxRecord,
  getDonationRecord, createDonationRecord,
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

export const useManagerViewModel = () => {
  const user = pb.authStore.model
  const org: OrganizationType = (user?.organization as OrganizationType) || 'policia'

  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [orgRoles, setOrgRoles] = useState<OrganizationRole[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [settings, setSettings] = useState<VillageSettings | null>(null)
  const [taxMap, setTaxMap] = useState<Record<string, TaxRecord | null>>({})
  const [donationMap, setDonationMap] = useState<Record<string, DonationRecord | null>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const weekStart = currentWeekStart()
  const period = currentMonth()

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [m, roles, users, cfg] = await Promise.all([
        getOrgMembers(org, weekStart),
        getOrganizationRoles(org),
        getAllUsers(),
        getVillageSettings().catch(() => null),
      ])
      setMembers(m)
      setOrgRoles(roles)
      setAllUsers(users.filter(u => u.status === 'approved'))
      setSettings(cfg)

      // Load tax/donation records for each member
      const memberUserIds = m.map(mem => mem.user)
      const [taxes, donations] = await Promise.all([
        Promise.all(memberUserIds.map(id => getTaxRecord(id, period))),
        Promise.all(memberUserIds.map(id => getDonationRecord(id, period))),
      ])
      const tm: Record<string, TaxRecord | null> = {}
      const dm: Record<string, DonationRecord | null> = {}
      memberUserIds.forEach((id, i) => { tm[id] = taxes[i]; dm[id] = donations[i] })
      setTaxMap(tm)
      setDonationMap(dm)
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }, [org, weekStart, period])

  useEffect(() => { load() }, [load])

  const addMember = async (userId: string, roleId: string) => {
    await upsertOrgMember({
      user: userId,
      organization: org,
      role: roleId,
      week_start: weekStart,
      registered_by: pb.authStore.model?.id || '',
    })
    await load()
  }

  const removeMember = async (memberId: string) => {
    await removeOrgMember(memberId)
    await load()
  }

  const registerTax = async (userId: string, amount: number) => {
    await createTaxRecord({
      user: userId,
      amount,
      period,
      verified_by: pb.authStore.model?.id || '',
    })
    const record = await getTaxRecord(userId, period)
    setTaxMap(m => ({ ...m, [userId]: record }))
  }

  const registerDonation = async (userId: string, amount: number) => {
    await createDonationRecord({
      user: userId,
      amount,
      registered_by: pb.authStore.model?.id || '',
      period,
    })
    const record = await getDonationRecord(userId, period)
    setDonationMap(m => ({ ...m, [userId]: record }))
  }

  const isBlocked = (userId: string): { blocked: boolean; reason?: string } => {
    if (!settings) return { blocked: false }
    const donation = donationMap[userId]
    if (!donation || donation.amount < settings.min_donation_amount) {
      return { blocked: true, reason: 'Doação pendente' }
    }
    const isMember = members.some(m => m.user === userId)
    if (isMember) {
      const tax = taxMap[userId]
      if (!tax) return { blocked: true, reason: 'Imposto pendente' }
    }
    return { blocked: false }
  }

  const availableUsers = allUsers.filter(u => !members.some(m => m.user === u.id))

  return {
    members, orgRoles, allUsers, availableUsers,
    settings, taxMap, donationMap,
    loading, error,
    weekStart, period,
    reload: load,
    addMember, removeMember,
    registerTax, registerDonation,
    isBlocked,
  }
}
