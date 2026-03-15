import type { IReservationFormRepository } from '../../../domain/reservation-form/repositories/IReservationFormRepository.js'
import {
  ReservationForm,
  type ReservationFormStatusValue,
} from '../../../domain/reservation-form/entities/ReservationForm.js'
import type { UniqueEntityId } from '../../../domain/_shared/UniqueEntityId.js'
import { prisma } from './PrismaService.js'

function toEntity(raw: {
  id: string
  weekOf: Date
  opensAt: Date
  closesAt: Date
  status: string
  createdAt: Date
  updatedAt: Date
}): ReservationForm {
  return ReservationForm.reconstitue({
    id: raw.id,
    weekOf: raw.weekOf,
    opensAt: raw.opensAt,
    closesAt: raw.closesAt,
    status: raw.status as ReservationFormStatusValue,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  })
}

export class PrismaReservationFormRepository implements IReservationFormRepository {
  async findById(id: UniqueEntityId): Promise<ReservationForm | null> {
    const raw = await prisma.reservationForm.findUnique({ where: { id: id.value } })
    if (!raw) return null
    return toEntity(raw)
  }

  async findAll(): Promise<ReservationForm[]> {
    const raws = await prisma.reservationForm.findMany({ orderBy: { weekOf: 'asc' } })
    return raws.map(toEntity)
  }

  async findByWeekOf(weekOf: Date): Promise<ReservationForm | null> {
    const raw = await prisma.reservationForm.findUnique({ where: { weekOf } })
    if (!raw) return null
    return toEntity(raw)
  }

  async findCurrentOpen(): Promise<ReservationForm | null> {
    const raw = await prisma.reservationForm.findFirst({
      where: { status: 'OPEN', closesAt: { gt: new Date() } },
    })
    if (!raw) return null
    return toEntity(raw)
  }

  async save(form: ReservationForm): Promise<void> {
    await prisma.reservationForm.upsert({
      where: { id: form.id.value },
      create: {
        id: form.id.value,
        weekOf: form.weekOf,
        opensAt: form.opensAt,
        closesAt: form.closesAt,
        status: form.status,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
      },
      update: {
        opensAt: form.opensAt,
        closesAt: form.closesAt,
        status: form.status,
        updatedAt: form.updatedAt,
      },
    })
  }

  async delete(id: UniqueEntityId): Promise<void> {
    await prisma.reservationForm.delete({ where: { id: id.value } })
  }
}
