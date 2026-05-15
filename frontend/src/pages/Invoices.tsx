import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatDate, formatCurrency, getErrorMessage } from '@/lib/utils'
import type { Invoice, InvoiceStatus } from '@/types/admin'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/contexts/ToastContext'
import { useState } from 'react'
import { OrgAvatar, StatusPill, PlanBadge, PageHeader, Card, CardHeader, SearchInput, FilterChip, TableFooter } from '@/components/ui/ds'

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
    <path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>
  </svg>
)
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
    <path d="M12 5v14M5 12h14"/>
  </svg>
)
const ChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12 }}>
    <path d="m6 9 6 6 6-6"/>
  </svg>
)
const MoreIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
    <circle cx="5" cy="12" r=".5"/><circle cx="12" cy="12" r=".5"/><circle cx="19" cy="12" r=".5"/>
  </svg>
)
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12 }}>
    <path d="M6 6l12 12M18 6 6 18"/>
  </svg>
)
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 10, height: 10 }}>
    <path d="M5 12.5 10 17.5l9-11"/>
  </svg>
)

type StatusFilter = InvoiceStatus | 'all'

function InvStatusPill({ status }: { status: InvoiceStatus }) {
  if (status === 'PAID')     return <StatusPill tone="ok">Paga</StatusPill>
  if (status === 'PENDING')  return <StatusPill tone="warn">Pendente</StatusPill>
  if (status === 'OVERDUE')  return <StatusPill tone="danger">Vencida</StatusPill>
  return <StatusPill tone="muted">Cancelada</StatusPill>
}

function overdueAge(dueDate: string): number {
  const due = new Date(dueDate)
  const now = new Date()
  return Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
}

