import type { UniqueEntityId } from './UniqueEntityId.js'

export interface DomainEvent {
  readonly occurredAt: Date
  readonly aggregateId: UniqueEntityId
  readonly eventName: string
}
