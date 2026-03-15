import type { ITokenService, TokenPayload, GeneratedTokens } from '../../src/application/_shared/ITokenService.js'

export class FakeTokenService implements ITokenService {
  generateTokens(payload: TokenPayload): GeneratedTokens {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: `fake-refresh-${payload.userId}`,
    }
  }

  generateAccessToken(payload: TokenPayload): string {
    return `fake-access-${payload.userId}`
  }

  verifyRefreshToken(token: string): { userId: string } | null {
    const match = token.match(/^fake-refresh-(.+)$/)
    if (!match) return null
    return { userId: match[1]! }
  }
}
