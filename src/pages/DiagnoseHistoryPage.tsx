import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, ChevronRight, Users } from 'lucide-react'
import { useDiagnostics } from '../hooks/useDiagnostics'
import type { Profile } from '../types'

interface Props {
  profile: Profile
}

export function DiagnoseHistoryPage({ profile }: Props) {
  const navigate = useNavigate()
  const [filterVendor, setFilterVendor] = useState('')

  const companyId = profile.role === 'company' ? profile.id : null
  const adminCompanyId = profile.role === 'admin' ? profile.id : null
  const { diagnostics, loading, refresh } = useDiagnostics(companyId ?? adminCompanyId)

  const vendorNames = Array.from(new Set(diagnostics.map(d => d.vendor_name_raw))).sort()
  const filtered = filterVendor ? diagnostics.filter(d => d.vendor_name_raw === filterVendor) : diagnostics

  // Stats por vendedor
  const vendorStats = vendorNames.map(name => {
    const items = diagnostics.filter(d => d.vendor_name_raw === name)
    const avg = items.length > 0
      ? Math.round(items.filter(d => d.score_final != null).reduce((s, d) => s + (d.score_final ?? 0), 0) / items.filter(d => d.score_final != null).length)
      : null
    return { name, count: items.length, avg }
  })

  function scoreColor(score: number | null) {
    if (score == null) return 'text-slate-400'
    if (score >= 80) return 'text-emerald-600'
    if (score >= 60) return 'text-amber-600'
    return 'text-rose-600'
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5]">

      <nav className="bg-white border-b border-slate-100 px-6 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/dashboard')} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-lg font-bold text-[#128C7E]">WhatsCoach</span>
        <span className="text-slate-300">·</span>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Diagnosticador</span>
        <div className="ml-auto">
          <button
            onClick={() => navigate('/diagnose/upload')}
            className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Nuevo diagnóstico
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6 space-y-6">

        {/* Comparativa por vendedor */}
        {vendorStats.length > 1 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400" />
              <h2 className="font-bold text-slate-800 text-sm">Comparativa de vendedores</h2>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {vendorStats.map(({ name, count, avg }) => (
                <button
                  key={name}
                  onClick={() => setFilterVendor(filterVendor === name ? '' : name)}
                  className={`p-4 rounded-xl border text-left transition-all ${filterVendor === name ? 'border-[#128C7E] bg-[#128C7E]/5' : 'border-slate-100 hover:border-slate-200 bg-slate-50'}`}
                >
                  <p className="text-xs font-bold text-slate-700 truncate">{name}</p>
                  <p className={`text-2xl font-extrabold mt-1 ${scoreColor(avg)}`}>{avg != null ? `${avg}%` : '—'}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{count} {count === 1 ? 'diagnóstico' : 'diagnósticos'}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lista de diagnósticos */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 text-sm">
              Historial {filterVendor && <span className="text-[#128C7E]">— {filterVendor}</span>}
            </h2>
            {filterVendor && (
              <button onClick={() => setFilterVendor('')} className="text-xs text-slate-400 hover:text-slate-600">
                Mostrar todos
              </button>
            )}
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="text-slate-400 text-sm mb-4">Aún no hay diagnósticos.</p>
              <button onClick={() => navigate('/diagnose/upload')} className="text-[#25D366] font-bold text-sm hover:opacity-70">
                Subir primera conversación →
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {filtered.map(d => (
                <li key={d.id}>
                  <button
                    onClick={() => navigate(`/diagnose/${d.id}`)}
                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700">{d.vendor_name_raw}</p>
                      <p className="text-xs text-slate-400 truncate">{d.product_name} · {new Date(d.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <span className={`text-lg font-extrabold shrink-0 ${scoreColor(d.score_final)}`}>
                      {d.score_final != null ? `${d.score_final}%` : '—'}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  )
}
