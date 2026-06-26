import { motion, AnimatePresence } from "motion/react"
import { Brain, AlertTriangle, Award, Copy, Download, ChevronsLeft, ChevronsRight } from "lucide-react"
import type { useSimulator } from "../../hooks/useSimulator"

type Sim = ReturnType<typeof useSimulator>

interface Props {
  sim: Sim
  expanded: boolean
  onToggleExpand: () => void
}

export function EvalPanel({ sim, expanded, onToggleExpand }: Props) {
  const ev = sim.evaluation

  return (
    <AnimatePresence>
      {sim.isEvalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`${expanded ? "w-full" : "w-1/2"} bg-white rounded-[25px] overflow-hidden shrink-0 h-full flex flex-col z-40 relative shadow-sm transition-all duration-300 ${sim.activeMobileView === "eval" ? "flex" : "hidden md:flex"}`}
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-200 bg-[#f0f2f5] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button type="button" onClick={onToggleExpand}
                className="text-slate-500 hover:text-[#128C7E] p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition-all"
                title={expanded ? "Ver junto al chat" : "Expandir panel"}>
                {expanded
                  ? <ChevronsRight className="h-4 w-4" />
                  : <ChevronsLeft className="h-4 w-4" />
                }
              </button>
              <Brain className="h-5 w-5 text-[#128C7E]" />
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 leading-none">Auditoría de Ventas IA</h2>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">Análisis del Discurso</p>
              </div>
            </div>
            <button type="button" onClick={() => sim.setIsEvalOpen(false)}
              className="text-slate-500 hover:text-slate-800 font-bold p-1 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs">✕</button>
          </div>

          {/* Loading */}
          {sim.isEvalLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4 bg-slate-50">
              <div className="h-10 w-10 rounded-full border-4 border-[#128C7E] border-t-transparent animate-spin" />
              <div className="text-center space-y-1 max-w-xs">
                <h4 className="text-xs font-bold text-[#128C7E] uppercase tracking-wider">Motor Analítico Activo</h4>
                <p className="text-xs text-slate-500 tracking-wide leading-relaxed">{sim.loadingStepText}</p>
              </div>
            </div>
          ) : ev && (
            <div className={`flex-1 p-5 space-y-6 bg-slate-50 overflow-y-auto ${expanded ? "max-w-3xl mx-auto w-full" : ""}`}>

              {sim.isOfflineMode && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-700 flex gap-2.5 shadow-xs">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div><span className="font-bold">Informe de Emergencia:</span> Generado localmente con heurísticas alternativas.</div>
                </div>
              )}

              {/* Score */}
              <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold italic">Métrica de Auditoría</p>
                  <h2 className="text-2xl font-bold leading-none tracking-tight text-slate-800 mt-0.5">Estratagema Comercial</h2>
                </div>
                <div className="flex items-baseline gap-2 border-b border-slate-100 pb-3">
                  <span className="text-6xl font-extrabold tracking-tighter text-[#128C7E] leading-none">{ev.indicadores.puntuacion_final}%</span>
                  <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Puntaje de Cierre</span>
                </div>
                <div className={`p-3 text-xs font-bold rounded-xl text-center shadow-xs ${
                  ev.indicadores.puntuacion_final >= 80 ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                  : ev.indicadores.puntuacion_final >= 60 ? "bg-amber-50 text-amber-800 border border-amber-100"
                  : "bg-rose-50 text-rose-800 border border-rose-100"
                }`}>
                  {ev.indicadores.puntuacion_final >= 80 ? "🏆 Calidad Máxima en Negociación"
                  : ev.indicadores.puntuacion_final >= 60 ? "👍 Cierre viable (Se perdieron marcos)"
                  : "⚠️ Peligro de Deserción del Lead"}
                </div>
              </div>

              {/* Mini indicadores */}
              <div className="grid grid-cols-3 gap-0 border border-slate-200 divide-x divide-slate-200 bg-white rounded-xl shadow-xs overflow-hidden">
                {[
                  { label: "Empatía",  val: ev.indicadores.calidad_conversacion },
                  { label: "Objeción", val: ev.indicadores.manejo_objeciones },
                  { label: "Marcos",   val: ev.indicadores.tecnicas_cierre },
                ].map(({ label, val }) => (
                  <div key={label} className="p-3 text-center">
                    <div className="text-base font-bold text-slate-800">{val}/10</div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{label}</div>
                  </div>
                ))}
              </div>

              {/* Fortalezas y oportunidades */}
              {[
                { title: "Puntos Fuertes", textColor: "text-emerald-700", dotColor: "bg-emerald-500", borderColor: "border-l-emerald-500", items: ev.analisis.fortalezas },
                { title: "Oportunidades",  textColor: "text-[#128C7E]",   dotColor: "bg-[#128C7E]",   borderColor: "border-l-[#128C7E]",   items: ev.analisis.oportunidades_mejora },
              ].map(({ title, textColor, dotColor, borderColor, items }) => (
                <div key={title} className="space-y-2">
                  <h3 className={`text-xs font-bold ${textColor} uppercase tracking-wider flex items-center gap-1.5`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} /> {title}
                  </h3>
                  <div className="space-y-1.5">
                    {items.map((item, i) => (
                      <div key={i} className={`text-xs bg-white border-l-4 ${borderColor} border border-slate-200 rounded-r-xl p-3 text-slate-600 font-medium leading-relaxed shadow-xs`}>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Matriz de técnicas */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-[#128C7E]" /> Matriz de Técnicas Detectadas
                </h3>
                <div className="border border-slate-200 overflow-hidden rounded-xl divide-y divide-slate-100 shadow-xs">
                  <div className="grid grid-cols-12 bg-slate-100 text-[9px] uppercase tracking-wider font-bold text-slate-500">
                    <div className="col-span-6 p-2.5 border-r border-slate-200">Técnica</div>
                    <div className="col-span-6 p-2.5">Estado</div>
                  </div>
                  {ev.analisis.tecnicas_aplicadas.map((t, i) => (
                    <div key={`a-${i}`} className="grid grid-cols-12 text-xs bg-white">
                      <div className="col-span-6 p-2 border-r border-slate-200 font-medium text-slate-700 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{t}
                      </div>
                      <div className="col-span-6 p-2 text-emerald-600 font-bold uppercase tracking-wider text-[11px]">EJECUTADA</div>
                    </div>
                  ))}
                  {ev.analisis.tecnicas_no_aplicadas.map((t, i) => (
                    <div key={`n-${i}`} className="grid grid-cols-12 text-xs bg-white">
                      <div className="col-span-6 p-2 border-r border-slate-200 font-medium text-slate-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />{t}
                      </div>
                      <div className="col-span-6 p-2 text-slate-400 italic">Ausente del discurso</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Táctica recomendada */}
              <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-1 shadow-xs">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Brain className="h-4 w-4 text-[#128C7E]" /> Táctica Cardinal del Cierre:
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">{ev.analisis.tecnica_cierre_recomendada}</p>
              </div>

              {/* Respuesta ideal */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fórmula para WhatsApp Ideal:</span>
                  <button type="button" onClick={() => sim.handleCopyText(ev.ejemplo_respuesta_ideal)}
                    className="text-[10px] text-[#128C7E] hover:text-[#0c6b60] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Copy className="h-3 w-3" /> Copiar Fórmula
                  </button>
                </div>
                <div className="bg-white border border-slate-200 p-4 text-xs italic leading-relaxed text-justify rounded-xl shadow-xs text-slate-700">
                  "{ev.ejemplo_respuesta_ideal}"
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={sim.downloadHistoryTXT}
                  className="flex-1 py-2.5 bg-[#128C7E] hover:bg-[#0c6b60] text-white font-bold text-xs rounded-xl shadow-sm transition-all text-center uppercase tracking-wider flex items-center justify-center gap-1">
                  <Download className="h-3 w-3" /> Descargar
                </button>
                <button type="button" onClick={sim.restartSimulationFull}
                  className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition-all text-center uppercase tracking-wider">
                  Volver a Entrenar
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
