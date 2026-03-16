import { AggregateRoot } from '../../_shared/AggregateRoot.js'
import { UniqueEntityId } from '../../_shared/UniqueEntityId.js'
import { RaidStatus, type RaidStatusValue } from '../value-objects/RaidStatus.js'
import { RaidCreatedEvent } from '../events/RaidCreatedEvent.js'

export interface RaidProps {
  date: Date
  description: string | null
  status: RaidStatus
  createdById: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateRaidProps {
  date: Date
  description?: string
  status: RaidStatusValue
  createdById: string
}

export interface ReconstitueRaidProps {
  id: string
  date: Date
  description: string | null
  status: RaidStatusValue
  createdById: string
  createdAt: Date
  updatedAt: Date
}

export class Raid extends AggregateRoot<RaidProps> {
  private constructor(props: RaidProps, id?: UniqueEntityId) {
    super(props, id)
  }

  static create(props: CreateRaidProps): Raid {
    const raid = new Raid({
      date: props.date,
      description: props.description ?? null,
      status: RaidStatus.create(props.status),
      createdById: props.createdById,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    raid.addDomainEvent(new RaidCreatedEvent(raid.id))
    return raid
  }

  static reconstitue(props: ReconstitueRaidProps): Raid {
    return new Raid(
      {
        date: props.date,
        description: props.description,
        status: RaidStatus.create(props.status),
        createdById: props.createdById,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
      },
      new UniqueEntityId(props.id)
    )
  }

  get date(): Date { return this.props.date }
  get description(): string | null { return this.props.description }
  get status(): RaidStatusValue { return this.props.status.value }
  get createdById(): string { return this.props.createdById }
  get createdAt(): Date { return this.props.createdAt }
  get updatedAt(): Date { return this.props.updatedAt }

  complete(): void {
    this.props.status = RaidStatus.create('COMPLETED')
    this.props.updatedAt = new Date()
  }

  changeStatus(status: RaidStatusValue): void {
    this.props.status = RaidStatus.create(status)
    this.props.updatedAt = new Date()
  }
}
