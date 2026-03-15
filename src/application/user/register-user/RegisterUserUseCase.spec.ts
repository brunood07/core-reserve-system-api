import { describe, it, expect, beforeEach } from 'vitest'
import bcrypt from 'bcrypt'
import { RegisterUserUseCase, EmailAlreadyInUseError } from './RegisterUserUseCase.js'
import { InMemoryUserRepository } from '../../../../tests/_shared/InMemoryUserRepository.js'
import { User } from '../../../domain/user/entities/User.js'

describe('RegisterUserUseCase', () => {
  let userRepo: InMemoryUserRepository
  let sut: RegisterUserUseCase

  beforeEach(() => {
    userRepo = new InMemoryUserRepository()
    sut = new RegisterUserUseCase(userRepo)
  })

  it('should register a user and hash the password', async () => {
    const output = await sut.execute({
      name: 'Vareniel',
      email: 'vareniel@guild.com',
      password: 'strongpassword123',
    })

    expect(output.userId).toBeDefined()
    expect(userRepo.items).toHaveLength(1)

    const saved = userRepo.items[0]!
    expect(saved.email).toBe('vareniel@guild.com')
    expect(saved.role).toBe('PLAYER')
    expect(saved.passwordHash).not.toBe('strongpassword123')
    const hashMatches = await bcrypt.compare('strongpassword123', saved.passwordHash)
    expect(hashMatches).toBe(true)
  })

  it('should normalize the email to lowercase', async () => {
    await sut.execute({ name: 'Vareniel', email: 'VARENIEL@Guild.COM', password: 'pass123' })
    expect(userRepo.items[0]?.email).toBe('vareniel@guild.com')
  })

  it('should throw EmailAlreadyInUseError when email is taken', async () => {
    await sut.execute({ name: 'Vareniel', email: 'vareniel@guild.com', password: 'pass123' })

    await expect(
      sut.execute({ name: 'Other', email: 'vareniel@guild.com', password: 'other123' })
    ).rejects.toThrow(EmailAlreadyInUseError)
  })

  it('should fire a UserRegistered domain event', async () => {
    const output = await sut.execute({
      name: 'Vareniel',
      email: 'vareniel@guild.com',
      password: 'pass123',
    })

    const saved = userRepo.items.find((u) => u.id.value === output.userId)!
    expect(saved.domainEvents[0]?.eventName).toBe('UserRegistered')
  })
})
