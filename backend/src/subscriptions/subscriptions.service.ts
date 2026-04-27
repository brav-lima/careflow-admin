import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ClinicApiService } from '../clinic-api/clinic-api.service'
import { CreateSubscriptionDto } from './dto/create-subscription.dto'

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clinicApi: ClinicApiService,
  ) {}

  findAll(orgId?: string, status?: string) {
    return this.prisma.subscription.findMany({
      where: {
        ...(orgId && { organizationId: orgId }),
        ...(status && { status: status as any }),
      },
      include: { plan: true, organization: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { id },
      include: { plan: true, organization: true, invoices: { orderBy: { dueDate: 'desc' } } },
    })
    if (!sub) throw new NotFoundException('Assinatura não encontrada')
    return sub
  }

  async create(dto: CreateSubscriptionDto) {
    const subscription = await this.prisma.subscription.create({
      data: {
        organizationId: dto.organizationId,
        planId: dto.planId,
        status: dto.trialEndsAt ? 'TRIAL' : 'ACTIVE',
        startDate: new Date(),
        trialEndsAt: dto.trialEndsAt ? new Date(dto.trialEndsAt) : null,
      },
      include: { plan: true, organization: true },
    })

    // Propaga limites do plano ao pelvi-ui
    if (subscription.organization.clinicExternalId) {
      await this.clinicApi.updateClinicAccess(
        subscription.organization.clinicExternalId,
        'ACTIVE',
        {
          maxUsers: subscription.plan.maxUsers,
          maxPatients: subscription.plan.maxPatients,
        },
      )
    }

    return subscription
  }

  async cancel(id: string) {
    await this.findOne(id)
    return this.prisma.subscription.update({
      where: { id },
      data: { status: 'CANCELED', endDate: new Date() },
    })
  }

  async update(id: string, data: Partial<CreateSubscriptionDto>) {
    await this.findOne(id)
    return this.prisma.subscription.update({ where: { id }, data })
  }
}
