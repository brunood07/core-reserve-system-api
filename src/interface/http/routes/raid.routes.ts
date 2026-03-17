import type { FastifyInstance } from 'fastify'
import { RaidController } from '../controllers/RaidController.js'
import { PrismaRaidRepository } from '../../../infrastructure/database/prisma/PrismaRaidRepository.js'
import { PrismaBossRepository } from '../../../infrastructure/database/prisma/PrismaBossRepository.js'
import { PrismaItemRepository } from '../../../infrastructure/database/prisma/PrismaItemRepository.js'
import { PrismaReservationFormRepository } from '../../../infrastructure/database/prisma/PrismaReservationFormRepository.js'
import { CreateRaidUseCase } from '../../../application/raid/create-raid/CreateRaidUseCase.js'
import { ListRaidsUseCase } from '../../../application/raid/list-raids/ListRaidsUseCase.js'
import { UpdateRaidStatusUseCase } from '../../../application/raid/update-raid-status/UpdateRaidStatusUseCase.js'
import { DuplicateRaidUseCase } from '../../../application/raid/duplicate-raid/DuplicateRaidUseCase.js'
import { CompleteRaidUseCase } from '../../../application/raid/complete-raid/CompleteRaidUseCase.js'
import { authenticate } from '../middlewares/authenticate.js'
import { requireRoles } from '../middlewares/requireRoles.js'

export async function raidRoutes(app: FastifyInstance): Promise<void> {
  const raidRepository = new PrismaRaidRepository()
  const formRepository = new PrismaReservationFormRepository()

  const controller = new RaidController(
    new CreateRaidUseCase(raidRepository),
    new ListRaidsUseCase(raidRepository),
    new UpdateRaidStatusUseCase(raidRepository),
    new DuplicateRaidUseCase(raidRepository, new PrismaBossRepository(), new PrismaItemRepository()),
    new CompleteRaidUseCase(raidRepository, formRepository)
  )

  const leaderGuard = {
    preHandler: [authenticate, requireRoles('RAID_LEADER', 'OFFICER', 'ADMIN')],
  }

  app.post('/', leaderGuard, controller.create.bind(controller))
  app.get('/', controller.list.bind(controller))
  app.post('/:raidId/complete', leaderGuard, controller.complete.bind(controller))
  app.post('/:raidId/duplicate', leaderGuard, controller.duplicate.bind(controller))
  app.patch('/:raidId/status', leaderGuard, controller.updateStatus.bind(controller))
}
