import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { IOrganizationRepository, ListOrganizationsFilter } from '../domain/organization.repository'
import { Organization } from '../domain/organization.entity'

@Injectable()
export class PrismaOrganizationRepository implements IOrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly activeSubInclude = {
    subscriptions: {
      where: { status: { in: ['ACTIVE', 'TRIAL'] as ['ACTIVE', 'TRIAL'] } },
      include: { plan: { select: { priceMonthly: true } } },
      take: 1,
    },
  } as const

  private computeMrr(subs: { plan: { priceMonthly: unknown } }[]): number | null {
    return subs[0]?.plan ? Number(subs[0].plan.priceMonthly) : null
  }

  async findById(id: string): Promise<Organization | null> {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: this.activeSubInclude,
    })
    if (!org) return null
    const { subscriptions, ...rest } = org
    return { ...rest, mrr: this.computeMrr(subscriptions) }
  }

  async findAll(filter: ListOrganizationsFilter): Promise<{ data: Organization[]; total: number }> {
    const { status, search, page = 1, limit = 20 } = filter
    const skip = (page - 1) * limit

    const where = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { document: { contains: search } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.organization.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: this.activeSubInclude,
      }),
      this.prisma.organization.count({ where }),
    ])

    return {
      data: data.map(({ subscriptions, ...org }) => ({
        ...org,
        mrr: this.computeMrr(subscriptions),
      })),
      total,
    }
  }

  async create(data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Promise<Organization> {
    return this.prisma.organization.create({ data }) as Promise<Organization>
  }

  async update(id: string, data: Partial<Organization>): Promise<Organization> {
    return this.prisma.organization.update({ where: { id }, data }) as Promise<Organization>
  }

  async delete(id: string): Promise<void> {
    await this.prisma.organization.delete({ where: { id } })
  }
}
