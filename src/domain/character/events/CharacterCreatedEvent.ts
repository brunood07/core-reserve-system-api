import type { DomainEvent } from '../../_shared/DomainEvent.js'
import type { UniqueEntityId } from '../../_shared/UniqueEntityId.js'

export class CharacterCreatedEvent implements DomainEvent {
  readonly occurredAt: Date
  readonly aggregateId: UniqueEntityId
  readonly eventName = 'CharacterCreated'

  constructor(aggregateId: UniqueEntityId) {
    this.aggregateId = aggregateId
    this.occurredAt = new Date()
  }
}
