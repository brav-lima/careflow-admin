import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { formatDate, formatCNPJ } from '@/lib/utils'
import type { Organization, OrgStatus, PaginatedResponse } from '@/types/admin'
import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateOrganizationModal } from '@/components/organizations/CreateOrganizationModal'

const statusLabel: Record<OrgStatus, { label: string; className: string }> = {
  ACTIVE: { label: 'Ativa', className: 'bg-green-100 text-green-700' },
  SUSPENDED: { label: 'Suspensa', className: 'bg-yellow-100 text-yellow-700' },
  CANCELED: { label: 'Cancelada', className: 'bg-red-100 text-red-700' },
}

export function OrganizationsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<OrgStatus | ''>('')

  const { data, isLoading } = useQuery<PaginatedResponse<Organization>>({
    queryKey: ['organizations', search, status],
    queryFn: () =>
      api
        .get('/organizations', { params: { search: search || undefined, status: status || undefined } })
        .then((r) => r.data),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Organizações</h1>
        <CreateOrganizationModal />
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Buscar por nome, CNPJ ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm flex-1 max-w-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as OrgStatus | '')}
          className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Todos os status</option>
          <option value="ACTIVE">Ativa</option>
          <option value="SUSPENDED">Suspensa</option>
          <option value="CANCELED">Cancelada</option>
        </select>
      </div>

      {isLoading ? (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                {['Nome', 'CNPJ', 'Email', 'Status', 'Cadastro'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b last:border-0">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Nome</th>
                <th className="text-left px-4 py-3 font-medium">CNPJ</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((org) => {
                const s = statusLabel[org.status]
                return (
                  <tr key={org.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <Link to={`/organizations/${org.id}`} className="font-medium hover:underline text-primary">
                        {org.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatCNPJ(org.document)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{org.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.className}`}>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(org.createdAt)}</td>
                  </tr>
                )
              })}
              {data?.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhuma organização encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {data && (
        <p className="text-xs text-muted-foreground">{data.total} organização(ões) encontrada(s)</p>
      )}
    </div>
  )
}
