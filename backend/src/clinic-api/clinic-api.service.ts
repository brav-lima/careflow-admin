import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

export type ClinicAccessStatus = 'ACTIVE' | 'BLOCKED'

export interface CreateClinicPayload {
  name: string
  document: string // CNPJ
  email: string
  phone?: string
}

export interface CreateClinicResponse {
  clinicId: string
}

export interface ClinicSummary {
  clinicId: string
  name: string
  document: string | null
  email: string | null
  phone: string | null
  accessStatus: 'ACTIVE' | 'BLOCKED'
}

@Injectable()
export class ClinicApiService {
  private readonly logger = new Logger(ClinicApiService.name)

  constructor(private readonly config: ConfigService) {}

  private get baseUrl(): string {
    return this.config.getOrThrow<string>('CLINIC_API_URL')
  }

  private get headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-internal-api-key': this.config.getOrThrow<string>('CLINIC_INTERNAL_API_KEY'),
    }
  }

  async createClinic(payload: CreateClinicPayload): Promise<CreateClinicResponse> {
    this.logger.log(`Creating clinic: ${payload.name}`)

    const res = await fetch(`${this.baseUrl}/internal/clinics`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(payload),
    }).catch(() => {
      throw new ServiceUnavailableException('careflow API indisponível')
    })

    if (!res.ok) {
      const body = await res.text()
      this.logger.error(`createClinic failed [${res.status}]: ${body}`)
      throw new ServiceUnavailableException(`Erro ao criar clínica no careflow: ${res.status}`)
    }

    return res.json() as Promise<CreateClinicResponse>
  }

  async listClinics(): Promise<ClinicSummary[]> {
    this.logger.log('Listing clinics from careflow')

    const res = await fetch(`${this.baseUrl}/internal/clinics`, {
      method: 'GET',
      headers: this.headers,
    }).catch(() => {
      throw new ServiceUnavailableException('careflow API indisponível')
    })

    if (!res.ok) {
      const body = await res.text()
      this.logger.error(`listClinics failed [${res.status}]: ${body}`)
      throw new ServiceUnavailableException(`Erro ao listar clínicas do careflow: ${res.status}`)
    }

    return res.json() as Promise<ClinicSummary[]>
  }

  async updateClinicAccess(
    clinicId: string,
    status: ClinicAccessStatus,
    limits?: { maxUsers: number; maxPatients: number },
  ): Promise<void> {
    this.logger.log(
      `Updating clinic ${clinicId} access → ${status}` +
        (limits ? ` (maxUsers=${limits.maxUsers}, maxPatients=${limits.maxPatients})` : ''),
    )

    const res = await fetch(`${this.baseUrl}/internal/clinics/${clinicId}/access`, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify({ status, ...limits }),
    }).catch(() => {
      throw new ServiceUnavailableException('careflow API indisponível')
    })

    if (!res.ok) {
      const body = await res.text()
      this.logger.error(`updateClinicAccess failed [${res.status}]: ${body}`)
      throw new ServiceUnavailableException(`Erro ao atualizar acesso no careflow: ${res.status}`)
    }
  }
}
