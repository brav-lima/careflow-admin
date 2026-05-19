import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { ClinicApiService } from '../../clinic-api/clinic-api.service'
import { OrgEventService } from './org-event.service'

@Injectable()
export class ChangePlanAdminUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clinicApi: ClinicApiService,
    private readonly orgEvents: OrgEventService,
  ) {}

  async execute(organizationId: string, planId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
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
    if (!newPlan || !newPlan.isActive) throw new NotFoundException('Plano não encontrado ou inativo')

    await this.prisma.subscription.update({
      where: { id: current.id },
      data: { planId, status: 'ACTIVE', trialEndsAt: null, endDate: null },
    })

    if (org.clinicExternalId) {
      await this.clinicApi.updateClinicAccess(org.clinicExternalId, 'ACTIVE', {
        maxUsers: newPlan.maxUsers,
        maxPatients: newPlan.maxPatients,
      })
    }

    await this.orgEvents.record(organizationId, 'PLAN_CHANGED', {
      from: current.planId,
      to: planId,
      planName: newPlan.name,
    })

    return { ok: true, planId, planName: newPlan.name }
  }
}
