import type { UseCase } from '../../_shared/UseCase.js'
import type { IUserRepository } from '../../../domain/user/repositories/IUserRepository.js'
import type { UserRoleValue } from '../../../domain/user/value-objects/UserRole.js'
import { UniqueEntityId } from '../../../domain/_shared/UniqueEntityId.js'

export interface UpdatePlayerInput {
  playerId: string
  name?: string
  email?: string
  role?: UserRoleValue
}

export interface UpdatePlayerOutput {
  id: string
  name: string
  email: string
  role: UserRoleValue
  updatedAt: Date
}

export class PlayerNotFoundError extends Error {
  constructor(id: string) {
    super(`Player not found: ${id}`)
    this.name = 'PlayerNotFoundError'
  }
}

export class PlayerEmailAlreadyTakenError extends Error {
  constructor() {
    super('Email is already in use')
    this.name = 'PlayerEmailAlreadyTakenError'
  }
}

export class UpdatePlayerUseCase implements UseCase<UpdatePlayerInput, UpdatePlayerOutput> {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: UpdatePlayerInput): Promise<UpdatePlayerOutput> {
    const user = await this.userRepository.findById(new UniqueEntityId(input.playerId))

    if (!user || user.isDeleted) {
      throw new PlayerNotFoundError(input.playerId)
    }

    if (input.email && input.email.toLowerCase() !== user.email) {
      const existing = await this.userRepository.findByEmail(input.email)
      if (existing) {
        throw new PlayerEmailAlreadyTakenError()
      }
    }

    user.update({
      name: input.name,
      email: input.email,
      role: input.role,
    })

    await this.userRepository.save(user)

    return {
      id: user.id.value,
      name: user.name,
      email: user.email,
      role: user.role,
      updatedAt: user.updatedAt,
    }
  }
}
