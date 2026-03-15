import { describe, it, expect, beforeEach } from 'vitest'
import { CreateCharacterUseCase, CharacterNameAlreadyTakenError } from './CreateCharacterUseCase.js'
import { InMemoryCharacterRepository } from '../../../../tests/_shared/InMemoryCharacterRepository.js'

const BASE_INPUT = {
  userId: 'user-1',
  name: 'Vareniel',
  class: 'MAGE' as const,
  spec: 'Frost',
  realm: 'Azralon',
}

describe('CreateCharacterUseCase', () => {
  let repo: InMemoryCharacterRepository
  let sut: CreateCharacterUseCase

  beforeEach(() => {
    repo = new InMemoryCharacterRepository()
    sut = new CreateCharacterUseCase(repo)
  })

  it('should create a character and return 201 data', async () => {
    const output = await sut.execute(BASE_INPUT)

    expect(output.characterId).toBeDefined()
    expect(output.name).toBe('Vareniel')
    expect(output.spec).toBe('Frost')
    expect(output.realm).toBe('Azralon')
    expect(output.userId).toBe('user-1')
  })

  it('should set isActive = true for the first character of a user', async () => {
    const output = await sut.execute(BASE_INPUT)

    expect(output.isActive).toBe(true)
  })

  it('should set isActive = false when user already has a character', async () => {
    await sut.execute(BASE_INPUT)

    const output = await sut.execute({
      ...BASE_INPUT,
      name: 'Vareniel-Alt',
    })

    expect(output.isActive).toBe(false)
  })

  it('should allow the same name on a different realm', async () => {
    await sut.execute(BASE_INPUT)

    const output = await sut.execute({ ...BASE_INPUT, realm: 'Gallywix' })

    expect(output.realm).toBe('Gallywix')
  })

  it('should throw CharacterNameAlreadyTakenError for same name and realm', async () => {
    await sut.execute(BASE_INPUT)

    await expect(sut.execute(BASE_INPUT)).rejects.toThrow(CharacterNameAlreadyTakenError)
  })

  it('should throw when class is invalid', async () => {
    await expect(
      sut.execute({ ...BASE_INPUT, class: 'INVALID' as never })
    ).rejects.toThrow('Invalid CharacterClass')
  })

  it('should not affect isActive of other users', async () => {
    // user-1 já tem personagem ativo
    await sut.execute(BASE_INPUT)

    // user-2 cria o primeiro personagem — deve ser ativo também
    const output = await sut.execute({ ...BASE_INPUT, userId: 'user-2', realm: 'Gallywix' })

    expect(output.isActive).toBe(true)
  })
})
