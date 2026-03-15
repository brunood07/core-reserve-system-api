import type { DomainEvent } from '../../_shared/DomainEvent.js'
import type { UniqueEntityId } from '../../_shared/UniqueEntityId.js'

export class UserRegisteredEvent implements DomainEvent {
  readonly occurredAt: Date
  readonly aggregateId: UniqueEntityId
  readonly eventName = 'UserRegistered'

  constructor(aggregateId: UniqueEntityId) {
    this.aggregateId = aggregateId
    this.occurredAt = new Date()
  }
}
