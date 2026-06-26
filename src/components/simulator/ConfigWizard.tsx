import { motion, AnimatePresence } from "motion/react"
import { X, UploadCloud, Sparkles, User, BookMarked } from "lucide-react"
import { CLIENT_PROFILES } from "../../data/clientProfiles"
import type { ClientProfile } from "../../data/clientProfiles"
import type { useSimulator } from "../../hooks/useSimulator"
import type { useKnowledgeBase } from "../../hooks/useKnowledgeBase"

type Sim = ReturnType<typeof useSimulator>
type KB  = ReturnType<typeof useKnowledgeBase>

interface Props {
  sim: Sim
  kb: KB
  isOpen: boolean
  step: number         // 0 = welcome, 1-5 = config steps
  onNext: () => void
  onBack: () => void
  onClose: () => void
  onFinish: () => void
}

const CONFIG_STEPS = 5
const STEP_TITLES = [
  "",                                   // step 0: welcome (no subtitle)
  "¿Cómo empieza la conversación?",
  "¿Qué vendes?",
  "Elige a tu cliente",
  "Base de conocimiento",
  "Resumen y confirmación",
]

export function ConfigWizard({ sim, kb, isOpen, step, onNext, onBack, onClose, onFinish }: Props) {
  const activeProfile = CLIENT_PROFILES[sim.selectedClientKey]
  const isWelcome = step === 0

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header — verde oscuro */}
            <div className="bg-[#075E54] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#25D366] rounded-full flex items-center justify-center text-base">💬</div>
                <span className="text-white font-bold text-sm">WhatsCoach <span className="text-[#25D366]">Pro</span></span>
                {!isWelcome && (
                  <div className="flex items-center gap-1 ml-1">
                    {Array.from({ length: CONFIG_STEPS }).map((_, i) => (
                      <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${
                        i < step     ? "w-6 bg-[#25D366]"
                        : i === step - 1 ? "w-6 bg-white"
                        : "w-3 bg-white/30"
                      }`} />
                    ))}
                    <span className="text-white/60 text-xs font-medium ml-1">{step}/{CONFIG_STEPS}</span>
                  </div>
                )}
              </div>
              {!isWelcome && (
                <button type="button" onClick={onClose}
                  className="text-white/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Step title (config steps only) */}
            {!isWelcome && (
              <div className="px-6 pt-5 pb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#128C7E]">Paso {step} de {CONFIG_STEPS}</p>
                <h2 className="text-xl font-bold text-slate-800 mt-0.5">{STEP_TITLES[step]}</h2>
              </div>
            )}

            {/* Step content */}
            <div className={`px-6 pb-4 flex flex-col ${isWelcome ? "pt-2" : "min-h-[260px] pt-3"}`}>
              <AnimatePresence mode="wait">
                <motion.div key={step}
                  initial={{ opacity: 0, x: isWelcome ? 0 : 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isWelcome ? 0 : -16 }}
                  transition={{ duration: 0.18 }}
                  className="flex-1"
                >
                  {step === 0 && <StepWelcome />}
                  {step === 1 && <Step1 sim={sim} />}
                  {step === 2 && <Step2 sim={sim} />}
                  {step === 3 && <Step3 sim={sim} />}
                  {step === 4 && <Step4 kb={kb} />}
                  {step === 5 && <Step5 sim={sim} kb={kb} activeProfile={activeProfile} />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-6 pb-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
              {step > 1 ? (
                <button type="button" onClick={onBack}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-semibold text-sm transition-colors px-3 py-2 rounded-xl hover:bg-slate-50">
                  ← Atrás
                </button>
              ) : (
                <div />
              )}
              {step === 0 ? (
                <button type="button" onClick={onNext}
                  className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold px-7 py-3 rounded-xl text-sm transition-colors shadow-sm">
                  Comenzar →
                </button>
              ) : step < CONFIG_STEPS ? (
                <button type="button" onClick={onNext}
                  className="flex items-center gap-2 bg-[#128C7E] hover:bg-[#0c6b60] text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors shadow-sm">
                  Siguiente →
                </button>
              ) : (
                <button type="button" onClick={onFinish}
                  className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors shadow-sm">
                  <Sparkles className="h-4 w-4" /> ¡Iniciar Simulación!
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── STEP 0: Bienvenida ───────────────────────────────────────────────────
function StepWelcome() {
  return (
    <div className="text-center space-y-5 py-4">
      <div className="space-y-2">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#128C7E]">Post-Conversational Sales Intelligence</p>
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
          WhatsCoach <span className="text-[#128C7E]">Pro AI</span>
        </h2>
        <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          Entrena tus cierres contra réplicas de IA, supera objeciones en vivo y recibe un diagnóstico de precisión.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-left">
        {[
          { icon: <User className="h-4 w-4" />, title: "Psicobiografías", desc: "6 personalidades con resistencia activa al costo y tiempo." },
          { icon: <BookMarked className="h-4 w-4" />, title: "Manuales PDFs", desc: "Sube scripts de tu empresa para que la IA te calibre con ellos." },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
            <div className="text-xs font-bold text-[#128C7E] uppercase tracking-wide flex items-center gap-1.5">{icon} {title}</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── STEP 1: Apertura + Dificultad ────────────────────────────────────────
function Step1({ sim }: { sim: Sim }) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">¿Quién abre la conversación?</label>
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100">
          {(["client", "seller"] as const).map(opt => (
            <button key={opt} type="button" onClick={() => sim.setInitiator(opt)}
              className={`py-3 px-4 text-sm font-semibold tracking-wide transition-all rounded-xl ${
                sim.initiator === opt ? "bg-[#128C7E] text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-white"
              }`}>
              {opt === "client" ? "🤝 El cliente" : "💬 Yo (vendedor)"}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Nivel de objeciones</label>
        <div className="grid grid-cols-3 gap-2">
          {([
            { val: "easy",   label: "Amigable",   emoji: "😊" },
            { val: "medium", label: "Intermedio", emoji: "🤔" },
            { val: "hard",   label: "Brutal",     emoji: "😤" },
          ] as const).map(({ val, label, emoji }) => (
            <button key={val} type="button" onClick={() => sim.setDifficulty(val)}
              className={`py-3 px-2 rounded-xl border text-center transition-all ${
                sim.difficulty === val
                  ? "border-2 border-[#128C7E] bg-[#128C7E]/5 text-[#128C7E]"
                  : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}>
              <div className="text-xl mb-1">{emoji}</div>
              <div className="text-[11px] font-bold">{label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── STEP 2: Producto ──────────────────────────────────────────────────────
function Step2({ sim }: { sim: Sim }) {
  return (
    <div className="space-y-3">
      {([
        { label: "Nombre del producto", value: sim.productName, onChange: sim.setProductName, type: "input",    placeholder: "Ej. Academia de IA para Emprendedores" },
        { label: "Precio",              value: sim.productPrice, onChange: sim.setProductPrice, type: "input",    placeholder: "Ej. $297 USD" },
        { label: "Propuesta de valor",  value: sim.productDesc,  onChange: sim.setProductDesc,  type: "textarea", placeholder: "Describe qué incluye y qué problema resuelve..." },
      ] as const).map(({ label, value, onChange, type, placeholder }) => (
        <div key={label} className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">{label}</label>
          {type === "textarea"
            ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#128C7E] transition-colors resize-none" />
            : <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#128C7E] transition-colors" />
          }
        </div>
      ))}
    </div>
  )
}

// ── STEP 3: Perfil de cliente ─────────────────────────────────────────────
function Step3({ sim }: { sim: Sim }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500 leading-relaxed">Elige el tipo de cliente contra el que quieres entrenar tu argumentación.</p>
      <div className="grid grid-cols-3 gap-2">
        {Object.values(CLIENT_PROFILES).map(prof => (
          <button key={prof.id} type="button" onClick={() => sim.setSelectedClientKey(prof.id)}
            className={`p-3 rounded-2xl border text-center transition-all ${
              sim.selectedClientKey === prof.id
                ? "border-2 border-[#128C7E] bg-[#128C7E]/5 shadow-sm"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            }`}>
            <div className="text-2xl mb-1">{prof.emoji}</div>
            <div className="text-[11px] font-bold text-slate-700 leading-tight">{prof.name.split(" ").slice(1).join(" ") || prof.name}</div>
          </button>
        ))}
      </div>
      {sim.selectedClientKey && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 leading-relaxed">
          <span className="font-bold text-[#128C7E] block mb-0.5">💡 Tip del coach:</span>
          {CLIENT_PROFILES[sim.selectedClientKey].sellerHint}
        </div>
      )}
    </div>
  )
}

// ── STEP 4: KB ────────────────────────────────────────────────────────────
function Step4({ kb }: { kb: KB }) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500 leading-relaxed">
        Opcional — sube manuales o pega argumentos para que la IA los use al evaluar tu desempeño.
      </p>
      <div onClick={() => kb.fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-200 hover:border-[#128C7E] rounded-2xl p-5 text-center cursor-pointer bg-slate-50 hover:bg-white transition-all flex flex-col items-center gap-2">
        <input type="file" ref={kb.fileInputRef} accept="application/pdf" onChange={kb.handlePdfUpload} className="hidden" />
        {kb.isPdfLoading ? (
          <>
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#128C7E] border-t-transparent" />
            <span className="text-xs font-bold text-[#128C7E]">Procesando PDF...</span>
          </>
        ) : (
          <>
            <UploadCloud className="h-7 w-7 text-[#128C7E]" />
            <span className="text-sm font-bold text-slate-700">Subir manual PDF</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Haz clic para seleccionar</span>
          </>
        )}
      </div>
      {kb.knowledgeSources.length > 0 && (
        <div className="space-y-1">
          {kb.knowledgeSources.map(ks => (
            <div key={ks.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs">
              <span className="text-slate-700 font-medium truncate max-w-[85%]">📄 {ks.fileName}</span>
              <button type="button" onClick={() => kb.removeKbFragment(ks.id)}
                className="text-slate-400 hover:text-rose-500 font-bold ml-2 transition-colors">✕</button>
            </div>
          ))}
        </div>
      )}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">O pega argumentos en texto</label>
        <textarea placeholder="Ej: 'Para el cliente escéptico, enfatiza la garantía de devolución...'"
          value={kb.pastedKbText} onChange={e => kb.setPastedKbText(e.target.value)} rows={2}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 outline-none focus:border-[#128C7E] resize-none" />
        <div className="flex gap-2">
          <button type="button" onClick={kb.addTextFragment}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 rounded-xl transition-colors">
            + Cargar fragmento
          </button>
          {kb.pastedKbText && (
            <button type="button" onClick={kb.cleanPastedKbInput}
              className="bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-bold px-3 rounded-xl transition-colors">✕</button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── STEP 5: Resumen ───────────────────────────────────────────────────────
function Step5({ sim, kb, activeProfile }: { sim: Sim; kb: KB; activeProfile: ClientProfile }) {
  const difficultyLabel = sim.difficulty === "easy" ? "Amigable 😊" : sim.difficulty === "medium" ? "Intermedio 🤔" : "Brutal 😤"
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">Todo listo. Revisa la configuración antes de iniciar.</p>
      <div className="bg-slate-50 border border-slate-200 rounded-2xl divide-y divide-slate-200 overflow-hidden">
        <Row label="Inicia"     value={sim.initiator === "client" ? "El cliente 🤝" : "Yo (vendedor) 💬"} />
        <Row label="Dificultad" value={difficultyLabel} />
        <Row label="Producto"   value={sim.productName || "—"} />
        <Row label="Precio"     value={sim.productPrice || "—"} />
        <Row label="Cliente"    value={`${activeProfile.emoji} ${activeProfile.name}`} />
        <Row label="Manuales"   value={kb.knowledgeSources.length > 0 ? `${kb.knowledgeSources.length} archivo(s)` : "Sin archivos"} />
      </div>
      <div className="bg-[#128C7E]/10 border border-[#128C7E]/20 rounded-xl p-3">
        <p className="text-xs text-[#128C7E] font-medium leading-relaxed">💡 {activeProfile.sellerHint}</p>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</span>
      <span className="text-slate-700 font-semibold text-xs text-right max-w-[60%] truncate">{value}</span>
    </div>
  )
}
