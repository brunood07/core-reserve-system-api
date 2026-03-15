import { describe, it, expect, beforeEach } from 'vitest'
import {
  CreateRaidUseCase,
  RaidNotOnWednesdayError,
  RaidDateAlreadyTakenError,
} from './CreateRaidUseCase.js'
import { InMemoryRaidRepository } from '../../../../tests/_shared/InMemoryRaidRepository.js'

// 2025-01-08 is a Wednesday (UTC)
const WEDNESDAY = new Date('2025-01-08T00:00:00.000Z')
// 2025-01-09 is a Thursday
const THURSDAY = new Date('2025-01-09T00:00:00.000Z')

const CREATOR_ID = 'user-1'

describe('CreateRaidUseCase', () => {
  let raidRepo: InMemoryRaidRepository
  let sut: CreateRaidUseCase

  beforeEach(() => {
    raidRepo = new InMemoryRaidRepository()
    sut = new CreateRaidUseCase(raidRepo)
  })

  it('should create a raid on a Wednesday', async () => {
    const output = await sut.execute({
      date: WEDNESDAY,
      status: 'OPEN',
      createdById: CREATOR_ID,
    })

    expect(output.raidId).toBeDefined()
    expect(output.date).toEqual(WEDNESDAY)
    expect(output.status).toBe('OPEN')
    expect(output.createdById).toBe(CREATOR_ID)
    expect(output.description).toBeNull()
    expect(raidRepo.items).toHaveLength(1)
  })

  it('should store the optional description', async () => {
    const output = await sut.execute({
      date: WEDNESDAY,
      description: 'First clear attempt',
      status: 'DRAFT',
      createdById: CREATOR_ID,
    })

    expect(output.description).toBe('First clear attempt')
  })

  it('should throw RaidNotOnWednesdayError for a non-Wednesday date', async () => {
    await expect(
      sut.execute({ date: THURSDAY, status: 'OPEN', createdById: CREATOR_ID })
    ).rejects.toThrow(RaidNotOnWednesdayError)
  })

  it('should throw RaidNotOnWednesdayError with the correct message', async () => {
    await expect(
      sut.execute({ date: THURSDAY, status: 'OPEN', createdById: CREATOR_ID })
    ).rejects.toThrow('A data da raid deve ser uma quarta-feira')
  })

  it('should throw RaidDateAlreadyTakenError when another raid exists on the same date', async () => {
    await sut.execute({ date: WEDNESDAY, status: 'OPEN', createdById: CREATOR_ID })

    await expect(
      sut.execute({ date: WEDNESDAY, status: 'DRAFT', createdById: CREATOR_ID })
    ).rejects.toThrow(RaidDateAlreadyTakenError)
  })

  it('should throw RaidNotOnWednesdayError for invalid status', async () => {
    await expect(
      sut.execute({ date: WEDNESDAY, status: 'INVALID' as never, createdById: CREATOR_ID })
    ).rejects.toThrow('Invalid RaidStatus')
  })
})
