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
  deletedAt: Date | null
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
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface UpdateUserProps {
  name?: string
  email?: string
  role?: UserRoleValue
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
      deletedAt: null,
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
        deletedAt: props.deletedAt,
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
  get deletedAt(): Date | null { return this.props.deletedAt }
  get isDeleted(): boolean { return this.props.deletedAt !== null }
  get createdAt(): Date { return this.props.createdAt }
  get updatedAt(): Date { return this.props.updatedAt }

  update(props: UpdateUserProps): void {
    if (props.name !== undefined) this.props.name = props.name.trim()
    if (props.email !== undefined) this.props.email = Email.create(props.email)
    if (props.role !== undefined) this.props.role = UserRole.create(props.role)
    this.props.updatedAt = new Date()
  }

  softDelete(): void {
    this.props.deletedAt = new Date()
    this.props.updatedAt = new Date()
  }
}
