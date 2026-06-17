import { Result } from '../../../../types/Result'
import { AuthRepository } from '../ports/AuthRepository.port'

export class RequestPasswordResetUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(email: string): Promise<Result<void, Error>> {
    return this.authRepository.requestPasswordReset(email)
  }
}
