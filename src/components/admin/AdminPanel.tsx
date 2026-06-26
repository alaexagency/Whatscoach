import { useState } from 'react'
import { Building2, Users, ChevronDown, ChevronRight, Mail, RefreshCw } from 'lucide-react'
import { useAdminData } from '../../hooks/useAdminData'
import type { CompanyWithVendors } from '../../hooks/useAdminData'

function CompanyRow({ item }: { item: CompanyWithVendors }) {
  const [open, setOpen] = useState(false)
  const { company, vendors } = item

  const initials = company.full_name
    ? company.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : company.email[0].toUpperCase()

  return (
    <div className="border border-slate-100 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 bg-white hover:bg-slate-50 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
          {company.avatar_url
            ? <img src={company.avatar_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
            : initials
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm">{company.full_name || '—'}</p>
          <p className="text-xs text-slate-400 truncate">{company.email}</p>
        </div>
        <span className="flex items-center gap-1 bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full">
          <Users className="h-3 w-3" />
          {vendors.length} {vendors.length === 1 ? 'vendedor' : 'vendedores'}
        </span>
        {open
          ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
          : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
        }
      </button>

      {open && (
        <div className="border-t border-slate-100 bg-slate-50 divide-y divide-slate-100">
          {vendors.length === 0 ? (
            <p className="px-5 py-4 text-sm text-slate-400 italic">Sin vendedores asignados.</p>
          ) : (
            vendors.map(v => {
              const vInitials = v.full_name
                ? v.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                : v.email[0].toUpperCase()
              return (
                <div key={v.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs shrink-0">
                    {v.avatar_url
                      ? <img src={v.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      : vInitials
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700">{v.full_name || '—'}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
                      <Mail className="h-3 w-3 shrink-0" />
                      {v.email}
                    </p>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Vendedor
                  </span>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export function AdminPanel() {
  const { companies, loading, refresh } = useAdminData(true)

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-slate-400" />
          <h2 className="font-bold text-slate-800 text-sm">Empresas y vendedores</h2>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-50 disabled:opacity-40"
          title="Actualizar"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
          ))
        ) : companies.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-8">No hay empresas registradas aún.</p>
        ) : (
          companies.map(item => <CompanyRow key={item.company.id} item={item} />)
        )}
      </div>

      {!loading && companies.length > 0 && (
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-400">
            {companies.length} {companies.length === 1 ? 'empresa' : 'empresas'} ·{' '}
            {companies.reduce((acc, c) => acc + c.vendors.length, 0)} vendedores en total
          </p>
        </div>
      )}
    </div>
  )
}
