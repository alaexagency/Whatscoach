import { useState, useRef, useEffect } from "react"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import type { Profile } from "./types"
import { useSimulator } from "./hooks/useSimulator"
import { useKnowledgeBase } from "./hooks/useKnowledgeBase"
import { ConfigWizard } from "./components/simulator/ConfigWizard"
import { EvalPanel } from "./components/simulator/EvalPanel"
import { MessageRole } from "./constants"
import {
  Send, AlertTriangle, CheckCircle2,
  Copy, Download, Brain, MessageCircle, Settings, Sparkles, Search
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

interface AppProps {
  user: SupabaseUser
  profile: Profile | null
  onSignOut: () => void
  onBackToDashboard: () => void
}

export default function App({ user, profile, onSignOut, onBackToDashboard }: AppProps) {
  const kb  = useKnowledgeBase((msg, isError) => sim.notify(msg, isError))
  const sim = useSimulator({ user, profile, knowledgeSources: kb.knowledgeSources })

  const [isConfigOpen, setIsConfigOpen] = useState(true)
  const [wizardStep,   setWizardStep]   = useState(0)
  const [evalExpanded, setEvalExpanded] = useState(false)
  const [isMenuOpen,   setIsMenuOpen]   = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    if (isMenuOpen) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isMenuOpen])

  const { activeProfile } = sim

  function openWizard()   { setWizardStep(1); setIsConfigOpen(true) }  // "Nueva Sim." salta bienvenida
  function closeWizard()  { sim.setWelcomeOverlay(false); setIsConfigOpen(false) }
  function finishWizard() { closeWizard(); sim.prepareSimulation() }

  const chatWidthClass = sim.isEvalOpen && !evalExpanded
    ? "w-1/2"
    : evalExpanded
      ? "hidden"
      : "flex-1"

  return (
    <div className="flex h-screen bg-[#e5ddd5] p-3 gap-3 text-slate-800 overflow-hidden font-sans select-none antialiased">

      {/* Toast */}
      <AnimatePresence>
        {sim.notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl shadow-2xl z-50 text-xs font-semibold tracking-wide flex items-center gap-3 md:min-w-[320px] border ${
              sim.notification.isError
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
          >
            {sim.notification.isError
              ? <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              : <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            }
            <span>{sim.notification.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wizard de configuración */}
      <ConfigWizard
        sim={sim} kb={kb}
        isOpen={isConfigOpen}
        step={wizardStep}
        onNext={() => setWizardStep(s => Math.min(s + 1, 5))}
        onBack={() => setWizardStep(s => Math.max(s - 1, 1))}
        onClose={closeWizard}
        onFinish={finishWizard}
      />

      {/* ==================== CHAT ==================== */}
      <main className={`flex-col bg-[#efeae2] rounded-[25px] overflow-hidden shadow-sm pb-16 md:pb-0 transition-all duration-300 ${chatWidthClass} ${sim.activeMobileView === "chat" ? "flex" : "hidden md:flex"}`}>

        {/* Start overlay */}
        {sim.startOverlay && (
          <div className="absolute inset-0 z-35 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 rounded-[25px]">
            <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="max-w-lg w-full bg-white border border-slate-200 p-5 sm:p-8 rounded-2xl shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
              <div className="text-center space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest text-[#128C7E] font-bold">Condiciones de Negociación</p>
                <h3 className="text-xl font-bold text-slate-800">
                  {sim.initiator === "client" ? "El Prospecto Abre el Chat" : "Abre la Conversación Tú"}
                </h3>
              </div>
              <div className="p-5 bg-slate-50 border border-slate-100 rounded-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{activeProfile.emoji}</div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 uppercase">{activeProfile.name}</h4>
                    <span className="text-[10px] uppercase tracking-wider text-[#128C7E] font-bold">
                      Gravedad: {sim.difficulty === "easy" ? "Cálida" : sim.difficulty === "medium" ? "Evasiones" : "Brutal / Hostil"}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 italic leading-relaxed">"{activeProfile.description}"</p>
                <div className="border-t border-slate-200 pt-3 text-[11px] text-slate-500">
                  <span className="text-[#128C7E] block uppercase tracking-wider text-[10px] font-bold mb-1">Objeción de Partida:</span>
                  "{activeProfile.objections[0]}"
                </div>
              </div>
              {sim.initiator === "seller" && (
                <div className="p-4 bg-emerald-50 border border-dashed border-emerald-200 rounded-xl">
                  <span className="text-[10px] font-bold text-[#128C7E] uppercase tracking-wider block mb-1">Script Recomendado</span>
                  <p className="text-xs text-[#128C7E] leading-relaxed font-medium">{activeProfile.sellerHint}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => sim.setStartOverlay(false)}
                  className="flex-1 py-2.5 border border-slate-200 hover:border-[#128C7E] text-slate-500 hover:text-[#128C7E] transition-colors font-bold text-xs rounded-xl">
                  Configurar más
                </button>
                <button type="button" onClick={sim.beginSimulation}
                  className="flex-1 py-2.5 bg-[#128C7E] hover:bg-[#0c6b60] text-white transition-colors font-bold text-xs rounded-xl shadow-sm">
                  Iniciar Negociación
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Chat header */}
        <header className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200/60 bg-[#f0f2f5]/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-xl">{activeProfile.emoji}</div>
            <div>
              <h2 className="text-base font-bold text-slate-800">{activeProfile.name}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">En línea</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={openWizard}
              className="flex items-center gap-1.5 py-2 px-3 bg-[#128C7E] hover:bg-[#0c6b60] text-white font-bold text-xs rounded-xl shadow-sm transition-colors">
              <Sparkles className="h-3.5 w-3.5" />
              Nueva Sim.
            </button>

            {/* Gear + dropdown */}
            <div className="relative" ref={menuRef}>
              <button type="button" onClick={() => setIsMenuOpen(o => !o)}
                className={`h-9 w-9 flex items-center justify-center rounded-xl border transition-colors ${
                  isMenuOpen
                    ? "bg-slate-200 border-slate-300 text-slate-800"
                    : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                }`}>
                <Settings className="h-4 w-4" />
              </button>

              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-11 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden"
                  >
                    {/* Usuario */}
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cuenta</p>
                      <p className="text-xs text-slate-700 font-semibold truncate mt-0.5">{user.email}</p>
                    </div>

                    {/* Contexto de la sesión */}
                    <div className="px-4 py-3 border-b border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Producto</span>
                        <span className="text-[11px] text-slate-700 font-semibold max-w-[130px] line-clamp-2 text-right leading-tight">{sim.productName || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">PDFs</span>
                        <span className="text-[11px] text-[#128C7E] font-bold">{kb.knowledgeSources.length} archivo{kb.knowledgeSources.length !== 1 ? "s" : ""}</span>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="py-1.5">
                      {sim.messages.length > 0 && (
                        <button type="button" onClick={() => { sim.downloadHistoryTXT(); setIsMenuOpen(false) }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                          <Download className="h-3.5 w-3.5 text-slate-400" /> Descargar chat
                        </button>
                      )}
                      <button type="button" onClick={() => { onBackToDashboard(); setIsMenuOpen(false) }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                        <Brain className="h-3.5 w-3.5 text-slate-400" /> Dashboard
                      </button>
                      <button type="button" onClick={() => { onSignOut(); setIsMenuOpen(false) }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-rose-500 hover:bg-rose-50 transition-colors">
                        <span className="h-3.5 w-3.5 flex items-center justify-center text-rose-400">✕</span> Cerrar sesión
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-[#efeae2] relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none">
            <span className="font-extrabold text-[12vw] tracking-tighter uppercase whitespace-nowrap text-slate-800">WHATSCOACH</span>
          </div>
          <div className="max-w-3xl mx-auto space-y-4 relative z-10">

            {sim.isOfflineMode && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 shadow-xs">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5 text-amber-600 animate-pulse" />
                </div>
                <div>
                  <h5 className="text-xs font-extrabold text-amber-800 uppercase tracking-wide">Simulador Local Activado</h5>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    Has alcanzado el límite de la API. El <b>motor offline de emergencia</b> está activo para continuar sin interrupciones.
                  </p>
                </div>
              </div>
            )}

            {sim.messages.length === 0 ? (
              <div className="text-center py-24 space-y-5 max-w-sm mx-auto">
                <div className="w-16 h-16 bg-[#128C7E]/10 rounded-full flex items-center justify-center mx-auto text-2xl">💬</div>
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#128C7E]">Canal de Chat Vacío</p>
                  <h4 className="text-3xl font-extrabold text-slate-400 tracking-tight">Sin Conversación</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Haz clic en <span className="text-[#128C7E] font-bold">Nueva Sim.</span> para configurar tu entrenamiento paso a paso.
                  </p>
                </div>
                <button type="button" onClick={openWizard}
                  className="mx-auto flex items-center gap-2 bg-[#128C7E] hover:bg-[#0c6b60] text-white font-bold px-6 py-3 rounded-2xl text-sm transition-colors shadow-sm">
                  <Sparkles className="h-4 w-4" /> Preparar Simulación
                </button>
              </div>
            ) : sim.messages.map((msg, i) => {
              const isUser = msg.role === MessageRole.Vendedor
              return (
                <div key={i} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl shadow-sm px-4 py-3 text-sm leading-relaxed ${
                    isUser ? "bg-[#d9fdd3] rounded-tr-none border border-[#e1f7de]"
                           : "bg-white rounded-tl-none border border-slate-100"
                  }`}>
                    <div className="flex justify-between items-center mb-1 gap-4">
                      <span className={`text-[10px] font-bold uppercase ${isUser ? "text-emerald-700" : "text-[#128C7E]"}`}>
                        {isUser ? "Tú (Vendedor)" : activeProfile.name}
                      </span>
                      <button type="button" onClick={() => sim.handleCopyText(msg.text)}
                        className="text-slate-400 hover:text-[#128C7E] transition-colors p-0.5">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-slate-800 text-[13px] sm:text-sm whitespace-pre-line leading-relaxed">{msg.text}</p>
                    <span className="text-[9px] text-slate-400 font-medium block text-right mt-1.5">{msg.time}</span>
                  </div>
                </div>
              )
            })}

            {sim.typingState && (
              <div className="flex items-center gap-1.5 bg-white border border-slate-100 shadow-sm p-3 rounded-2xl w-28">
                <span className="text-[10px] font-bold text-[#128C7E] animate-pulse">Escribiendo</span>
                <div className="h-1 w-1 bg-[#25D366] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="h-1 w-1 bg-[#25D366] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              </div>
            )}
            <div ref={sim.chatBottomRef} />
          </div>
        </div>

        {/* FAB — Analizar (aparece tras 4+ interacciones) */}
        <AnimatePresence>
          {sim.isSimInProgress && sim.messages.length >= 4 && (
            <motion.button
              type="button"
              onClick={sim.finishAndEvaluateWithIA}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: [0,  1,  1,  1,  1,  1],
                y:       [20, 0, -8,  0, -4,  0],
              }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="absolute bottom-[88px] left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-5 py-3 bg-[#128C7E] hover:bg-[#0c6b60] text-white rounded-full shadow-lg text-sm font-bold transition-colors whitespace-nowrap"
            >
              <Search className="h-4 w-4" />
              Analizar conversación
            </motion.button>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="px-4 py-3 bg-[#f0f2f5]/80 flex items-center gap-3 shrink-0">
          <input type="text"
            placeholder={
              !sim.isSimInProgress ? "Configura la simulación con el botón Nueva Sim. →"
              : sim.typingState    ? "El prospecto está respondiendo..."
              : "Escribe un mensaje..."
            }
            value={sim.inputText}
            onChange={e => sim.setInputText(e.target.value)}
            disabled={!sim.isSimInProgress || sim.typingState}
            onKeyDown={e => { if (e.key === "Enter") sim.handleSendMessage() }}
            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-[#128C7E] text-slate-800 disabled:opacity-50 transition-colors"
          />
          <button type="button" onClick={sim.handleSendMessage}
            disabled={!sim.isSimInProgress || sim.typingState || !sim.inputText.trim()}
            className="h-11 w-11 bg-[#128C7E] hover:bg-[#0c6b60] text-white flex items-center justify-center rounded-full shadow-md disabled:opacity-40 transition-all shrink-0">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </main>

      <EvalPanel
        sim={sim}
        expanded={evalExpanded}
        onToggleExpand={() => setEvalExpanded(e => !e)}
      />

      {/* Mobile nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 z-50 flex items-center justify-around px-2 shadow-lg">
        {([
          { view: "config" as const, icon: <Settings className="h-5 w-5" />,       label: "Configurar" },
          { view: "chat"   as const, icon: <MessageCircle className="h-5 w-5" />,  label: "Chat" },
          { view: "eval"   as const, icon: <Brain className="h-5 w-5" />,          label: "Coach IA" },
        ]).map(({ view, icon, label }) => (
          <button key={view} type="button"
            onClick={() => {
              if (view === "config") {
                openWizard()
              } else if (view === "eval" && !sim.isEvalOpen && !sim.evaluation) {
                sim.notify("Alcanza al menos un par de mensajes y toca 'Analizar Estrategia' para habilitar tus informes.", true)
              } else {
                sim.setActiveMobileView(view)
              }
            }}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all relative ${
              sim.activeMobileView === view && view !== "config" ? "text-[#128C7E] font-bold scale-105"
              : view === "eval" && !sim.isEvalOpen && !sim.evaluation ? "text-slate-400 opacity-40 cursor-not-allowed"
              : "text-slate-500 font-medium"
            }`}>
            {icon}
            <span className="text-[10px] tracking-tight">{label}</span>
            {view === "chat" && sim.messages.length > 0 && (
              <span className="absolute top-1.5 right-8 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
