import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreatePlanFeatureDto } from './dto/create-plan-feature.dto'
import { UpdatePlanFeatureDto } from './dto/update-plan-feature.dto'

@Injectable()
export class PlanFeaturesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(includeInactive = false) {
    return this.prisma.planFeatureDefinition.findMany({
      where: includeInactive ? undefined : { active: true },
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    })
  }

  async findOne(id: string) {
    const feature = await this.prisma.planFeatureDefinition.findUnique({ where: { id } })
    if (!feature) throw new NotFoundException('Feature não encontrada')
    return feature
  }

  async create(dto: CreatePlanFeatureDto) {
    const exists = await this.prisma.planFeatureDefinition.findUnique({ where: { key: dto.key } })
    if (exists) throw new ConflictException(`Feature com key '${dto.key}' já existe`)
    return this.prisma.planFeatureDefinition.create({ data: dto })
  }

  async update(id: string, dto: UpdatePlanFeatureDto) {
    await this.findOne(id)
    return this.prisma.planFeatureDefinition.update({ where: { id }, data: dto })
  }

  async remove(id: string) {
    await this.findOne(id)
    await this.prisma.planFeatureDefinition.delete({ where: { id } })
  }
}
