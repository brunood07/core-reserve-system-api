import type { UseCase } from '../../_shared/UseCase.js'
import type { IRaidRepository } from '../../../domain/raid/repositories/IRaidRepository.js'
import type { IRaidAttendanceRepository } from '../../../domain/attendance/repositories/IRaidAttendanceRepository.js'
import { UniqueEntityId } from '../../../domain/_shared/UniqueEntityId.js'

export interface EnrollPlayerInput {
  raidId: string
  userId: string
  characterId: string
}

export interface EnrollPlayerOutput {
  alreadyEnrolled: boolean
}

export class RaidNotFoundError extends Error {
  constructor(id: string) {
    super(`Raid not found: ${id}`)
    this.name = 'RaidNotFoundError'
  }
}

export class EnrollPlayerUseCase implements UseCase<EnrollPlayerInput, EnrollPlayerOutput> {
  constructor(
    private readonly raidRepository: IRaidRepository,
    private readonly attendanceRepository: IRaidAttendanceRepository
  ) {}

  async execute(input: EnrollPlayerInput): Promise<EnrollPlayerOutput> {
    const raid = await this.raidRepository.findById(new UniqueEntityId(input.raidId))
    if (!raid) {
      throw new RaidNotFoundError(input.raidId)
    }

    const existing = await this.attendanceRepository.findByRaidAndUser(input.raidId, input.userId)
    if (existing) {
      return { alreadyEnrolled: true }
    }

    await this.attendanceRepository.saveMany([
      {
        raidId: input.raidId,
        userId: input.userId,
        characterId: input.characterId,
        attended: false,
      },
    ])

    return { alreadyEnrolled: false }
  }
}
