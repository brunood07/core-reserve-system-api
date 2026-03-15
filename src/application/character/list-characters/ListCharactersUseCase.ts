import type { UseCase } from '../../_shared/UseCase.js'
import type { ICharacterRepository } from '../../../domain/character/repositories/ICharacterRepository.js'
import type { CharacterClassValue } from '../../../domain/character/value-objects/CharacterClass.js'

export type ListCharactersInput = Record<string, never>

export interface ListCharactersOutput {
  characters: Array<{
    characterId: string
    userId: string
    name: string
    class: CharacterClassValue
    spec: string
    realm: string
    isActive: boolean
    createdAt: Date
  }>
}

export class ListCharactersUseCase
  implements UseCase<ListCharactersInput, ListCharactersOutput>
{
  constructor(private readonly characterRepository: ICharacterRepository) {}

  async execute(_input: ListCharactersInput): Promise<ListCharactersOutput> {
    const characters = await this.characterRepository.findAll()
    return {
      characters: characters.map((c) => ({
        characterId: c.id.value,
        userId: c.userId,
        name: c.name,
        class: c.class,
        spec: c.spec,
        realm: c.realm,
        isActive: c.isActive,
        createdAt: c.createdAt,
      })),
    }
  }
}
