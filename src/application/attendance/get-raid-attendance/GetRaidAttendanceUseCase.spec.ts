import { describe, it, expect, beforeEach } from 'vitest'
import { GetRaidAttendanceUseCase, RaidNotFoundError } from './GetRaidAttendanceUseCase.js'
import { InMemoryRaidRepository } from '../../../../tests/_shared/InMemoryRaidRepository.js'
import { InMemoryRaidAttendanceRepository } from '../../../../tests/_shared/InMemoryRaidAttendanceRepository.js'
import { Raid } from '../../../domain/raid/entities/Raid.js'
import { RaidAttendance } from '../../../domain/attendance/entities/RaidAttendance.js'

function makeRaid(): Raid {
  return Raid.create({
    date: new Date('2025-01-08T00:00:00.000Z'),
    status: 'OPEN',
    createdById: 'user-gm',
  })
}

describe('GetRaidAttendanceUseCase', () => {
  let raidRepo: InMemoryRaidRepository
  let attendanceRepo: InMemoryRaidAttendanceRepository
  let sut: GetRaidAttendanceUseCase
  let raidId: string

  beforeEach(async () => {
    raidRepo = new InMemoryRaidRepository()
    attendanceRepo = new InMemoryRaidAttendanceRepository()
    sut = new GetRaidAttendanceUseCase(raidRepo, attendanceRepo)

    const raid = makeRaid()
    await raidRepo.save(raid)
    raidId = raid.id.value
  })

  it('should return present and absent lists with counts', async () => {
    await attendanceRepo.save(
      RaidAttendance.create({ raidId, userId: 'u1', characterId: 'c1', attended: true })
    )
    await attendanceRepo.save(
      RaidAttendance.create({ raidId, userId: 'u2', characterId: 'c2', attended: true })
    )
    await attendanceRepo.save(
      RaidAttendance.create({ raidId, userId: 'u3', characterId: 'c3', attended: false })
    )

    const output = await sut.execute({ raidId })

    expect(output.counts.total).toBe(3)
    expect(output.counts.present).toBe(2)
    expect(output.counts.absent).toBe(1)
    expect(output.present).toHaveLength(2)
    expect(output.absent).toHaveLength(1)
  })

  it('should return empty lists when no attendance records exist', async () => {
    const output = await sut.execute({ raidId })

    expect(output.counts.total).toBe(0)
    expect(output.counts.present).toBe(0)
    expect(output.counts.absent).toBe(0)
    expect(output.present).toHaveLength(0)
    expect(output.absent).toHaveLength(0)
  })

  it('should include attendanceId and userId in each record', async () => {
    const att = RaidAttendance.create({ raidId, userId: 'u1', characterId: 'c1', attended: true })
    await attendanceRepo.save(att)

    const output = await sut.execute({ raidId })

    expect(output.present[0]).toMatchObject({
      attendanceId: att.id.value,
      userId: 'u1',
      characterId: 'c1',
    })
  })

  it('should throw RaidNotFoundError when raid does not exist', async () => {
    await expect(sut.execute({ raidId: 'non-existent' })).rejects.toThrow(RaidNotFoundError)
  })
})
