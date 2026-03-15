import type { UseCase } from '../../_shared/UseCase.js'
import type { ITokenService } from '../../_shared/ITokenService.js'
import type { IRefreshTokenStore } from '../../_shared/IRefreshTokenStore.js'
import type { IUserRepository } from '../../../domain/user/repositories/IUserRepository.js'
import { UniqueEntityId } from '../../../domain/_shared/UniqueEntityId.js'

export interface RefreshTokenInput {
  refreshToken: string
}

export interface RefreshTokenOutput {
  accessToken: string
}

export class InvalidRefreshTokenError extends Error {
  constructor() {
    super('Refresh token inválido ou expirado')
    this.name = 'InvalidRefreshTokenError'
  }
}

export class RefreshTokenUseCase implements UseCase<RefreshTokenInput, RefreshTokenOutput> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenService: ITokenService,
    private readonly refreshTokenStore: IRefreshTokenStore
  ) {}

  async execute(input: RefreshTokenInput): Promise<RefreshTokenOutput> {
    // 1. Verifica assinatura JWT do refresh token
    const payload = this.tokenService.verifyRefreshToken(input.refreshToken)
    if (!payload) throw new InvalidRefreshTokenError()

    // 2. Confirma que o token ainda existe no Postgres (não foi invalidado por logout)
    const storedToken = await this.refreshTokenStore.get(payload.userId)
    if (!storedToken || storedToken !== input.refreshToken) {
      throw new InvalidRefreshTokenError()
    }

    // 3. Busca usuário para garantir role/email atualizados no novo access token
    const user = await this.userRepository.findById(new UniqueEntityId(payload.userId))
    if (!user) throw new InvalidRefreshTokenError()

    // 4. Gera apenas novo access token (refresh token não é rotacionado aqui)
    const accessToken = this.tokenService.generateAccessToken({
      userId: user.id.value,
      email: user.email,
      role: user.role,
    })

    return { accessToken }
  }
}
