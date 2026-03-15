import { describe, it, expect, beforeEach } from 'vitest'
import {
  CreateBossUseCase,
  RaidNotFoundError,
  BossOrderIndexAlreadyTakenError,
} from './CreateBossUseCase.js'
import { InMemoryBossRepository } from '../../../../tests/_shared/InMemoryBossRepository.js'
import { InMemoryRaidRepository } from '../../../../tests/_shared/InMemoryRaidRepository.js'
import { Raid } from '../../../domain/raid/entities/Raid.js'

const CREATOR_ID = 'user-1'

function makeRaid(): Raid {
  return Raid.create({
    date: new Date('2025-01-08T00:00:00.000Z'),
    status: 'OPEN',
    createdById: CREATOR_ID,
  })
}

describe('CreateBossUseCase', () => {
  let bossRepo: InMemoryBossRepository
  let raidRepo: InMemoryRaidRepository
  let sut: CreateBossUseCase
  let raidId: string

  beforeEach(async () => {
    bossRepo = new InMemoryBossRepository()
    raidRepo = new InMemoryRaidRepository()
    sut = new CreateBossUseCase(bossRepo, raidRepo)

    const raid = makeRaid()
    await raidRepo.save(raid)
    raidId = raid.id.value
  })

  it('should create a boss linked to the raid', async () => {
    const output = await sut.execute({ raidId, name: 'Ulgrax', orderIndex: 1 })

    expect(output.bossId).toBeDefined()
    expect(output.raidId).toBe(raidId)
    expect(output.name).toBe('Ulgrax')
    expect(output.orderIndex).toBe(1)
    expect(bossRepo.items).toHaveLength(1)
  })

  it('should allow multiple bosses with different order indexes in the same raid', async () => {
    await sut.execute({ raidId, name: 'Ulgrax', orderIndex: 1 })
    await sut.execute({ raidId, name: 'The Bloodbound Horror', orderIndex: 2 })

    expect(bossRepo.items).toHaveLength(2)
  })

  it('should throw RaidNotFoundError when raid does not exist', async () => {
    await expect(
      sut.execute({ raidId: 'non-existent', name: 'Ulgrax', orderIndex: 1 })
    ).rejects.toThrow(RaidNotFoundError)
  })

  it('should throw BossOrderIndexAlreadyTakenError for duplicate order_index in same raid', async () => {
    await sut.execute({ raidId, name: 'Ulgrax', orderIndex: 1 })

    await expect(
      sut.execute({ raidId, name: 'Other Boss', orderIndex: 1 })
    ).rejects.toThrow(BossOrderIndexAlreadyTakenError)
  })

  it('should allow the same order_index in different raids', async () => {
    const raid2 = Raid.create({
      date: new Date('2025-01-15T00:00:00.000Z'),
      status: 'OPEN',
      createdById: CREATOR_ID,
    })
    await raidRepo.save(raid2)

    await sut.execute({ raidId, name: 'Ulgrax', orderIndex: 1 })
    await sut.execute({ raidId: raid2.id.value, name: 'Ulgrax', orderIndex: 1 })

    expect(bossRepo.items).toHaveLength(2)
  })

  it('should throw when name is empty', async () => {
    await expect(
      sut.execute({ raidId, name: '', orderIndex: 1 })
    ).rejects.toThrow('Boss name cannot be empty')
  })

  it('should throw when orderIndex is zero', async () => {
    await expect(
      sut.execute({ raidId, name: 'Boss', orderIndex: 0 })
    ).rejects.toThrow('Boss orderIndex must be a positive integer')
  })

  it('should throw when orderIndex is negative', async () => {
    await expect(
      sut.execute({ raidId, name: 'Boss', orderIndex: -1 })
    ).rejects.toThrow('Boss orderIndex must be a positive integer')
  })
})
