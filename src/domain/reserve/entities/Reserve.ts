import { AggregateRoot } from '../../_shared/AggregateRoot.js'
import { UniqueEntityId } from '../../_shared/UniqueEntityId.js'
import { ItemName } from '../value-objects/ItemName.js'
import { ReserveStatus, type ReserveStatusValue } from '../value-objects/ReserveStatus.js'
import { ReserveCreatedEvent } from '../events/ReserveCreatedEvent.js'
import { ReserveCancelledEvent } from '../events/ReserveCancelledEvent.js'

export interface ReserveProps {
  raidId: UniqueEntityId
  characterId: UniqueEntityId
  itemName: ItemName
  status: ReserveStatus
  createdAt: Date
  updatedAt: Date
}

export interface CreateReserveProps {
  raidId: string
  characterId: string
  itemName: string
}

export interface ReconstitueReserveProps extends CreateReserveProps {
  id: string
  status: ReserveStatusValue
  createdAt: Date
  updatedAt: Date
}

export class Reserve extends AggregateRoot<ReserveProps> {
  private constructor(props: ReserveProps, id?: UniqueEntityId) {
    super(props, id)
  }

  static create(props: CreateReserveProps): Reserve {
    const reserve = new Reserve({
      raidId: new UniqueEntityId(props.raidId),
      characterId: new UniqueEntityId(props.characterId),
      itemName: ItemName.create(props.itemName),
      status: ReserveStatus.create('ACTIVE'),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    reserve.addDomainEvent(new ReserveCreatedEvent(reserve.id))
    return reserve
  }

  static reconstitue(props: ReconstitueReserveProps): Reserve {
    return new Reserve(
      {
        raidId: new UniqueEntityId(props.raidId),
        characterId: new UniqueEntityId(props.characterId),
        itemName: ItemName.create(props.itemName),
        status: ReserveStatus.create(props.status),
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
      },
      new UniqueEntityId(props.id)
    )
  }

  cancel(): void {
    if (this.props.status.value !== 'ACTIVE') {
      throw new Error('Only ACTIVE reserves can be cancelled')
    }
    this.props = {
      ...this.props,
      status: ReserveStatus.create('CANCELLED'),
      updatedAt: new Date(),
    }
    this.addDomainEvent(new ReserveCancelledEvent(this._id))
  }

  fulfill(): void {
    if (this.props.status.value !== 'ACTIVE') {
      throw new Error('Only ACTIVE reserves can be fulfilled')
    }
    this.props = {
      ...this.props,
      status: ReserveStatus.create('FULFILLED'),
      updatedAt: new Date(),
    }
  }

  get raidId(): string { return this.props.raidId.value }
  get characterId(): string { return this.props.characterId.value }
  get itemName(): string { return this.props.itemName.value }
  get status(): ReserveStatusValue { return this.props.status.value }
  get createdAt(): Date { return this.props.createdAt }
  get updatedAt(): Date { return this.props.updatedAt }
}