export function InvoicesPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const { data: invoicesResp, isLoading, error } = useQuery<{ data: Invoice[]; total: number }>({
    queryKey: ['invoices'],
    queryFn: () => api.get('/invoices').then((r) => r.data),
  })
  const allInvoices = invoicesResp?.data ?? []
  const total = invoicesResp?.total ?? 0

  const markPaid = useMutation({
    mutationFn: (id: string) => api.post(`/invoices/${id}/payments`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Fatura marcada como paga')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const overdue  = allInvoices.filter(i => i.status === 'OVERDUE')
  const pending  = allInvoices.filter(i => i.status === 'PENDING')
  const paid     = allInvoices.filter(i => i.status === 'PAID')
  const canceled = allInvoices.filter(i => i.status === 'CANCELED')

  const overdueTotal = overdue.reduce((s, i) => s + i.amount, 0)

  const bucket1to7  = overdue.filter(i => { const d = overdueAge(i.dueDate); return d >= 1 && d <= 7 })
  const bucket8to30 = overdue.filter(i => { const d = overdueAge(i.dueDate); return d > 7 && d <= 30 })
  const bucket30p   = overdue.filter(i => overdueAge(i.dueDate) > 30)

  const filtered = allInvoices.filter(inv => {
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        inv.subscription?.organization?.name?.toLowerCase().includes(q) ||
        (inv.externalReference ?? '').toLowerCase().includes(q)
      )
    }
    return true
  })

  const counts = {
    all:      allInvoices.length,
    OVERDUE:  overdue.length,
    PENDING:  pending.length,
    PAID:     paid.length,
    CANCELED: canceled.length,
  }

  const selectedList = filtered.filter(i => selected.has(i.id))
  const selectedTotal = selectedList.reduce((s, i) => s + i.amount, 0)

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (error) {
    return (
      <div style={{ borderRadius: 8, background: 'var(--danger-soft)', padding: '12px 16px', fontSize: 13, color: 'var(--danger-ink)' }}>
        Falha ao carregar faturas. Tente novamente.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Faturas"
        subtitle={
          <>
            Cobrança recorrente ·{' '}
            <span className="num" style={{ color: 'var(--danger-ink)', fontWeight: 500 }}>{overdue.length}</span> vencidas no valor de{' '}
            <span className="num" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-2)', fontWeight: 500 }}>{formatCurrency(overdueTotal)}</span>
          </>
        }
        actions={
          <>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid var(--ds-border)', background: 'var(--surface)', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: 'var(--text)', fontFamily: 'var(--font-sans)' }}>
              <DownloadIcon />Exportar
            </button>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid var(--p)', background: 'var(--p)', color: 'white', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans)', boxShadow: 'var(--shadow-brand), inset 0 1px 0 rgba(255,255,255,0.16)' }}>
              <PlusIcon />Emitir fatura
            </button>
          </>
        }
      />

      {/* Aging buckets */}
      {!isLoading && overdue.length > 0 && (
        <Card>
          <CardHeader
            title="Aging — faturas vencidas"
            subtitle="Agrupamento por idade do vencimento"
            actions={
              <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 28, padding: '0 10px', borderRadius: 6, border: '1px solid transparent', background: 'transparent', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
                Ver política de cobrança
              </button>
            }
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[
              { label: 'Total vencido', items: overdue,     highlight: true },
              { label: '1–7 dias',      items: bucket1to7 },
              { label: '8–30 dias',     items: bucket8to30 },
              { label: '30+ dias',      items: bucket30p },
            ].map((b, i) => {
              const val = b.items.reduce((s, x) => s + x.amount, 0)
              return (
                <div key={i} style={{
                  padding: '16px 20px',
                  borderRight: i < 3 ? '1px solid var(--divider)' : 0,
                  borderTop: '1px solid var(--divider)',
                  background: b.highlight ? 'linear-gradient(180deg, var(--danger-soft), transparent)' : 'transparent',
                }}>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 500 }}>{b.label}</div>
                  <div className="num" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.018em', marginTop: 4, color: 'var(--danger-ink)', fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(val)}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {b.items.length} fatura{b.items.length !== 1 ? 's' : ''}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Filter row */}
      <div className="flex items-center gap-2 flex-wrap">
        <FilterChip label="Todas"     count={counts.all}      active={statusFilter === 'all'}      onClick={() => setStatusFilter('all')} />
        <FilterChip label="Vencidas"  count={counts.OVERDUE}  active={statusFilter === 'OVERDUE'}  onClick={() => setStatusFilter('OVERDUE')} />
        <FilterChip label="Pendentes" count={counts.PENDING}  active={statusFilter === 'PENDING'}  onClick={() => setStatusFilter('PENDING')} />
        <FilterChip label="Pagas"     count={counts.PAID}     active={statusFilter === 'PAID'}     onClick={() => setStatusFilter('PAID')} />
        <FilterChip label="Canceladas"count={counts.CANCELED} active={statusFilter === 'CANCELED'} onClick={() => setStatusFilter('CANCELED')} />
        <div style={{ flex: 1 }}/>
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por organização ou referência…" />
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 12px', borderRadius: 8, border: '1px solid var(--ds-border)', background: 'var(--surface)', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: 'var(--text)' }}>
          Período: 30d <ChevronDown />
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--p-border)', background: 'var(--p-soft)', color: 'var(--p-ink)', fontSize: 13 }}>
          <span style={{ width: 18, height: 18, borderRadius: 4, background: 'var(--p)', color: 'white', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <CheckIcon />
          </span>
          <span>
            <span className="num" style={{ fontWeight: 600 }}>{selected.size}</span> faturas selecionadas ·{' '}
            <span className="num" style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(selectedTotal)}</span> totalizando
          </span>
          <span style={{ flex: 1 }}/>
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 28, padding: '0 10px', borderRadius: 6, border: '1px solid var(--ds-border)', background: 'var(--surface)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', color: 'var(--text)', fontFamily: 'var(--font-sans)' }}>
            Enviar lembrete
          </button>
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 28, padding: '0 10px', borderRadius: 6, border: '1px solid var(--ds-border)', background: 'var(--surface)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', color: 'var(--text)', fontFamily: 'var(--font-sans)' }}>
            Renegociar
          </button>
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 28, padding: '0 10px', borderRadius: 6, border: '1px solid var(--p)', background: 'var(--p)', color: 'white', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            Dar baixa em lote
          </button>
          <button onClick={() => setSelected(new Set())} style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', borderRadius: 6, border: '1px solid transparent', background: 'transparent', cursor: 'pointer', color: 'var(--p-ink)' }}>
            <XIcon />
          </button>
        </div>
      )}

      <Card style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table className="pa-tbl">
            <thead>
              <tr>
                <th style={{ width: 32 }}>
                  <input type="checkbox" style={{ accentColor: 'var(--p)' }}
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={e => setSelected(e.target.checked ? new Set(filtered.map(i => i.id)) : new Set())}
                  />
                </th>
                <th>Referência</th>
                <th>Organização</th>
                <th>Plano</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th>Pago em</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j}><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.map((inv) => {
                const isSelected = selected.has(inv.id)
                const orgName = inv.subscription?.organization?.name ?? '—'
                const planName = inv.subscription?.plan?.name
                const ageInDays = inv.status === 'OVERDUE' ? overdueAge(inv.dueDate) : null
                const daysUntilDue = inv.status === 'PENDING' ? Math.ceil((new Date(inv.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null

                return (
                  <tr key={inv.id} className={isSelected ? 'is-selected' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(inv.id)}
                        style={{ accentColor: 'var(--p)' }}
                      />
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 500 }}>
                      {inv.externalReference ?? `INV-${inv.id.slice(0, 8).toUpperCase()}`}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <OrgAvatar name={orgName} size={24} />
                        <span style={{ fontWeight: 500, color: 'var(--text)' }}>{orgName}</span>
                      </div>
                    </td>
                    <td>
                      {planName ? <PlanBadge name={planName} /> : '—'}
                    </td>
                    <td className="num" style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500 }}>
                      {formatCurrency(inv.amount)}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      <div>{formatDate(inv.dueDate)}</div>
                      {ageInDays !== null && ageInDays > 0 && (
                        <div style={{ color: 'var(--danger-ink)', fontSize: 11, marginTop: 1 }}>
                          há <span className="num">{ageInDays}</span> dias
                        </div>
                      )}
                      {daysUntilDue !== null && daysUntilDue > 0 && (
                        <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 1 }}>
                          em <span className="num">{daysUntilDue}</span> dias
                        </div>
                      )}
                    </td>
                    <td><InvStatusPill status={inv.status} /></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                      {inv.paidAt ? formatDate(inv.paidAt) : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {(inv.status === 'PENDING' || inv.status === 'OVERDUE') ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => markPaid.mutate(inv.id)}
                            disabled={markPaid.isPending}
                            style={{ display: 'inline-flex', alignItems: 'center', height: 26, padding: '0 9px', borderRadius: 5, border: '1px solid var(--ok-soft)', background: 'var(--ok-soft)', color: 'var(--ok-ink)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans)', opacity: markPaid.isPending ? 0.5 : 1 }}
                          >
                            Dar baixa
                          </button>
                          <button style={{ width: 26, height: 26, display: 'grid', placeItems: 'center', border: 0, background: 'transparent', cursor: 'pointer', borderRadius: 5, color: 'var(--text-muted)' }}>
                            <MoreIcon />
                          </button>
                        </div>
                      ) : (
                        <button style={{ width: 26, height: 26, display: 'grid', placeItems: 'center', border: 0, background: 'transparent', cursor: 'pointer', borderRadius: 5, color: 'var(--text-muted)' }}>
                          <MoreIcon />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    Nenhuma fatura encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TableFooter showing={filtered.length} total={total} />
      </Card>
    </div>
  )
}
