import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { Prisma } from '@prisma/client'
import { CreateInvoiceDto } from './dto/create-invoice.dto'

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    subscriptionId?: string,
    status?: string,
    month?: number,
    year?: number,
    page = 1,
    limit = 50,
  ) {
    const take = Math.min(limit, 100)
    const skip = (page - 1) * take
    const where: Prisma.InvoiceWhereInput = {
      ...(subscriptionId && { subscriptionId }),
      ...(status && { status: status as Prisma.EnumInvoiceStatusFilter }),
    }

    if (month && year) {
      const start = new Date(year, month - 1, 1)
      const end = new Date(year, month, 0, 23, 59, 59)
      where.dueDate = { gte: start, lte: end }
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        where,
        include: { subscription: { include: { organization: true, plan: true } } },
        orderBy: { dueDate: 'desc' },
        take,
        skip,
      }),
      this.prisma.invoice.count({ where }),
    ])

    return { data, total, page, limit: take }
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { subscription: { include: { organization: true, plan: true } } },
    })
    if (!invoice) throw new NotFoundException('Fatura não encontrada')
    return invoice
  }

  create(dto: CreateInvoiceDto) {
    return this.prisma.invoice.create({
      data: {
        subscriptionId: dto.subscriptionId,
        amount: dto.amount,
        dueDate: new Date(dto.dueDate),
        notes: dto.notes,
      },
    })
  }

  async markPaid(id: string) {
    await this.findOne(id)
    return this.prisma.invoice.update({
      where: { id },
      data: { status: 'PAID', paidAt: new Date() },
    })
  }

  async cancel(id: string) {
    await this.findOne(id)
    return this.prisma.invoice.update({
      where: { id },
      data: { status: 'CANCELED' },
    })
  }
}
