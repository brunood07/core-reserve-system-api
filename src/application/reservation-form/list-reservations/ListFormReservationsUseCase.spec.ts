import { describe, it, expect, beforeEach } from 'vitest'
import { ListFormReservationsUseCase, FormNotFoundError } from './ListFormReservationsUseCase.js'
import { InMemoryReservationFormRepository } from '../../../../tests/_shared/InMemoryReservationFormRepository.js'
import { InMemoryRaidRepository } from '../../../../tests/_shared/InMemoryRaidRepository.js'
import { InMemoryRaidAttendanceRepository } from '../../../../tests/_shared/InMemoryRaidAttendanceRepository.js'
import { InMemoryBossRepository } from '../../../../tests/_shared/InMemoryBossRepository.js'
import { InMemoryReserveRepository } from '../../../../tests/_shared/InMemoryReserveRepository.js'
import { ReservationForm } from '../../../domain/reservation-form/entities/ReservationForm.js'
import { Raid } from '../../../domain/raid/entities/Raid.js'
import { RaidAttendance } from '../../../domain/attendance/entities/RaidAttendance.js'
import { Boss } from '../../../domain/boss/entities/Boss.js'
import { Reserve } from '../../../domain/reserve/entities/Reserve.js'

// Future dates so forms aren't expired
const SOURCE_DATE = new Date('2026-03-11T00:00:00.000Z') // Wednesday -7 days
const WEEK_OF = new Date('2026-03-18T00:00:00.000Z')     // Wednesday (form's week)
const CLOSES_AT = new Date('2026-03-18T01:00:00.000Z')

const USER_A = 'user-a'
const USER_B = 'user-b'
const CHAR_A = 'char-a'
const CHAR_B = 'char-b'
const BOSS_ID = 'boss-1'
const ITEM_ID = 'item-1'
const ITEM_NAME = 'Cursed Warlord Helmet'

