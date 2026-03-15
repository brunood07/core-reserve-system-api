import { describe, it, expect, beforeEach } from 'vitest'
import { LogoutUseCase } from './LogoutUseCase.js'
import { FakeRefreshTokenStore } from '../../../../tests/_shared/FakeRefreshTokenStore.js'

describe('LogoutUseCase', () => {
  let tokenStore: FakeRefreshTokenStore
  let sut: LogoutUseCase

  beforeEach(async () => {
    tokenStore = new FakeRefreshTokenStore()
    sut = new LogoutUseCase(tokenStore)

    await tokenStore.save('user-1', 'fake-refresh-user-1', 604800)
  })

  it('should remove the refresh token from the store', async () => {
    await sut.execute({ userId: 'user-1' })

    const stored = await tokenStore.get('user-1')
    expect(stored).toBeNull()
  })

  it('should be idempotent when called for a user with no token', async () => {
    await expect(sut.execute({ userId: 'user-without-token' })).resolves.not.toThrow()
  })
})
