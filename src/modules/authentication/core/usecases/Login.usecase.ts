import { Result } from '../../../../types/Result'
import { User } from '../entities/User.entity'
import { AuthRepository } from '../ports/AuthRepository.port'

export class LoginUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(email: string, password: string): Promise<Result<User, Error>> {
    return this.authRepository.login(email, password)
  }
}