describe('ListFormReservationsUseCase', () => {
  let formRepo: InMemoryReservationFormRepository
  let raidRepo: InMemoryRaidRepository
  let attendanceRepo: InMemoryRaidAttendanceRepository
  let bossRepo: InMemoryBossRepository
  let reserveRepo: InMemoryReserveRepository
  let sut: ListFormReservationsUseCase

  let formId: string
  let sourceRaidId: string
  let targetRaidId: string

  beforeEach(async () => {
    formRepo = new InMemoryReservationFormRepository()
    raidRepo = new InMemoryRaidRepository()
    attendanceRepo = new InMemoryRaidAttendanceRepository()
    bossRepo = new InMemoryBossRepository()
    reserveRepo = new InMemoryReserveRepository()

    sut = new ListFormReservationsUseCase(formRepo, raidRepo, attendanceRepo, bossRepo, reserveRepo)

    // Form
    const form = ReservationForm.reconstitue({
      id: 'form-1',
      weekOf: WEEK_OF,
      opensAt: new Date('2026-03-12T00:00:00.000Z'),
      closesAt: CLOSES_AT,
      status: 'OPEN',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await formRepo.save(form)
    formId = form.id.value

    // Source raid (previous Wednesday)
    const sourceRaid = Raid.create({ date: SOURCE_DATE, status: 'COMPLETED', createdById: 'gm' })
    await raidRepo.save(sourceRaid)
    sourceRaidId = sourceRaid.id.value

    // Target raid (form's Wednesday)
    const targetRaid = Raid.create({ date: WEEK_OF, status: 'OPEN', createdById: 'gm' })
    await raidRepo.save(targetRaid)
    targetRaidId = targetRaid.id.value

    // Both users attended the source raid
    await attendanceRepo.save(
      RaidAttendance.reconstitue({
        id: 'att-a',
        raidId: sourceRaidId,
        userId: USER_A,
        characterId: CHAR_A,
        attended: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    )
    await attendanceRepo.save(
      RaidAttendance.reconstitue({
        id: 'att-b',
        raidId: sourceRaidId,
        userId: USER_B,
        characterId: CHAR_B,
        attended: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    )

    // Boss on target raid with one item
    const boss = Boss.reconstitue({
      id: BOSS_ID,
      raidId: targetRaidId,
      name: 'The Silken Court',
      orderIndex: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await bossRepo.save(boss)
    bossRepo.bossItems.set(BOSS_ID, [
      { id: ITEM_ID, name: ITEM_NAME, itemType: 'HELM', ilvl: 639 },
    ])

    // Seed character data so reserve repo can resolve userId
    reserveRepo.characterData.set(CHAR_A, {
      userId: USER_A,
      playerName: 'Alpha',
      characterName: 'Shadowmeld',
      characterClass: 'DRUID',
    })
    reserveRepo.characterData.set(CHAR_B, {
      userId: USER_B,
      playerName: 'Beta',
      characterName: 'Drako',
      characterClass: 'WARRIOR',
    })
  })

  it('throws FormNotFoundError when form does not exist', async () => {
    await expect(sut.execute({ formId: 'non-existent' })).rejects.toThrow(FormNotFoundError)
  })

  it('returns correct structure even when no reserves or raids exist', async () => {
    raidRepo.items = []

    const output = await sut.execute({ formId })

    expect(output.formId).toBe(formId)
    expect(output.weekOf).toEqual(WEEK_OF)
    expect(output.bosses).toEqual([])
    expect(output.playersWithPendingReservation).toEqual([])
    expect(output.summary).toEqual({ totalReservations: 0, totalPending: 0 })
  })

  it('groups reserves under the correct boss', async () => {
    await reserveRepo.save(
      Reserve.reconstitue({
        id: 'reserve-1',
        raidId: targetRaidId,
        characterId: CHAR_A,
        itemName: ITEM_NAME,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    )

    const output = await sut.execute({ formId })

    expect(output.bosses).toHaveLength(1)
    expect(output.bosses[0]?.bossName).toBe('The Silken Court')
    expect(output.bosses[0]?.orderIndex).toBe(1)
    expect(output.bosses[0]?.reservations).toHaveLength(1)
    expect(output.bosses[0]?.reservations[0]?.item.itemName).toBe(ITEM_NAME)
    expect(output.bosses[0]?.reservations[0]?.item.itemType).toBe('HELM')
    expect(output.bosses[0]?.count).toBe(1)
  })

  it('marks players who attended but did not reserve as pending', async () => {
    // Only user-a reserved; user-b has not
    await reserveRepo.save(
      Reserve.reconstitue({
        id: 'reserve-1',
        raidId: targetRaidId,
        characterId: CHAR_A,
        itemName: ITEM_NAME,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    )

    const output = await sut.execute({ formId })

    expect(output.playersWithPendingReservation).toHaveLength(1)
    expect(output.playersWithPendingReservation[0]?.userId).toBe(USER_B)
    expect(output.playersWithPendingReservation[0]?.hasPendingReservation).toBe(true)
  })

  it('returns no pending players when all attendees have reserved', async () => {
    await reserveRepo.save(
      Reserve.reconstitue({
        id: 'reserve-a',
        raidId: targetRaidId,
        characterId: CHAR_A,
        itemName: ITEM_NAME,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    )
    await reserveRepo.save(
      Reserve.reconstitue({
        id: 'reserve-b',
        raidId: targetRaidId,
        characterId: CHAR_B,
        itemName: ITEM_NAME,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    )

    const output = await sut.execute({ formId })

    expect(output.playersWithPendingReservation).toHaveLength(0)
    expect(output.summary.totalPending).toBe(0)
  })

  it('does not include absent players in pending list', async () => {
    // Make user-b absent instead of present
    const absent = attendanceRepo.items.find((a) => a.userId === USER_B)!
    attendanceRepo.items = attendanceRepo.items.filter((a) => a.userId !== USER_B)
    await attendanceRepo.save(
      RaidAttendance.reconstitue({
        id: absent.id.value,
        raidId: sourceRaidId,
        userId: USER_B,
        characterId: CHAR_B,
        attended: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    )

    const output = await sut.execute({ formId })

    // user-b was absent, so should NOT appear as pending (can't reserve anyway)
    expect(output.playersWithPendingReservation.some((p) => p.userId === USER_B)).toBe(false)
    // user-a attended and didn't reserve → is pending
    expect(output.playersWithPendingReservation.some((p) => p.userId === USER_A)).toBe(true)
    expect(output.summary.totalPending).toBe(1)
  })

  it('returns no pending players when source raid does not exist', async () => {
    raidRepo.items = raidRepo.items.filter((r) => r.id.value !== sourceRaidId)

    const output = await sut.execute({ formId })

    expect(output.playersWithPendingReservation).toHaveLength(0)
  })

  it('returns correct summary counts', async () => {
    await reserveRepo.save(
      Reserve.reconstitue({
        id: 'reserve-a',
        raidId: targetRaidId,
        characterId: CHAR_A,
        itemName: ITEM_NAME,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    )

    const output = await sut.execute({ formId })

    expect(output.summary.totalReservations).toBe(1)
    expect(output.summary.totalPending).toBe(1) // user-b attended but didn't reserve
  })

  it('does not include CANCELLED reserves in the grouped output', async () => {
    await reserveRepo.save(
      Reserve.reconstitue({
        id: 'reserve-cancelled',
        raidId: targetRaidId,
        characterId: CHAR_A,
        itemName: ITEM_NAME,
        status: 'CANCELLED',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    )

    const output = await sut.execute({ formId })

    expect(output.bosses[0]?.reservations).toHaveLength(0)
    expect(output.summary.totalReservations).toBe(0)
    // user-a's reserve is cancelled so they count as pending
    expect(output.playersWithPendingReservation.some((p) => p.userId === USER_A)).toBe(true)
  })
})
