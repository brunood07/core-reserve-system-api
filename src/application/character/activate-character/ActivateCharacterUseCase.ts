import type { UseCase } from '../../_shared/UseCase.js'
import type { ICharacterRepository } from '../../../domain/character/repositories/ICharacterRepository.js'
import type { CharacterClassValue } from '../../../domain/character/value-objects/CharacterClass.js'
import { UniqueEntityId } from '../../../domain/_shared/UniqueEntityId.js'

export interface ActivateCharacterInput {
  characterId: string
  userId: string
}

export interface ActivateCharacterOutput {
  characterId: string
  userId: string
  name: string
  class: CharacterClassValue
  spec: string
  realm: string
  isActive: true
  updatedAt: Date
}

export class CharacterNotFoundError extends Error {
  constructor(id: string) {
    super(`Character not found: ${id}`)
    this.name = 'CharacterNotFoundError'
  }
}

export class CharacterOwnershipError extends Error {
  constructor() {
    super('This character does not belong to the authenticated user')
    this.name = 'CharacterOwnershipError'
  }
}

export class ActivateCharacterUseCase
  implements UseCase<ActivateCharacterInput, ActivateCharacterOutput>
{
  constructor(private readonly characterRepository: ICharacterRepository) {}

  async execute(input: ActivateCharacterInput): Promise<ActivateCharacterOutput> {
    const character = await this.characterRepository.findById(
      new UniqueEntityId(input.characterId)
    )

    if (!character) {
      throw new CharacterNotFoundError(input.characterId)
    }

    if (character.userId !== input.userId) {
      throw new CharacterOwnershipError()
    }

    const activated = await this.characterRepository.activateCharacter(
      new UniqueEntityId(input.characterId),
      new UniqueEntityId(input.userId)
    )

    return {
      characterId: activated.id.value,
      userId: activated.userId,
      name: activated.name,
      class: activated.class,
      spec: activated.spec,
      realm: activated.realm,
      isActive: true,
      updatedAt: activated.updatedAt,
    }
  }
}
