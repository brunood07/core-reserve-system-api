import type { UseCase } from '../../_shared/UseCase.js'
import type { IReserveRepository } from '../../../domain/reserve/repositories/IReserveRepository.js'
import { UniqueEntityId } from '../../../domain/_shared/UniqueEntityId.js'

export interface ListReservesByRaidInput {
  raidId: string
}

export interface ListReservesByRaidOutput {
  reserves: Array<{
    reserveId: string
    raidId: string
    characterId: string
    itemName: string
    status: string
    createdAt: Date
  }>
}

export class ListReservesByRaidUseCase
  implements UseCase<ListReservesByRaidInput, ListReservesByRaidOutput>
{
  constructor(private readonly reserveRepository: IReserveRepository) {}

  async execute(input: ListReservesByRaidInput): Promise<ListReservesByRaidOutput> {
    const reserves = await this.reserveRepository.findByRaidId(
      new UniqueEntityId(input.raidId)
    )
    return {
      reserves: reserves.map((r) => ({
        reserveId: r.id.value,
        raidId: r.raidId,
        characterId: r.characterId,
        itemName: r.itemName,
        status: r.status,
        createdAt: r.createdAt,
      })),
    }
  }
}
