import type { UseCase } from '../../_shared/UseCase.js'
import type {
  IRaidAttendanceRepository,
  AttendanceRankingEntry,
} from '../../../domain/attendance/repositories/IRaidAttendanceRepository.js'

export interface GetAttendanceRankingOutput {
  ranking: AttendanceRankingEntry[]
}

export class GetAttendanceRankingUseCase
  implements UseCase<void, GetAttendanceRankingOutput>
{
  constructor(private readonly attendanceRepository: IRaidAttendanceRepository) {}

  async execute(): Promise<GetAttendanceRankingOutput> {
    const ranking = await this.attendanceRepository.findAttendanceRanking()
    return { ranking }
  }
}
