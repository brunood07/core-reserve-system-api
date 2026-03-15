import type { Repository } from '../../_shared/Repository.js'
import type { Character } from '../entities/Character.js'
import type { UniqueEntityId } from '../../_shared/UniqueEntityId.js'

export interface ICharacterRepository extends Repository<Character> {
  findByNameAndRealm(name: string, realm: string): Promise<Character | null>
  findByUserId(userId: UniqueEntityId): Promise<Character[]>
  activateCharacter(characterId: UniqueEntityId, userId: UniqueEntityId): Promise<Character>
}
