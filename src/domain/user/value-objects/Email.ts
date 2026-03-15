import { ValueObject } from '../../_shared/ValueObject.js'

interface EmailProps {
  value: string
}

export class Email extends ValueObject<EmailProps> {
  private constructor(props: EmailProps) {
    super(props)
  }

  static create(email: string): Email {
    const normalized = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new Error(`Invalid email: "${email}"`)
    }
    return new Email({ value: normalized })
  }

  get value(): string {
    return this.props.value
  }
}
