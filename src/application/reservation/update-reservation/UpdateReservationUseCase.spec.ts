import { describe, it, expect, beforeEach } from 'vitest'
import {
  UpdateReservationUseCase,
  ReserveNotFoundError,
  ReserveNotInOpenFormError,
  ForbiddenError,
  ItemNotFoundError,
} from './UpdateReservationUseCase.js'
import { InMemoryReserveRepository } from '../../../../tests/_shared/InMemoryReserveRepository.js'
import { InMemoryReservationFormRepository } from '../../../../tests/_shared/InMemoryReservationFormRepository.js'
import { InMemoryRaidRepository } from '../../../../tests/_shared/InMemoryRaidRepository.js'
import { InMemoryCharacterRepository } from '../../../../tests/_shared/InMemoryCharacterRepository.js'
import { InMemoryBossRepository } from '../../../../tests/_shared/InMemoryBossRepository.js'
import { InMemoryItemRepository } from '../../../../tests/_shared/InMemoryItemRepository.js'
import { Reserve } from '../../../domain/reserve/entities/Reserve.js'
import { ReservationForm } from '../../../domain/reservation-form/entities/ReservationForm.js'
import { Raid } from '../../../domain/raid/entities/Raid.js'
import { Character } from '../../../domain/character/entities/Character.js'
import { Boss } from '../../../domain/boss/entities/Boss.js'
import { Item } from '../../../domain/item/entities/Item.js'

const WEEK_OF = new Date('2026-03-18T00:00:00.000Z')
const CLOSES_AT = new Date('2026-03-18T01:00:00.000Z')

const OWNER_USER_ID = 'user-owner'
const OTHER_USER_ID = 'user-other'
const CHAR_ID = 'char-1'
const BOSS_ID = 'boss-1'
const ITEM_A_ID = 'item-a'
const ITEM_B_ID = 'item-b'

