import { describe, it, expect, beforeEach } from 'vitest'
import {
  ActivateCharacterUseCase,
  CharacterNotFoundError,
  CharacterOwnershipError,
} from './ActivateCharacterUseCase.js'
import { InMemoryCharacterRepository } from '../../../../tests/_shared/InMemoryCharacterRepository.js'
import { Character } from '../../../domain/character/entities/Character.js'

const USER_ID = 'user-1'
const OTHER_USER_ID = 'user-2'

function makeCharacter(overrides: Partial<{ userId: string; isActive: boolean; name: string }> = {}) {
  return Character.create({
    userId: overrides.userId ?? USER_ID,
    name: overrides.name ?? 'Vareniel',
    class: 'MAGE',
    spec: 'Frost',
    realm: 'Azralon',
    isActive: overrides.isActive ?? false,
  })
}

describe('ActivateCharacterUseCase', () => {
  let repo: InMemoryCharacterRepository
  let sut: ActivateCharacterUseCase

  beforeEach(() => {
    repo = new InMemoryCharacterRepository()
    sut = new ActivateCharacterUseCase(repo)
  })

  it('should activate the target character', async () => {
    const character = makeCharacter()
    await repo.save(character)

    const output = await sut.execute({ characterId: character.id.value, userId: USER_ID })

    expect(output.isActive).toBe(true)
    expect(output.characterId).toBe(character.id.value)
  })

  it('should deactivate all other characters of the same user', async () => {
    const active = makeCharacter({ isActive: true, name: 'Vareniel' })
    const alt1 = makeCharacter({ isActive: false, name: 'Vareniel-Alt' })
    const target = makeCharacter({ isActive: false, name: 'Vareniel-Alt2' })
    await repo.save(active)
    await repo.save(alt1)
    await repo.save(target)

    await sut.execute({ characterId: target.id.value, userId: USER_ID })

    const all = await repo.findAll()
    const userChars = all.filter((c) => c.userId === USER_ID)
    const activeOnes = userChars.filter((c) => c.isActive)

    expect(activeOnes).toHaveLength(1)
    expect(activeOnes[0]?.id.value).toBe(target.id.value)
  })

  it('should not affect characters of other users', async () => {
    const otherActive = makeCharacter({ userId: OTHER_USER_ID, isActive: true, name: 'Grixel' })
    const target = makeCharacter({ isActive: false, name: 'Vareniel' })
    await repo.save(otherActive)
    await repo.save(target)

    await sut.execute({ characterId: target.id.value, userId: USER_ID })

    const other = await repo.findById(otherActive.id)
    expect(other?.isActive).toBe(true)
  })

  it('should throw CharacterNotFoundError when character does not exist', async () => {
    await expect(
      sut.execute({ characterId: 'non-existent-id', userId: USER_ID })
    ).rejects.toThrow(CharacterNotFoundError)
  })

  it('should throw CharacterOwnershipError when character belongs to another user', async () => {
    const character = makeCharacter({ userId: OTHER_USER_ID })
    await repo.save(character)

    await expect(
      sut.execute({ characterId: character.id.value, userId: USER_ID })
    ).rejects.toThrow(CharacterOwnershipError)
  })
})
