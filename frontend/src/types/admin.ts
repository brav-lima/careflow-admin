export type AdminRole = 'SUPER_ADMIN' | 'FINANCE' | 'SUPPORT'
export type OrgStatus = 'ACTIVE' | 'SUSPENDED' | 'CANCELED'
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED'
export type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELED'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: AdminRole
  createdAt: string
}

export interface Organization {
  id: string
  name: string
  document: string
  email: string
  phone: string | null
  status: OrgStatus
  clinicDbId: string | null
  createdAt: string
  updatedAt: string
}

export interface Plan {
  id: string
  name: string
  priceMonthly: number
  maxUsers: number
  maxPatients: number
  features: Record<string, boolean> | null
  isActive: boolean
  createdAt: string
}

export interface Subscription {
  id: string
  organizationId: string
  planId: string
  status: SubscriptionStatus
  startDate: string
  endDate: string | null
  trialEndsAt: string | null
  createdAt: string
  organization?: Organization
  plan?: Plan
}

export interface Invoice {
  id: string
  subscriptionId: string
  amount: number
  status: InvoiceStatus
  dueDate: string
  paidAt: string | null
  externalReference: string | null
  notes: string | null
  createdAt: string
  subscription?: Subscription & { organization: Organization; plan: Plan }
}

export interface MetricsSummary {
  mrr: number
  activeOrgs: number
  trialOrgs: number
  suspendedOrgs: number
  overdueInvoices: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
}
