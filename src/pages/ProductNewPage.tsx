import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Upload, FileText, X, Loader2, AlertCircle, CheckCircle, HelpCircle, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

interface Props {
  profile: Profile
}

type FieldSource = 'found' | 'inferred' | 'not_found'

interface ExtractedField {
  value: string
  source: FieldSource
}

interface Extracted {
  name:              ExtractedField
  what_we_sell:      ExtractedField
  ideal_client:      ExtractedField
  problem_solved:    ExtractedField
  value_proposition: ExtractedField
  price:             ExtractedField
  main_benefits:     { value: string[]; source: FieldSource }
  common_objections: { value: string[]; source: FieldSource }
}

function SourceBadge({ source }: { source: FieldSource }) {
  if (source === 'found')     return <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full"><CheckCircle className="h-2.5 w-2.5" />Detectado</span>
  if (source === 'inferred')  return <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full"><HelpCircle className="h-2.5 w-2.5" />Inferido</span>
  return null
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = (window as any).pdfjsLib
  if (!pdfjsLib) throw new Error("El procesador de PDF aún se está cargando. Intenta de nuevo.")
  const arrayBuffer = await file.arrayBuffer()
  const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise
  const maxPages = Math.min(pdfDoc.numPages, 20)
  let text = ''
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdfDoc.getPage(i)
    const content = await page.getTextContent()
    text += content.items.map((item: any) => item.str).join(' ') + '\n'
  }
  return text
}

