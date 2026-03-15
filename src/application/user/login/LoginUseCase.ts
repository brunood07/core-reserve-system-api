import bcrypt from 'bcrypt'
import type { UseCase } from '../../_shared/UseCase.js'
import type { IUserRepository } from '../../../domain/user/repositories/IUserRepository.js'
import type { ITokenService } from '../../_shared/ITokenService.js'
import type { IRefreshTokenStore } from '../../_shared/IRefreshTokenStore.js'

const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60 // 7 days

export interface LoginInput {
  email: string
  password: string
}

export interface LoginOutput {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password')
    this.name = 'InvalidCredentialsError'
  }
}

export class LoginUseCase implements UseCase<LoginInput, LoginOutput> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenService: ITokenService,
    private readonly refreshTokenStore: IRefreshTokenStore
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const user = await this.userRepository.findByEmail(input.email)
    if (!user) {
      throw new InvalidCredentialsError()
    }

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash)
    if (!passwordMatches) {
      throw new InvalidCredentialsError()
    }

    const { accessToken, refreshToken } = this.tokenService.generateTokens({
      userId: user.id.value,
      email: user.email,
      role: user.role,
    })

    await this.refreshTokenStore.save(
      user.id.value,
      refreshToken,
      REFRESH_TOKEN_TTL_SECONDS
    )

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id.value,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    }
  }
}
