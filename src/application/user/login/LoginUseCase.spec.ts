import { describe, it, expect, beforeEach } from 'vitest'
import { LoginUseCase, InvalidCredentialsError } from './LoginUseCase.js'
import { RegisterUserUseCase } from '../register-user/RegisterUserUseCase.js'
import { InMemoryUserRepository } from '../../../../tests/_shared/InMemoryUserRepository.js'
import { FakeTokenService } from '../../../../tests/_shared/FakeTokenService.js'
import { FakeRefreshTokenStore } from '../../../../tests/_shared/FakeRefreshTokenStore.js'

describe('LoginUseCase', () => {
  let userRepo: InMemoryUserRepository
  let tokenService: FakeTokenService
  let tokenStore: FakeRefreshTokenStore
  let sut: LoginUseCase

  beforeEach(async () => {
    userRepo = new InMemoryUserRepository()
    tokenService = new FakeTokenService()
    tokenStore = new FakeRefreshTokenStore()
    sut = new LoginUseCase(userRepo, tokenService, tokenStore)

    // Cria usuário via RegisterUserUseCase para garantir hash correto
    await new RegisterUserUseCase(userRepo).execute({
      name: 'Vareniel',
      email: 'vareniel@guild.com',
      password: 'strongpassword123',
    })
  })

  it('should return tokens and user data on valid credentials', async () => {
    const output = await sut.execute({
      email: 'vareniel@guild.com',
      password: 'strongpassword123',
    })

    expect(output.accessToken).toBeDefined()
    expect(output.refreshToken).toBeDefined()
    expect(output.user.email).toBe('vareniel@guild.com')
    expect(output.user.role).toBe('PLAYER')
    expect(output.user).not.toHaveProperty('passwordHash')
  })

  it('should store the refresh token in the store', async () => {
    const output = await sut.execute({
      email: 'vareniel@guild.com',
      password: 'strongpassword123',
    })

    const stored = await tokenStore.get(output.user.id)
    expect(stored).toBe(output.refreshToken)
  })

  it('should throw InvalidCredentialsError for unknown email', async () => {
    await expect(
      sut.execute({ email: 'unknown@guild.com', password: 'strongpassword123' })
    ).rejects.toThrow(InvalidCredentialsError)
  })

  it('should throw InvalidCredentialsError for wrong password', async () => {
    await expect(
      sut.execute({ email: 'vareniel@guild.com', password: 'wrongpassword' })
    ).rejects.toThrow(InvalidCredentialsError)
  })

  it('should throw the same error for wrong email and wrong password (no user enumeration)', async () => {
    const wrongEmail = sut.execute({ email: 'nobody@guild.com', password: 'any' })
    const wrongPass = sut.execute({ email: 'vareniel@guild.com', password: 'wrong' })

    const [errA, errB] = await Promise.all([
      wrongEmail.catch((e) => e),
      wrongPass.catch((e) => e),
    ])

    expect(errA).toBeInstanceOf(InvalidCredentialsError)
    expect(errB).toBeInstanceOf(InvalidCredentialsError)
    expect(errA.message).toBe(errB.message)
  })
})
