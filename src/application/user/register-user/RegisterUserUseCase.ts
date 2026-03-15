import bcrypt from 'bcrypt'
import type { UseCase } from '../../_shared/UseCase.js'
import type { IUserRepository } from '../../../domain/user/repositories/IUserRepository.js'
import { User } from '../../../domain/user/entities/User.js'

export interface RegisterUserInput {
  name: string
  email: string
  password: string
}

export interface RegisterUserOutput {
  userId: string
}

export class RegisterUserUseCase implements UseCase<RegisterUserInput, RegisterUserOutput> {
  private static readonly SALT_ROUNDS = 12

  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    const existing = await this.userRepository.findByEmail(input.email)
    if (existing) {
      throw new EmailAlreadyInUseError(input.email)
    }

    const passwordHash = await bcrypt.hash(input.password, RegisterUserUseCase.SALT_ROUNDS)

    const user = User.create({
      name: input.name,
      email: input.email,
      passwordHash,
    })

    await this.userRepository.save(user)

    return { userId: user.id.value }
  }
}

export class EmailAlreadyInUseError extends Error {
  constructor(email: string) {
    super(`Email already in use: ${email}`)
    this.name = 'EmailAlreadyInUseError'
  }
}
