import type { FastifyRequest, FastifyReply } from 'fastify'
import type { UserRoleValue } from '../../../domain/user/value-objects/UserRole.js'

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Roles can be passed in any casing; comparison is always case-insensitive.
 * Use the canonical uppercase values from UserRoleValue for the best type safety:
 *   authorize('RAID_LEADER', 'OFFICER', 'ADMIN')
 *   authorize('PLAYER')
 */
type RoleInput = UserRoleValue | Lowercase<UserRoleValue>

type PreHandlerFn = (request: FastifyRequest, reply: FastifyReply) => Promise<void>

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Returns a Fastify preHandler that allows only the listed roles to proceed.
 *
 * Must be used after `authenticate` so that `request.user` is populated.
 *
 * @example
 * app.get('/players', { preHandler: [authenticate, authorize('RAID_LEADER')] }, handler)
 * app.get('/raids',   { preHandler: [authenticate, authorize('RAID_LEADER', 'OFFICER')] }, handler)
 */
export function authorize(...allowedRoles: [RoleInput, ...RoleInput[]]): PreHandlerFn {
  // Normalise once at build-time so every request pays O(1) not O(n)
  const allowed = new Set(allowedRoles.map((r) => r.toUpperCase()))

  return async function authorizeHandler(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const role = request.user?.role?.toUpperCase()

    if (!role || !allowed.has(role)) {
      reply
        .status(403)
        .send({ error: 'Acesso negado: permissão insuficiente' })
      return
    }
  }
}
