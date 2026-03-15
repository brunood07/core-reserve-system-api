import type { UseCase } from '../../_shared/UseCase.js'
import type {
  IUserRepository,
  FindPlayersParams,
  FindPlayersResult,
} from '../../../domain/user/repositories/IUserRepository.js'

export interface ListPlayersInput {
  page?: number
  limit?: number
  search?: string
}

export type ListPlayersOutput = FindPlayersResult

export class ListPlayersUseCase implements UseCase<ListPlayersInput, ListPlayersOutput> {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: ListPlayersInput): Promise<ListPlayersOutput> {
    const params: FindPlayersParams = {
      page: input.page ?? 1,
      limit: Math.min(input.limit ?? 20, 100),
      search: input.search,
    }

    return this.userRepository.findPlayers(params)
  }
}
