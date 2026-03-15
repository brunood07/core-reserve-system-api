import type { UseCase } from '../../_shared/UseCase.js'
import type { IRaidRepository } from '../../../domain/raid/repositories/IRaidRepository.js'
import { Raid } from '../../../domain/raid/entities/Raid.js'
import type { RaidStatusValue } from '../../../domain/raid/value-objects/RaidStatus.js'

export interface CreateRaidInput {
  date: Date
  description?: string
  status: RaidStatusValue
  createdById: string
}

export interface CreateRaidOutput {
  raidId: string
  date: Date
  description: string | null
  status: RaidStatusValue
  createdById: string
  createdAt: Date
}

export class RaidNotOnWednesdayError extends Error {
  constructor() {
    super('A data da raid deve ser uma quarta-feira')
    this.name = 'RaidNotOnWednesdayError'
  }
}

export class RaidDateAlreadyTakenError extends Error {
  constructor(date: Date) {
    super(`Already exists a raid scheduled for ${date.toISOString().slice(0, 10)}`)
    this.name = 'RaidDateAlreadyTakenError'
  }
}

export class CreateRaidUseCase implements UseCase<CreateRaidInput, CreateRaidOutput> {
  constructor(private readonly raidRepository: IRaidRepository) {}

  async execute(input: CreateRaidInput): Promise<CreateRaidOutput> {
    if (input.date.getUTCDay() !== 3) {
      throw new RaidNotOnWednesdayError()
    }

    const existing = await this.raidRepository.findByDate(input.date)
    if (existing) {
      throw new RaidDateAlreadyTakenError(input.date)
    }

    const raid = Raid.create(input)
    await this.raidRepository.save(raid)

    return {
      raidId: raid.id.value,
      date: raid.date,
      description: raid.description,
      status: raid.status,
      createdById: raid.createdById,
      createdAt: raid.createdAt,
    }
  }
}
