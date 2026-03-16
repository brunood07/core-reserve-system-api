import type { UseCase } from '../../_shared/UseCase.js'
import type { ICharacterRepository } from '../../../domain/character/repositories/ICharacterRepository.js'
import type { CharacterClassValue } from '../../../domain/character/value-objects/CharacterClass.js'
import { UniqueEntityId } from '../../../domain/_shared/UniqueEntityId.js'

export interface GetMyCharactersInput {
  userId: string
}

export interface MyCharacter {
  id: string
  name: string
  class: CharacterClassValue
  spec: string
  realm: string
  isActive: boolean
}

export interface GetMyCharactersOutput {
  characters: MyCharacter[]
}

export class GetMyCharactersUseCase
  implements UseCase<GetMyCharactersInput, GetMyCharactersOutput>
{
  constructor(private readonly characterRepository: ICharacterRepository) {}

  async execute(input: GetMyCharactersInput): Promise<GetMyCharactersOutput> {
    const characters = await this.characterRepository.findByUserId(
      new UniqueEntityId(input.userId)
    )
    return {
      characters: characters.map((c) => ({
        id: c.id.value,
        name: c.name,
        class: c.class,
        spec: c.spec,
        realm: c.realm,
        isActive: c.isActive,
      })),
    }
  }
}
