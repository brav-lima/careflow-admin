import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ClinicExtService {
  constructor(private readonly prisma: PrismaService) {}

  async getSubscription(clinicId: string) {
    const org = await this.prisma.organization.findFirst({
      where: { clinicExternalId: clinicId },
      include: {
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!org) throw new NotFoundException('Organização não encontrada')

    const subscription = org.subscriptions[0] ?? null

    return {
      organizationId: org.id,
      clinicId,
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            trialEndsAt: subscription.trialEndsAt,
            plan: {
              id: subscription.plan.id,
              name: subscription.plan.name,
              priceMonthly: subscription.plan.priceMonthly,
              maxUsers: subscription.plan.maxUsers,
              maxPatients: subscription.plan.maxPatients,
              features: subscription.plan.features,
            },
          }
        : null,
    }
  }

  getPlans() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: 'asc' },
      select: {
        id: true,
        name: true,
        priceMonthly: true,
        maxUsers: true,
        maxPatients: true,
        features: true,
      },
    })
  }
}
