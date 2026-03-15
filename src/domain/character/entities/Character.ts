import { AggregateRoot } from '../../_shared/AggregateRoot.js'
import { UniqueEntityId } from '../../_shared/UniqueEntityId.js'
import { CharacterClass, type CharacterClassValue } from '../value-objects/CharacterClass.js'
import { CharacterCreatedEvent } from '../events/CharacterCreatedEvent.js'

export interface CharacterProps {
  userId: UniqueEntityId
  name: string
  class: CharacterClass
  spec: string
  realm: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateCharacterProps {
  userId: string
  name: string
  class: CharacterClassValue
  spec: string
  realm: string
  isActive: boolean
}

export interface ReconstitueCharacterProps extends CreateCharacterProps {
  id: string
  createdAt: Date
  updatedAt: Date
}

export class Character extends AggregateRoot<CharacterProps> {
  private constructor(props: CharacterProps, id?: UniqueEntityId) {
    super(props, id)
  }

  static create(props: CreateCharacterProps): Character {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Character name cannot be empty')
    }
    if (!props.spec || props.spec.trim().length === 0) {
      throw new Error('Character spec cannot be empty')
    }
    if (!props.realm || props.realm.trim().length === 0) {
      throw new Error('Character realm cannot be empty')
    }

    const character = new Character({
      userId: new UniqueEntityId(props.userId),
      name: props.name.trim(),
      class: CharacterClass.create(props.class),
      spec: props.spec.trim(),
      realm: props.realm.trim(),
      isActive: props.isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    character.addDomainEvent(new CharacterCreatedEvent(character.id))
    return character
  }

  static reconstitue(props: ReconstitueCharacterProps): Character {
    return new Character(
      {
        userId: new UniqueEntityId(props.userId),
        name: props.name,
        class: CharacterClass.create(props.class),
        spec: props.spec,
        realm: props.realm,
        isActive: props.isActive,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
      },
      new UniqueEntityId(props.id)
    )
  }

  get userId(): string { return this.props.userId.value }
  get name(): string { return this.props.name }
  get class(): CharacterClassValue { return this.props.class.value }
  get spec(): string { return this.props.spec }
  get realm(): string { return this.props.realm }
  get isActive(): boolean { return this.props.isActive }
  get createdAt(): Date { return this.props.createdAt }
  get updatedAt(): Date { return this.props.updatedAt }
}
