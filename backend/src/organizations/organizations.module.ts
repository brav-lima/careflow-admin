import { Module } from '@nestjs/common'
import { OrganizationsController } from './organizations.controller'
import { CreateOrganizationUseCase } from './application/create-organization.usecase'
import { UpdateOrgStatusUseCase } from './application/update-status.usecase'
import { ListOrganizationsUseCase } from './application/list-organizations.usecase'
import { PrismaOrganizationRepository } from './infra/prisma-organization.repository'
import { ORGANIZATION_REPOSITORY } from './domain/organization.repository'

@Module({
  controllers: [OrganizationsController],
  providers: [
    CreateOrganizationUseCase,
    UpdateOrgStatusUseCase,
    ListOrganizationsUseCase,
    {
      provide: ORGANIZATION_REPOSITORY,
      useClass: PrismaOrganizationRepository,
    },
  ],
})
export class OrganizationsModule {}
