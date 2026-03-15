import type { FastifyInstance } from 'fastify'
import { ReservationFormController } from '../controllers/ReservationFormController.js'
import { PrismaReservationFormRepository } from '../../../infrastructure/database/prisma/PrismaReservationFormRepository.js'
import { PrismaRaidRepository } from '../../../infrastructure/database/prisma/PrismaRaidRepository.js'
import { PrismaRaidAttendanceRepository } from '../../../infrastructure/database/prisma/PrismaRaidAttendanceRepository.js'
import { PrismaCharacterRepository } from '../../../infrastructure/database/prisma/PrismaCharacterRepository.js'
import { PrismaReserveRepository } from '../../../infrastructure/database/prisma/PrismaReserveRepository.js'
import { PrismaBossRepository } from '../../../infrastructure/database/prisma/PrismaBossRepository.js'
import { PrismaItemRepository } from '../../../infrastructure/database/prisma/PrismaItemRepository.js'
import { GetCurrentReservationFormUseCase } from '../../../application/reservation-form/get-current/GetCurrentReservationFormUseCase.js'
import { CreateFormReserveUseCase } from '../../../application/reservation-form/create-reserve/CreateFormReserveUseCase.js'
import { ListFormReservationsUseCase } from '../../../application/reservation-form/list-reservations/ListFormReservationsUseCase.js'
import { authenticate } from '../middlewares/authenticate.js'
import { requireRoles } from '../middlewares/requireRoles.js'

export async function reservationFormRoutes(app: FastifyInstance): Promise<void> {
  const formRepo = new PrismaReservationFormRepository()
  const raidRepo = new PrismaRaidRepository()
  const attendanceRepo = new PrismaRaidAttendanceRepository()
  const characterRepo = new PrismaCharacterRepository()
  const reserveRepo = new PrismaReserveRepository()
  const bossRepo = new PrismaBossRepository()
  const itemRepo = new PrismaItemRepository()

  const controller = new ReservationFormController(
    new GetCurrentReservationFormUseCase(
      formRepo,
      raidRepo,
      attendanceRepo,
      characterRepo,
      reserveRepo,
      bossRepo
    ),
    new CreateFormReserveUseCase(
      formRepo,
      raidRepo,
      attendanceRepo,
      characterRepo,
      reserveRepo,
      bossRepo,
      itemRepo
    ),
    new ListFormReservationsUseCase(
      formRepo,
      raidRepo,
      attendanceRepo,
      bossRepo,
      reserveRepo
    )
  )

  const authGuard = { preHandler: [authenticate] }
  const leaderGuard = { preHandler: [authenticate, requireRoles('RAID_LEADER', 'OFFICER', 'ADMIN')] }

  app.get('/current', authGuard, controller.getCurrent.bind(controller))
  app.post('/:formId/reserve', authGuard, controller.reserve.bind(controller))
  app.get('/:formId/reservations', leaderGuard, controller.getReservations.bind(controller))
}
