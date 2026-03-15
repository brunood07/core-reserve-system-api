import type { FastifyInstance } from 'fastify'
import { ItemController } from '../controllers/ItemController.js'
import { PrismaItemRepository } from '../../../infrastructure/database/prisma/PrismaItemRepository.js'
import { PrismaBossRepository } from '../../../infrastructure/database/prisma/PrismaBossRepository.js'
import { CreateItemUseCase } from '../../../application/item/create-item/CreateItemUseCase.js'
import { ListItemsUseCase } from '../../../application/item/list-items/ListItemsUseCase.js'
import { authenticate } from '../middlewares/authenticate.js'
import { requireRoles } from '../middlewares/requireRoles.js'

export async function itemRoutes(app: FastifyInstance): Promise<void> {
  const itemRepo = new PrismaItemRepository()
  const bossRepo = new PrismaBossRepository()

  const controller = new ItemController(
    new CreateItemUseCase(itemRepo, bossRepo),
    new ListItemsUseCase(itemRepo, bossRepo)
  )

  app.post('/:bossId/items', {
    preHandler: [authenticate, requireRoles('RAID_LEADER', 'OFFICER', 'ADMIN')],
  }, controller.create.bind(controller))

  app.get('/:bossId/items', {
    preHandler: [authenticate],
  }, controller.list.bind(controller))
}
