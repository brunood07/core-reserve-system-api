import { describe, it, expect, beforeEach } from 'vitest'
import {
  GetCurrentReservationFormUseCase,
  NoOpenFormError,
} from './GetCurrentReservationFormUseCase.js'
import { InMemoryReservationFormRepository } from '../../../../tests/_shared/InMemoryReservationFormRepository.js'
import { InMemoryRaidRepository } from '../../../../tests/_shared/InMemoryRaidRepository.js'
import { InMemoryRaidAttendanceRepository } from '../../../../tests/_shared/InMemoryRaidAttendanceRepository.js'
import { InMemoryCharacterRepository } from '../../../../tests/_shared/InMemoryCharacterRepository.js'
import { InMemoryReserveRepository } from '../../../../tests/_shared/InMemoryReserveRepository.js'
import { InMemoryBossRepository } from '../../../../tests/_shared/InMemoryBossRepository.js'
import { ReservationForm } from '../../../domain/reservation-form/entities/ReservationForm.js'
import { Raid } from '../../../domain/raid/entities/Raid.js'
import { RaidAttendance } from '../../../domain/attendance/entities/RaidAttendance.js'
import { Reserve } from '../../../domain/reserve/entities/Reserve.js'
import { Character } from '../../../domain/character/entities/Character.js'
import { Boss } from '../../../domain/boss/entities/Boss.js'

// Use future dates so findCurrentOpen() treats the form as currently open.
// WEEK_OF must be a Wednesday (UTC day 3).
// Next Wednesday from today (2026-03-15) = 2026-03-18.
const SOURCE_DATE = new Date('2026-03-11T00:00:00.000Z') // previous Wednesday
const WEEK_OF = new Date('2026-03-18T00:00:00.000Z')     // upcoming Wednesday
const CLOSES_AT = new Date('2026-03-18T01:00:00.000Z')   // Wed 01:00 UTC = Tue 22:00 BRT
const OPENS_AT = new Date('2026-03-12T00:00:00.000Z')    // Thu after source raid

const USER_ID = 'user-1'
const CHAR_ID = 'char-1'

function makeOpenForm(): ReservationForm {
  return ReservationForm.reconstitue({
    id: 'form-1',
    weekOf: WEEK_OF,
    opensAt: OPENS_AT,
    closesAt: CLOSES_AT,
    status: 'OPEN',
    createdAt: new Date(),
    updatedAt: new Date(),
  })
}

function makeSourceRaid(): Raid {
  return Raid.create({ date: SOURCE_DATE, status: 'COMPLETED', createdById: 'gm' })
}

function makeTargetRaid(): Raid {
  return Raid.create({ date: WEEK_OF, status: 'OPEN', createdById: 'gm' })
}

