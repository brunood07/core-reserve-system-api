import { describe, it, expect, beforeEach } from 'vitest'
import {
  CreateFormReserveUseCase,
  FormNotFoundError,
  FormClosedError,
  NotAttendedError,
  ItemNotFoundError,
  ReservationAlreadyExistsError,
  NoActiveCharacterError,
} from './CreateFormReserveUseCase.js'
import { InMemoryReservationFormRepository } from '../../../../tests/_shared/InMemoryReservationFormRepository.js'
import { InMemoryRaidRepository } from '../../../../tests/_shared/InMemoryRaidRepository.js'
import { InMemoryRaidAttendanceRepository } from '../../../../tests/_shared/InMemoryRaidAttendanceRepository.js'
import { InMemoryCharacterRepository } from '../../../../tests/_shared/InMemoryCharacterRepository.js'
import { InMemoryReserveRepository } from '../../../../tests/_shared/InMemoryReserveRepository.js'
import { InMemoryBossRepository } from '../../../../tests/_shared/InMemoryBossRepository.js'
import { InMemoryItemRepository } from '../../../../tests/_shared/InMemoryItemRepository.js'
import { ReservationForm } from '../../../domain/reservation-form/entities/ReservationForm.js'
import { Raid } from '../../../domain/raid/entities/Raid.js'
import { RaidAttendance } from '../../../domain/attendance/entities/RaidAttendance.js'
import { Character } from '../../../domain/character/entities/Character.js'
import { Boss } from '../../../domain/boss/entities/Boss.js'
import { Item } from '../../../domain/item/entities/Item.js'
import { Reserve } from '../../../domain/reserve/entities/Reserve.js'

// Future dates so the form stays open during tests
const SOURCE_DATE = new Date('2026-03-11T00:00:00.000Z') // previous Wednesday
const WEEK_OF = new Date('2026-03-18T00:00:00.000Z')     // upcoming Wednesday
const CLOSES_AT = new Date('2026-03-18T01:00:00.000Z')   // Wed 01:00 UTC

const USER_ID = 'user-1'
const CHAR_ID = 'char-1'
const BOSS_ID = 'boss-1'
const ITEM_ID = 'item-1'

