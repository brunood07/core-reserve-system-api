export interface TokenPayload {
  userId: string
  email: string
  role: string
}

export interface GeneratedTokens {
  accessToken: string
  refreshToken: string
}

export interface ITokenService {
  generateTokens(payload: TokenPayload): GeneratedTokens
  generateAccessToken(payload: TokenPayload): string
  verifyRefreshToken(token: string): { userId: string } | null
}