describe('GetCurrentReservationFormUseCase', () => {
  let formRepo: InMemoryReservationFormRepository
  let raidRepo: InMemoryRaidRepository
  let attendanceRepo: InMemoryRaidAttendanceRepository
  let characterRepo: InMemoryCharacterRepository
  let reserveRepo: InMemoryReserveRepository
  let bossRepo: InMemoryBossRepository
  let sut: GetCurrentReservationFormUseCase

  beforeEach(() => {
    formRepo = new InMemoryReservationFormRepository()
    raidRepo = new InMemoryRaidRepository()
    attendanceRepo = new InMemoryRaidAttendanceRepository()
    characterRepo = new InMemoryCharacterRepository()
    reserveRepo = new InMemoryReserveRepository()
    bossRepo = new InMemoryBossRepository()
    sut = new GetCurrentReservationFormUseCase(
      formRepo,
      raidRepo,
      attendanceRepo,
      characterRepo,
      reserveRepo,
      bossRepo
    )
  })

  it('throws NoOpenFormError when no open form exists', async () => {
    await expect(sut.execute({ userId: USER_ID })).rejects.toThrow(NoOpenFormError)
  })

  it('throws NoOpenFormError when form is expired', async () => {
    const expired = ReservationForm.reconstitue({
      id: 'form-expired',
      weekOf: WEEK_OF,
      opensAt: OPENS_AT,
      closesAt: new Date(Date.now() - 1000), // already closed
      status: 'OPEN',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await formRepo.save(expired)

    await expect(sut.execute({ userId: USER_ID })).rejects.toThrow(NoOpenFormError)
  })

  it('returns the open form with canReserve=false when no source raid exists', async () => {
    await formRepo.save(makeOpenForm())

    const output = await sut.execute({ userId: USER_ID })

    expect(output.form.id).toBe('form-1')
    expect(output.form.weekOf).toEqual(WEEK_OF)
    expect(output.canReserve).toBe(false)
    expect(output.currentReservation).toBeNull()
    expect(output.bosses).toEqual([])
  })

  it('returns canReserve=false when user was absent from source raid', async () => {
    const sourceRaid = makeSourceRaid()
    await raidRepo.save(sourceRaid)
    await attendanceRepo.save(
      RaidAttendance.reconstitue({
        id: 'att-1',
        raidId: sourceRaid.id.value,
        userId: USER_ID,
        characterId: CHAR_ID,
        attended: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    )
    await formRepo.save(makeOpenForm())

    const output = await sut.execute({ userId: USER_ID })

    expect(output.canReserve).toBe(false)
  })

  it('returns canReserve=true when user attended source raid', async () => {
    const sourceRaid = makeSourceRaid()
    await raidRepo.save(sourceRaid)
    await attendanceRepo.save(
      RaidAttendance.reconstitue({
        id: 'att-1',
        raidId: sourceRaid.id.value,
        userId: USER_ID,
        characterId: CHAR_ID,
        attended: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    )
    await formRepo.save(makeOpenForm())

    const output = await sut.execute({ userId: USER_ID })

    expect(output.canReserve).toBe(true)
  })

  it('returns canReserve=false when user has no attendance record for source raid', async () => {
    const sourceRaid = makeSourceRaid()
    await raidRepo.save(sourceRaid)
    await formRepo.save(makeOpenForm())

    const output = await sut.execute({ userId: USER_ID })

    expect(output.canReserve).toBe(false)
  })

  it('returns bosses (empty items in memory) when target raid exists', async () => {
    const targetRaid = makeTargetRaid()
    await raidRepo.save(targetRaid)

    const boss = Boss.reconstitue({
      id: 'boss-1',
      raidId: targetRaid.id.value,
      name: 'The Silken Court',
      orderIndex: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await bossRepo.save(boss)
    await formRepo.save(makeOpenForm())

    const output = await sut.execute({ userId: USER_ID })

    expect(output.bosses).toHaveLength(1)
    expect(output.bosses[0]?.name).toBe('The Silken Court')
  })

  it('returns currentReservation when user has an active reserve', async () => {
    const targetRaid = makeTargetRaid()
    await raidRepo.save(targetRaid)

    const character = Character.reconstitue({
      id: CHAR_ID,
      userId: USER_ID,
      name: 'Shadowmeld',
      class: 'DRUID',
      spec: 'Balance',
      realm: 'Azralon',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await characterRepo.save(character)

    const reserve = Reserve.reconstitue({
      id: 'reserve-1',
      raidId: targetRaid.id.value,
      characterId: CHAR_ID,
      itemName: 'Cursed Warlord Helmet',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await reserveRepo.save(reserve)
    await formRepo.save(makeOpenForm())

    const output = await sut.execute({ userId: USER_ID })

    expect(output.currentReservation).not.toBeNull()
    expect(output.currentReservation?.id).toBe('reserve-1')
    expect(output.currentReservation?.itemName).toBe('Cursed Warlord Helmet')
    expect(output.currentReservation?.characterId).toBe(CHAR_ID)
    expect(output.currentReservation?.status).toBe('ACTIVE')
  })

  it('returns currentReservation=null when user has no active reserve', async () => {
    const targetRaid = makeTargetRaid()
    await raidRepo.save(targetRaid)

    const character = Character.reconstitue({
      id: CHAR_ID,
      userId: USER_ID,
      name: 'Shadowmeld',
      class: 'DRUID',
      spec: 'Balance',
      realm: 'Azralon',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await characterRepo.save(character)
    await formRepo.save(makeOpenForm())

    const output = await sut.execute({ userId: USER_ID })

    expect(output.currentReservation).toBeNull()
  })
})
