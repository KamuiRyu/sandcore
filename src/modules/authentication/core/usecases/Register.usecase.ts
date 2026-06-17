import { Result } from '../../../../types/Result'
import { User } from '../entities/User.entity'
import { AuthRepository } from '../ports/AuthRepository.port'

export class RegisterUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(name: string, email: string, password: string): Promise<Result<User, Error>> {
    return this.authRepository.register(name, email, password)
  }
}
