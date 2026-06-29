import { useState, useEffect, useCallback } from 'react'
import { pb } from '../../../../lib/pocketbase'
import { MissionTemplate } from '../../core/entities/MissionTemplate.entity'
import { MissionAssignment } from '../../core/entities/MissionAssignment.entity'
import { VillageSettings } from '../../core/entities/VillageSettings.entity'
import {
  getMissionTemplates,
  getMyAssignments,
  getDayAssignments,
  createAssignment,
  updateAssignment,
  getVillageSettings,
} from '../../infrastructure/adapters/PocketBaseVillage.adapter'

function formatDate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function today() {
  const now = new Date()
  // Reset happens at 12h local time — before noon still counts as previous day
  if (now.getHours() < 12) now.setDate(now.getDate() - 1)
  return formatDate(now)
}

export const useMissionsViewModel = () => {
  const [templates, setTemplates] = useState<MissionTemplate[]>([])
  const [myAssignments, setMyAssignments] = useState<MissionAssignment[]>([])
  const [todayAssignments, setTodayAssignments] = useState<MissionAssignment[]>([])
  const [settings, setSettings] = useState<VillageSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const userId = pb.authStore.model?.id || ''

  const getRankCost = useCallback((rank: string): number => {
    if (!settings) return 0
    let costMap = settings.points_cost
    if (typeof costMap === 'string') {
      try {
        costMap = JSON.parse(costMap)
      } catch {
        return 0
      }
    }
    if (!costMap) return 0
    const upperRank = rank.toUpperCase()
    for (const [key, val] of Object.entries(costMap)) {
      if (key.toUpperCase() === upperRank) {
        return Number(val) || 0
      }
    }
    return 0
  }, [settings])

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError('')
    try {
      const [tpl, mine, day, cfg] = await Promise.all([
        getMissionTemplates(true),
        getMyAssignments(userId),
        getDayAssignments(today()),
        getVillageSettings().catch(() => null),
      ])

      // Auto-reset daily_points_used at 12:00 PM local time
      if (cfg) {
        const now = new Date()
        const cycleStart = new Date(now)
        cycleStart.setHours(12, 0, 0, 0)
        if (now.getHours() < 12) {
          cycleStart.setDate(cycleStart.getDate() - 1)
        }

        const lastResetStr = pb.authStore.model?.last_points_reset
        const lastReset = lastResetStr ? new Date(lastResetStr) : new Date(0)

        if (lastReset < cycleStart) {
          try {
            await pb.collection('users').update(userId, {
              daily_points_used: 0,
              last_points_reset: cycleStart.toISOString(),
            })
            await pb.collection('users').authRefresh()
          } catch (e) {
            console.error('Error auto-resetting points:', e)
          }
        }
      }

      setTemplates(tpl)
      setMyAssignments(mine)
      setTodayAssignments(day)
      setSettings(cfg)
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar dados do vilarejo')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  const submitEvidence = async (assignmentId: string, files?: File[]) => {
    const formData = new FormData()
    formData.append('status', 'pending_review')
    if (files && files.length > 0) {
      files.forEach(f => {
        formData.append('evidence', f)
      })
    }
    await updateAssignment(assignmentId, formData as any)
    await load()
  }

  const checkEligibility = (templateId: string): { eligible: boolean; reason?: string } => {
    if (!settings) return { eligible: true }
    const tpl = templates.find(t => t.id === templateId)
    if (!tpl) return { eligible: false, reason: 'Template não encontrado' }

    const user = pb.authStore.model
    if (user) {
      if (tpl.min_level && user.level < tpl.min_level) {
        return { eligible: false, reason: `Nível mínimo ${tpl.min_level} exigido` }
      }
    }

    // Check max daily missions limit
    const maxMissions = settings.max_daily_missions || 0
    if (maxMissions > 0) {
      const todayActiveCount = myAssignments.filter(
        a => a.day === today() && a.status !== 'completed' && !a.is_imported
      ).length
      if (todayActiveCount >= maxMissions) {
        return { eligible: false, reason: `Limite de ${maxMissions} missões diárias atingido` }
      }
    }

    const pointCost = getRankCost(tpl.rank)
    const usedPoints = pb.authStore.model?.daily_points_used || 0

    if (usedPoints + pointCost > settings.daily_points_per_ninja) {
      return { eligible: false, reason: 'Limite de pontos diários atingido' }
    }

    return { eligible: true }
  }

  const assignMission = async (templateId: string, targetUserId?: string) => {
    const assignee = targetUserId || userId
    const tpl = templates.find(t => t.id === templateId)
    if (!tpl) return

    const cost = getRankCost(tpl.rank)

    // Update user's points record
    if (assignee === userId) {
      const currentUsed = pb.authStore.model?.daily_points_used || 0
      try {
        await pb.collection('users').update(userId, {
          daily_points_used: currentUsed + cost,
        })
        await pb.collection('users').authRefresh()
      } catch (e) {
        console.error('Error updating user daily points:', e)
      }
    }

    await createAssignment({
      template: templateId,
      assigned_to: assignee,
      status: 'in_progress',
      day: today(),
      assigned_at: new Date().toISOString(),
    })
    await load()
  }

  const activeAssignments = myAssignments.filter(a => a.status === 'in_progress' && !a.is_imported)
  const pendingAssignments = myAssignments.filter(a => a.status === 'pending_review' && !a.is_imported)
  const completedAssignments = myAssignments.filter(a => a.status === 'completed' && !a.is_imported)

  const assignedTemplateIds = new Set(
    myAssignments.filter(a => a.day?.trim() === today()).map(a => a.template)
  )

  const usedPoints = pb.authStore.model?.daily_points_used || 0

  const todayActiveMissionCount = myAssignments.filter(
    a => a.day === today() && a.status !== 'completed' && !a.is_imported
  ).length
  const maxDailyMissions = settings?.max_daily_missions || 0

  return {
    templates,
    myAssignments,
    activeAssignments,
    pendingAssignments,
    completedAssignments,
    todayAssignments,
    assignedTemplateIds,
    settings,
    loading,
    error,
    reload: load,
    submitEvidence,
    checkEligibility,
    assignMission,
    usedPoints,
    todayActiveMissionCount,
    maxDailyMissions,
  }
}
