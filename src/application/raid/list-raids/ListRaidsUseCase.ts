import type { UseCase } from '../../_shared/UseCase.js'
import type { IRaidRepository, RaidBossDetail } from '../../../domain/raid/repositories/IRaidRepository.js'
import type { RaidStatusValue } from '../../../domain/raid/value-objects/RaidStatus.js'

export type ListRaidsInput = Record<string, never>

export interface ListRaidsOutput {
  raids: Array<{
    id: string
    date: Date
    description: string | null
    status: RaidStatusValue
    bosses: RaidBossDetail[]
  }>
}

export class ListRaidsUseCase implements UseCase<ListRaidsInput, ListRaidsOutput> {
  constructor(private readonly raidRepository: IRaidRepository) {}

  async execute(_input: ListRaidsInput): Promise<ListRaidsOutput> {
    const raids = await this.raidRepository.findAllWithDetails()
    return {
      raids: raids.map((r) => ({
        id: r.id,
        date: r.date,
        description: r.description,
        status: r.status as RaidStatusValue,
        bosses: r.bosses,
      })),
    }
  }
}
