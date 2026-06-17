import { Result } from '../../../../types/Result'
import { User } from '../entities/User.entity'
import { AuthRepository } from '../ports/AuthRepository.port'

export class OAuthLoginUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(provider: 'google' | 'discord'): Promise<Result<User, Error>> {
    return this.authRepository.authWithOAuth2(provider)
  }
}
