import { describe, it, expect, beforeEach } from 'vitest'
import { CancelReserveUseCase } from './CancelReserveUseCase.js'
import { InMemoryReserveRepository } from '../../../../tests/_shared/InMemoryReserveRepository.js'
import { Reserve } from '../../../domain/reserve/entities/Reserve.js'

describe('CancelReserveUseCase', () => {
  let reserveRepo: InMemoryReserveRepository
  let sut: CancelReserveUseCase

  beforeEach(() => {
    reserveRepo = new InMemoryReserveRepository()
    sut = new CancelReserveUseCase(reserveRepo)
  })

  it('should cancel an active reserve', async () => {
    const reserve = Reserve.create({
      raidId: 'raid-1',
      characterId: 'char-1',
      itemName: 'Spellfire Longsword',
    })
    await reserveRepo.save(reserve)

    const output = await sut.execute({ reserveId: reserve.id.value })

    expect(output.status).toBe('CANCELLED')
    expect(reserveRepo.items[0]?.status).toBe('CANCELLED')
  })

  it('should throw when reserve does not exist', async () => {
    await expect(
      sut.execute({ reserveId: 'non-existent' })
    ).rejects.toThrow('Reserve not found')
  })

  it('should throw when trying to cancel a non-active reserve', async () => {
    const reserve = Reserve.create({
      raidId: 'raid-1',
      characterId: 'char-1',
      itemName: 'Some Item',
    })
    reserve.cancel()
    await reserveRepo.save(reserve)

    await expect(
      sut.execute({ reserveId: reserve.id.value })
    ).rejects.toThrow('Only ACTIVE reserves can be cancelled')
  })
})
