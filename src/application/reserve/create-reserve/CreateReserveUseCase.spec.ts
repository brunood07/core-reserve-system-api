import { describe, it, expect, beforeEach } from 'vitest'
import { CreateReserveUseCase } from './CreateReserveUseCase.js'
import { InMemoryReserveRepository } from '../../../../tests/_shared/InMemoryReserveRepository.js'
import { InMemoryRaidRepository } from '../../../../tests/_shared/InMemoryRaidRepository.js'
import { InMemoryCharacterRepository } from '../../../../tests/_shared/InMemoryCharacterRepository.js'
import { Raid } from '../../../domain/raid/entities/Raid.js'
import { Character } from '../../../domain/character/entities/Character.js'

describe('CreateReserveUseCase', () => {
  let reserveRepo: InMemoryReserveRepository
  let raidRepo: InMemoryRaidRepository
  let characterRepo: InMemoryCharacterRepository
  let sut: CreateReserveUseCase

  let raidId: string
  let characterId: string

  beforeEach(async () => {
    reserveRepo = new InMemoryReserveRepository()
    raidRepo = new InMemoryRaidRepository()
    characterRepo = new InMemoryCharacterRepository()
    sut = new CreateReserveUseCase(reserveRepo, raidRepo, characterRepo)

    const raid = Raid.create({ name: "Nerub'ar Palace", difficulty: 'MYTHIC', maxSlots: 20 })
    await raidRepo.save(raid)
    raidId = raid.id.value

    const character = Character.create({
      userId: 'user-1',
      name: 'Vareniel',
      class: 'MAGE',
      spec: 'Frost',
      realm: 'Azralon',
      isActive: true,
    })
    await characterRepo.save(character)
    characterId = character.id.value
  })

  it('should create a reserve successfully', async () => {
    const output = await sut.execute({ raidId, characterId, itemName: 'Spellfire Longsword' })

    expect(output.reserveId).toBeDefined()
    expect(output.status).toBe('ACTIVE')
    expect(output.itemName).toBe('Spellfire Longsword')
    expect(reserveRepo.items).toHaveLength(1)
  })

  it('should throw when raid does not exist', async () => {
    await expect(
      sut.execute({ raidId: 'non-existent', characterId, itemName: 'Some Item' })
    ).rejects.toThrow('Raid not found')
  })

  it('should throw when character does not exist', async () => {
    await expect(
      sut.execute({ raidId, characterId: 'non-existent', itemName: 'Some Item' })
    ).rejects.toThrow('Character not found')
  })

  it('should throw when character already reserved the same item', async () => {
    await sut.execute({ raidId, characterId, itemName: 'Spellfire Longsword' })

    await expect(
      sut.execute({ raidId, characterId, itemName: 'Spellfire Longsword' })
    ).rejects.toThrow('already has an active reserve')
  })

  it('should throw when character exceeds max reserves (2)', async () => {
    await sut.execute({ raidId, characterId, itemName: 'Item A' })
    await sut.execute({ raidId, characterId, itemName: 'Item B' })

    await expect(
      sut.execute({ raidId, characterId, itemName: 'Item C' })
    ).rejects.toThrow('reached the maximum number of reserves')
  })
})
