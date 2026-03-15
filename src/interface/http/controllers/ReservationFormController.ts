import { z } from 'zod'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { GetCurrentReservationFormUseCase } from '../../../application/reservation-form/get-current/GetCurrentReservationFormUseCase.js'
import { NoOpenFormError } from '../../../application/reservation-form/get-current/GetCurrentReservationFormUseCase.js'
import type { CreateFormReserveUseCase } from '../../../application/reservation-form/create-reserve/CreateFormReserveUseCase.js'
import {
  FormNotFoundError as CreateFormNotFoundError,
  FormClosedError,
  NotAttendedError,
  ItemNotFoundError,
  ReservationAlreadyExistsError,
  NoActiveCharacterError,
} from '../../../application/reservation-form/create-reserve/CreateFormReserveUseCase.js'
import type { ListFormReservationsUseCase } from '../../../application/reservation-form/list-reservations/ListFormReservationsUseCase.js'
import { FormNotFoundError as ListFormNotFoundError } from '../../../application/reservation-form/list-reservations/ListFormReservationsUseCase.js'

const createReserveBodySchema = z.object({
  itemId: z.string().uuid('itemId must be a valid UUID'),
  bossId: z.string().uuid('bossId must be a valid UUID'),
})

export class ReservationFormController {
  constructor(
    private readonly getCurrentForm: GetCurrentReservationFormUseCase,
    private readonly createReserve: CreateFormReserveUseCase,
    private readonly listReservations: ListFormReservationsUseCase
  ) {}

  async getCurrent(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const output = await this.getCurrentForm.execute({
        userId: request.user.userId,
      })
      reply.send(output)
    } catch (err) {
      if (err instanceof NoOpenFormError) {
        reply.status(404).send({ message: err.message })
        return
      }
      throw err
    }
  }

  async reserve(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { formId } = request.params as { formId: string }

    const result = createReserveBodySchema.safeParse(request.body)
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
      const output = await this.createReserve.execute({
        formId,
        bossId: result.data.bossId,
        itemId: result.data.itemId,
        userId: request.user.userId,
      })
      reply.status(201).send(output)
    } catch (err) {
      if (err instanceof CreateFormNotFoundError) {
        reply.status(404).send({ error: err.message })
        return
      }
      if (err instanceof FormClosedError) {
        reply.status(400).send({ error: err.message })
        return
      }
      if (err instanceof NotAttendedError) {
        reply.status(403).send({ error: err.message })
        return
      }
      if (err instanceof ItemNotFoundError) {
        reply.status(404).send({ error: err.message })
        return
      }
      if (err instanceof ReservationAlreadyExistsError) {
        reply.status(409).send({ error: err.message })
        return
      }
      if (err instanceof NoActiveCharacterError) {
        reply.status(422).send({ error: err.message })
        return
      }
      throw err
    }
  }

  async getReservations(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { formId } = request.params as { formId: string }

    try {
      const output = await this.listReservations.execute({ formId })
      reply.send(output)
    } catch (err) {
      if (err instanceof ListFormNotFoundError) {
        reply.status(404).send({ error: err.message })
        return
      }
      throw err
    }
  }
}
