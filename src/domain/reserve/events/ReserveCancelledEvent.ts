import type { DomainEvent } from '../../_shared/DomainEvent.js'
import type { UniqueEntityId } from '../../_shared/UniqueEntityId.js'

export class ReserveCancelledEvent implements DomainEvent {
  readonly occurredAt: Date
  readonly aggregateId: UniqueEntityId
  readonly eventName = 'ReserveCancelled'

  constructor(aggregateId: UniqueEntityId) {
    this.aggregateId = aggregateId
    this.occurredAt = new Date()
  }
}
