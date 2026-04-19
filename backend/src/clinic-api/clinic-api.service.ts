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

export interface UpsertPersonPayload {
  cpf: string
  name: string
  email: string
  phone?: string
  password: string
}

export interface UpsertPersonResponse {
  person: {
    personId: string
    cpf: string
    name: string
    email: string
    phone: string | null
    active: boolean
  }
  reused: boolean
}

export type ClinicUserRole = 'ADMIN' | 'PROFESSIONAL' | 'RECEPTIONIST'

export interface LinkClinicUserPayload {
  personId: string
  role?: ClinicUserRole
}

export interface LinkClinicUserResponse {
  organizationUserId: string
  reused: boolean
}

export interface ClinicUserSummary {
  organizationUserId: string
  personId: string
  cpf: string
  name: string
  email: string
  phone: string | null
  role: ClinicUserRole
  linkActive: boolean
  personActive: boolean
  createdAt: string
}

export interface UpdateClinicUserPayload {
  active?: boolean
  role?: ClinicUserRole
}

export interface UpdateClinicUserResponse {
  organizationUserId: string
  active: boolean
  role: ClinicUserRole
}

@Injectable()
export class ClinicApiService {
  private readonly logger = new Logger(ClinicApiService.name)

  constructor(private readonly config: ConfigService) {}

  private get baseUrl(): string {
    return this.config.getOrThrow<string>('CLINIC_API_URL')
  }

  // CLINIC_INTERNAL_API_KEY is a static shared secret. Rotate every 90 days or
  // immediately if compromised. See .env.example for the rotation procedure.
  // Future improvement: replace with short-lived machine-to-machine JWT tokens.
  private get headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-internal-api-key': this.config.getOrThrow<string>('CLINIC_INTERNAL_API_KEY'),
    }
  }

  // Builds an absolute URL against CLINIC_API_URL while ensuring that no
  // dynamic segment can escape the configured origin or traverse the path.
  // Each segment is URI-encoded and the final origin must match the base.
  private buildUrl(template: TemplateStringsArray, ...segments: string[]): string {
    let path = template[0]
    for (let i = 0; i < segments.length; i++) {
      path += encodeURIComponent(segments[i]) + template[i + 1]
    }
    const base = new URL(this.baseUrl)
    const url = new URL(base.toString().replace(/\/+$/, '') + path)
    if (url.origin !== base.origin) {
      throw new ServiceUnavailableException('URL inválida para careflow API')
    }
    return url.toString()
  }

  private async fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 5000): Promise<Response> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(url, { ...options, signal: controller.signal })
      return res
    } catch {
      throw new ServiceUnavailableException('careflow API indisponível')
    } finally {
      clearTimeout(timeout)
    }
  }

  async createClinic(payload: CreateClinicPayload): Promise<CreateClinicResponse> {
    this.logger.log(`Creating clinic: ${payload.name}`)

    const res = await this.fetchWithTimeout(this.buildUrl`/api/internal/clinics`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(payload),
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

    const res = await this.fetchWithTimeout(this.buildUrl`/api/internal/clinics`, {
      method: 'GET',
      headers: this.headers,
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

    const res = await this.fetchWithTimeout(this.buildUrl`/api/internal/clinics/${clinicId}/access`, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify({ status, ...limits }),
    })

    if (!res.ok) {
      const body = await res.text()
      this.logger.error(`updateClinicAccess failed [${res.status}]: ${body}`)
      throw new ServiceUnavailableException(`Erro ao atualizar acesso no careflow: ${res.status}`)
    }
  }

  async upsertPerson(payload: UpsertPersonPayload): Promise<UpsertPersonResponse> {
    this.logger.log(`Upserting person cpf=${payload.cpf}`)

    const res = await this.fetchWithTimeout(this.buildUrl`/api/internal/persons`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const body = await res.text()
      this.logger.error(`upsertPerson failed [${res.status}]: ${body}`)
      throw new ServiceUnavailableException(`Erro ao registrar responsável no careflow: ${res.status}`)
    }

    return res.json() as Promise<UpsertPersonResponse>
  }

  async linkPersonToClinic(
    clinicId: string,
    payload: LinkClinicUserPayload,
  ): Promise<LinkClinicUserResponse> {
    this.logger.log(`Linking person ${payload.personId} → clinic ${clinicId} (role=${payload.role ?? 'ADMIN'})`)

    const res = await this.fetchWithTimeout(
      this.buildUrl`/api/internal/clinics/${clinicId}/users`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload),
      },
    )

    if (!res.ok) {
      const body = await res.text()
      this.logger.error(`linkPersonToClinic failed [${res.status}]: ${body}`)
      throw new ServiceUnavailableException(`Erro ao vincular responsável à clínica: ${res.status}`)
    }

    return res.json() as Promise<LinkClinicUserResponse>
  }

  async listClinicUsers(clinicId: string): Promise<ClinicUserSummary[]> {
    this.logger.log(`Listing users of clinic ${clinicId}`)

    const res = await this.fetchWithTimeout(
      this.buildUrl`/api/internal/clinics/${clinicId}/users`,
      { method: 'GET', headers: this.headers },
    )

    if (!res.ok) {
      const body = await res.text()
      this.logger.error(`listClinicUsers failed [${res.status}]: ${body}`)
      throw new ServiceUnavailableException(`Erro ao listar usuários da clínica: ${res.status}`)
    }

    return res.json() as Promise<ClinicUserSummary[]>
  }

  async updateClinicUser(
    clinicId: string,
    organizationUserId: string,
    payload: UpdateClinicUserPayload,
  ): Promise<UpdateClinicUserResponse> {
    this.logger.log(`Updating clinic user ${organizationUserId} (clinic=${clinicId})`)

    const res = await this.fetchWithTimeout(
      this.buildUrl`/api/internal/clinics/${clinicId}/users/${organizationUserId}`,
      { method: 'PATCH', headers: this.headers, body: JSON.stringify(payload) },
    )

    if (!res.ok) {
      const body = await res.text()
      this.logger.error(`updateClinicUser failed [${res.status}]: ${body}`)
      throw new ServiceUnavailableException(`Erro ao atualizar usuário da clínica: ${res.status}`)
    }

    return res.json() as Promise<UpdateClinicUserResponse>
  }

  async resetClinicUserPassword(
    clinicId: string,
    organizationUserId: string,
    password: string,
  ): Promise<void> {
    this.logger.log(`Resetting password for clinic user ${organizationUserId}`)

    const res = await this.fetchWithTimeout(
      this.buildUrl`/api/internal/clinics/${clinicId}/users/${organizationUserId}/reset-password`,
      { method: 'POST', headers: this.headers, body: JSON.stringify({ password }) },
    )

    if (!res.ok) {
      const body = await res.text()
      this.logger.error(`resetClinicUserPassword failed [${res.status}]: ${body}`)
      throw new ServiceUnavailableException(`Erro ao resetar senha: ${res.status}`)
    }
  }
}