describe('CreateFormReserveUseCase', () => {
  let formRepo: InMemoryReservationFormRepository
  let raidRepo: InMemoryRaidRepository
  let attendanceRepo: InMemoryRaidAttendanceRepository
  let characterRepo: InMemoryCharacterRepository
  let reserveRepo: InMemoryReserveRepository
  let bossRepo: InMemoryBossRepository
  let itemRepo: InMemoryItemRepository
  let sut: CreateFormReserveUseCase

  // IDs that depend on entity creation — assigned in beforeEach
  let formId: string
  let sourceRaidId: string
  let targetRaidId: string

  beforeEach(async () => {
    formRepo = new InMemoryReservationFormRepository()
    raidRepo = new InMemoryRaidRepository()
    attendanceRepo = new InMemoryRaidAttendanceRepository()
    characterRepo = new InMemoryCharacterRepository()
    reserveRepo = new InMemoryReserveRepository()
    bossRepo = new InMemoryBossRepository()
    itemRepo = new InMemoryItemRepository()

    sut = new CreateFormReserveUseCase(
      formRepo,
      raidRepo,
      attendanceRepo,
      characterRepo,
      reserveRepo,
      bossRepo,
      itemRepo
    )

    // Open form
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

    // Source raid (the one that was attended)
    const sourceRaid = Raid.create({ date: SOURCE_DATE, status: 'COMPLETED', createdById: 'gm' })
    await raidRepo.save(sourceRaid)
    sourceRaidId = sourceRaid.id.value

    // Target raid (the upcoming one players reserve for)
    const targetRaid = Raid.create({ date: WEEK_OF, status: 'OPEN', createdById: 'gm' })
    await raidRepo.save(targetRaid)
    targetRaidId = targetRaid.id.value

    // User attended source raid
    await attendanceRepo.save(
      RaidAttendance.reconstitue({
        id: 'att-1',
        raidId: sourceRaidId,
        userId: USER_ID,
        characterId: CHAR_ID,
        attended: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    )

    // Active character
    await characterRepo.save(
      Character.reconstitue({
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
    )

    // Boss on target raid
    await bossRepo.save(
      Boss.reconstitue({
        id: BOSS_ID,
        raidId: targetRaidId,
        name: 'The Silken Court',
        orderIndex: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    )

    // Item on that boss
    await itemRepo.save(
      Item.reconstitue({
        id: ITEM_ID,
        bossId: BOSS_ID,
        name: 'Cursed Warlord Helmet',
        itemType: 'HELM',
        ilvl: 639,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    )
  })

  it('creates a reserve and returns 201 payload with boss and item data', async () => {
    const output = await sut.execute({ formId, bossId: BOSS_ID, itemId: ITEM_ID, userId: USER_ID })

    expect(output.id).toBeDefined()
    expect(output.raidId).toBe(targetRaidId)
    expect(output.characterId).toBe(CHAR_ID)
    expect(output.itemName).toBe('Cursed Warlord Helmet')
    expect(output.status).toBe('ACTIVE')
    expect(output.boss.id).toBe(BOSS_ID)
    expect(output.boss.name).toBe('The Silken Court')
    expect(output.item.id).toBe(ITEM_ID)
    expect(output.item.itemType).toBe('HELM')
    expect(output.item.ilvl).toBe(639)
  })

  it('persists the reserve in the repository', async () => {
    await sut.execute({ formId, bossId: BOSS_ID, itemId: ITEM_ID, userId: USER_ID })

    expect(reserveRepo.items).toHaveLength(1)
    expect(reserveRepo.items[0]?.itemName).toBe('Cursed Warlord Helmet')
    expect(reserveRepo.items[0]?.characterId).toBe(CHAR_ID)
  })

  it('throws FormNotFoundError when form does not exist', async () => {
    await expect(
      sut.execute({ formId: 'non-existent', bossId: BOSS_ID, itemId: ITEM_ID, userId: USER_ID })
    ).rejects.toThrow(FormNotFoundError)
  })

  it('throws FormClosedError when form is expired', async () => {
    const expired = ReservationForm.reconstitue({
      id: 'form-expired',
      weekOf: WEEK_OF,
      opensAt: new Date('2026-03-12T00:00:00.000Z'),
      closesAt: new Date(Date.now() - 1000),
      status: 'OPEN',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await formRepo.save(expired)

    await expect(
      sut.execute({ formId: 'form-expired', bossId: BOSS_ID, itemId: ITEM_ID, userId: USER_ID })
    ).rejects.toThrow(FormClosedError)
  })

  it('throws FormClosedError when form status is CLOSED', async () => {
    const closed = ReservationForm.reconstitue({
      id: 'form-closed',
      weekOf: WEEK_OF,
      opensAt: new Date('2026-03-12T00:00:00.000Z'),
      closesAt: CLOSES_AT,
      status: 'CLOSED',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await formRepo.save(closed)

    await expect(
      sut.execute({ formId: 'form-closed', bossId: BOSS_ID, itemId: ITEM_ID, userId: USER_ID })
    ).rejects.toThrow(FormClosedError)
  })

  it('throws NotAttendedError when source raid does not exist', async () => {
    // Remove source raid
    raidRepo.items = raidRepo.items.filter((r) => r.id.value !== sourceRaidId)

    await expect(
      sut.execute({ formId, bossId: BOSS_ID, itemId: ITEM_ID, userId: USER_ID })
    ).rejects.toThrow(NotAttendedError)
  })

  it('throws NotAttendedError when user was absent from source raid', async () => {
    attendanceRepo.items = attendanceRepo.items.map((a) =>
      RaidAttendance.reconstitue({
        id: a.id.value,
        raidId: a.raidId,
        userId: a.userId,
        characterId: a.characterId,
        attended: false,
        createdAt: a.createdAt,
        updatedAt: new Date(),
      })
    )

    await expect(
      sut.execute({ formId, bossId: BOSS_ID, itemId: ITEM_ID, userId: USER_ID })
    ).rejects.toThrow(NotAttendedError)
  })

  it('throws NotAttendedError when user has no attendance record', async () => {
    attendanceRepo.items = []

    await expect(
      sut.execute({ formId, bossId: BOSS_ID, itemId: ITEM_ID, userId: USER_ID })
    ).rejects.toThrow(NotAttendedError)
  })

  it('throws ItemNotFoundError when boss does not belong to target raid', async () => {
    const otherRaid = Raid.create({ date: new Date('2026-03-25T00:00:00.000Z'), status: 'OPEN', createdById: 'gm' })
    await raidRepo.save(otherRaid)
    await bossRepo.save(
      Boss.reconstitue({
        id: 'boss-other',
        raidId: otherRaid.id.value,
        name: 'Other Boss',
        orderIndex: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    )

    await expect(
      sut.execute({ formId, bossId: 'boss-other', itemId: ITEM_ID, userId: USER_ID })
    ).rejects.toThrow(ItemNotFoundError)
  })

  it('throws ItemNotFoundError when item does not belong to the given boss', async () => {
    const otherBoss = Boss.reconstitue({
      id: 'boss-2',
      raidId: targetRaidId,
      name: 'Other Boss',
      orderIndex: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await bossRepo.save(otherBoss)

    // ITEM_ID still belongs to BOSS_ID, not boss-2
    await expect(
      sut.execute({ formId, bossId: 'boss-2', itemId: ITEM_ID, userId: USER_ID })
    ).rejects.toThrow(ItemNotFoundError)
  })

  it('throws ItemNotFoundError when item does not exist', async () => {
    await expect(
      sut.execute({ formId, bossId: BOSS_ID, itemId: 'non-existent', userId: USER_ID })
    ).rejects.toThrow(ItemNotFoundError)
  })

  it('throws ReservationAlreadyExistsError when user already has an active reserve this week', async () => {
    await reserveRepo.save(
      Reserve.reconstitue({
        id: 'reserve-existing',
        raidId: targetRaidId,
        characterId: CHAR_ID,
        itemName: 'Some Other Item',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    )

    await expect(
      sut.execute({ formId, bossId: BOSS_ID, itemId: ITEM_ID, userId: USER_ID })
    ).rejects.toThrow(ReservationAlreadyExistsError)
  })

  it('throws NoActiveCharacterError when user has no active character', async () => {
    await characterRepo.save(
      Character.reconstitue({
        id: CHAR_ID,
        userId: USER_ID,
        name: 'Shadowmeld',
        class: 'DRUID',
        spec: 'Balance',
        realm: 'Azralon',
        isActive: false, // deactivated
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    )

    await expect(
      sut.execute({ formId, bossId: BOSS_ID, itemId: ITEM_ID, userId: USER_ID })
    ).rejects.toThrow(NoActiveCharacterError)
  })
})
