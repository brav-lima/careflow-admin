import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { IOrganizationRepository, ListOrganizationsFilter } from '../domain/organization.repository'
import { Organization } from '../domain/organization.entity'

@Injectable()
export class PrismaOrganizationRepository implements IOrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Organization | null> {
    return this.prisma.organization.findUnique({ where: { id } }) as Promise<Organization | null>
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
      this.prisma.organization.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.organization.count({ where }),
    ])

    return { data: data as Organization[], total }
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
