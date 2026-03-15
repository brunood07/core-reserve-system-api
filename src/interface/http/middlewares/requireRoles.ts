import type { FastifyRequest, FastifyReply } from 'fastify'
import type { UserRoleValue } from '../../../domain/user/value-objects/UserRole.js'

export function requireRoles(...roles: UserRoleValue[]) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!roles.includes(request.user.role as UserRoleValue)) {
      reply.status(403).send({ error: 'Acesso não autorizado para esta operação' })
    }
  }
}
