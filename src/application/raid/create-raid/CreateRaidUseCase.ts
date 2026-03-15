import type { UseCase } from '../../_shared/UseCase.js'
import type { IRaidRepository } from '../../../domain/raid/repositories/IRaidRepository.js'
import { Raid } from '../../../domain/raid/entities/Raid.js'
import type { RaidDifficultyValue } from '../../../domain/raid/value-objects/RaidDifficulty.js'

export interface CreateRaidInput {
  name: string
  difficulty: RaidDifficultyValue
  maxSlots: number
  scheduledAt?: Date
}

export interface CreateRaidOutput {
  raidId: string
  name: string
  difficulty: RaidDifficultyValue
  maxSlots: number
  scheduledAt?: Date
  createdAt: Date
}

export class CreateRaidUseCase implements UseCase<CreateRaidInput, CreateRaidOutput> {
  constructor(private readonly raidRepository: IRaidRepository) {}

  async execute(input: CreateRaidInput): Promise<CreateRaidOutput> {
    const existing = await this.raidRepository.findByName(input.name)
    if (existing) {
      throw new Error(`Raid with name "${input.name}" already exists`)
    }

    const raid = Raid.create(input)
    await this.raidRepository.save(raid)

    return {
      raidId: raid.id.value,
      name: raid.name,
      difficulty: raid.difficulty,
      maxSlots: raid.maxSlots,
      scheduledAt: raid.scheduledAt,
      createdAt: raid.createdAt,
    }
  }
}
