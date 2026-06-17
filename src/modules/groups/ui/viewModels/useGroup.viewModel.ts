import { useState, useEffect, useCallback } from 'react'
import { pbGroupRepository } from '../../infrastructure/adapters/PocketBaseGroup.adapter'
import { pbAuthRepository } from '../../../authentication/infrastructure/adapters/PocketBaseAuth.adapter'
import type { MapGroup, MapGroupMember } from '../../core/entities/MapGroup.entity'

export const useGroupViewModel = () => {
  const [group, setGroup] = useState<MapGroup | null>(null)
  const [members, setMembers] = useState<MapGroupMember[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)

  const currentUser = pbAuthRepository.getCurrentUser()
  const userId = currentUser?.id

  const loadGroupData = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const myGroup = await pbGroupRepository.getMyGroup(userId)
      setGroup(myGroup)
      if (myGroup) {
        const groupMembers = await pbGroupRepository.getGroupMembers(myGroup.id)
        setMembers(groupMembers)
      } else {
        setMembers([])
      }
    } catch (err: any) {
      console.error('Error loading group data:', err)
      setError('Erro ao carregar dados do grupo.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadGroupData()
  }, [loadGroupData])

  const createGroup = async (name: string) => {
    if (!userId || !name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const newGroup = await pbGroupRepository.createGroup(name.trim(), userId)
      setGroup(newGroup)
      await loadGroupData()
    } catch (err: any) {
      console.error('Error creating group:', err)
      setError('Erro ao criar grupo. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const joinGroup = async (inviteCode: string) => {
    if (!userId || !inviteCode.trim()) return
    setLoading(true)
    setError(null)
    try {
      const joinedGroup = await pbGroupRepository.joinGroupByCode(inviteCode.trim(), userId)
      setGroup(joinedGroup)
      await loadGroupData()
    } catch (err: any) {
      console.error('Error joining group:', err)
      setError(err.message || 'Código de convite inválido ou erro ao entrar.')
    } finally {
      setLoading(false)
    }
  }

  const leaveGroup = async () => {
    if (!userId || !group) return
    setLoading(true)
    setError(null)
    try {
      await pbGroupRepository.leaveGroup(group.id, userId)
      setGroup(null)
      setMembers([])
    } catch (err: any) {
      console.error('Error leaving group:', err)
      setError('Erro ao sair do grupo.')
    } finally {
      setLoading(false)
    }
  }

  const copyInviteCode = () => {
    if (!group) return
    navigator.clipboard.writeText(group.inviteCode)
    setCopySuccess(true)
    setTimeout(() => {
      setCopySuccess(false)
    }, 2000)
  }

  return {
    group,
    members,
    loading,
    error,
    setError,
    copySuccess,
    createGroup,
    joinGroup,
    leaveGroup,
    copyInviteCode,
    refresh: loadGroupData,
  }
}
