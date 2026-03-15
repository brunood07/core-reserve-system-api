import { describe, it, expect, beforeEach } from 'vitest'
import {
  DeleteReservationUseCase,
  ReserveNotFoundError,
  ReserveNotInOpenFormError,
  ForbiddenError,
} from './DeleteReservationUseCase.js'
import { InMemoryReserveRepository } from '../../../../tests/_shared/InMemoryReserveRepository.js'
import { InMemoryReservationFormRepository } from '../../../../tests/_shared/InMemoryReservationFormRepository.js'
import { InMemoryRaidRepository } from '../../../../tests/_shared/InMemoryRaidRepository.js'
import { InMemoryCharacterRepository } from '../../../../tests/_shared/InMemoryCharacterRepository.js'
import { Reserve } from '../../../domain/reserve/entities/Reserve.js'
import { ReservationForm } from '../../../domain/reservation-form/entities/ReservationForm.js'
import { Raid } from '../../../domain/raid/entities/Raid.js'
import { Character } from '../../../domain/character/entities/Character.js'

const WEEK_OF = new Date('2026-03-18T00:00:00.000Z')
const CLOSES_AT = new Date('2026-03-18T01:00:00.000Z')

const OWNER_USER_ID = 'user-owner'
const OTHER_USER_ID = 'user-other'
const CHAR_ID = 'char-1'

describe('DeleteReservationUseCase', () => {
  let reserveRepo: InMemoryReserveRepository
  let formRepo: InMemoryReservationFormRepository
  let raidRepo: InMemoryRaidRepository
  let characterRepo: InMemoryCharacterRepository
  let sut: DeleteReservationUseCase

  let reserveId: string
  let targetRaidId: string

  beforeEach(async () => {
    reserveRepo = new InMemoryReserveRepository()
    formRepo = new InMemoryReservationFormRepository()
    raidRepo = new InMemoryRaidRepository()
    characterRepo = new InMemoryCharacterRepository()

    sut = new DeleteReservationUseCase(reserveRepo, formRepo, raidRepo, characterRepo)

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

    // Active reserve belonging to owner's character
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

  it('deletes the reserve and returns success message', async () => {
    const output = await sut.execute({
      reserveId,
      requestingUserId: OWNER_USER_ID,
      requestingUserRole: 'PLAYER',
    })

    expect(output.message).toBe('Reserva cancelada com sucesso')
    expect(reserveRepo.items).toHaveLength(0)
  })

  it('allows RAID_LEADER to delete another users reserve', async () => {
    const output = await sut.execute({
      reserveId,
      requestingUserId: OTHER_USER_ID,
      requestingUserRole: 'RAID_LEADER',
    })

    expect(output.message).toBe('Reserva cancelada com sucesso')
    expect(reserveRepo.items).toHaveLength(0)
  })

  it('allows OFFICER to delete another users reserve', async () => {
    await sut.execute({
      reserveId,
      requestingUserId: OTHER_USER_ID,
      requestingUserRole: 'OFFICER',
    })

    expect(reserveRepo.items).toHaveLength(0)
  })

  it('throws ReserveNotFoundError when reserve does not exist', async () => {
    await expect(
      sut.execute({ reserveId: 'non-existent', requestingUserId: OWNER_USER_ID, requestingUserRole: 'PLAYER' })
    ).rejects.toThrow(ReserveNotFoundError)
  })

  it('throws ReserveNotFoundError when reserve is already cancelled', async () => {
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
      sut.execute({ reserveId: 'reserve-cancelled', requestingUserId: OWNER_USER_ID, requestingUserRole: 'PLAYER' })
    ).rejects.toThrow(ReserveNotFoundError)
  })

  it('throws ReserveNotInOpenFormError when no open form exists', async () => {
    formRepo.items = []

    await expect(
      sut.execute({ reserveId, requestingUserId: OWNER_USER_ID, requestingUserRole: 'PLAYER' })
    ).rejects.toThrow(ReserveNotInOpenFormError)
  })

  it('throws ReserveNotInOpenFormError when reserve belongs to a different raid', async () => {
    const otherRaid = Raid.create({ date: new Date('2026-03-25T00:00:00.000Z'), status: 'OPEN', createdById: 'gm' })
    await raidRepo.save(otherRaid)

    const staleReserve = Reserve.reconstitue({
      id: 'reserve-stale',
      raidId: otherRaid.id.value,
      characterId: CHAR_ID,
      itemName: 'Old Helmet',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await reserveRepo.save(staleReserve)

    await expect(
      sut.execute({ reserveId: 'reserve-stale', requestingUserId: OWNER_USER_ID, requestingUserRole: 'PLAYER' })
    ).rejects.toThrow(ReserveNotInOpenFormError)
  })

  it('throws ForbiddenError when player tries to delete another users reserve', async () => {
    await expect(
      sut.execute({ reserveId, requestingUserId: OTHER_USER_ID, requestingUserRole: 'PLAYER' })
    ).rejects.toThrow(ForbiddenError)
  })
})
