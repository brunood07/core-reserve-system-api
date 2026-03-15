import type { UseCase } from '../../_shared/UseCase.js'
import type { IRaidRepository } from '../../../domain/raid/repositories/IRaidRepository.js'
import type { RaidDifficultyValue } from '../../../domain/raid/value-objects/RaidDifficulty.js'

export type ListRaidsInput = Record<string, never>

export interface ListRaidsOutput {
  raids: Array<{
    raidId: string
    name: string
    difficulty: RaidDifficultyValue
    maxSlots: number
    scheduledAt?: Date
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
        name: r.name,
        difficulty: r.difficulty,
        maxSlots: r.maxSlots,
        scheduledAt: r.scheduledAt,
        createdAt: r.createdAt,
      })),
    }
  }
}
