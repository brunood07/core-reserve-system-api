import { describe, it, expect, beforeEach } from 'vitest'
import { ListPlayersUseCase } from './ListPlayersUseCase.js'
import { InMemoryUserRepository } from '../../../../tests/_shared/InMemoryUserRepository.js'
import { User } from '../../../domain/user/entities/User.js'

function makePlayer(overrides: Partial<{ name: string; email: string }> = {}): User {
  return User.reconstitue({
    id: crypto.randomUUID(),
    name: overrides.name ?? 'Player One',
    email: overrides.email ?? `player${Math.random()}@example.com`,
    passwordHash: 'hash',
    role: 'PLAYER',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
}

function makeRaidLeader(): User {
  return User.reconstitue({
    id: crypto.randomUUID(),
    name: 'Raid Leader',
    email: 'rl@example.com',
    passwordHash: 'hash',
    role: 'RAID_LEADER',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
}

describe('ListPlayersUseCase', () => {
  let repo: InMemoryUserRepository
  let sut: ListPlayersUseCase

  beforeEach(() => {
    repo = new InMemoryUserRepository()
    sut = new ListPlayersUseCase(repo)
  })

  it('should return only PLAYER role users', async () => {
    await repo.save(makePlayer({ name: 'Alice' }))
    await repo.save(makePlayer({ name: 'Bob' }))
    await repo.save(makeRaidLeader())

    const output = await sut.execute({})

    expect(output.total).toBe(2)
    expect(output.players).toHaveLength(2)
    expect(output.players.every((p) => p.role === 'PLAYER')).toBe(true)
  })

  it('should not return soft-deleted players', async () => {
    const player = makePlayer({ name: 'DeletedPlayer' })
    player.softDelete()
    await repo.save(player)
    await repo.save(makePlayer({ name: 'ActivePlayer' }))

    const output = await sut.execute({})

    expect(output.total).toBe(1)
    expect(output.players[0]?.name).toBe('ActivePlayer')
  })

  it('should paginate results', async () => {
    for (let i = 0; i < 5; i++) {
      await repo.save(makePlayer({ name: `Player ${i}` }))
    }

    const page1 = await sut.execute({ page: 1, limit: 2 })
    const page2 = await sut.execute({ page: 2, limit: 2 })

    expect(page1.total).toBe(5)
    expect(page1.players).toHaveLength(2)
    expect(page2.players).toHaveLength(2)
  })

  it('should filter by search term', async () => {
    await repo.save(makePlayer({ name: 'Vareniel', email: 'vareniel@example.com' }))
    await repo.save(makePlayer({ name: 'Grixel', email: 'grixel@example.com' }))

    const output = await sut.execute({ search: 'Varen' })

    expect(output.total).toBe(1)
    expect(output.players[0]?.name).toBe('Vareniel')
  })

  it('should cap limit at 100', async () => {
    for (let i = 0; i < 5; i++) {
      await repo.save(makePlayer())
    }

    const output = await sut.execute({ limit: 999 })

    expect(output.players.length).toBeLessThanOrEqual(100)
  })
})
