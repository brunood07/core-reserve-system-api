import { ValueObject } from '../../_shared/ValueObject.js'

export type ReserveStatusValue = 'ACTIVE' | 'CANCELLED' | 'FULFILLED'

const VALID_STATUSES: ReserveStatusValue[] = ['ACTIVE', 'CANCELLED', 'FULFILLED']

interface ReserveStatusProps {
  value: ReserveStatusValue
}

export class ReserveStatus extends ValueObject<ReserveStatusProps> {
  private constructor(props: ReserveStatusProps) {
    super(props)
  }

  static create(value: string): ReserveStatus {
    if (!VALID_STATUSES.includes(value as ReserveStatusValue)) {
      throw new Error(
        `Invalid ReserveStatus: "${value}". Must be one of: ${VALID_STATUSES.join(', ')}`
      )
    }
    return new ReserveStatus({ value: value as ReserveStatusValue })
  }

  get value(): ReserveStatusValue {
    return this.props.value
  }
}
