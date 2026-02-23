import { Organization, OrgStatus } from './organization.entity'

export interface ListOrganizationsFilter {
  status?: OrgStatus
  search?: string
  page?: number
  limit?: number
}

export interface IOrganizationRepository {
  findById(id: string): Promise<Organization | null>
  findAll(filter: ListOrganizationsFilter): Promise<{ data: Organization[]; total: number }>
  create(data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Promise<Organization>
  update(id: string, data: Partial<Organization>): Promise<Organization>
  delete(id: string): Promise<void>
}

export const ORGANIZATION_REPOSITORY = Symbol('IOrganizationRepository')
