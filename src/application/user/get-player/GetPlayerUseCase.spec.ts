import { describe, it, expect, beforeEach } from 'vitest'
import { GetPlayerUseCase, PlayerNotFoundError } from './GetPlayerUseCase.js'
import { InMemoryUserRepository } from '../../../../tests/_shared/InMemoryUserRepository.js'
import { User } from '../../../domain/user/entities/User.js'

function makePlayer(): User {
  return User.reconstitue({
    id: crypto.randomUUID(),
    name: 'Vareniel',
    email: 'vareniel@example.com',
    passwordHash: 'hash',
    role: 'PLAYER',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
}

describe('GetPlayerUseCase', () => {
  let repo: InMemoryUserRepository
  let sut: GetPlayerUseCase

  beforeEach(() => {
    repo = new InMemoryUserRepository()
    sut = new GetPlayerUseCase(repo)
  })

  it('should return player details', async () => {
    const player = makePlayer()
    await repo.save(player)

    const output = await sut.execute({ playerId: player.id.value })

    expect(output.id).toBe(player.id.value)
    expect(output.name).toBe('Vareniel')
    expect(output.characters).toEqual([])
    expect(output.recentAttendances).toEqual([])
  })

  it('should throw PlayerNotFoundError when player does not exist', async () => {
    await expect(sut.execute({ playerId: 'non-existent' })).rejects.toThrow(PlayerNotFoundError)
  })

  it('should throw PlayerNotFoundError for soft-deleted players', async () => {
    const player = makePlayer()
    player.softDelete()
    await repo.save(player)

    await expect(sut.execute({ playerId: player.id.value })).rejects.toThrow(PlayerNotFoundError)
  })
})
