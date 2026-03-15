import { describe, it, expect, beforeEach } from 'vitest'
import {
  GetPlayerAttendanceUseCase,
  PlayerNotFoundError,
  ForbiddenError,
} from './GetPlayerAttendanceUseCase.js'
import { InMemoryUserRepository } from '../../../../tests/_shared/InMemoryUserRepository.js'
import { InMemoryRaidAttendanceRepository } from '../../../../tests/_shared/InMemoryRaidAttendanceRepository.js'
import { User } from '../../../domain/user/entities/User.js'
import { RaidAttendance } from '../../../domain/attendance/entities/RaidAttendance.js'

function makePlayer(id: string): User {
  return User.reconstitue({
    id,
    name: 'Vareniel',
    email: `${id}@example.com`,
    passwordHash: 'hash',
    role: 'PLAYER',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
}

function makeAttendance(userId: string, attended: boolean, raidId = 'raid-1'): RaidAttendance {
  return RaidAttendance.create({ raidId, userId, characterId: 'char-1', attended })
}

describe('GetPlayerAttendanceUseCase', () => {
  let userRepo: InMemoryUserRepository
  let attendanceRepo: InMemoryRaidAttendanceRepository
  let sut: GetPlayerAttendanceUseCase
  const PLAYER_ID = 'player-1'
  const OTHER_ID = 'player-2'

  beforeEach(async () => {
    userRepo = new InMemoryUserRepository()
    attendanceRepo = new InMemoryRaidAttendanceRepository()
    sut = new GetPlayerAttendanceUseCase(userRepo, attendanceRepo)

    await userRepo.save(makePlayer(PLAYER_ID))
  })

  it('should allow a player to view their own attendance', async () => {
    await attendanceRepo.save(makeAttendance(PLAYER_ID, true))
    await attendanceRepo.save(makeAttendance(PLAYER_ID, false, 'raid-2'))

    const output = await sut.execute({
      targetUserId: PLAYER_ID,
      requestingUserId: PLAYER_ID,
      requestingUserRole: 'PLAYER',
    })

    expect(output.total).toBe(2)
  })

  it('should allow RAID_LEADER to view another player\'s attendance', async () => {
    await attendanceRepo.save(makeAttendance(PLAYER_ID, true))

    const output = await sut.execute({
      targetUserId: PLAYER_ID,
      requestingUserId: OTHER_ID,
      requestingUserRole: 'RAID_LEADER',
    })

    expect(output.total).toBe(1)
  })

  it('should allow OFFICER to view another player\'s attendance', async () => {
    await attendanceRepo.save(makeAttendance(PLAYER_ID, true))

    const output = await sut.execute({
      targetUserId: PLAYER_ID,
      requestingUserId: OTHER_ID,
      requestingUserRole: 'OFFICER',
    })

    expect(output.total).toBe(1)
  })

  it('should throw ForbiddenError when PLAYER tries to view another player', async () => {
    await userRepo.save(makePlayer(OTHER_ID))

    await expect(
      sut.execute({
        targetUserId: PLAYER_ID,
        requestingUserId: OTHER_ID,
        requestingUserRole: 'PLAYER',
      })
    ).rejects.toThrow(ForbiddenError)
  })

  it('should throw PlayerNotFoundError when target player does not exist', async () => {
    await expect(
      sut.execute({
        targetUserId: 'non-existent',
        requestingUserId: 'non-existent',
        requestingUserRole: 'PLAYER',
      })
    ).rejects.toThrow(PlayerNotFoundError)
  })

  it('should throw PlayerNotFoundError for soft-deleted players', async () => {
    const deleted = makePlayer('deleted-id')
    deleted.softDelete()
    await userRepo.save(deleted)

    await expect(
      sut.execute({
        targetUserId: 'deleted-id',
        requestingUserId: 'deleted-id',
        requestingUserRole: 'PLAYER',
      })
    ).rejects.toThrow(PlayerNotFoundError)
  })

  it('should calculate attendance_rate correctly', async () => {
    await attendanceRepo.save(makeAttendance(PLAYER_ID, true, 'r1'))
    await attendanceRepo.save(makeAttendance(PLAYER_ID, true, 'r2'))
    await attendanceRepo.save(makeAttendance(PLAYER_ID, false, 'r3'))

    const output = await sut.execute({
      targetUserId: PLAYER_ID,
      requestingUserId: PLAYER_ID,
      requestingUserRole: 'PLAYER',
    })

    // 2 attended out of 3 = ~67%
    expect(output.attendanceRate).toBeCloseTo(67, 0)
  })

  it('should return 0 attendance_rate when no records exist', async () => {
    const output = await sut.execute({
      targetUserId: PLAYER_ID,
      requestingUserId: PLAYER_ID,
      requestingUserRole: 'PLAYER',
    })

    expect(output.attendanceRate).toBe(0)
    expect(output.total).toBe(0)
  })

  it('should paginate records', async () => {
    for (let i = 0; i < 5; i++) {
      await attendanceRepo.save(makeAttendance(PLAYER_ID, true, `raid-${i}`))
    }

    const output = await sut.execute({
      targetUserId: PLAYER_ID,
      requestingUserId: PLAYER_ID,
      requestingUserRole: 'PLAYER',
      page: 1,
      limit: 2,
    })

    expect(output.total).toBe(5)
    expect(output.records).toHaveLength(2)
    expect(output.page).toBe(1)
    expect(output.limit).toBe(2)
  })
})
