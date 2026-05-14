import { Injectable } from '@nestjs/common'
import { OrgEventType } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class OrgEventService {
  constructor(private readonly prisma: PrismaService) {}

  async record(
    organizationId: string,
    type: OrgEventType,
    payload?: Record<string, unknown>,
    actorId?: string,
  ): Promise<void> {
    await this.prisma.orgEvent.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { organizationId, type, payload: (payload as any) ?? undefined, actorId: actorId ?? null },
    })
  }

  async list(organizationId: string, limit = 20) {
    return this.prisma.orgEvent.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    })
  }
}
