import { z } from 'zod'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { DeleteReservationUseCase } from '../../../application/reservation/delete-reservation/DeleteReservationUseCase.js'
import {
  ReserveNotFoundError as DeleteNotFoundError,
  ReserveNotInOpenFormError as DeleteNotInFormError,
  ForbiddenError as DeleteForbiddenError,
} from '../../../application/reservation/delete-reservation/DeleteReservationUseCase.js'
import type { UpdateReservationUseCase } from '../../../application/reservation/update-reservation/UpdateReservationUseCase.js'
import {
  ReserveNotFoundError as UpdateNotFoundError,
  ReserveNotInOpenFormError as UpdateNotInFormError,
  ForbiddenError as UpdateForbiddenError,
  ItemNotFoundError as UpdateItemNotFoundError,
} from '../../../application/reservation/update-reservation/UpdateReservationUseCase.js'
import type { GetWeekSummaryUseCase } from '../../../application/reservation/get-week-summary/GetWeekSummaryUseCase.js'

const updateBodySchema = z.object({
  itemId: z.string().uuid('itemId must be a valid UUID'),
  bossId: z.string().uuid('bossId must be a valid UUID'),
})

export class ReservationController {
  constructor(
    private readonly deleteReservation: DeleteReservationUseCase,
    private readonly updateReservation: UpdateReservationUseCase,
    private readonly getWeekSummary: GetWeekSummaryUseCase
  ) {}

  async weekSummary(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const output = await this.getWeekSummary.execute()
    reply.send(output)
  }

  async remove(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string }

    try {
      const output = await this.deleteReservation.execute({
        reserveId: id,
        requestingUserId: request.user.userId,
        requestingUserRole: request.user.role,
      })
      reply.send(output)
    } catch (err) {
      if (err instanceof DeleteNotFoundError) {
        reply.status(404).send({ error: err.message })
        return
      }
      if (err instanceof DeleteNotInFormError) {
        reply.status(400).send({ error: err.message })
        return
      }
      if (err instanceof DeleteForbiddenError) {
        reply.status(403).send({ error: err.message })
        return
      }
      throw err
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string }

    const result = updateBodySchema.safeParse(request.body)
    if (!result.success) {
      reply.status(400).send({
        error: 'Validation failed',
        details: result.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      })
      return
    }

    try {
      const output = await this.updateReservation.execute({
        reserveId: id,
        bossId: result.data.bossId,
        itemId: result.data.itemId,
        requestingUserId: request.user.userId,
        requestingUserRole: request.user.role,
      })
      reply.send(output)
    } catch (err) {
      if (err instanceof UpdateNotFoundError) {
        reply.status(404).send({ error: err.message })
        return
      }
      if (err instanceof UpdateNotInFormError) {
        reply.status(400).send({ error: err.message })
        return
      }
      if (err instanceof UpdateForbiddenError) {
        reply.status(403).send({ error: err.message })
        return
      }
      if (err instanceof UpdateItemNotFoundError) {
        reply.status(404).send({ error: err.message })
        return
      }
      throw err
    }
  }
}
