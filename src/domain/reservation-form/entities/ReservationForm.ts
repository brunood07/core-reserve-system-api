import { AggregateRoot } from '../../_shared/AggregateRoot.js'
import { UniqueEntityId } from '../../_shared/UniqueEntityId.js'

export type ReservationFormStatusValue = 'OPEN' | 'CLOSED'

export interface ReservationFormProps {
  weekOf: Date
  opensAt: Date
  closesAt: Date
  status: ReservationFormStatusValue
  createdAt: Date
  updatedAt: Date
}

export interface CreateReservationFormProps {
  weekOf: Date
  opensAt: Date
  closesAt: Date
}

export interface ReconstitueReservationFormProps {
  id: string
  weekOf: Date
  opensAt: Date
  closesAt: Date
  status: ReservationFormStatusValue
  createdAt: Date
  updatedAt: Date
}

export class ReservationForm extends AggregateRoot<ReservationFormProps> {
  private constructor(props: ReservationFormProps, id?: UniqueEntityId) {
    super(props, id)
  }

  static create(props: CreateReservationFormProps): ReservationForm {
    return new ReservationForm({
      weekOf: props.weekOf,
      opensAt: props.opensAt,
      closesAt: props.closesAt,
      status: 'OPEN',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  static reconstitue(props: ReconstitueReservationFormProps): ReservationForm {
    return new ReservationForm(
      {
        weekOf: props.weekOf,
        opensAt: props.opensAt,
        closesAt: props.closesAt,
        status: props.status,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
      },
      new UniqueEntityId(props.id)
    )
  }

  get weekOf(): Date { return this.props.weekOf }
  get opensAt(): Date { return this.props.opensAt }
  get closesAt(): Date { return this.props.closesAt }
  get status(): ReservationFormStatusValue { return this.props.status }
  get createdAt(): Date { return this.props.createdAt }
  get updatedAt(): Date { return this.props.updatedAt }

  updateClosesAt(closesAt: Date): void {
    this.props.closesAt = closesAt
    this.props.updatedAt = new Date()
  }
}
