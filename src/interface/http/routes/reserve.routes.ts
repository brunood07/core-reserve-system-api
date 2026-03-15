import type { FastifyInstance } from 'fastify'
import { ReserveController } from '../controllers/ReserveController.js'
import { PrismaReserveRepository } from '../../../infrastructure/database/prisma/PrismaReserveRepository.js'
import { PrismaRaidRepository } from '../../../infrastructure/database/prisma/PrismaRaidRepository.js'
import { PrismaCharacterRepository } from '../../../infrastructure/database/prisma/PrismaCharacterRepository.js'
import { CreateReserveUseCase } from '../../../application/reserve/create-reserve/CreateReserveUseCase.js'
import { CancelReserveUseCase } from '../../../application/reserve/cancel-reserve/CancelReserveUseCase.js'
import { ListReservesByRaidUseCase } from '../../../application/reserve/list-reserves-by-raid/ListReservesByRaidUseCase.js'

export async function reserveRoutes(app: FastifyInstance): Promise<void> {
  const reserveRepo = new PrismaReserveRepository()
  const controller = new ReserveController(
    new CreateReserveUseCase(reserveRepo, new PrismaRaidRepository(), new PrismaCharacterRepository()),
    new CancelReserveUseCase(reserveRepo),
    new ListReservesByRaidUseCase(reserveRepo)
  )

  app.post('/', controller.create.bind(controller))
  app.delete('/:id', controller.cancel.bind(controller))
  app.get('/raid/:raidId', controller.listByRaidId.bind(controller))
}
