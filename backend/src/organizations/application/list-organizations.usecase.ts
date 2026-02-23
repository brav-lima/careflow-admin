import { Injectable, Inject } from '@nestjs/common'
import { IOrganizationRepository, ORGANIZATION_REPOSITORY, ListOrganizationsFilter } from '../domain/organization.repository'

@Injectable()
export class ListOrganizationsUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly repo: IOrganizationRepository,
  ) {}

  execute(filter: ListOrganizationsFilter) {
    return this.repo.findAll(filter)
  }
}
