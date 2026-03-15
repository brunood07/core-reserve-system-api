import { z } from 'zod'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { RegisterUserUseCase } from '../../../application/user/register-user/RegisterUserUseCase.js'
import { EmailAlreadyInUseError } from '../../../application/user/register-user/RegisterUserUseCase.js'
import type { LoginUseCase } from '../../../application/user/login/LoginUseCase.js'
import { InvalidCredentialsError } from '../../../application/user/login/LoginUseCase.js'
import type { RefreshTokenUseCase } from '../../../application/user/refresh-token/RefreshTokenUseCase.js'
import { InvalidRefreshTokenError } from '../../../application/user/refresh-token/RefreshTokenUseCase.js'
import type { LogoutUseCase } from '../../../application/user/logout/LogoutUseCase.js'

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

const refreshSchema = z.object({
  refresh_token: z.string().min(1, 'refresh_token is required'),
})

export class AuthController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly loginUser: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase
  ) {}

  async register(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const result = registerSchema.safeParse(request.body)

    if (!result.success) {
      reply.status(400).send({
        error: 'Validation failed',
        details: result.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      })
      return
    }

    const { name, email, password } = result.data

    try {
      await this.registerUser.execute({ name, email, password })
      reply.status(201).send({ message: 'Usuário criado com sucesso' })
    } catch (err) {
      if (err instanceof EmailAlreadyInUseError) {
        reply.status(409).send({ error: 'Email já cadastrado' })
        return
      }
      throw err
    }
  }

  async login(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const result = loginSchema.safeParse(request.body)

    if (!result.success) {
      reply.status(400).send({
        error: 'Validation failed',
        details: result.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      })
      return
    }

    try {
      const output = await this.loginUser.execute(result.data)
      reply.status(200).send({
        access_token: output.accessToken,
        refresh_token: output.refreshToken,
        user: output.user,
      })
    } catch (err) {
      if (err instanceof InvalidCredentialsError) {
        reply.status(401).send({ error: 'Email ou senha inválidos' })
        return
      }
      throw err
    }
  }

  async refresh(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const result = refreshSchema.safeParse(request.body)

    if (!result.success) {
      reply.status(400).send({
        error: 'Validation failed',
        details: result.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      })
      return
    }

    try {
      const output = await this.refreshTokenUseCase.execute({
        refreshToken: result.data.refresh_token,
      })
      reply.status(200).send({ access_token: output.accessToken })
    } catch (err) {
      if (err instanceof InvalidRefreshTokenError) {
        reply.status(401).send({ error: err.message })
        return
      }
      throw err
    }
  }

  async logout(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    await this.logoutUseCase.execute({ userId: request.user.userId })
    reply.status(200).send({ message: 'Logout realizado com sucesso' })
  }
}
