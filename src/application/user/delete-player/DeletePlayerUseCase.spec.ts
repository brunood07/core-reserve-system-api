import { describe, it, expect, beforeEach } from 'vitest'
import { DeletePlayerUseCase, PlayerNotFoundError } from './DeletePlayerUseCase.js'
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

describe('DeletePlayerUseCase', () => {
  let repo: InMemoryUserRepository
  let sut: DeletePlayerUseCase

  beforeEach(() => {
    repo = new InMemoryUserRepository()
    sut = new DeletePlayerUseCase(repo)
  })

  it('should soft-delete the player', async () => {
    const player = makePlayer()
    await repo.save(player)

    const output = await sut.execute({ playerId: player.id.value })

    expect(output.message).toBe('Jogador removido')

    const saved = await repo.findById(player.id)
    expect(saved?.isDeleted).toBe(true)
    expect(saved?.deletedAt).toBeInstanceOf(Date)
  })

  it('should throw PlayerNotFoundError when player does not exist', async () => {
    await expect(sut.execute({ playerId: 'non-existent' })).rejects.toThrow(PlayerNotFoundError)
  })

  it('should throw PlayerNotFoundError when already soft-deleted', async () => {
    const player = makePlayer()
    player.softDelete()
    await repo.save(player)

    await expect(sut.execute({ playerId: player.id.value })).rejects.toThrow(PlayerNotFoundError)
  })
})
