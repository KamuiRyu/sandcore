import { pb } from '../../../../lib/pocketbase'
import { Result, ok, fail } from '../../../../types/Result'
import { User } from '../../core/entities/User.entity'
import { AuthRepository } from '../../core/ports/AuthRepository.port'

export class PocketBaseAuthAdapter implements AuthRepository {
  private mapToUser(record: any): User {
    return {
      id: record.id,
      email: record.email,
      name: record.name || record.username || '',
      avatar: record.avatar || '',
      push_token: record.push_token || '',
      status: record.status || 'pending',
      role: record.role || 'ninja',
      ninja_rank: record.ninja_rank || '',
      level: record.level || 0,
      title_points: record.title_points || 0,
      current_title: record.current_title || '',
      daily_points_used: record.daily_points_used || 0,
      last_points_reset: record.last_points_reset || '',
      approved_by: record.approved_by || '',
      approved_at: record.approved_at || '',
      created: record.created,
      updated: record.updated,
    }
  }

  async login(email: string, password: string): Promise<Result<User, Error>> {
    try {
      await pb.collection('users').authWithPassword(email.trim(), password)
      const refreshed = await pb.collection('users').authRefresh()
      return ok(this.mapToUser(refreshed.record))
    } catch (err: any) {
      if (err.status === 400 || err.status === 401) {
        return fail(new Error('E-mail ou senha incorretos.'))
      } else if (err.status === 0) {
        return fail(new Error('Servidor offline.'))
      }
      return fail(new Error(err.message || 'Falha ao entrar.'))
    }
  }

  async register(name: string, email: string, password: string): Promise<Result<User, Error>> {
    try {
      await pb.collection('users').create({
        email: email.trim(),
        emailVisibility: false,
        name: name.trim() || email.trim().split('@')[0],
        password,
        passwordConfirm: password,
      })
      // Auto login after registration
      const authData = await pb.collection('users').authWithPassword(email.trim(), password)
      return ok(this.mapToUser(authData.record))
    } catch (err: any) {
      return fail(new Error(err.message || 'Falha ao criar conta.'))
    }
  }

  async requestPasswordReset(email: string): Promise<Result<void, Error>> {
    try {
      await pb.collection('users').requestPasswordReset(email.trim())
      return ok(undefined)
    } catch (err: any) {
      return fail(new Error(err.message || 'Erro ao recuperar senha.'))
    }
  }

  async authWithOAuth2(provider: 'google' | 'discord'): Promise<Result<User, Error>> {
    try {
      const authData = await pb.collection('users').authWithOAuth2({
        provider,
        urlCallback: (url) => {
          window.ipcRenderer?.send('open-external-url', url)
        },
      })
      if (!authData.record) {
        return fail(new Error('Falha na autenticação social.'))
      }
      const refreshed = await pb.collection('users').authRefresh()
      return ok(this.mapToUser(refreshed.record ?? authData.record))
    } catch (err: any) {
      return fail(new Error(err.message || 'Erro no login social. Tente novamente.'))
    }
  }

  async logout(): Promise<Result<void, Error>> {
    try {
      pb.authStore.clear()
      return ok(undefined)
    } catch (err: any) {
      return fail(new Error(err.message || 'Erro ao sair.'))
    }
  }

  getCurrentUser(): User | null {
    if (pb.authStore.isValid && pb.authStore.model) {
      return this.mapToUser(pb.authStore.model)
    }
    return null
  }

  isLoggedIn(): boolean {
    return pb.authStore.isValid
  }

  async updateCurrentUser(data: { name?: string; avatar?: File | null }): Promise<Result<User, Error>> {
    try {
      const model = pb.authStore.model
      if (!model) return fail(new Error('Usuário não autenticado.'))
      const formData = new FormData()
      if (data.name !== undefined) formData.append('name', data.name.trim())
      if (data.avatar !== undefined) {
        if (data.avatar === null) formData.append('avatar', '')
        else formData.append('avatar', data.avatar)
      }
      const updated = await pb.collection('users').update(model.id, formData)
      await pb.collection('users').authRefresh()
      return ok(this.mapToUser(updated))
    } catch (err: any) {
      return fail(new Error(err.message || 'Erro ao atualizar perfil.'))
    }
  }

  async listExternalAuths(): Promise<{ provider: string }[]> {
    const model = pb.authStore.model
    if (!model) return []
    const auths = await pb.collection('users').listExternalAuths(model.id)
    return auths.map(a => ({ provider: a.provider }))
  }

  async unlinkExternalAuth(provider: string): Promise<Result<void, Error>> {
    try {
      const model = pb.authStore.model
      if (!model) return fail(new Error('Usuário não autenticado.'))
      await pb.collection('users').unlinkExternalAuth(model.id, provider)
      return ok(undefined)
    } catch (err: any) {
      return fail(new Error(err.message || 'Erro ao desvincular conta.'))
    }
  }
}
export const pbAuthRepository = new PocketBaseAuthAdapter()
