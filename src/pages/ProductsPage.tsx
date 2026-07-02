import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Package, ChevronRight, Trash2 } from 'lucide-react'
import { useCompanyProducts } from '../hooks/useProducts'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'
import { useState } from 'react'

interface Props {
  profile: Profile
}

export function ProductsPage({ profile }: Props) {
  const navigate = useNavigate()
  const companyId = profile.role === 'company' ? profile.id : null
  const { products, loading, refresh } = useCompanyProducts(companyId)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('¿Eliminar este producto?')) return
    setDeleting(id)
    await supabase.from('products').delete().eq('id', id)
    refresh()
    setDeleting(null)
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5]">

      <nav className="bg-white border-b border-slate-100 px-6 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/dashboard')} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-lg font-bold text-[#128C7E]">WhatsCoach</span>
        <span className="text-slate-300">·</span>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Productos</span>
        <div className="ml-auto">
          <button
            onClick={() => navigate('/products/new')}
            className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Nuevo producto
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto p-6">

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Package className="h-4 w-4 text-slate-400" />
            <h2 className="font-bold text-slate-800 text-sm">Biblioteca de productos</h2>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <Package className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm mb-4">Aún no tienes productos. Crea el primero desde un PDF o manualmente.</p>
              <button onClick={() => navigate('/products/new')} className="text-[#25D366] font-bold text-sm hover:opacity-70">
                Crear primer producto →
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {products.map(p => (
                <li key={p.id}>
                  <button
                    onClick={() => navigate(`/products/${p.id}`)}
                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#128C7E]/10 flex items-center justify-center shrink-0">
                      <Package className="h-5 w-5 text-[#128C7E]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {p.price || 'Sin precio'} · {new Date(p.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {p.source_pdf_name && ` · desde ${p.source_pdf_name}`}
                      </p>
                    </div>
                    <button
                      onClick={e => handleDelete(p.id, e)}
                      disabled={deleting === p.id}
                      className="p-2 text-slate-300 hover:text-rose-500 transition-colors rounded-lg shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
