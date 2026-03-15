import type { FastifyInstance } from 'fastify'
import { ReservationController } from '../controllers/ReservationController.js'
import { PrismaReserveRepository } from '../../../infrastructure/database/prisma/PrismaReserveRepository.js'
import { PrismaReservationFormRepository } from '../../../infrastructure/database/prisma/PrismaReservationFormRepository.js'
import { PrismaRaidRepository } from '../../../infrastructure/database/prisma/PrismaRaidRepository.js'
import { PrismaCharacterRepository } from '../../../infrastructure/database/prisma/PrismaCharacterRepository.js'
import { PrismaBossRepository } from '../../../infrastructure/database/prisma/PrismaBossRepository.js'
import { PrismaItemRepository } from '../../../infrastructure/database/prisma/PrismaItemRepository.js'
import { DeleteReservationUseCase } from '../../../application/reservation/delete-reservation/DeleteReservationUseCase.js'
import { UpdateReservationUseCase } from '../../../application/reservation/update-reservation/UpdateReservationUseCase.js'
import { authenticate } from '../middlewares/authenticate.js'

export async function reservationRoutes(app: FastifyInstance): Promise<void> {
  const reserveRepo = new PrismaReserveRepository()
  const formRepo = new PrismaReservationFormRepository()
  const raidRepo = new PrismaRaidRepository()
  const characterRepo = new PrismaCharacterRepository()
  const bossRepo = new PrismaBossRepository()
  const itemRepo = new PrismaItemRepository()

  const controller = new ReservationController(
    new DeleteReservationUseCase(reserveRepo, formRepo, raidRepo, characterRepo),
    new UpdateReservationUseCase(reserveRepo, formRepo, raidRepo, characterRepo, bossRepo, itemRepo)
  )

  const authGuard = { preHandler: [authenticate] }

  app.delete('/:id', authGuard, controller.remove.bind(controller))
  app.put('/:id', authGuard, controller.update.bind(controller))
}
