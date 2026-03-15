import type { DomainEvent } from '../../_shared/DomainEvent.js'
import type { UniqueEntityId } from '../../_shared/UniqueEntityId.js'

export class ReserveCreatedEvent implements DomainEvent {
  readonly occurredAt: Date
  readonly aggregateId: UniqueEntityId
  readonly eventName = 'ReserveCreated'

  constructor(aggregateId: UniqueEntityId) {
    this.aggregateId = aggregateId
    this.occurredAt = new Date()
  }
}
