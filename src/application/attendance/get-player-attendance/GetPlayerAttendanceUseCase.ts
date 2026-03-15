import type { UseCase } from '../../_shared/UseCase.js'
import type { IUserRepository } from '../../../domain/user/repositories/IUserRepository.js'
import type {
  IRaidAttendanceRepository,
  PlayerAttendanceRecord,
} from '../../../domain/attendance/repositories/IRaidAttendanceRepository.js'
import { UniqueEntityId } from '../../../domain/_shared/UniqueEntityId.js'

export interface GetPlayerAttendanceInput {
  targetUserId: string
  requestingUserId: string
  requestingUserRole: string
  page?: number
  limit?: number
}

export interface GetPlayerAttendanceOutput {
  records: PlayerAttendanceRecord[]
  total: number
  page: number
  limit: number
  attendanceRate: number
}

const ELEVATED_ROLES = ['RAID_LEADER', 'OFFICER', 'ADMIN']

export class PlayerNotFoundError extends Error {
  constructor(id: string) {
    super(`Player not found: ${id}`)
    this.name = 'PlayerNotFoundError'
  }
}

export class ForbiddenError extends Error {
  constructor() {
    super('You are not allowed to view another player\'s attendance')
    this.name = 'ForbiddenError'
  }
}

export class GetPlayerAttendanceUseCase
  implements UseCase<GetPlayerAttendanceInput, GetPlayerAttendanceOutput>
{
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly attendanceRepository: IRaidAttendanceRepository
  ) {}

  async execute(input: GetPlayerAttendanceInput): Promise<GetPlayerAttendanceOutput> {
    const isSelf = input.requestingUserId === input.targetUserId
    const hasElevatedRole = ELEVATED_ROLES.includes(input.requestingUserRole)

    if (!isSelf && !hasElevatedRole) {
      throw new ForbiddenError()
    }

    const user = await this.userRepository.findById(new UniqueEntityId(input.targetUserId))
    if (!user || user.isDeleted) {
      throw new PlayerNotFoundError(input.targetUserId)
    }

    const page = input.page ?? 1
    const limit = Math.min(input.limit ?? 20, 100)

    const history = await this.attendanceRepository.findPlayerAttendanceHistory(
      input.targetUserId,
      { page, limit }
    )

    return {
      records: history.records,
      total: history.total,
      page,
      limit,
      attendanceRate: history.attendanceRate,
    }
  }
}
