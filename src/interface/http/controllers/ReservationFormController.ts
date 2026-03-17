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
import type { CreateReservationFormUseCase } from '../../../application/reservation-form/create-form/CreateReservationFormUseCase.js'
import { FormAlreadyOpenError } from '../../../application/reservation-form/create-form/CreateReservationFormUseCase.js'
import type { UpdateReservationFormUseCase } from '../../../application/reservation-form/update-form/UpdateReservationFormUseCase.js'
import { FormNotFoundError as UpdateFormNotFoundError } from '../../../application/reservation-form/update-form/UpdateReservationFormUseCase.js'

const createReserveBodySchema = z.object({
  itemId: z.string().uuid('itemId must be a valid UUID'),
  bossId: z.string().uuid('bossId must be a valid UUID'),
})

const createFormBodySchema = z.object({
  weekOf: z.string().datetime({ message: 'weekOf must be a valid ISO datetime' }),
  opensAt: z.string().datetime({ message: 'opensAt must be a valid ISO datetime' }),
  closesAt: z.string().datetime({ message: 'closesAt must be a valid ISO datetime' }),
})

const updateFormBodySchema = z.object({
  closesAt: z.string().datetime({ message: 'closesAt must be a valid ISO datetime' }),
})

export class ReservationFormController {
  constructor(
    private readonly getCurrentForm: GetCurrentReservationFormUseCase,
    private readonly createReserve: CreateFormReserveUseCase,
    private readonly listReservations: ListFormReservationsUseCase,
    private readonly createFormUseCase: CreateReservationFormUseCase,
    private readonly updateFormUseCase: UpdateReservationFormUseCase
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

  async createForm(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const result = createFormBodySchema.safeParse(request.body)
    if (!result.success) {
      reply.status(400).send({
        error: 'Validation failed',
        details: result.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      })
      return
    }

    try {
      const output = await this.createFormUseCase.execute({
        weekOf: new Date(result.data.weekOf),
        opensAt: new Date(result.data.opensAt),
        closesAt: new Date(result.data.closesAt),
      })
      reply.status(201).send(output)
    } catch (err) {
      if (err instanceof FormAlreadyOpenError) {
        reply.status(409).send({ error: err.message })
        return
      }
      throw err
    }
  }

  async updateForm(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { formId } = request.params as { formId: string }

    const result = updateFormBodySchema.safeParse(request.body)
    if (!result.success) {
      reply.status(400).send({
        error: 'Validation failed',
        details: result.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      })
      return
    }

    try {
      const output = await this.updateFormUseCase.execute({
        formId,
        closesAt: new Date(result.data.closesAt),
      })
      reply.send(output)
    } catch (err) {
      if (err instanceof UpdateFormNotFoundError) {
        reply.status(404).send({ error: err.message })
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
