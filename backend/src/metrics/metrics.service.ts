import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const [
      activeOrgs,
      trialOrgs,
      suspendedOrgs,
      activeSubscriptions,
      overdueInvoices,
    ] = await this.prisma.$transaction([
      this.prisma.organization.count({ where: { status: 'ACTIVE' } }),
      this.prisma.subscription.count({ where: { status: 'TRIAL' } }),
      this.prisma.organization.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.subscription.findMany({
        where: { status: 'ACTIVE' },
        include: { plan: { select: { priceMonthly: true } } },
      }),
      this.prisma.invoice.count({ where: { status: 'OVERDUE' } }),
    ])

    const mrr = activeSubscriptions.reduce(
      (sum, sub) => sum + Number(sub.plan.priceMonthly),
      0,
    )

    return {
      mrr,
      activeOrgs,
      trialOrgs,
      suspendedOrgs,
      overdueInvoices,
    }
  }

  async getRevenueByYear(year: number) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        status: 'PAID',
        paidAt: {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31, 23, 59, 59),
        },
      },
      select: { amount: true, paidAt: true },
    })

    const monthly = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      revenue: 0,
    }))

    for (const invoice of invoices) {
      const month = invoice.paidAt!.getMonth()
      monthly[month].revenue += Number(invoice.amount)
    }

    return monthly
  }

  async getOrganizationsByPeriod(period: 'week' | 'month' | 'year' = 'month') {
    const now = new Date()
    const ranges = {
      week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      month: new Date(now.getFullYear(), now.getMonth() - 11, 1),
      year: new Date(now.getFullYear() - 1, 0, 1),
    }

    return this.prisma.organization.findMany({
      where: { createdAt: { gte: ranges[period] } },
      select: { id: true, name: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
  }
}
