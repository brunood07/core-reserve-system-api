import { describe, it, expect, beforeEach } from 'vitest'
import { CreateRaidUseCase } from './CreateRaidUseCase.js'
import { InMemoryRaidRepository } from '../../../../tests/_shared/InMemoryRaidRepository.js'

describe('CreateRaidUseCase', () => {
  let raidRepo: InMemoryRaidRepository
  let sut: CreateRaidUseCase

  beforeEach(() => {
    raidRepo = new InMemoryRaidRepository()
    sut = new CreateRaidUseCase(raidRepo)
  })

  it('should create a raid successfully', async () => {
    const output = await sut.execute({
      name: "Nerub'ar Palace",
      difficulty: 'MYTHIC',
      maxSlots: 20,
    })

    expect(output.raidId).toBeDefined()
    expect(output.name).toBe("Nerub'ar Palace")
    expect(output.difficulty).toBe('MYTHIC')
    expect(output.maxSlots).toBe(20)
    expect(raidRepo.items).toHaveLength(1)
  })

  it('should throw when raid name already exists', async () => {
    await sut.execute({ name: 'Amirdrassil', difficulty: 'HEROIC', maxSlots: 20 })

    await expect(
      sut.execute({ name: 'Amirdrassil', difficulty: 'NORMAL', maxSlots: 25 })
    ).rejects.toThrow('already exists')
  })

  it('should throw when difficulty is invalid', async () => {
    await expect(
      sut.execute({ name: 'Some Raid', difficulty: 'INVALID' as never, maxSlots: 20 })
    ).rejects.toThrow('Invalid RaidDifficulty')
  })

  it('should throw when name is empty', async () => {
    await expect(
      sut.execute({ name: '', difficulty: 'NORMAL', maxSlots: 20 })
    ).rejects.toThrow('RaidName cannot be empty')
  })
})
