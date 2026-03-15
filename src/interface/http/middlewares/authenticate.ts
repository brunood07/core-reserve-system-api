import jwt from 'jsonwebtoken'
import type { FastifyRequest, FastifyReply } from 'fastify'

export interface AuthenticatedUser {
  userId: string
  email: string
  role: string
}

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthenticatedUser
  }
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    reply.status(401).send({ error: 'Token de autenticação não fornecido' })
    return
  }

  const token = authHeader.slice(7)
  const secret = process.env['JWT_ACCESS_SECRET']

  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET must be set')
  }

  try {
    const payload = jwt.verify(token, secret) as AuthenticatedUser
    request.user = payload
  } catch {
    reply.status(401).send({ error: 'Token inválido ou expirado' })
  }
}
