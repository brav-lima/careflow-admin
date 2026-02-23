export type OrgStatus = 'ACTIVE' | 'SUSPENDED' | 'CANCELED'

export interface Organization {
  id: string
  name: string
  document: string
  email: string
  phone: string | null
  status: OrgStatus
  clinicExternalId: string | null
  createdAt: Date
  updatedAt: Date
}
