import { Brain, Award } from "lucide-react"

export interface EvalData {
  indicadores: {
    calidad_conversacion: number
    manejo_objeciones: number
    tecnicas_cierre: number
    puntuacion_final: number
  }
  analisis: {
    fortalezas: string[]
    oportunidades_mejora: string[]
    tecnicas_aplicadas: string[]
    tecnicas_no_aplicadas: string[]
    tecnica_cierre_recomendada: string
  }
  ejemplo_respuesta_ideal: string
}

export function EvalDisplay({ data }: { data: EvalData }) {
  const { indicadores, analisis, ejemplo_respuesta_ideal } = data
  const score = indicadores.puntuacion_final

  return (
    <div className="space-y-5">

      {/* Score principal */}
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm space-y-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Puntuación de Cierre</p>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-6xl font-extrabold tracking-tighter text-[#128C7E] leading-none">{score}%</span>
          </div>
        </div>
        <div className={`p-3 text-xs font-bold rounded-xl text-center ${
          score >= 80 ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
          : score >= 60 ? "bg-amber-50 text-amber-800 border border-amber-100"
          : "bg-rose-50 text-rose-800 border border-rose-100"
        }`}>
          {score >= 80 ? "🏆 Calidad máxima en negociación"
           : score >= 60 ? "👍 Cierre viable — se perdieron algunos marcos"
           : "⚠️ Peligro de deserción del lead"}
        </div>
      </div>

      {/* Mini indicadores */}
      <div className="grid grid-cols-3 border border-slate-200 divide-x divide-slate-200 bg-white rounded-xl shadow-sm overflow-hidden">
        {[
          { label: "Empatía",  val: indicadores.calidad_conversacion },
          { label: "Objeción", val: indicadores.manejo_objeciones },
          { label: "Marcos",   val: indicadores.tecnicas_cierre },
        ].map(({ label, val }) => (
          <div key={label} className="p-4 text-center">
            <div className="text-xl font-bold text-slate-800">{val}/10</div>
            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Fortalezas y mejoras */}
      {[
        { title: "Puntos Fuertes",  textColor: "text-emerald-700", dotColor: "bg-emerald-500", borderColor: "border-l-emerald-500", items: analisis.fortalezas },
        { title: "Errores / Oportunidades", textColor: "text-[#128C7E]", dotColor: "bg-[#128C7E]", borderColor: "border-l-[#128C7E]", items: analisis.oportunidades_mejora },
      ].map(({ title, textColor, dotColor, borderColor, items }) => (
        <div key={title} className="space-y-2">
          <h3 className={`text-xs font-bold ${textColor} uppercase tracking-wider flex items-center gap-1.5`}>
            <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} /> {title}
          </h3>
          <div className="space-y-1.5">
            {items.map((item, i) => (
              <div key={i} className={`text-xs bg-white border-l-4 ${borderColor} border border-slate-200 rounded-r-xl p-3 text-slate-600 font-medium leading-relaxed shadow-sm`}>
                {item}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Matriz de técnicas */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Award className="h-4 w-4 text-[#128C7E]" /> Técnicas detectadas
        </h3>
        <div className="border border-slate-200 overflow-hidden rounded-xl divide-y divide-slate-100 shadow-sm">
          <div className="grid grid-cols-12 bg-slate-100 text-[9px] uppercase tracking-wider font-bold text-slate-500">
            <div className="col-span-6 p-2.5 border-r border-slate-200">Técnica</div>
            <div className="col-span-6 p-2.5">Estado</div>
          </div>
          {analisis.tecnicas_aplicadas.map((t, i) => (
            <div key={`a-${i}`} className="grid grid-cols-12 text-xs bg-white">
              <div className="col-span-6 p-2.5 border-r border-slate-200 font-medium text-slate-700 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />{t}
              </div>
              <div className="col-span-6 p-2.5 text-emerald-600 font-bold uppercase tracking-wider text-[11px]">EJECUTADA</div>
            </div>
          ))}
          {analisis.tecnicas_no_aplicadas.map((t, i) => (
            <div key={`n-${i}`} className="grid grid-cols-12 text-xs bg-white">
              <div className="col-span-6 p-2.5 border-r border-slate-200 font-medium text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />{t}
              </div>
              <div className="col-span-6 p-2.5 text-slate-400 italic">Ausente del discurso</div>
            </div>
          ))}
        </div>
      </div>

      {/* Táctica recomendada */}
      <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-1.5 shadow-sm">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
          <Brain className="h-4 w-4 text-[#128C7E]" /> Táctica de cierre recomendada
        </h4>
        <p className="text-xs text-slate-600 leading-relaxed font-medium">{analisis.tecnica_cierre_recomendada}</p>
      </div>

      {/* Respuesta ideal */}
      <div className="space-y-2">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Respuesta ideal para WhatsApp:</p>
        <div className="bg-white border border-slate-200 p-4 text-xs italic leading-relaxed text-justify rounded-xl shadow-sm text-slate-700">
          "{ejemplo_respuesta_ideal}"
        </div>
      </div>

      {/* Ejercicios recomendados */}
      {analisis.tecnicas_no_aplicadas.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Ejercicios recomendados
          </h3>
          <div className="space-y-1.5">
            {analisis.tecnicas_no_aplicadas.slice(0, 4).map((t, i) => (
              <div key={i} className="text-xs bg-amber-50 border-l-4 border-l-amber-400 border border-amber-100 rounded-r-xl p-3 text-amber-800 font-medium leading-relaxed shadow-sm">
                Practica <strong>{t}</strong> — simula una conversación usando esta técnica en WhatsCoach.
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
