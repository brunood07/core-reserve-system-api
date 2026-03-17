import type { UseCase } from '../../_shared/UseCase.js'
import type { IRaidRepository } from '../../../domain/raid/repositories/IRaidRepository.js'
import type { IRaidAttendanceRepository } from '../../../domain/attendance/repositories/IRaidAttendanceRepository.js'
import { UniqueEntityId } from '../../../domain/_shared/UniqueEntityId.js'

export interface AttendanceInput {
  userId: string
  characterId: string
  attended: boolean
}

export interface SaveAttendanceInput {
  raidId: string
  attendances: AttendanceInput[]
}

export interface AttendanceOutput {
  id: string
  raidId: string
  userId: string
  characterId: string
  attended: boolean
}

export interface SaveAttendanceOutput {
  attendances: AttendanceOutput[]
}

export class RaidNotFoundError extends Error {
  constructor(id: string) {
    super(`Raid not found: ${id}`)
    this.name = 'RaidNotFoundError'
  }
}

export class SaveAttendanceUseCase implements UseCase<SaveAttendanceInput, SaveAttendanceOutput> {
  constructor(
    private readonly raidRepository: IRaidRepository,
    private readonly attendanceRepository: IRaidAttendanceRepository
  ) {}

  async execute(input: SaveAttendanceInput): Promise<SaveAttendanceOutput> {
    const raid = await this.raidRepository.findById(new UniqueEntityId(input.raidId))
    if (!raid) {
      throw new RaidNotFoundError(input.raidId)
    }

    const records = input.attendances.map((a) => ({
      raidId: input.raidId,
      userId: a.userId,
      characterId: a.characterId,
      attended: a.attended,
    }))

    const saved = await this.attendanceRepository.saveMany(records)

    return {
      attendances: saved.map((a) => ({
        id: a.id.value,
        raidId: a.raidId,
        userId: a.userId,
        characterId: a.characterId,
        attended: a.attended,
      })),
    }
  }
}
