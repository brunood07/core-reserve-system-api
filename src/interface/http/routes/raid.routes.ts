import type { FastifyInstance } from 'fastify'
import { RaidController } from '../controllers/RaidController.js'
import { PrismaRaidRepository } from '../../../infrastructure/database/prisma/PrismaRaidRepository.js'
import { CreateRaidUseCase } from '../../../application/raid/create-raid/CreateRaidUseCase.js'
import { ListRaidsUseCase } from '../../../application/raid/list-raids/ListRaidsUseCase.js'
import { authenticate } from '../middlewares/authenticate.js'
import { requireRoles } from '../middlewares/requireRoles.js'

export async function raidRoutes(app: FastifyInstance): Promise<void> {
  const repository = new PrismaRaidRepository()
  const controller = new RaidController(
    new CreateRaidUseCase(repository),
    new ListRaidsUseCase(repository)
  )

  app.post('/', {
    preHandler: [authenticate, requireRoles('RAID_LEADER', 'OFFICER', 'ADMIN')],
  }, controller.create.bind(controller))

  app.get('/', controller.list.bind(controller))
}
