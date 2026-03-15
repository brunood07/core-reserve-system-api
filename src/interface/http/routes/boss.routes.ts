import type { FastifyInstance } from 'fastify'
import { BossController } from '../controllers/BossController.js'
import { PrismaBossRepository } from '../../../infrastructure/database/prisma/PrismaBossRepository.js'
import { PrismaRaidRepository } from '../../../infrastructure/database/prisma/PrismaRaidRepository.js'
import { CreateBossUseCase } from '../../../application/boss/create-boss/CreateBossUseCase.js'
import { authenticate } from '../middlewares/authenticate.js'
import { requireRoles } from '../middlewares/requireRoles.js'

export async function bossRoutes(app: FastifyInstance): Promise<void> {
  const controller = new BossController(
    new CreateBossUseCase(new PrismaBossRepository(), new PrismaRaidRepository())
  )

  app.post('/:raidId/bosses', {
    preHandler: [authenticate, requireRoles('RAID_LEADER', 'OFFICER', 'ADMIN')],
  }, controller.create.bind(controller))
}
