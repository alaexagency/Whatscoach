export interface ClientProfile {
  id: string
  name: string
  emoji: string
  description: string
  traits: string[]
  sellerHint: string
  objections: string[]
}

export const CLIENT_PROFILES: Record<string, ClientProfile> = {
  skeptical: {
    id: "skeptical",
    name: "Carlos Escéptico",
    emoji: "🤨",
    description: "No cree en promesas de gurús de internet. Exige pruebas reales, desconfía por naturaleza y busca errores argumentales.",
    traits: ["Cuestiona promesas", "Exige pruebas sociales", "Tono defensivo de inicio"],
    sellerHint: "Para cerrar a Carlos, no prometas cosas utópicas. Usa datos, validación emocional (Feel-Felt-Found) y ofrece garantías.",
    objections: [
      "He comprado 3 cursos de IA antes y ninguno me funcionó. ¿Por qué este no sería humo?",
      "Prometes automatización, pero ¿tienes resultados REALES de alumnos medibles?",
      "¿Cómo sé que las herramientas que enseñas no quedarán obsoletas en 3 meses por las actualizaciones?"
    ]
  },
  price_sensitive: {
    id: "price_sensitive",
    name: "María Precio",
    emoji: "💰",
    description: "Le interesa el producto pero tiene pánico a gastar. Su mente calcula precios y busca conseguir rebajas o cuotas.",
    traits: ["Pide rebajas", "Menciona limitaciones de dinero", "Compara con opciones baratas"],
    sellerHint: "Usa la técnica de Reframing (encuadrar como inversión) o propone pagos divididos (Alternative Close) en lugar de dar descuentos.",
    objections: [
      "La verdad me interesa pero $297 dólares me parece carísimo para mi situación de hoy.",
      "Hay cursos en internet por $15 o videos gratis en YouTube. ¿Vale la pena pagar tanto de diferencia?",
      "No puedo pagarlo todo ahora mismo. ¿Hay un plan de cuotas bajas sin intereses?"
    ]
  },
  busy: {
    id: "busy",
    name: "Andrea Ocupada",
    emoji: "⏰",
    description: "Está saturada de trabajo y proyectos. Te contesta apurada, odia textos largos y teme que el curso le robe más tiempo del que tiene.",
    traits: ["Mensajes cortos", "Pide ir al grano", "Valora la optimización del tiempo"],
    sellerHint: "Sé ultra preciso en WhatsApp. No le mandes párrafos eternos. Resalta que el programa es práctico y de solo 20 mins al día.",
    objections: [
      "Trabajo más de 10 horas diarias. No tengo energías ni tiempo extra para ponerme a estudiar.",
      "¿Hay clases grabadas o es todo en vivo obligatorio? Si requiere horarios fijos no podré entrar.",
      "Necesito ver resultados rápidamente. Si me toma 3 meses ver cambios, no me sirve."
    ]
  },
  analytical: {
    id: "analytical",
    name: "Roberto Analítico",
    emoji: "📊",
    description: "Decide con datos estructurados y lógica pura. Ignora la emotividad y las frases motivadoras.",
    traits: ["Pide detalles mecánicos", "Solicita temario estructurado", "Busca métricas de retorno"],
    sellerHint: "Preséntale el temario exacto de forma ordenada, habla de métricas de completación anteriores y muéstrate súper técnico.",
    objections: [
      "¿Cuál es el temario detallado semana a semana? Necesito ver exactamente qué herramientas de automatización enseñan.",
      "¿Qué porcentaje de sus estudiantes realmente termina con éxito todo el plan de estudios?",
      "Quiero saber las métricas exactas del ROI promedio que informan sus graduados en los primeros meses."
    ]
  },
  emotional: {
    id: "emotional",
    name: "Laura Emocional",
    emoji: "❤️",
    description: "Siente frustración acumulada y tiene terror de quedarse atrás tecnológicamente. Prefiere historias humanas y sentirse apoyada.",
    traits: ["Abierta emocionalmente", "Busca conexión", "Miedo al fracaso técnico"],
    sellerHint: "Empatiza profundamente. Entiende su problema inicial, cuéntale historias de soporte constante y hazla sentir bienvenida a una familia académica.",
    objections: [
      "Me da pánico la tecnología, siento que me voy a quedar estancada y no sé si sea capaz de aprender.",
      "Me da miedo sentirme sola haciendo preguntas tontas en el curso y que se desesperen.",
      "¿Hay mentoría real para consultas personalizadas o es simplemente ver videos pregrabados sóla?"
    ]
  },
  ghost: {
    id: "ghost",
    name: "Diego Fantasma",
    emoji: "👻",
    description: "Pregunta con inicial curiosidad y luego deja de responder rápidamente o te deja en 'Visto'. Es el clásico cliente evasivo.",
    traits: ["Lector pasivo", "Evasivo", "Aplaza decisiones constantemente"],
    sellerHint: "Aprovecha preguntas cortas que exijan fácil respuesta o utiliza la técnica de Takeaway (Quitar oportunidad/Escasez) para sacudir su parálisis.",
    objections: [
      "Ah, me interesa. Envíame información completa por favor.",
      "*(visto sin responder por rato)*",
      "Está genial la información, pero déjame pensarlo con calma y yo te escribo cuando esté listo."
    ]
  }
}

