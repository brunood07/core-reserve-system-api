import type { UseCase } from '../../_shared/UseCase.js'
import type { IRaidRepository } from '../../../domain/raid/repositories/IRaidRepository.js'
import type { RaidStatusValue } from '../../../domain/raid/value-objects/RaidStatus.js'

export type ListRaidsInput = Record<string, never>

export interface ListRaidsOutput {
  raids: Array<{
    raidId: string
    date: Date
    description: string | null
    status: RaidStatusValue
    createdById: string
    createdAt: Date
  }>
}

export class ListRaidsUseCase implements UseCase<ListRaidsInput, ListRaidsOutput> {
  constructor(private readonly raidRepository: IRaidRepository) {}

  async execute(_input: ListRaidsInput): Promise<ListRaidsOutput> {
    const raids = await this.raidRepository.findAll()
    return {
      raids: raids.map((r) => ({
        raidId: r.id.value,
        date: r.date,
        description: r.description,
        status: r.status,
        createdById: r.createdById,
        createdAt: r.createdAt,
      })),
    }
  }
}
