import jwt from 'jsonwebtoken'
import type { FastifyRequest, FastifyReply } from 'fastify'

// ── Shape of the decoded access-token payload ─────────────────────────────────

export interface AuthenticatedUser {
  userId: string
  email: string
  role: string
}

// Extend Fastify's request type so every handler gets req.user with full types
declare module 'fastify' {
  interface FastifyRequest {
    user: AuthenticatedUser
  }
}

// ── Payload guard ─────────────────────────────────────────────────────────────

function hasValidShape(value: unknown): value is AuthenticatedUser {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v['userId'] === 'string' && v['userId'].length > 0 &&
    typeof v['email']  === 'string' && v['email'].length  > 0 &&
    typeof v['role']   === 'string' && v['role'].length   > 0
  )
}

// ── Middleware ────────────────────────────────────────────────────────────────

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // ── 1. Extract the raw token ───────────────────────────────────────────────
  const authHeader = request.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    reply.status(401).send({ error: 'Token de autenticação não fornecido' })
    return
  }

  // 'Bearer '.length === 7
  const token = authHeader.slice(7).trim()
  if (!token) {
    reply.status(401).send({ error: 'Token de autenticação não fornecido' })
    return
  }

  // ── 2. Resolve the signing secret ─────────────────────────────────────────
  const secret = process.env['JWT_ACCESS_SECRET']
  if (!secret) {
    // Configuration error – let the global error handler surface it as 500
    throw new Error('JWT_ACCESS_SECRET environment variable is not set')
  }

  // ── 3. Verify signature and expiration ────────────────────────────────────
  try {
    const decoded = jwt.verify(token, secret)

    // ── 4. Validate the payload shape ───────────────────────────────────────
    if (!hasValidShape(decoded)) {
      reply.status(401).send({ error: 'Token inválido: payload incompleto' })
      return
    }

    // ── 5. Attach to the request ────────────────────────────────────────────
    request.user = {
      userId: decoded.userId,
      email:  decoded.email,
      role:   decoded.role,
    }
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      reply.status(401).send({ error: 'Token expirado' })
      return
    }

    // JsonWebTokenError, NotBeforeError, or any other jwt failure
    reply.status(401).send({ error: 'Token inválido' })
  }
}
