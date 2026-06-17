import { Result } from '../../../../types/Result'
import { User } from '../entities/User.entity'

export interface AuthRepository {
  login(email: string, password: string): Promise<Result<User, Error>>
  register(name: string, email: string, password: string): Promise<Result<User, Error>>
  requestPasswordReset(email: string): Promise<Result<void, Error>>
  authWithOAuth2(provider: 'google' | 'discord'): Promise<Result<User, Error>>
  logout(): Promise<Result<void, Error>>
  getCurrentUser(): User | null
  isLoggedIn(): boolean
}
