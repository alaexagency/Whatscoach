import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useDiagnosticDetail } from '../hooks/useDiagnostics'
import { EvalDisplay } from '../components/shared/EvalDisplay'
import type { Profile } from '../types'
import { UserRole } from '../constants'

interface Props {
  profile: Profile
}

export function DiagnoseResultPage({ profile }: Props) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { diagnostic, loading } = useDiagnosticDetail(id)

  const backPath = profile.role === UserRole.Vendedor ? '/dashboard' : '/diagnose'

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#128C7E] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!diagnostic) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Diagnóstico no encontrado o sin acceso.</p>
          <button onClick={() => navigate(backPath)} className="text-[#128C7E] font-bold text-sm">Volver</button>
        </div>
      </div>
    )
  }

  const evalData = {
    indicadores: {
      calidad_conversacion: diagnostic.score_conversation ?? 0,
      manejo_objeciones: diagnostic.score_objections ?? 0,
      tecnicas_cierre: diagnostic.score_closing ?? 0,
      puntuacion_final: diagnostic.score_final ?? 0,
    },
    analisis: {
      fortalezas: diagnostic.strengths ?? [],
      oportunidades_mejora: diagnostic.improvements ?? [],
      tecnicas_aplicadas: diagnostic.techniques_applied ?? [],
      tecnicas_no_aplicadas: diagnostic.techniques_missing ?? [],
      tecnica_cierre_recomendada: diagnostic.recommended_close ?? '',
    },
    ejemplo_respuesta_ideal: diagnostic.ideal_response ?? '',
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5]">

      <nav className="bg-white border-b border-slate-100 px-6 py-3 flex items-center gap-3">
        <button onClick={() => navigate(backPath)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-lg font-bold text-[#128C7E]">WhatsCoach</span>
        <span className="text-slate-300">·</span>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Diagnóstico</span>
      </nav>

      <div className="max-w-2xl mx-auto p-6 space-y-4">

        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Diagnóstico de conversación real</p>
              <h1 className="text-lg font-bold text-slate-800">{diagnostic.vendor_name_raw}</h1>
              <p className="text-sm text-slate-400">{diagnostic.product_name}{diagnostic.product_price ? ` · ${diagnostic.product_price}` : ''}</p>
            </div>
            <p className="text-xs text-slate-400">
              {new Date(diagnostic.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        <EvalDisplay data={evalData} />

      </div>
    </div>
  )
}
