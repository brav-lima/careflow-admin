import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ClinicApiService } from '../clinic-api/clinic-api.service'

@Injectable()
export class ClinicExtService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clinicApi: ClinicApiService,
  ) {}

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

  async changePlan(clinicId: string, planId: string) {
    const org = await this.prisma.organization.findFirst({
      where: { clinicExternalId: clinicId },
      include: {
        subscriptions: {
          where: { status: { in: ['TRIAL', 'ACTIVE'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!org) throw new NotFoundException('Organização não encontrada')

    const current = org.subscriptions[0]
    if (!current) throw new BadRequestException('Nenhuma assinatura ativa encontrada')
    if (current.planId === planId) throw new BadRequestException('Plano já é o plano atual')

    const newPlan = await this.prisma.plan.findUnique({ where: { id: planId } })
    if (!newPlan || !newPlan.isActive) throw new NotFoundException('Plano não encontrado')

    await this.prisma.subscription.update({
      where: { id: current.id },
      data: {
        planId,
        status: 'ACTIVE',
        trialEndsAt: null,
        startDate: new Date(),
        endDate: null,
      },
    })

    await this.clinicApi.updateClinicAccess(clinicId, 'ACTIVE', {
      maxUsers: newPlan.maxUsers,
      maxPatients: newPlan.maxPatients,
    })

    return { ok: true, planId, planName: newPlan.name }
  }

  async cancelSubscription(clinicId: string) {
    const org = await this.prisma.organization.findFirst({
      where: { clinicExternalId: clinicId },
      include: {
        subscriptions: {
          where: { status: { in: ['TRIAL', 'ACTIVE'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!org) throw new NotFoundException('Organização não encontrada')

    const current = org.subscriptions[0]
    if (!current) throw new BadRequestException('Nenhuma assinatura ativa encontrada')

    // Grace period of 30 days before access should be reviewed
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 30)

    await this.prisma.subscription.update({
      where: { id: current.id },
      data: { status: 'CANCELED', endDate },
    })

    return { ok: true, endDate }
  }
}
