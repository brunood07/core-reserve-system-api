import type { ICharacterRepository } from '../../src/domain/character/repositories/ICharacterRepository.js'
import type { Character } from '../../src/domain/character/entities/Character.js'
import type { UniqueEntityId } from '../../src/domain/_shared/UniqueEntityId.js'

export class InMemoryCharacterRepository implements ICharacterRepository {
  public items: Character[] = []

  async findById(id: UniqueEntityId): Promise<Character | null> {
    return this.items.find((c) => c.id.equals(id)) ?? null
  }

  async findAll(): Promise<Character[]> {
    return [...this.items]
  }

  async findByNameAndRealm(name: string, realm: string): Promise<Character | null> {
    return (
      this.items.find(
        (c) => c.name.toLowerCase() === name.toLowerCase() && c.realm.toLowerCase() === realm.toLowerCase()
      ) ?? null
    )
  }

  async findByUserId(userId: UniqueEntityId): Promise<Character[]> {
    return this.items.filter((c) => c.userId === userId.value)
  }

  async save(character: Character): Promise<void> {
    const index = this.items.findIndex((c) => c.id.equals(character.id))
    if (index >= 0) {
      this.items[index] = character
    } else {
      this.items.push(character)
    }
  }

  async delete(id: UniqueEntityId): Promise<void> {
    this.items = this.items.filter((c) => !c.id.equals(id))
  }
}
