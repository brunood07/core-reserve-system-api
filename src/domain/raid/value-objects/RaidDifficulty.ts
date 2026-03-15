import { ValueObject } from '../../_shared/ValueObject.js'

export type RaidDifficultyValue = 'NORMAL' | 'HEROIC' | 'MYTHIC'

const VALID_DIFFICULTIES: RaidDifficultyValue[] = ['NORMAL', 'HEROIC', 'MYTHIC']

interface RaidDifficultyProps {
  value: RaidDifficultyValue
}

export class RaidDifficulty extends ValueObject<RaidDifficultyProps> {
  private constructor(props: RaidDifficultyProps) {
    super(props)
  }

  static create(difficulty: string): RaidDifficulty {
    if (!VALID_DIFFICULTIES.includes(difficulty as RaidDifficultyValue)) {
      throw new Error(
        `Invalid RaidDifficulty: "${difficulty}". Must be one of: ${VALID_DIFFICULTIES.join(', ')}`
      )
    }
    return new RaidDifficulty({ value: difficulty as RaidDifficultyValue })
  }

  get value(): RaidDifficultyValue {
    return this.props.value
  }
}
