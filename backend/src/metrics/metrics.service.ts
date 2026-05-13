import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const [activeOrgs, trialOrgs, suspendedOrgs, overdueInvoices, mrrAgg] =
      await this.prisma.$transaction([
        this.prisma.organization.count({ where: { status: 'ACTIVE' } }),
        this.prisma.subscription.count({ where: { status: 'TRIAL' } }),
        this.prisma.organization.count({ where: { status: 'SUSPENDED' } }),
        this.prisma.invoice.count({ where: { status: 'OVERDUE' } }),
        this.prisma.subscription.findMany({
          where: { status: 'ACTIVE' },
          select: { plan: { select: { priceMonthly: true } } },
          take: 10000,
        }),
      ])

    const mrr = mrrAgg.reduce((sum, sub) => sum + Number(sub.plan.priceMonthly), 0)

    return { mrr, activeOrgs, trialOrgs, suspendedOrgs, overdueInvoices }
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
      take: 10000,
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

  async getConversionFunnel(days: number) {
    const now = new Date()
    const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    const prevPeriodStart = new Date(now.getTime() - 2 * days * 24 * 60 * 60 * 1000)

    const [currentSubs, prevSubs] = await this.prisma.$transaction([
      this.prisma.subscription.findMany({
        where: { startDate: { gte: periodStart, lte: now } },
        select: {
          status: true,
          invoices: { where: { status: 'PAID' }, select: { id: true } },
        },
      }),
      this.prisma.subscription.findMany({
        where: { startDate: { gte: prevPeriodStart, lt: periodStart } },
        select: { status: true },
      }),
    ])

    const trialsStarted = currentSubs.length
    const converted = currentSubs.filter((s) => s.status === 'ACTIVE').length
    const withRecurringPayment = currentSubs.filter((s) => s.invoices.length >= 2).length

    const prevTrialsStarted = prevSubs.length
    const prevConverted = prevSubs.filter((s) => s.status === 'ACTIVE').length

    const conversionRate = trialsStarted > 0 ? (converted / trialsStarted) * 100 : 0
    const prevConversionRate = prevTrialsStarted > 0 ? (prevConverted / prevTrialsStarted) * 100 : 0
    const deltaConversionRate = conversionRate - prevConversionRate

    return {
      periodDays: days,
      trialsStarted,
      onboardingCompleted: null,
      converted,
      withRecurringPayment,
      conversionRate: Math.round(conversionRate * 10) / 10,
      deltaConversionRate: Math.round(deltaConversionRate * 10) / 10,
    }
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
      take: 500,
    })
  }
}
