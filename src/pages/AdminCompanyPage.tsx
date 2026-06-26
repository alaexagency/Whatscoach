import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Users, Building2, Calendar } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { UserRole } from '../constants'
import type { Profile } from '../types'

export function AdminCompanyPage() {
  const { companyId } = useParams<{ companyId: string }>()
  const navigate = useNavigate()

  const [company, setCompany] = useState<Profile | null>(null)
  const [vendors, setVendors] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!companyId) return
    loadData(companyId)
  }, [companyId])

  async function loadData(id: string) {
    setLoading(true)
    const [{ data: companyData }, { data: vendorData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).single(),
      supabase.from('profiles').select('*').eq('company_id', id).eq('role', UserRole.Vendedor).order('full_name'),
    ])
    if (companyData) setCompany(companyData as Profile)
    setVendors((vendorData as Profile[]) ?? [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#128C7E] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Empresa no encontrada.</p>
          <button onClick={() => navigate('/dashboard')} className="text-[#128C7E] font-bold text-sm">
            Volver al dashboard
          </button>
        </div>
      </div>
    )
  }

  const initials = company.full_name
    ? company.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : company.email[0].toUpperCase()

  return (
    <div className="min-h-screen bg-[#f0f2f5]">

      {/* Navbar */}
      <nav className="bg-white border-b border-slate-100 px-6 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-lg font-bold text-[#128C7E]">WhatsCoach</span>
        <span className="text-slate-300">·</span>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Admin</span>
      </nav>

      <div className="max-w-3xl mx-auto p-6 space-y-6">

        {/* Header empresa */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl shrink-0">
            {company.avatar_url
              ? <img src={company.avatar_url} alt="" className="w-16 h-16 rounded-2xl object-cover" />
              : initials
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-slate-400" />
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Empresa</span>
            </div>
            <h1 className="text-xl font-bold text-slate-800">{company.full_name || '—'}</h1>
            <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-1">
              <Mail className="h-3.5 w-3.5" />
              {company.email}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-bold text-slate-800">{vendors.length}</p>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1 justify-end">
              <Users className="h-3 w-3" />
              {vendors.length === 1 ? 'vendedor' : 'vendedores'}
            </p>
          </div>
        </div>

        {/* Lista de vendedores */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-400" />
            <h2 className="font-bold text-slate-800 text-sm">Vendedores</h2>
          </div>

          {vendors.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-10">Esta empresa no tiene vendedores asignados aún.</p>
          ) : (
            <ul className="divide-y divide-slate-50">
              {vendors.map(v => {
                const vInitials = v.full_name
                  ? v.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                  : v.email[0].toUpperCase()
                return (
                  <li key={v.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">
                      {v.avatar_url
                        ? <img src={v.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                        : vInitials
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-700 text-sm">{v.full_name || '—'}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
                        <Mail className="h-3 w-3 shrink-0" />
                        {v.email}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
                      <Calendar className="h-3 w-3" />
                      {new Date(v.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

      </div>
    </div>
  )
}
