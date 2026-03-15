import type { ICharacterRepository } from '../../src/domain/character/repositories/ICharacterRepository.js'
import { Character } from '../../src/domain/character/entities/Character.js'
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

  async activateCharacter(characterId: UniqueEntityId, userId: UniqueEntityId): Promise<Character> {
    // Simula a transação: desativa todos do usuário, ativa o alvo
    this.items = this.items.map((c) => {
      if (c.userId !== userId.value) return c
      return Character.reconstitue({
        id: c.id.value,
        userId: c.userId,
        name: c.name,
        class: c.class,
        spec: c.spec,
        realm: c.realm,
        isActive: false,
        createdAt: c.createdAt,
        updatedAt: new Date(),
      })
    })

    const index = this.items.findIndex((c) => c.id.equals(characterId))
    if (index < 0) throw new Error(`Character not found: ${characterId.value}`)

    const target = this.items[index]!
    const activated = Character.reconstitue({
      id: target.id.value,
      userId: target.userId,
      name: target.name,
      class: target.class,
      spec: target.spec,
      realm: target.realm,
      isActive: true,
      createdAt: target.createdAt,
      updatedAt: new Date(),
    })

    this.items[index] = activated
    return activated
  }

  async delete(id: UniqueEntityId): Promise<void> {
    this.items = this.items.filter((c) => !c.id.equals(id))
  }
}
