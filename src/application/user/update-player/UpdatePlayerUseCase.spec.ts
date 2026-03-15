import { describe, it, expect, beforeEach } from 'vitest'
import {
  UpdatePlayerUseCase,
  PlayerNotFoundError,
  PlayerEmailAlreadyTakenError,
} from './UpdatePlayerUseCase.js'
import { InMemoryUserRepository } from '../../../../tests/_shared/InMemoryUserRepository.js'
import { User } from '../../../domain/user/entities/User.js'

function makePlayer(overrides: Partial<{ name: string; email: string }> = {}): User {
  return User.reconstitue({
    id: crypto.randomUUID(),
    name: overrides.name ?? 'Vareniel',
    email: overrides.email ?? 'vareniel@example.com',
    passwordHash: 'hash',
    role: 'PLAYER',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
}

describe('UpdatePlayerUseCase', () => {
  let repo: InMemoryUserRepository
  let sut: UpdatePlayerUseCase

  beforeEach(() => {
    repo = new InMemoryUserRepository()
    sut = new UpdatePlayerUseCase(repo)
  })

  it('should update player name', async () => {
    const player = makePlayer()
    await repo.save(player)

    const output = await sut.execute({ playerId: player.id.value, name: 'NewName' })

    expect(output.name).toBe('NewName')
    expect(output.email).toBe('vareniel@example.com')
  })

  it('should update player email', async () => {
    const player = makePlayer()
    await repo.save(player)

    const output = await sut.execute({ playerId: player.id.value, email: 'new@example.com' })

    expect(output.email).toBe('new@example.com')
  })

  it('should update player role', async () => {
    const player = makePlayer()
    await repo.save(player)

    const output = await sut.execute({ playerId: player.id.value, role: 'OFFICER' })

    expect(output.role).toBe('OFFICER')
  })

  it('should allow updating to the same email', async () => {
    const player = makePlayer({ email: 'vareniel@example.com' })
    await repo.save(player)

    const output = await sut.execute({
      playerId: player.id.value,
      email: 'vareniel@example.com',
    })

    expect(output.email).toBe('vareniel@example.com')
  })

  it('should throw PlayerEmailAlreadyTakenError when email is in use', async () => {
    const player1 = makePlayer({ email: 'taken@example.com' })
    const player2 = makePlayer({ email: 'other@example.com' })
    await repo.save(player1)
    await repo.save(player2)

    await expect(
      sut.execute({ playerId: player2.id.value, email: 'taken@example.com' })
    ).rejects.toThrow(PlayerEmailAlreadyTakenError)
  })

  it('should throw PlayerNotFoundError when player does not exist', async () => {
    await expect(sut.execute({ playerId: 'non-existent', name: 'X' })).rejects.toThrow(
      PlayerNotFoundError
    )
  })

  it('should throw PlayerNotFoundError for soft-deleted players', async () => {
    const player = makePlayer()
    player.softDelete()
    await repo.save(player)

    await expect(sut.execute({ playerId: player.id.value, name: 'X' })).rejects.toThrow(
      PlayerNotFoundError
    )
  })
})
