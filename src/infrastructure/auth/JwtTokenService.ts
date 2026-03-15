import jwt from 'jsonwebtoken'
import type { ITokenService, TokenPayload, GeneratedTokens } from '../../application/_shared/ITokenService.js'

export class JwtTokenService implements ITokenService {
  private readonly accessSecret: string
  private readonly refreshSecret: string

  constructor() {
    const accessSecret = process.env['JWT_ACCESS_SECRET']
    const refreshSecret = process.env['JWT_REFRESH_SECRET']

    if (!accessSecret || !refreshSecret) {
      throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set')
    }

    this.accessSecret = accessSecret
    this.refreshSecret = refreshSecret
  }

  generateTokens(payload: TokenPayload): GeneratedTokens {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: jwt.sign({ userId: payload.userId }, this.refreshSecret, { expiresIn: '7d' }),
    }
  }

  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.accessSecret, { expiresIn: '15m' })
  }

  verifyRefreshToken(token: string): { userId: string } | null {
    try {
      const payload = jwt.verify(token, this.refreshSecret) as { userId: string }
      return { userId: payload.userId }
    } catch {
      return null
    }
  }
}
