import type { UseCase } from '../../_shared/UseCase.js'
import type { IRaidRepository } from '../../../domain/raid/repositories/IRaidRepository.js'
import type {
  IRaidAttendanceRepository,
  AttendeeRecord,
} from '../../../domain/attendance/repositories/IRaidAttendanceRepository.js'
import { UniqueEntityId } from '../../../domain/_shared/UniqueEntityId.js'

export interface GetRaidAttendanceInput {
  raidId: string
}

export interface GetRaidAttendanceOutput {
  raidId: string
  counts: { total: number; present: number; absent: number }
  present: AttendeeRecord[]
  absent: AttendeeRecord[]
}

export class RaidNotFoundError extends Error {
  constructor(id: string) {
    super(`Raid not found: ${id}`)
    this.name = 'RaidNotFoundError'
  }
}

export class GetRaidAttendanceUseCase
  implements UseCase<GetRaidAttendanceInput, GetRaidAttendanceOutput>
{
  constructor(
    private readonly raidRepository: IRaidRepository,
    private readonly attendanceRepository: IRaidAttendanceRepository
  ) {}

  async execute(input: GetRaidAttendanceInput): Promise<GetRaidAttendanceOutput> {
    const raid = await this.raidRepository.findById(new UniqueEntityId(input.raidId))
    if (!raid) {
      throw new RaidNotFoundError(input.raidId)
    }

    const summary = await this.attendanceRepository.findRaidAttendanceSummary(input.raidId)

    return {
      raidId: summary.raidId,
      counts: {
        total: summary.total,
        present: summary.present.length,
        absent: summary.absent.length,
      },
      present: summary.present,
      absent: summary.absent,
    }
  }
}
