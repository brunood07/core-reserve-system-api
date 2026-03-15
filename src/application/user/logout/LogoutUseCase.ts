import type { UseCase } from '../../_shared/UseCase.js'
import type { IRefreshTokenStore } from '../../_shared/IRefreshTokenStore.js'

export interface LogoutInput {
  userId: string
}

export type LogoutOutput = void

export class LogoutUseCase implements UseCase<LogoutInput, LogoutOutput> {
  constructor(private readonly refreshTokenStore: IRefreshTokenStore) {}

  async execute(input: LogoutInput): Promise<void> {
    await this.refreshTokenStore.delete(input.userId)
  }
}
