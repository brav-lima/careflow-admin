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

  async updateClinicAccess(clinicId: string, status: ClinicAccessStatus): Promise<void> {
    this.logger.log(`Updating clinic ${clinicId} access → ${status}`)

    const res = await fetch(`${this.baseUrl}/internal/clinics/${clinicId}/access`, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify({ status }),
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
