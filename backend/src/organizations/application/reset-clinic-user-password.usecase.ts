import { Injectable } from '@nestjs/common'
import { ClinicApiService } from '../../clinic-api/clinic-api.service'
import { ResolveClinicId } from './resolve-clinic-id'
import { generateProvisionalPassword } from './provisional-password'
import { OrgEventService } from './org-event.service'

export interface ResetClinicUserPasswordResult {
  organizationUserId: string
  provisionalPassword: string
}

@Injectable()
export class ResetClinicUserPasswordUseCase {
  constructor(
    private readonly clinicApi: ClinicApiService,
    private readonly resolveClinicId: ResolveClinicId,
    private readonly orgEvents: OrgEventService,
  ) {}

  async execute(
    organizationId: string,
    organizationUserId: string,
  ): Promise<ResetClinicUserPasswordResult> {
    const clinicId = await this.resolveClinicId.byOrganizationId(organizationId)

    const provisionalPassword = generateProvisionalPassword()
    await this.clinicApi.resetClinicUserPassword(clinicId, organizationUserId, provisionalPassword)

    await this.orgEvents.record(organizationId, 'PASSWORD_RESET', { organizationUserId })
    return { organizationUserId, provisionalPassword }
  }
}
