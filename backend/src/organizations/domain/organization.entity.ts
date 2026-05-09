export type OrgStatus = 'ACTIVE' | 'SUSPENDED' | 'CANCELED'
export type DocumentType = 'CNPJ' | 'CPF'

export interface Organization {
  id: string
  name: string
  document: string
  documentType: DocumentType
  email: string
  phone: string | null
  status: OrgStatus
  clinicExternalId: string | null
  createdAt: Date
  updatedAt: Date
}
