import { describe, it, expect, beforeEach } from 'vitest'
import { ListItemsUseCase, BossNotFoundError } from './ListItemsUseCase.js'
import { InMemoryItemRepository } from '../../../../tests/_shared/InMemoryItemRepository.js'
import { InMemoryBossRepository } from '../../../../tests/_shared/InMemoryBossRepository.js'
import { Boss } from '../../../domain/boss/entities/Boss.js'
import { Item } from '../../../domain/item/entities/Item.js'

function makeBoss(): Boss {
  return Boss.create({ raidId: 'raid-1', name: 'Ulgrax', orderIndex: 1 })
}

function makeItem(bossId: string, overrides: Partial<{ name: string; ilvl: number }> = {}): Item {
  return Item.create({
    bossId,
    name: overrides.name ?? 'Test Item',
    itemType: 'TRINKET',
    ilvl: overrides.ilvl ?? 610,
  })
}

describe('ListItemsUseCase', () => {
  let itemRepo: InMemoryItemRepository
  let bossRepo: InMemoryBossRepository
  let sut: ListItemsUseCase
  let bossId: string

  beforeEach(async () => {
    itemRepo = new InMemoryItemRepository()
    bossRepo = new InMemoryBossRepository()
    sut = new ListItemsUseCase(itemRepo, bossRepo)

    const boss = makeBoss()
    await bossRepo.save(boss)
    bossId = boss.id.value
  })

  it('should return all items for a boss', async () => {
    await itemRepo.save(makeItem(bossId, { name: 'Item A' }))
    await itemRepo.save(makeItem(bossId, { name: 'Item B' }))

    const output = await sut.execute({ bossId })

    expect(output.items).toHaveLength(2)
    expect(output.items.map((i) => i.name)).toEqual(
      expect.arrayContaining(['Item A', 'Item B'])
    )
  })

  it('should return only id, name, itemType, ilvl per item', async () => {
    await itemRepo.save(makeItem(bossId))

    const output = await sut.execute({ bossId })
    const item = output.items[0]!

    expect(item).toHaveProperty('id')
    expect(item).toHaveProperty('name')
    expect(item).toHaveProperty('itemType')
    expect(item).toHaveProperty('ilvl')
    expect(item).not.toHaveProperty('bossId')
    expect(item).not.toHaveProperty('createdAt')
  })

  it('should return an empty array when boss has no items', async () => {
    const output = await sut.execute({ bossId })
    expect(output.items).toHaveLength(0)
  })

  it('should not return items from other bosses', async () => {
    const otherBoss = Boss.create({ raidId: 'raid-1', name: 'Other Boss', orderIndex: 2 })
    await bossRepo.save(otherBoss)
    await itemRepo.save(makeItem(otherBoss.id.value, { name: 'Other Item' }))

    const output = await sut.execute({ bossId })

    expect(output.items).toHaveLength(0)
  })

  it('should throw BossNotFoundError when boss does not exist', async () => {
    await expect(sut.execute({ bossId: 'non-existent' })).rejects.toThrow(BossNotFoundError)
  })
})
