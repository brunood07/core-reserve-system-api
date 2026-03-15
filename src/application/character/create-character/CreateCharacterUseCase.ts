import type { UseCase } from '../../_shared/UseCase.js'
import type { ICharacterRepository } from '../../../domain/character/repositories/ICharacterRepository.js'
import { Character } from '../../../domain/character/entities/Character.js'
import type { CharacterClassValue } from '../../../domain/character/value-objects/CharacterClass.js'
import { UniqueEntityId } from '../../../domain/_shared/UniqueEntityId.js'

export interface CreateCharacterInput {
  userId: string
  name: string
  class: CharacterClassValue
  spec: string
  realm: string
}

export interface CreateCharacterOutput {
  characterId: string
  userId: string
  name: string
  class: CharacterClassValue
  spec: string
  realm: string
  isActive: boolean
  createdAt: Date
}

export class CharacterNameAlreadyTakenError extends Error {
  constructor(name: string, realm: string) {
    super(`Character "${name}" already exists on realm "${realm}"`)
    this.name = 'CharacterNameAlreadyTakenError'
  }
}

export class CreateCharacterUseCase implements UseCase<CreateCharacterInput, CreateCharacterOutput> {
  constructor(private readonly characterRepository: ICharacterRepository) {}

  async execute(input: CreateCharacterInput): Promise<CreateCharacterOutput> {
    const existing = await this.characterRepository.findByNameAndRealm(input.name, input.realm)
    if (existing) {
      throw new CharacterNameAlreadyTakenError(input.name, input.realm)
    }

    const userCharacters = await this.characterRepository.findByUserId(
      new UniqueEntityId(input.userId)
    )

    // Primeiro personagem do usuário é definido como ativo automaticamente
    const isActive = userCharacters.length === 0

    const character = Character.create({ ...input, isActive })
    await this.characterRepository.save(character)

    return {
      characterId: character.id.value,
      userId: character.userId,
      name: character.name,
      class: character.class,
      spec: character.spec,
      realm: character.realm,
      isActive: character.isActive,
      createdAt: character.createdAt,
    }
  }
}