describe('UpdateReservationUseCase', () => {
  let reserveRepo: InMemoryReserveRepository
  let formRepo: InMemoryReservationFormRepository
  let raidRepo: InMemoryRaidRepository
  let characterRepo: InMemoryCharacterRepository
  let bossRepo: InMemoryBossRepository
  let itemRepo: InMemoryItemRepository
  let sut: UpdateReservationUseCase

  let reserveId: string
  let targetRaidId: string

  beforeEach(async () => {
    reserveRepo = new InMemoryReserveRepository()
    formRepo = new InMemoryReservationFormRepository()
    raidRepo = new InMemoryRaidRepository()
    characterRepo = new InMemoryCharacterRepository()
    bossRepo = new InMemoryBossRepository()
    itemRepo = new InMemoryItemRepository()

    sut = new UpdateReservationUseCase(
      reserveRepo, formRepo, raidRepo, characterRepo, bossRepo, itemRepo
    )

    // Open form
    await formRepo.save(
      ReservationForm.reconstitue({
        id: 'form-1',
        weekOf: WEEK_OF,
        opensAt: new Date('2026-03-12T00:00:00.000Z'),
        closesAt: CLOSES_AT,
        status: 'OPEN',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    )

    // Target raid
    const targetRaid = Raid.create({ date: WEEK_OF, status: 'OPEN', createdById: 'gm' })
    await raidRepo.save(targetRaid)
    targetRaidId = targetRaid.id.value

    // Owner's character
    await characterRepo.save(
      Character.reconstitue({
        id: CHAR_ID,
        userId: OWNER_USER_ID,
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

    // Two items on that boss
    await itemRepo.save(
      Item.reconstitue({
        id: ITEM_A_ID,
        bossId: BOSS_ID,
        name: 'Cursed Warlord Helmet',
        itemType: 'HELM',
        ilvl: 639,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    )
    await itemRepo.save(
      Item.reconstitue({
        id: ITEM_B_ID,
        bossId: BOSS_ID,
        name: 'Silken Court Chestpiece',
        itemType: 'CHEST',
        ilvl: 639,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    )

    // Active reserve with item A
    const reserve = Reserve.reconstitue({
      id: 'reserve-1',
      raidId: targetRaidId,
      characterId: CHAR_ID,
      itemName: 'Cursed Warlord Helmet',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await reserveRepo.save(reserve)
    reserveId = reserve.id.value
  })

  it('updates the reserve to the new item and returns enriched output', async () => {
    const output = await sut.execute({
      reserveId,
      bossId: BOSS_ID,
      itemId: ITEM_B_ID,
      requestingUserId: OWNER_USER_ID,
      requestingUserRole: 'PLAYER',
    })

    expect(output.itemName).toBe('Silken Court Chestpiece')
    expect(output.status).toBe('ACTIVE')
    expect(output.boss.id).toBe(BOSS_ID)
    expect(output.item.id).toBe(ITEM_B_ID)
    expect(output.item.itemType).toBe('CHEST')
  })

  it('persists the updated item name', async () => {
    await sut.execute({
      reserveId,
      bossId: BOSS_ID,
      itemId: ITEM_B_ID,
      requestingUserId: OWNER_USER_ID,
      requestingUserRole: 'PLAYER',
    })

    expect(reserveRepo.items[0]?.itemName).toBe('Silken Court Chestpiece')
  })

  it('allows RAID_LEADER to update another users reserve', async () => {
    const output = await sut.execute({
      reserveId,
      bossId: BOSS_ID,
      itemId: ITEM_B_ID,
      requestingUserId: OTHER_USER_ID,
      requestingUserRole: 'RAID_LEADER',
    })

    expect(output.itemName).toBe('Silken Court Chestpiece')
  })

  it('throws ReserveNotFoundError when reserve does not exist', async () => {
    await expect(
      sut.execute({ reserveId: 'non-existent', bossId: BOSS_ID, itemId: ITEM_B_ID, requestingUserId: OWNER_USER_ID, requestingUserRole: 'PLAYER' })
    ).rejects.toThrow(ReserveNotFoundError)
  })

  it('throws ReserveNotFoundError when reserve is cancelled', async () => {
    await reserveRepo.save(
      Reserve.reconstitue({
        id: 'reserve-cancelled',
        raidId: targetRaidId,
        characterId: CHAR_ID,
        itemName: 'Helmet',
        status: 'CANCELLED',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    )

    await expect(
      sut.execute({ reserveId: 'reserve-cancelled', bossId: BOSS_ID, itemId: ITEM_B_ID, requestingUserId: OWNER_USER_ID, requestingUserRole: 'PLAYER' })
    ).rejects.toThrow(ReserveNotFoundError)
  })

  it('throws ReserveNotInOpenFormError when no open form exists', async () => {
    formRepo.items = []

    await expect(
      sut.execute({ reserveId, bossId: BOSS_ID, itemId: ITEM_B_ID, requestingUserId: OWNER_USER_ID, requestingUserRole: 'PLAYER' })
    ).rejects.toThrow(ReserveNotInOpenFormError)
  })

  it('throws ReserveNotInOpenFormError when reserve belongs to a different raid', async () => {
    const otherRaid = Raid.create({ date: new Date('2026-03-25T00:00:00.000Z'), status: 'OPEN', createdById: 'gm' })
    await raidRepo.save(otherRaid)

    const staleReserve = Reserve.reconstitue({
      id: 'reserve-stale',
      raidId: otherRaid.id.value,
      characterId: CHAR_ID,
      itemName: 'Old Item',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await reserveRepo.save(staleReserve)

    await expect(
      sut.execute({ reserveId: 'reserve-stale', bossId: BOSS_ID, itemId: ITEM_B_ID, requestingUserId: OWNER_USER_ID, requestingUserRole: 'PLAYER' })
    ).rejects.toThrow(ReserveNotInOpenFormError)
  })

  it('throws ForbiddenError when player tries to update another users reserve', async () => {
    await expect(
      sut.execute({ reserveId, bossId: BOSS_ID, itemId: ITEM_B_ID, requestingUserId: OTHER_USER_ID, requestingUserRole: 'PLAYER' })
    ).rejects.toThrow(ForbiddenError)
  })

  it('throws ItemNotFoundError when boss does not belong to target raid', async () => {
    const otherRaid = Raid.create({ date: new Date('2026-03-25T00:00:00.000Z'), status: 'OPEN', createdById: 'gm' })
    await raidRepo.save(otherRaid)
    await bossRepo.save(
      Boss.reconstitue({
        id: 'boss-other',
        raidId: otherRaid.id.value,
        name: 'Wrong Boss',
        orderIndex: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    )

    await expect(
      sut.execute({ reserveId, bossId: 'boss-other', itemId: ITEM_B_ID, requestingUserId: OWNER_USER_ID, requestingUserRole: 'PLAYER' })
    ).rejects.toThrow(ItemNotFoundError)
  })

  it('throws ItemNotFoundError when item does not belong to the given boss', async () => {
    const boss2 = Boss.reconstitue({
      id: 'boss-2',
      raidId: targetRaidId,
      name: 'Second Boss',
      orderIndex: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await bossRepo.save(boss2)

    // ITEM_B_ID still belongs to BOSS_ID, not boss-2
    await expect(
      sut.execute({ reserveId, bossId: 'boss-2', itemId: ITEM_B_ID, requestingUserId: OWNER_USER_ID, requestingUserRole: 'PLAYER' })
    ).rejects.toThrow(ItemNotFoundError)
  })

  it('throws ItemNotFoundError when item does not exist', async () => {
    await expect(
      sut.execute({ reserveId, bossId: BOSS_ID, itemId: 'non-existent', requestingUserId: OWNER_USER_ID, requestingUserRole: 'PLAYER' })
    ).rejects.toThrow(ItemNotFoundError)
  })
})
