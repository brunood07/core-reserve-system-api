import { describe, it, expect, beforeEach } from 'vitest'
import { CreateItemUseCase, BossNotFoundError } from './CreateItemUseCase.js'
import { InMemoryItemRepository } from '../../../../tests/_shared/InMemoryItemRepository.js'
import { InMemoryBossRepository } from '../../../../tests/_shared/InMemoryBossRepository.js'
import { Boss } from '../../../domain/boss/entities/Boss.js'

function makeBoss(): Boss {
  return Boss.create({ raidId: 'raid-1', name: 'Ulgrax', orderIndex: 1 })
}

describe('CreateItemUseCase', () => {
  let itemRepo: InMemoryItemRepository
  let bossRepo: InMemoryBossRepository
  let sut: CreateItemUseCase
  let bossId: string

  beforeEach(async () => {
    itemRepo = new InMemoryItemRepository()
    bossRepo = new InMemoryBossRepository()
    sut = new CreateItemUseCase(itemRepo, bossRepo)

    const boss = makeBoss()
    await bossRepo.save(boss)
    bossId = boss.id.value
  })

  it('should create an item linked to a boss', async () => {
    const output = await sut.execute({
      bossId,
      name: 'Ulgrax\'s Discarded Husk',
      itemType: 'TRINKET',
      ilvl: 626,
    })

    expect(output.itemId).toBeDefined()
    expect(output.bossId).toBe(bossId)
    expect(output.name).toBe('Ulgrax\'s Discarded Husk')
    expect(output.itemType).toBe('TRINKET')
    expect(output.ilvl).toBe(626)
    expect(itemRepo.items).toHaveLength(1)
  })

  it('should allow multiple items on the same boss', async () => {
    await sut.execute({ bossId, name: 'Item A', itemType: 'WEAPON', ilvl: 610 })
    await sut.execute({ bossId, name: 'Item B', itemType: 'HELM', ilvl: 610 })

    expect(itemRepo.items).toHaveLength(2)
  })

  it('should throw BossNotFoundError when boss does not exist', async () => {
    await expect(
      sut.execute({ bossId: 'non-existent', name: 'X', itemType: 'TRINKET', ilvl: 610 })
    ).rejects.toThrow(BossNotFoundError)
  })

  it('should throw when name is empty', async () => {
    await expect(
      sut.execute({ bossId, name: '', itemType: 'TRINKET', ilvl: 610 })
    ).rejects.toThrow('Item name cannot be empty')
  })

  it('should throw when ilvl is below 1', async () => {
    await expect(
      sut.execute({ bossId, name: 'X', itemType: 'TRINKET', ilvl: 0 })
    ).rejects.toThrow('ilvl must be an integer between 1 and 700')
  })

  it('should throw when ilvl exceeds 700', async () => {
    await expect(
      sut.execute({ bossId, name: 'X', itemType: 'TRINKET', ilvl: 701 })
    ).rejects.toThrow('ilvl must be an integer between 1 and 700')
  })

  it('should accept all valid item types', async () => {
    const types = [
      'HELM', 'SHOULDER', 'BACK', 'CHEST', 'WRIST', 'HANDS',
      'WAIST', 'LEGS', 'FEET', 'NECK', 'FINGER', 'TRINKET',
      'WEAPON', 'SHIELD', 'OFF_HAND',
    ] as const

    for (const itemType of types) {
      await sut.execute({ bossId, name: `Item ${itemType}`, itemType, ilvl: 600 })
    }

    expect(itemRepo.items).toHaveLength(types.length)
  })
})