export const MASTER_12_TECNICAS = [
  { name: "Straight Line",        author: "Jordan Belfort", keywords: "Transferencia de certeza, seguridad absoluta",              matchWords: ["seguro", "definitivamente", "certeza", "estupidez", "sin dudas"] },
  { name: "SPIN Selling",         author: "Neil Rackham",   keywords: "Situación, Problema, Implicación, Necesidad",               matchWords: ["situación", "problema", "implicación", "consecuencia", "cuánto cuesta"] },
  { name: "Feel-Felt-Found",      author: "Clásica",        keywords: "Sentir, Sentían, Encontraron (empatía pura)",               matchWords: ["entiendo cómo", "sentían", "descubrieron", "muchos se han"] },
  { name: "Benjamin Franklin",    author: "Ben Franklin",   keywords: "Lista de pros y contras",                                   matchWords: ["pros", "contras", "ventajas", "lista", "balance"] },
  { name: "Assumptive Close",     author: "Clásica",        keywords: "Asumir la venta logística",                                 matchWords: ["envío el link", "qué tarjeta", "dirección", "cuándo empezamos"] },
  { name: "Urgencia Real",        author: "Escasez",        keywords: "Crear FOMO con cupos o tiempo legítimo",                   matchWords: ["quedan", "últimos", "solo hoy", "se acaba", "cupo limitado"] },
  { name: "Prueba Social",        author: "Cialdini",       keywords: "Testimonios, audios, capturas, casos de éxito",            matchWords: ["testimonio", "caso de éxito", "mira esto", "paso el caso"] },
  { name: "Reframing",            author: "PNL/Ventas",     keywords: "Convertir gasto a inversión amortizable",                  matchWords: ["inversión", "no es gasto", "se paga solo", "retorno"] },
  { name: "Alternative Close",    author: "Clásica",        keywords: "Ofrecer opción A o B en vez de Sí/No",                    matchWords: ["opción A", "¿cuál prefieres?", "tarjeta o transf", "3 o 6 pagos"] },
  { name: "Porque (Cialdini)",    author: "Cialdini",       keywords: "Justificación con 'porque' para aumentar aceptación",      matchWords: ["porque", "ya que", "la razón es", "te lo digo porque"] },
  { name: "Pain Agitate Solve",   author: "Copywriting",    keywords: "Foco dolor, agitar la consecuencia y resolver",            matchWords: ["imagina", "cada día que pasa", "mientras tanto", "te está pasando"] },
  { name: "Takeaway",             author: "Clásica",        keywords: "Quitar la oportunidad para avivar el deseo",               matchWords: ["quizás no sea para ti", "no todos califican", "tengo que evaluar"] }
]
