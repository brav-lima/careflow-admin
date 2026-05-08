import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class ResolveTrialPlan {
  private readonly logger = new Logger(ResolveTrialPlan.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async planId(): Promise<string> {
    const fromEnv = this.config.get<string>('TRIAL_PLAN_ID')
    if (fromEnv) return fromEnv

    const plan = await this.prisma.plan.findFirst({
      where: { name: { contains: 'Trial', mode: 'insensitive' }, isActive: true },
    })

    if (!plan) {
      this.logger.warn('Nenhum plano de trial encontrado. Configure TRIAL_PLAN_ID ou crie um plano com nome "Trial".')
      throw new Error('Plano de trial não encontrado. Configure TRIAL_PLAN_ID.')
    }

    return plan.id
  }
}