export function ProductNewPage({ profile }: Props) {
  const navigate = useNavigate()
  const { id: editId } = useParams<{ id: string }>()
  const isEdit = Boolean(editId)
  const fileRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<'upload' | 'form'>(isEdit ? 'form' : 'upload')
  const [pdfName, setPdfName] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState('')
  const [sources, setSources] = useState<Partial<Record<keyof Extracted, FieldSource>>>({})

  // Campos del formulario
  const [name, setName] = useState('')
  const [whatWeSell, setWhatWeSell] = useState('')
  const [idealClient, setIdealClient] = useState('')
  const [problemSolved, setProblemSolved] = useState('')
  const [valueProposition, setValueProposition] = useState('')
  const [price, setPrice] = useState('')
  const [mainBenefits, setMainBenefits] = useState<string[]>([''])
  const [commonObjections, setCommonObjections] = useState<string[]>([''])

  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!editId) return
    supabase.from('products').select('*').eq('id', editId).single().then(({ data }) => {
      if (!data) return
      setName(data.name)
      setWhatWeSell(data.what_we_sell)
      setIdealClient(data.ideal_client)
      setProblemSolved(data.problem_solved)
      setValueProposition(data.value_proposition)
      setPrice(data.price)
      setMainBenefits(data.main_benefits.length > 0 ? data.main_benefits : [''])
      setCommonObjections(data.common_objections.length > 0 ? data.common_objections : [''])
      if (data.source_pdf_name) setPdfName(data.source_pdf_name)
    })
  }, [editId])

  async function handleFile(file: File) {
    if (!file.name.endsWith('.pdf')) { setExtractError('Solo se aceptan archivos .pdf'); return }
    if (file.size > 10 * 1024 * 1024) { setExtractError('El archivo no puede superar 10 MB'); return }
    setExtractError('')
    setExtracting(true)
    setPdfName(file.name)

    try {
      const text = await extractPdfText(file)
      if (text.split(/\s+/).filter(Boolean).length < 10) {
        setExtractError('No pudimos extraer texto de este PDF. Puede ser un PDF escaneado. Completa los campos manualmente.')
        setExtracting(false)
        setStep('form')
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/extract-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ text }),
      })
      const extracted: Extracted = await res.json()

      if (extracted.name)              { setName(extracted.name.value);                        setSources(s => ({ ...s, name: extracted.name.source })) }
      if (extracted.what_we_sell)      { setWhatWeSell(extracted.what_we_sell.value);          setSources(s => ({ ...s, what_we_sell: extracted.what_we_sell.source })) }
      if (extracted.ideal_client)      { setIdealClient(extracted.ideal_client.value);         setSources(s => ({ ...s, ideal_client: extracted.ideal_client.source })) }
      if (extracted.problem_solved)    { setProblemSolved(extracted.problem_solved.value);     setSources(s => ({ ...s, problem_solved: extracted.problem_solved.source })) }
      if (extracted.value_proposition) { setValueProposition(extracted.value_proposition.value); setSources(s => ({ ...s, value_proposition: extracted.value_proposition.source })) }
      if (extracted.price)             { setPrice(extracted.price.value);                      setSources(s => ({ ...s, price: extracted.price.source })) }
      if (extracted.main_benefits?.value?.length > 0) setMainBenefits(extracted.main_benefits.value)
      if (extracted.common_objections?.value?.length > 0) setCommonObjections(extracted.common_objections.value)

    } catch (err: any) {
      setExtractError(err.message || 'Error procesando el PDF. Completa los campos manualmente.')
    }

    setExtracting(false)
    setStep('form')
  }

  async function handleSave() {
    if (!name.trim()) { setFormError('El nombre del producto es obligatorio.'); return }
    setFormError('')
    setSaving(true)

    const companyId = profile.role === 'company' ? profile.id : null
    if (!companyId) { setFormError('Solo las empresas pueden crear productos.'); setSaving(false); return }

    const payload = {
      company_id: companyId,
      created_by: profile.id,
      name: name.trim(),
      what_we_sell: whatWeSell.trim(),
      ideal_client: idealClient.trim(),
      problem_solved: problemSolved.trim(),
      value_proposition: valueProposition.trim(),
      price: price.trim(),
      main_benefits: mainBenefits.filter(b => b.trim()),
      common_objections: commonObjections.filter(o => o.trim()),
      source_pdf_name: pdfName || null,
      updated_at: new Date().toISOString(),
    }

    if (isEdit && editId) {
      await supabase.from('products').update(payload).eq('id', editId)
    } else {
      await supabase.from('products').insert(payload)
    }

    setSaving(false)
    navigate('/products')
  }

  function addItem(setter: React.Dispatch<React.SetStateAction<string[]>>) {
    setter(prev => [...prev, ''])
  }
  function updateItem(setter: React.Dispatch<React.SetStateAction<string[]>>, i: number, val: string) {
    setter(prev => prev.map((v, idx) => idx === i ? val : v))
  }
  function removeItem(setter: React.Dispatch<React.SetStateAction<string[]>>, i: number) {
    setter(prev => prev.filter((_, idx) => idx !== i))
  }

  const fields = [
    { key: 'name' as const,              label: 'Nombre del producto *', value: name,             setValue: setName,             multiline: false, placeholder: 'Ej: Academia de Ventas IA' },
    { key: 'what_we_sell' as const,      label: 'Qué vendes',           value: whatWeSell,        setValue: setWhatWeSell,        multiline: true,  placeholder: 'Describe brevemente qué ofreces...' },
    { key: 'ideal_client' as const,      label: 'Cliente ideal',        value: idealClient,       setValue: setIdealClient,       multiline: true,  placeholder: 'A quién va dirigido este producto...' },
    { key: 'problem_solved' as const,    label: 'Problema que resuelve',value: problemSolved,     setValue: setProblemSolved,     multiline: true,  placeholder: 'Qué dolor o problema soluciona...' },
    { key: 'value_proposition' as const, label: 'Propuesta de valor',   value: valueProposition,  setValue: setValueProposition,  multiline: true,  placeholder: 'Por qué elegirte a ti y no a la competencia...' },
    { key: 'price' as const,             label: 'Precio',               value: price,             setValue: setPrice,             multiline: false, placeholder: 'No detectado — completa manualmente' },
  ]

  return (
    <div className="min-h-screen bg-[#f0f2f5]">

      <nav className="bg-white border-b border-slate-100 px-6 py-3 flex items-center gap-3">
        <button onClick={() => navigate(isEdit ? '/products' : step === 'form' && !isEdit ? '/products' : '/products')} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-lg font-bold text-[#128C7E]">WhatsCoach</span>
        <span className="text-slate-300">·</span>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{isEdit ? 'Editar producto' : 'Nuevo producto'}</span>
      </nav>

      <div className="max-w-2xl mx-auto p-6 space-y-5">

        {/* Step: Upload PDF */}
        {step === 'upload' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <div>
              <h1 className="text-lg font-bold text-slate-800">Sube el PDF del producto</h1>
              <p className="text-sm text-slate-400 mt-1">Extrae automáticamente la ficha del producto. Podrás revisar y editar todo antes de guardar.</p>
            </div>

            <div
              onDrop={e => { e.preventDefault(); e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]) }}
              onDragOver={e => e.preventDefault()}
              onClick={() => !extracting && fileRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-[#128C7E] rounded-2xl p-10 text-center cursor-pointer transition-colors hover:bg-slate-50"
            >
              <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              {extracting ? (
                <div className="space-y-2">
                  <Loader2 className="h-8 w-8 text-[#128C7E] mx-auto animate-spin" />
                  <p className="text-sm font-semibold text-[#128C7E]">Analizando PDF con IA...</p>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-600">Arrastra el PDF aquí</p>
                  <p className="text-xs text-slate-400 mt-1">o haz click para seleccionar · Máx 10 MB, 20 páginas</p>
                </>
              )}
            </div>

            {extractError && (
              <div className="flex items-start gap-2 text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {extractError}
              </div>
            )}

            <div className="flex items-center gap-3 text-slate-300">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">o</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            <button
              onClick={() => setStep('form')}
              className="w-full py-3 border border-slate-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-50 transition-colors"
            >
              Completar manualmente
            </button>
          </div>
        )}

        {/* Step: Form */}
        {step === 'form' && (
          <>
            {pdfName && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-emerald-700">Extraído de: {pdfName}</span>
                <button onClick={() => { setPdfName(''); setSources({}); setStep('upload') }} className="ml-auto text-emerald-400 hover:text-emerald-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
              <h1 className="text-lg font-bold text-slate-800">Ficha del producto</h1>
              <p className="text-xs text-slate-400">Revisa y completa la información. Los vendedores usarán esta ficha en el simulador.</p>

              {/* Campos de texto */}
              {fields.map(({ key, label, value, setValue, multiline, placeholder }) => (
                <div key={key}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{label}</label>
                    {sources[key] && <SourceBadge source={sources[key]!} />}
                  </div>
                  {multiline ? (
                    <textarea
                      value={value}
                      onChange={e => setValue(e.target.value)}
                      placeholder={placeholder}
                      rows={3}
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#128C7E]/30 focus:border-[#128C7E]"
                    />
                  ) : (
                    <input
                      value={value}
                      onChange={e => setValue(e.target.value)}
                      placeholder={placeholder}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#128C7E]/30 focus:border-[#128C7E]"
                    />
                  )}
                </div>
              ))}

              {/* Beneficios */}
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Beneficios principales</label>
                <div className="space-y-2">
                  {mainBenefits.map((b, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={b} onChange={e => updateItem(setMainBenefits, i, e.target.value)} placeholder={`Beneficio ${i + 1}`} className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#128C7E]/30 focus:border-[#128C7E]" />
                      {mainBenefits.length > 1 && <button onClick={() => removeItem(setMainBenefits, i)} className="p-2 text-slate-300 hover:text-rose-500"><Trash2 className="h-4 w-4" /></button>}
                    </div>
                  ))}
                  {mainBenefits.length < 5 && (
                    <button onClick={() => addItem(setMainBenefits)} className="text-xs text-[#128C7E] font-bold flex items-center gap-1 hover:opacity-70">
                      <Plus className="h-3 w-3" /> Agregar beneficio
                    </button>
                  )}
                </div>
              </div>

              {/* Objeciones */}
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Objeciones frecuentes</label>
                <div className="space-y-2">
                  {commonObjections.map((o, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={o} onChange={e => updateItem(setCommonObjections, i, e.target.value)} placeholder={`Objeción ${i + 1}`} className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#128C7E]/30 focus:border-[#128C7E]" />
                      {commonObjections.length > 1 && <button onClick={() => removeItem(setCommonObjections, i)} className="p-2 text-slate-300 hover:text-rose-500"><Trash2 className="h-4 w-4" /></button>}
                    </div>
                  ))}
                  {commonObjections.length < 5 && (
                    <button onClick={() => addItem(setCommonObjections)} className="text-xs text-[#128C7E] font-bold flex items-center gap-1 hover:opacity-70">
                      <Plus className="h-3 w-3" /> Agregar objeción
                    </button>
                  )}
                </div>
              </div>

              {formError && (
                <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {formError}
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-[#128C7E] hover:bg-[#0c6b60] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3 rounded-xl transition-colors text-sm"
              >
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</> : isEdit ? 'Actualizar producto' : 'Guardar producto'}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
