import type { UseCase } from '../../_shared/UseCase.js'
import type { IUserRepository } from '../../../domain/user/repositories/IUserRepository.js'
import { UniqueEntityId } from '../../../domain/_shared/UniqueEntityId.js'

export interface DeletePlayerInput {
  playerId: string
}

export interface DeletePlayerOutput {
  message: string
}

export class PlayerNotFoundError extends Error {
  constructor(id: string) {
    super(`Player not found: ${id}`)
    this.name = 'PlayerNotFoundError'
  }
}

export class DeletePlayerUseCase implements UseCase<DeletePlayerInput, DeletePlayerOutput> {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: DeletePlayerInput): Promise<DeletePlayerOutput> {
    const user = await this.userRepository.findById(new UniqueEntityId(input.playerId))

    if (!user || user.isDeleted) {
      throw new PlayerNotFoundError(input.playerId)
    }

    user.softDelete()
    await this.userRepository.save(user)

    return { message: 'Jogador removido' }
  }
}
