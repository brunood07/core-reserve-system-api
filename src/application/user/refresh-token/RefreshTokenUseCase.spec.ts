import { describe, it, expect, beforeEach } from 'vitest'
import { RefreshTokenUseCase, InvalidRefreshTokenError } from './RefreshTokenUseCase.js'
import { InMemoryUserRepository } from '../../../../tests/_shared/InMemoryUserRepository.js'
import { FakeTokenService } from '../../../../tests/_shared/FakeTokenService.js'
import { FakeRefreshTokenStore } from '../../../../tests/_shared/FakeRefreshTokenStore.js'
import { User } from '../../../domain/user/entities/User.js'

describe('RefreshTokenUseCase', () => {
  let userRepo: InMemoryUserRepository
  let tokenService: FakeTokenService
  let tokenStore: FakeRefreshTokenStore
  let sut: RefreshTokenUseCase

  let userId: string
  const validRefreshToken = 'fake-refresh-user-1'

  beforeEach(async () => {
    userRepo = new InMemoryUserRepository()
    tokenService = new FakeTokenService()
    tokenStore = new FakeRefreshTokenStore()
    sut = new RefreshTokenUseCase(userRepo, tokenService, tokenStore)

    const user = User.create({
      name: 'Vareniel',
      email: 'vareniel@guild.com',
      passwordHash: 'hashed',
    })
    userId = user.id.value
    await userRepo.save(user)

    // Simula token armazenado após login
    await tokenStore.save(userId, `fake-refresh-${userId}`, 604800)
  })

  it('should return a new access token for a valid refresh token', async () => {
    const output = await sut.execute({ refreshToken: `fake-refresh-${userId}` })

    expect(output.accessToken).toBe(`fake-access-${userId}`)
  })

  it('should throw when the JWT signature is invalid', async () => {
    await expect(
      sut.execute({ refreshToken: 'invalid-token' })
    ).rejects.toThrow(InvalidRefreshTokenError)
  })

  it('should throw when the token is not found in the store (logged out)', async () => {
    await tokenStore.delete(userId)

    await expect(
      sut.execute({ refreshToken: `fake-refresh-${userId}` })
    ).rejects.toThrow(InvalidRefreshTokenError)
  })

  it('should throw when the token does not match the stored one (token reuse)', async () => {
    await expect(
      sut.execute({ refreshToken: `fake-refresh-${userId}-stale` })
    ).rejects.toThrow(InvalidRefreshTokenError)
  })

  it('should throw when the user no longer exists', async () => {
    userRepo.items = []

    await expect(
      sut.execute({ refreshToken: `fake-refresh-${userId}` })
    ).rejects.toThrow(InvalidRefreshTokenError)
  })
})
