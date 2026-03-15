import { AggregateRoot } from '../../_shared/AggregateRoot.js'
import { UniqueEntityId } from '../../_shared/UniqueEntityId.js'
import { Email } from '../value-objects/Email.js'
import { UserRole, type UserRoleValue } from '../value-objects/UserRole.js'
import { UserRegisteredEvent } from '../events/UserRegisteredEvent.js'

export interface UserProps {
  name: string
  email: Email
  passwordHash: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export interface CreateUserProps {
  name: string
  email: string
  passwordHash: string
}

export interface ReconstitueUserProps {
  id: string
  name: string
  email: string
  passwordHash: string
  role: UserRoleValue
  createdAt: Date
  updatedAt: Date
}

export class User extends AggregateRoot<UserProps> {
  private constructor(props: UserProps, id?: UniqueEntityId) {
    super(props, id)
  }

  static create(props: CreateUserProps): User {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('User name cannot be empty')
    }
    const user = new User({
      name: props.name.trim(),
      email: Email.create(props.email),
      passwordHash: props.passwordHash,
      role: UserRole.create('PLAYER'),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    user.addDomainEvent(new UserRegisteredEvent(user.id))
    return user
  }

  static reconstitue(props: ReconstitueUserProps): User {
    return new User(
      {
        name: props.name,
        email: Email.create(props.email),
        passwordHash: props.passwordHash,
        role: UserRole.create(props.role),
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
      },
      new UniqueEntityId(props.id)
    )
  }

  get name(): string { return this.props.name }
  get email(): string { return this.props.email.value }
  get passwordHash(): string { return this.props.passwordHash }
  get role(): UserRoleValue { return this.props.role.value }
  get createdAt(): Date { return this.props.createdAt }
  get updatedAt(): Date { return this.props.updatedAt }
}
