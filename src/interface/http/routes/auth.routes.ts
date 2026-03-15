import type { FastifyInstance } from 'fastify'
import { AuthController } from '../controllers/AuthController.js'
import { PrismaUserRepository } from '../../../infrastructure/database/prisma/PrismaUserRepository.js'
import { RegisterUserUseCase } from '../../../application/user/register-user/RegisterUserUseCase.js'
import { LoginUseCase } from '../../../application/user/login/LoginUseCase.js'
import { RefreshTokenUseCase } from '../../../application/user/refresh-token/RefreshTokenUseCase.js'
import { LogoutUseCase } from '../../../application/user/logout/LogoutUseCase.js'
import { JwtTokenService } from '../../../infrastructure/auth/JwtTokenService.js'
import { PrismaRefreshTokenStore } from '../../../infrastructure/cache/PrismaRefreshTokenStore.js'
import { authenticate } from '../middlewares/authenticate.js'

export async function authRoutes(app: FastifyInstance): Promise<void> {
  const userRepository = new PrismaUserRepository()
  const tokenService = new JwtTokenService()
  const tokenStore = new PrismaRefreshTokenStore()

  const controller = new AuthController(
    new RegisterUserUseCase(userRepository),
    new LoginUseCase(userRepository, tokenService, tokenStore),
    new RefreshTokenUseCase(userRepository, tokenService, tokenStore),
    new LogoutUseCase(tokenStore)
  )

  app.post('/register', controller.register.bind(controller))
  app.post('/login', controller.login.bind(controller))
  app.post('/refresh', controller.refresh.bind(controller))
  app.post('/logout', { preHandler: authenticate }, controller.logout.bind(controller))
}
