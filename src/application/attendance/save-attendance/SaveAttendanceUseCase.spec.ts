import { describe, it, expect, beforeEach } from 'vitest'
import { SaveAttendanceUseCase, RaidNotFoundError } from './SaveAttendanceUseCase.js'
import { InMemoryRaidRepository } from '../../../../tests/_shared/InMemoryRaidRepository.js'
import { InMemoryRaidAttendanceRepository } from '../../../../tests/_shared/InMemoryRaidAttendanceRepository.js'
import { InMemoryReservationFormRepository } from '../../../../tests/_shared/InMemoryReservationFormRepository.js'
import { Raid } from '../../../domain/raid/entities/Raid.js'

// 2025-01-08 is a Wednesday
const RAID_DATE = new Date('2025-01-08T00:00:00.000Z')
// Next Wednesday = 2025-01-15
const NEXT_WEDNESDAY = new Date('2025-01-15T00:00:00.000Z')

function makeRaid(date = RAID_DATE): Raid {
  return Raid.create({ date, status: 'OPEN', createdById: 'user-gm' })
}

const ATTENDANCES = [
  { userId: 'user-1', characterId: 'char-1', attended: true },
  { userId: 'user-2', characterId: 'char-2', attended: false },
]

describe('SaveAttendanceUseCase', () => {
  let raidRepo: InMemoryRaidRepository
  let attendanceRepo: InMemoryRaidAttendanceRepository
  let formRepo: InMemoryReservationFormRepository
  let sut: SaveAttendanceUseCase
  let raidId: string

  beforeEach(async () => {
    raidRepo = new InMemoryRaidRepository()
    attendanceRepo = new InMemoryRaidAttendanceRepository()
    formRepo = new InMemoryReservationFormRepository()
    sut = new SaveAttendanceUseCase(raidRepo, attendanceRepo, formRepo)

    const raid = makeRaid()
    await raidRepo.save(raid)
    raidId = raid.id.value
  })

  it('should save attendance records and return them', async () => {
    const output = await sut.execute({ raidId, attendances: ATTENDANCES })

    expect(output.attendances).toHaveLength(2)
    expect(output.attendances[0]).toMatchObject({
      raidId,
      userId: 'user-1',
      characterId: 'char-1',
      attended: true,
    })
    expect(output.attendances[0]?.id).toBeDefined()
  })

  it('should mark the raid as COMPLETED', async () => {
    await sut.execute({ raidId, attendances: ATTENDANCES })

    const raid = await raidRepo.findById(
      (await raidRepo.findAll())[0]!.id
    )
    expect(raid?.status).toBe('COMPLETED')
  })

  it('should create a reservation form when at least one attended = true', async () => {
    const output = await sut.execute({ raidId, attendances: ATTENDANCES })

    expect(output.reservationFormCreated).toBe(true)
    expect(formRepo.items).toHaveLength(1)
    expect(formRepo.items[0]?.weekOf.getTime()).toBe(NEXT_WEDNESDAY.getTime())
    expect(formRepo.items[0]?.status).toBe('OPEN')
  })

  it('should set closes_at to Tuesday 22:00 BRT (01:00 UTC Wednesday)', async () => {
    await sut.execute({ raidId, attendances: ATTENDANCES })

    const form = formRepo.items[0]!
    // closes_at = next Wednesday at 01:00 UTC = Tuesday 22:00 BRT
    expect(form.closesAt.getUTCDay()).toBe(3)    // It's UTC Wednesday
    expect(form.closesAt.getUTCHours()).toBe(1)  // 01:00 UTC
    expect(form.closesAt.getUTCMinutes()).toBe(0)
  })

  it('should NOT create a reservation form when all attended = false', async () => {
    const output = await sut.execute({
      raidId,
      attendances: [
        { userId: 'user-1', characterId: 'char-1', attended: false },
        { userId: 'user-2', characterId: 'char-2', attended: false },
      ],
    })

    expect(output.reservationFormCreated).toBe(false)
    expect(formRepo.items).toHaveLength(0)
  })

  it('should NOT create a form when one already exists for that week', async () => {
    // First call creates the form
    await sut.execute({ raidId, attendances: ATTENDANCES })
    expect(formRepo.items).toHaveLength(1)

    // Second call (e.g. correcting attendance) should not create another
    const output = await sut.execute({ raidId, attendances: ATTENDANCES })

    expect(output.reservationFormCreated).toBe(false)
    expect(formRepo.items).toHaveLength(1)
  })

  it('should upsert: updating an existing attendance record', async () => {
    await sut.execute({
      raidId,
      attendances: [{ userId: 'user-1', characterId: 'char-1', attended: true }],
    })
    await sut.execute({
      raidId,
      attendances: [{ userId: 'user-1', characterId: 'char-1', attended: false }],
    })

    const all = await attendanceRepo.findByRaidId(raidId)
    expect(all).toHaveLength(1)
    expect(all[0]?.attended).toBe(false)
  })

  it('should throw RaidNotFoundError when raid does not exist', async () => {
    await expect(
      sut.execute({ raidId: 'non-existent', attendances: ATTENDANCES })
    ).rejects.toThrow(RaidNotFoundError)
  })

  it('should handle empty attendances array', async () => {
    const output = await sut.execute({ raidId, attendances: [] })

    expect(output.attendances).toHaveLength(0)
    expect(output.reservationFormCreated).toBe(false)
  })
})
