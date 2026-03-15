import { ValueObject } from '../../_shared/ValueObject.js'

export type RaidStatusValue = 'DRAFT' | 'OPEN' | 'CLOSED'

const VALID_STATUSES: RaidStatusValue[] = ['DRAFT', 'OPEN', 'CLOSED']

interface RaidStatusProps {
  value: RaidStatusValue
}

export class RaidStatus extends ValueObject<RaidStatusProps> {
  get value(): RaidStatusValue {
    return this.props.value
  }

  static create(status: string): RaidStatus {
    if (!VALID_STATUSES.includes(status as RaidStatusValue)) {
      throw new Error(`Invalid RaidStatus: ${status}. Must be one of: ${VALID_STATUSES.join(', ')}`)
    }
    return new RaidStatus({ value: status as RaidStatusValue })
  }
}
