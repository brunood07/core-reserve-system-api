import { AggregateRoot } from '../../_shared/AggregateRoot.js'
import { UniqueEntityId } from '../../_shared/UniqueEntityId.js'

export interface BossProps {
  raidId: string
  name: string
  orderIndex: number
  createdAt: Date
  updatedAt: Date
}

export interface CreateBossProps {
  raidId: string
  name: string
  orderIndex: number
}

export interface ReconstitueBossProps {
  id: string
  raidId: string
  name: string
  orderIndex: number
  createdAt: Date
  updatedAt: Date
}

export class Boss extends AggregateRoot<BossProps> {
  private constructor(props: BossProps, id?: UniqueEntityId) {
    super(props, id)
  }

  static create(props: CreateBossProps): Boss {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Boss name cannot be empty')
    }
    if (!Number.isInteger(props.orderIndex) || props.orderIndex < 1) {
      throw new Error('Boss orderIndex must be a positive integer')
    }
    return new Boss({
      raidId: props.raidId,
      name: props.name.trim(),
      orderIndex: props.orderIndex,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  static reconstitue(props: ReconstitueBossProps): Boss {
    return new Boss(
      {
        raidId: props.raidId,
        name: props.name,
        orderIndex: props.orderIndex,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
      },
      new UniqueEntityId(props.id)
    )
  }

  get raidId(): string { return this.props.raidId }
  get name(): string { return this.props.name }
  get orderIndex(): number { return this.props.orderIndex }
  get createdAt(): Date { return this.props.createdAt }
  get updatedAt(): Date { return this.props.updatedAt }
}
