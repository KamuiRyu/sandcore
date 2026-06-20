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

function today() {
  return new Date().toISOString().split('T')[0]
}

export const useMissionsViewModel = () => {
  const [templates, setTemplates] = useState<MissionTemplate[]>([])
  const [myAssignments, setMyAssignments] = useState<MissionAssignment[]>([])
  const [todayAssignments, setTodayAssignments] = useState<MissionAssignment[]>([])
  const [settings, setSettings] = useState<VillageSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const userId = pb.authStore.model?.id || ''

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
      setTemplates(tpl)
      setMyAssignments(mine)
      setTodayAssignments(day)
      setSettings(cfg)
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar missões')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { load() }, [load])

  const submitEvidence = async (assignmentId: string, evidenceFile?: File) => {
    const data: any = {
      status: 'pending_review',
      submitted_at: new Date().toISOString(),
    }
    if (evidenceFile) {
      const form = new FormData()
      form.append('evidence', evidenceFile)
      form.append('status', 'pending_review')
      form.append('submitted_at', data.submitted_at)
      await updateAssignment(assignmentId, form as any)
    } else {
      await updateAssignment(assignmentId, data)
    }
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

    const pointCost = settings.points_cost[tpl.rank] || 0
    const usedPoints = todayAssignments
      .filter(a => a.assigned_to === userId)
      .reduce((sum, a) => {
        const t = a.expand?.template
        return sum + (t ? (settings.points_cost[t.rank] || 0) : 0)
      }, 0)

    if (usedPoints + pointCost > settings.daily_points_per_ninja) {
      return { eligible: false, reason: 'Limite de pontos diários atingido' }
    }

    return { eligible: true }
  }

  const assignMission = async (templateId: string, targetUserId?: string) => {
    const assignee = targetUserId || userId
    await createAssignment({
      template: templateId,
      assigned_to: assignee,
      status: 'in_progress',
      day: today(),
      assigned_at: new Date().toISOString(),
    })
    await load()
  }

  const activeAssignments = myAssignments.filter(a => a.status === 'in_progress')
  const pendingAssignments = myAssignments.filter(a => a.status === 'pending_review')
  const completedAssignments = myAssignments.filter(a => a.status === 'completed')

  const assignedTemplateIds = new Set(
    todayAssignments.filter(a => a.assigned_to === userId).map(a => a.template)
  )

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
  }
}
