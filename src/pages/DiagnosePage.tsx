import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, FileText, X, ChevronRight, Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAdminData } from '../hooks/useAdminData'
import type { Profile } from '../types'

interface Props {
  profile: Profile
}

export function DiagnosePage({ profile }: Props) {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<1 | 2>(1)
  const [rawText, setRawText] = useState('')
  const [fileName, setFileName] = useState('')
  const [vendorName, setVendorName] = useState('')
  const [vendorId, setVendorId] = useState('')
  const [productName, setProductName] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [productDesc, setProductDesc] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isCompany = profile.role === 'company'
  const { companies } = useAdminData(profile.role === 'admin')

  // Para company: vendedores propios
  const [ownVendors, setOwnVendors] = useState<{ id: string; full_name: string; email: string }[]>([])
  const [vendorsLoaded, setVendorsLoaded] = useState(false)

  if (isCompany && !vendorsLoaded) {
    setVendorsLoaded(true)
    supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('company_id', profile.id)
      .eq('role', 'vendedor')
      .then(({ data }) => setOwnVendors(data ?? []))
  }

  const vendorOptions = isCompany
    ? ownVendors
    : companies.flatMap(c => c.vendors.map(v => ({ id: v.id, full_name: v.full_name, email: v.email })))

  function handleFile(file: File) {
    if (!file.name.endsWith('.txt')) {
      setError('Solo se aceptan archivos .txt (export de WhatsApp)')
      return
    }
    setError('')
    const reader = new FileReader()
    reader.onload = (e) => {
      setRawText(e.target?.result as string)
      setFileName(file.name)
    }
    reader.readAsText(file, 'utf-8')
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function canGoToStep2() {
    return (rawText.trim().length > 50 || fileName) && vendorName.trim().length >= 2
  }

  async function handleDiagnose() {
    if (!productName.trim()) { setError('Indica el nombre del producto.'); return }
    setError('')
    setLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    try {
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rawText, vendorName, productName, productPrice, productDescription: productDesc, vendorId: vendorId || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error procesando la conversación.'); setLoading(false); return }
      navigate(`/diagnose/${data.diagnosticId}`)
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5]">

      <nav className="bg-white border-b border-slate-100 px-6 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/diagnose')} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-lg font-bold text-[#128C7E]">WhatsCoach</span>
        <span className="text-slate-300">·</span>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Diagnosticador</span>
      </nav>

      <div className="max-w-2xl mx-auto p-6">

        {/* Progress */}
        <div className="flex items-center gap-3 mb-6">
          {[1, 2].map(n => (
            <div key={n} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= n ? 'bg-[#128C7E] text-white' : 'bg-slate-200 text-slate-400'}`}>{n}</div>
              {n === 1 && <div className={`h-0.5 w-12 transition-colors ${step >= 2 ? 'bg-[#128C7E]' : 'bg-slate-200'}`} />}
            </div>
          ))}
          <span className="text-xs text-slate-400 ml-1">{step === 1 ? 'Conversación' : 'Producto'}</span>
        </div>

        {step === 1 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <h1 className="text-lg font-bold text-slate-800">Sube la conversación</h1>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => !rawText && fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${rawText ? 'border-emerald-300 bg-emerald-50 cursor-default' : 'border-slate-200 hover:border-[#128C7E] hover:bg-slate-50 cursor-pointer'}`}
            >
              <input ref={fileRef} type="file" accept=".txt" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              {fileName ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="h-6 w-6 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-700">{fileName}</span>
                  <button onClick={e => { e.stopPropagation(); setFileName(''); setRawText('') }} className="text-slate-400 hover:text-rose-500">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-600">Arrastra el export .txt de WhatsApp</p>
                  <p className="text-xs text-slate-400 mt-1">o haz click para seleccionar</p>
                </>
              )}
            </div>

            {/* Divider o texto */}
            {!fileName && (
              <>
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="flex-1 h-px bg-slate-100" />
                  <span className="text-xs font-bold uppercase tracking-wider">o pega el texto</span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>
                <textarea
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  placeholder="Pega aquí el texto de la conversación..."
                  rows={6}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#128C7E]/30 focus:border-[#128C7E] text-slate-600"
                />
              </>
            )}

            {/* Nombre del vendedor */}
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                ¿Cuál es el nombre del vendedor en el chat?
              </label>
              <input
                value={vendorName}
                onChange={e => setVendorName(e.target.value)}
                placeholder="Ej: Miguel, Juan Pérez..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#128C7E]/30 focus:border-[#128C7E]"
              />
              <p className="text-[10px] text-slate-400 mt-1">Debe coincidir exactamente con el nombre que aparece en el chat.</p>
            </div>

            {/* Selector de vendedor */}
            {vendorOptions.length > 0 && (
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                  Asignar a vendedor (opcional)
                </label>
                <select
                  value={vendorId}
                  onChange={e => setVendorId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#128C7E]/30 focus:border-[#128C7E] bg-white"
                >
                  <option value="">Sin asignar</option>
                  {vendorOptions.map(v => (
                    <option key={v.id} value={v.id}>{v.full_name || v.email}</option>
                  ))}
                </select>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            <button
              onClick={() => canGoToStep2() && setStep(2)}
              disabled={!canGoToStep2()}
              className="w-full flex items-center justify-center gap-2 bg-[#128C7E] hover:bg-[#0c6b60] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3 rounded-xl transition-colors text-sm"
            >
              Siguiente <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <h1 className="text-lg font-bold text-slate-800">Contexto del producto</h1>
            <p className="text-sm text-slate-400">Esta info ayuda a la IA a entender el contexto de la venta.</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Nombre del producto *</label>
                <input value={productName} onChange={e => setProductName(e.target.value)} placeholder="Ej: Academia de Ventas IA" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#128C7E]/30 focus:border-[#128C7E]" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Precio</label>
                <input value={productPrice} onChange={e => setProductPrice(e.target.value)} placeholder="Ej: $297 USD" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#128C7E]/30 focus:border-[#128C7E]" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Descripción del producto</label>
                <textarea value={productDesc} onChange={e => setProductDesc(e.target.value)} placeholder="Qué incluye, a quién va dirigido..." rows={4} className="w-full border border-slate-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#128C7E]/30 focus:border-[#128C7E]" />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-50 transition-colors">
                Atrás
              </button>
              <button
                onClick={handleDiagnose}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3 rounded-xl transition-colors text-sm"
              >
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Analizando...</> : 'Diagnosticar'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
