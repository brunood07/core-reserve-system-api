import type { UseCase } from '../../_shared/UseCase.js'
import type { IUserRepository, PlayerDetails } from '../../../domain/user/repositories/IUserRepository.js'

export interface GetPlayerInput {
  playerId: string
}

export type GetPlayerOutput = PlayerDetails

export class PlayerNotFoundError extends Error {
  constructor(id: string) {
    super(`Player not found: ${id}`)
    this.name = 'PlayerNotFoundError'
  }
}

export class GetPlayerUseCase implements UseCase<GetPlayerInput, GetPlayerOutput> {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: GetPlayerInput): Promise<GetPlayerOutput> {
    const player = await this.userRepository.findPlayerDetails(input.playerId)

    if (!player) {
      throw new PlayerNotFoundError(input.playerId)
    }

    return player
  }
}
