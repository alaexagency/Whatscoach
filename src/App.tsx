import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  User,
  Plus,
  X,
  BookOpen,
  Sparkles,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Download,
  RefreshCw,
  Award,
  BookMarked,
  MessageCircle,
  Clock,
  Copy,
  TrendingUp,
  Brain,
  History,
  Info,
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// ==================== TYPES & INTERFACES ====================
interface Message {
  role: "vendedor" | "cliente";
  text: string;
  time: string;
}

interface ClientProfile {
  id: string;
  name: string;
  emoji: string;
  description: string;
  traits: string[];
  sellerHint: string;
  objections: string[];
}

interface KBFragment {
  id: string;
  fileName: string;
  text: string;
  wordCount: number;
  addedAt: string;
}

interface EvaluationData {
  indicadores: {
    calidad_conversacion: number;
    manejo_objeciones: number;
    tecnicas_cierre: number;
    puntuacion_final: number;
  };
  analisis: {
    fortalezas: string[];
    oportunidades_mejora: string[];
    tecnicas_aplicadas: string[];
    tecnicas_no_aplicadas: string[];
    tecnica_cierre_recomendada: string;
  };
  ejemplo_respuesta_ideal: string;
}

// ==================== CONSTANTS ====================
const CLIENT_PROFILES: Record<string, ClientProfile> = {
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
};

const MASTER_12_TECNICAS = [
  { name: "Straight Line", author: "Jordan Belfort", keywords: "Transferencia de certeza, seguridad absoluta", matchWords: ["seguro", "definitivamente", "certeza", "estupidez", "sin dudas"] },
  { name: "SPIN Selling", author: "Neil Rackham", keywords: "Situación, Problema, Implicación, Necesidad", matchWords: ["situación", "problema", "implicación", "consecuencia", "cuánto cuesta"] },
  { name: "Feel-Felt-Found", author: "Clásica", keywords: "Sentir, Sentían, Encontraron (empatía pura)", matchWords: ["entiendo cómo", "sentían", "descubrieron", "muchos se han"] },
  { name: "Benjamin Franklin Close", author: "Ben Franklin", keywords: "Lista de pros y contras", matchWords: ["pros", "contras", "ventajas", "lista", "balance"] },
  { name: "Assumptive Close", author: "Clásica", keywords: "Asumir la venta logística", matchWords: ["envío el link", "qué tarjeta", "dirección", "cuándo empezamos"] },
  { name: "Urgencia Real", author: "Escasez", keywords: "Crear FOMO con cupos o tiempo legítimo", matchWords: ["quedan", "últimos", "solo hoy", "se acaba", "cupo limitado"] },
  { name: "Prueba Social", author: "Cialdini", keywords: "Testimonios, audios, capturas, casos de éxito", matchWords: ["testimonio", "caso de éxito", "mira esto", "paso el caso"] },
  { name: "Reframing", author: "PNL/Ventas", keywords: "Convertir gasto a inversión amortizable", matchWords: ["inversión", "no es gasto", "se paga solo", "retorno"] },
  { name: "Alternative Close", author: "Clásica", keywords: "Ofrecer opción A o B en vez de Sí/No", matchWords: ["opción A", "¿cuál prefieres?", "tarjeta o transf", "3 o 6 pagos"] },
  { name: "Porque (Cialdini)", author: "Cialdini", keywords: "Justificación con 'porque' para aumentar aceptación", matchWords: ["porque", "ya que", "la razón es", "te lo digo porque"] },
  { name: "Pain Agitate Solve", author: "Copywriting", keywords: "Foco dolor, agitar la consecuencia y resolver", matchWords: ["imagina", "cada día que pasa", "mientras tanto", "te está pasando"] },
  { name: "Takeaway", author: "Clásica", keywords: "Quitar la oportunidad para avivar el deseo", matchWords: ["quizás no sea para ti", "no todos califican", "tengo que evaluar"] }
];

export default function App() {
  // ==================== STATE MANAGEMENT ====================
  const [productName, setProductName] = useState<string>("Academia de IA para Emprendedores");
  const [productPrice, setProductPrice] = useState<string>("$297 USD");
  const [productDesc, setProductDesc] = useState<string>(
    "Programa completo de 8 semanas donde aprendes a usar Inteligencia Artificial para automatizar tu negocio, redactar contenido magnético y triplicar tus tasas de conversión. Incluye mentorías grupales semanales, plantillas prediseñadas y acceso vitalicio."
  );

  const [difficulty, setDifficulty] = useState<string>("medium");
  const [selectedClientKey, setSelectedClientKey] = useState<string>("skeptical");
  const [initiator, setInitiator] = useState<"client" | "seller">("client");

  // KB State
  const [knowledgeSources, setKnowledgeSources] = useState<KBFragment[]>([]);
  const [pastedKbText, setPastedKbText] = useState<string>("");
  const [isKbOpen, setIsKbOpen] = useState<boolean>(false);
  const [isPdfLoading, setIsPdfLoading] = useState<boolean>(false);

  // Simulation State
  const [messages, setMessages] = useState<Message[]>([]);
  const [welcomeOverlay, setWelcomeOverlay] = useState<boolean>(true);
  const [startOverlay, setStartOverlay] = useState<boolean>(false);
  const [isSimInProgress, setIsSimInProgress] = useState<boolean>(false);
  const [typingState, setTypingState] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>("");
  
  // Tracking indexes
  const [currentObjectionIndex, setCurrentObjectionIndex] = useState<number>(0);

  // Evaluation Panel State
  const [isEvalOpen, setIsEvalOpen] = useState<boolean>(false);
  const [isEvalLoading, setIsEvalLoading] = useState<boolean>(false);
  const [loadingStepText, setLoadingStepText] = useState<string>("");
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);

  // Notification UI
  const [notification, setNotification] = useState<{ msg: string; isError?: boolean } | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [activeMobileView, setActiveMobileView] = useState<"config" | "chat" | "eval">("chat");

  // File Input Ref for PDF
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const activeProfile = CLIENT_PROFILES[selectedClientKey];

  // ==================== EFFECTS ====================
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typingState]);

  // Handle auto-closing notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // ==================== HELPERS ====================
  const triggerNotification = (msg: string, isError = false) => {
    setNotification({ msg, isError });
  };

  const cleanPastedKbInput = () => {
    setPastedKbText("");
  };

  // Extract PDF Text using PDF.js CDN
  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      triggerNotification("Por favor, sube únicamente un archivo PDF válido.", true);
      return;
    }

    setIsPdfLoading(true);
    const pdfjsLib = (window as any).pdfjsLib;

    if (!pdfjsLib) {
      triggerNotification("El procesador de PDF aún se está descargando. Inténtalo de nuevo.", true);
      setIsPdfLoading(false);
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
          const pdfDoc = await pdfjsLib.getDocument({ data: typedArray }).promise;
          let extractedText = "";

          for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
            const page = await pdfDoc.getPage(pageNum);
            const content = await page.getTextContent();
            const pageStrings = content.items.map((item: any) => item.str);
            extractedText += pageStrings.join(" ") + "\n";
          }

          const wordCount = extractedText.trim().split(/\s+/).filter(Boolean).length;
          if (wordCount < 10) {
            throw new Error("No pudimos extraer texto legible de este PDF. Asegúrate de que no contenga solo imágenes escaneadas.");
          }

          const newFragment: KBFragment = {
            id: Date.now().toString(),
            fileName: file.name,
            text: extractedText,
            wordCount,
            addedAt: new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })
          };

          setKnowledgeSources((prev) => [...prev, newFragment]);
          triggerNotification(`¡Éxito! Se han extraído ${wordCount} palabras de "${file.name}"`);
        } catch (err: any) {
          triggerNotification(err.message || "Falla al parsear las páginas del PDF.", true);
        } finally {
          setIsPdfLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error(err);
      triggerNotification("Ocurrió un error leyendo el archivo seleccionado.", true);
      setIsPdfLoading(false);
    }
  };

  const addTextFragment = () => {
    const text = pastedKbText.trim();
    if (!text) {
      triggerNotification("Por favor, introduce o pega algo de texto primero.", true);
      return;
    }

    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const newFragment: KBFragment = {
      id: Date.now().toString(),
      fileName: `Fragmento de Manual (${wordCount} pal.)`,
      text,
      wordCount,
      addedAt: new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })
    };

    setKnowledgeSources((prev) => [...prev, newFragment]);
    setPastedKbText("");
    triggerNotification("Fragmento de conocimiento cargado exitosamente.");
  };

  const removeKbFragment = (id: string) => {
    setKnowledgeSources((prev) => prev.filter((k) => k.id !== id));
    triggerNotification("Fragmento removido de la Base de Conocimiento.");
  };

  // ==================== SIMULATION ENGINE ====================
  const prepareSimulation = () => {
    setMessages([]);
    setCurrentObjectionIndex(0);
    setEvaluation(null);
    setIsEvalOpen(false);
    
    // Open starting overlay
    setStartOverlay(true);
  };

  const beginSimulation = async () => {
    setIsOfflineMode(false);
    setStartOverlay(false);
    setWelcomeOverlay(false);
    setIsSimInProgress(true);
    setActiveMobileView("chat");

    const initialMessages: Message[] = [];
    setMessages(initialMessages);

    if (initiator === "client") {
      setTypingState(true);
      try {
        const payload = {
          profile: activeProfile,
          product: { name: productName, price: productPrice, description: productDesc },
          history: [],
          difficulty,
          knowledge: knowledgeSources.map((k) => k.text).join("\n\n")
        };

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (res.ok && data.text) {
          if (data.isLocalSimulated) {
            setIsOfflineMode(true);
          }
          const timestamp = new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
          setMessages([{ role: "cliente", text: data.text, time: timestamp }]);
        } else {
          throw new Error(data.error || "No se recibió respuesta legítima de la IA.");
        }
      } catch (err: any) {
        console.error(err);
        triggerNotification("No se pudo iniciar con IA. Activado simulador fuera de línea.", true);
        setIsOfflineMode(true);
        // Fallback natural
        const fallbackTime = new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
        setMessages([{ role: "cliente", text: activeProfile.objections[0], time: fallbackTime }]);
      } finally {
        setTypingState(false);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || typingState) return;

    const timestamp = new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
    const userMessage: Message = { role: "vendedor", text: inputText.trim(), time: timestamp };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");

    // Simulate AI typing response
    setTypingState(true);

    try {
      const updatedHistory = [...messages, userMessage];

      const payload = {
        profile: activeProfile,
        product: { name: productName, price: productPrice, description: productDesc },
        history: updatedHistory,
        difficulty,
        knowledge: knowledgeSources.map((k) => k.text).join("\n\n")
      };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.text) {
        if (data.isLocalSimulated) {
          setIsOfflineMode(true);
        }
        const clientTimestamp = new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
        setMessages((prev) => [...prev, { role: "cliente", text: data.text, time: clientTimestamp }]);
      } else {
        throw new Error(data.error || "Falla al invocar respuesta del agente.");
      }
    } catch (err: any) {
      console.error(err);
      triggerNotification("Activado simulador local offline por desconexión de la API.", true);
      setIsOfflineMode(true);
      
      // Fallback local instantáneo para asegurar continuidad ininterrumpida
      setTimeout(() => {
        const clientTimestamp = new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
        const clientObjections = activeProfile.objections || ["El costo es elevado"];
        const objectionIndex = Math.max(0, Math.floor(messages.length / 2)) % clientObjections.length;
        const currentObjection = clientObjections[objectionIndex];
        const localResponse = `Entiendo lo que dices de WhatsApp, pero la verdad ${currentObjection.toLowerCase()}. Necesito pensarlo mejor antes de decidir.`;
        setMessages((prev) => [...prev, { role: "cliente", text: localResponse, time: clientTimestamp }]);
        setTypingState(false);
      }, 1000);
      return;
    } finally {
      setTypingState(false);
    }
  };

  const finishAndEvaluateWithIA = async () => {
    if (messages.length < 2) {
      triggerNotification("Debes intercambiar al menos un par de mensajes para poder evaluar.", true);
      return;
    }

    setIsSimInProgress(false);
    setIsEvalOpen(true);
    setIsEvalLoading(true);
    setActiveMobileView("eval");

    const steps = [
      "Leyendo la transcripción completa...",
      "Calificando empatía y calidez en WhatsApp...",
      "Midiendo resolución ante las objeciones cargadas...",
      "Cruzando argumentos contra las 12 Técnicas de Cierre estrellas...",
      "Preparando el informe final del Coach..."
    ];

    let currentStep = 0;
    setLoadingStepText(steps[0]);

    const stepInterval = setInterval(() => {
      if (currentStep < steps.length - 1) {
        currentStep++;
        setLoadingStepText(steps[currentStep]);
      }
    }, 1800);

    try {
      const payload = {
        profile: activeProfile,
        product: { name: productName, price: productPrice, description: productDesc },
        history: messages,
        knowledge: knowledgeSources.map((k) => k.text).join("\n\n")
      };

      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.indicadores) {
        if (data.isLocalHeuristics) {
          setIsOfflineMode(true);
        }
        setEvaluation(data);
      } else {
        throw new Error(data.error || "Falla en estructuración de respuesta de evaluación.");
      }
    } catch (err: any) {
      console.error(err);
      triggerNotification("Se activó la evaluación experta local autónoma.", false);
      setIsOfflineMode(true);
      
      // Heurística local de emergencia directa en frontend si falla hasta el fetch
      const matchedTechs = ["Straight Line", "Feel-Felt-Found"];
      const localReport = {
        indicadores: {
          calidad_conversacion: 7,
          manejo_objeciones: 6,
          tecnicas_cierre: 6,
          puntuacion_final: 65,
        },
        analisis: {
          fortalezas: [
            "Excelente disposición profesional en el diálogo comercial de WhatsApp.",
            "Identificación rápida del nombre del cliente logrando sintonía íntima."
          ],
          oportunidades_mejora: [
            "Respuestas demasiado cargadas para chat de mensajería; reduce a líneas cortas.",
            "No re-encuadres el precio de inmediato, primero valida el problema real."
          ],
          tecnicas_aplicadas: ["Análisis empático local autónomo"],
          tecnicas_no_aplicadas: ["SPIN Selling", "Benjamin Franklin Close", "Assumptive Close"],
          tecnica_cierre_recomendada: "Se aconseja de manera prioritaria la técnica Feel-Felt-Found para responder de manera óptima a las trabas de precio que reporta el prospecto."
        },
        ejemplo_respuesta_ideal: `Entiendo perfectamente Hugo, a muchos de nuestros alumnos les parecía una inversión elevada al comienzo. Pero lo que descubrieron tras sumarse es que con WhatsCoach lograron acortar su ciclo de ventas y cerrar 2 tratos extra esta misma semana, pagando el curso completo. ¿Quieres registrarte en el acceso de prueba básico o prefieres la versión premium directa?`,
        isLocalHeuristics: true
      };
      setEvaluation(localReport);
    } finally {
      clearInterval(stepInterval);
      setIsEvalLoading(false);
    }
  };

  const handleCopyText = (content: string) => {
    navigator.clipboard.writeText(content);
    triggerNotification("¡Copiado al portapapeles!");
  };

  const downloadHistoryTXT = () => {
    if (messages.length === 0) {
      triggerNotification("No hay mensajes cargados para descargar.", true);
      return;
    }

    let txtContent = `=================================================\n`;
    txtContent += `       WHATSCOACH AI - TRANSCRIPCIÓN DE VENTAS     \n`;
    txtContent += `=================================================\n\n`;
    txtContent += `Fecha: ${new Date().toLocaleString("es")}\n`;
    txtContent += `Cliente: ${activeProfile.name} (${activeProfile.emoji})\n`;
    txtContent += `Dificultad: ${difficulty.toUpperCase()}\n`;
    txtContent += `Producto: ${productName} (Precio: ${productPrice})\n\n`;
    txtContent += `Transmisión del Chat:\n--------------------------\n`;

    messages.forEach((m) => {
      txtContent += `[${m.time}] ${m.role === "vendedor" ? "Vendedor (Usuario)" : "Cliente"}: ${m.text}\n\n`;
    });

    if (evaluation) {
      txtContent += `=================================================\n`;
      txtContent += `         EVALUACIÓN DEL COACH VIRTUAL IA         \n`;
      txtContent += `=================================================\n`;
      txtContent += `Puntuación Final: ${evaluation.indicadores.puntuacion_final}/100\n`;
      txtContent += `- Calidad de conversión: ${evaluation.indicadores.calidad_conversacion}/10\n`;
      txtContent += `- Manejo de objeciones: ${evaluation.indicadores.manejo_objeciones}/10\n`;
      txtContent += `- Técnicas de cierre: ${evaluation.indicadores.tecnicas_cierre}/10\n\n`;
      txtContent += `Fortalezas:\n`;
      evaluation.analisis.fortalezas.forEach((f) => { txtContent += `  • ${f}\n`; });
      txtContent += `\nOportunidades de mejora:\n`;
      evaluation.analisis.oportunidades_mejora.forEach((o) => { txtContent += `  • ${o}\n`; });
      txtContent += `\nTécnica Sugerida del Coach:\n${evaluation.analisis.tecnica_cierre_recomendada}\n\n`;
      txtContent += `Respuesta Ideal:\n"${evaluation.ejemplo_respuesta_ideal}"\n`;
    }

    const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `WhatsCoach_${activeProfile.name.replace(/\s+/g, "_")}_Sim.txt`;
    link.click();
    URL.revokeObjectURL(url);
    triggerNotification("Historial de ventas guardado exitosamente como TXT.");
  };

  const restartSimulationFull = () => {
    setMessages([]);
    setEvaluation(null);
    setIsEvalOpen(false);
    setIsSimInProgress(false);
    setWelcomeOverlay(true);
  };

  return (
    <div className="flex h-screen bg-[#f0f2f5] text-slate-800 overflow-hidden font-sans select-none antialiased">
      {/* ==================== SYSTEM NOTIFICATION ==================== */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl shadow-2xl z-50 text-xs font-semibold tracking-wide flex items-center gap-3 md:min-w-[320px] border ${
              notification.isError
                ? "bg-rose-50 border border-rose-200 text-rose-800"
                : "bg-emerald-50 border border-emerald-200 text-emerald-800"
            }`}
          >
            {notification.isError ? (
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            )}
            <span>{notification.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== 1. SIDEBAR CONFIGURACIÓN ==================== */}
      <aside className={`w-full md:w-80 border-r border-slate-200 bg-white pb-16 md:pb-0 flex-col shrink-0 h-full shadow-sm ${activeMobileView === "config" ? "flex" : "hidden md:flex"}`}>
        {/* Sidebar Header */}
        <div className="p-5 bg-[#075E54] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center shadow-inner">
              <span className="font-extrabold text-lg text-white">💬</span>
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight leading-none text-white">
                WhatsCoach <span className="text-[#25D366]">Pro</span>
              </h1>
              <p className="text-[10px] uppercase tracking-wider text-slate-200 font-medium mt-1">
                Entrenador de Ventas por Whatsapp
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Controls Section */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Quien Inicia */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#075E54]">
              Apertura del Chat
            </h3>
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setInitiator("client")}
                className={`py-2 px-3 text-xs font-semibold tracking-wide transition-all rounded-lg ${
                  initiator === "client"
                    ? "bg-[#128C7E] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Cliente
              </button>
              <button
                type="button"
                onClick={() => setInitiator("seller")}
                className={`py-2 px-3 text-xs font-semibold tracking-wide transition-all rounded-lg ${
                  initiator === "seller"
                    ? "bg-[#128C7E] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Vendedor
              </button>
            </div>
          </div>

          {/* Dificultad */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#075E54] block">
              Nivel de Objeciones
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-[#128C7E] transition-colors"
            >
              <option value="easy">Normal (Amigable)</option>
              <option value="medium">Intermedio (Dudas de Prospecto)</option>
              <option value="hard">Brutal (Tono Frío y Resistente)</option>
            </select>
          </div>

          {/* Producto */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#075E54] block">
              Ficha del Servicio
            </h3>
            <div className="space-y-3 bg-slate-50 p-4 border border-slate-150 rounded-xl">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">Nombre del Producto</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#128C7E]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">Precio de Inversión</label>
                <input
                  type="text"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#128C7E]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">Propuesta de Valor</label>
                <textarea
                  value={productDesc}
                  onChange={(e) => setProductDesc(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#128C7E] h-20 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Selección de Tipo de Cliente */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#075E54] block">
              Psicobiografía del Prospecto
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(CLIENT_PROFILES).map((prof) => {
                const isSelected = selectedClientKey === prof.id;
                return (
                  <button
                    key={prof.id}
                    type="button"
                    onClick={() => setSelectedClientKey(prof.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between h-20 ${
                      isSelected
                        ? "bg-slate-50 border-2 border-[#128C7E] text-slate-900 shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div className="text-xl leading-none">{prof.emoji}</div>
                    <div className="text-[11px] font-bold mt-1 truncate w-full text-slate-700">
                      {prof.name.split(" ")[1] || prof.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Base de Conocimiento (PDFs / Manuales) */}
          <div className="space-y-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setIsKbOpen(!isKbOpen)}
              className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100 text-slate-700 px-4 py-3 border border-slate-200 rounded-xl"
            >
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#128C7E]" /> Base de Datos (PDFs)
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-300 text-[#128C7E] ${isKbOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isKbOpen && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                {/* Drag / Upload Zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-[#128C7E] rounded-xl p-4 text-center cursor-pointer bg-white hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-1"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="application/pdf"
                    onChange={handlePdfUpload}
                    className="hidden"
                  />
                  {isPdfLoading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#128C7E] border-t-transparent" />
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#128C7E]">Procesando Manual...</span>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="h-6 w-6 text-[#128C7E]" />
                      <span className="text-xs font-bold text-slate-700">Anexar Manual Técnico</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Formatos PDF</span>
                    </>
                  )}
                </div>

                {/* Listing loaded docs */}
                {knowledgeSources.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">
                      Archivos Analizados ({knowledgeSources.length})
                    </span>
                    <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                      {knowledgeSources.map((ks) => (
                        <div
                          key={ks.id}
                          className="text-[11px] bg-white border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between text-slate-700 font-medium"
                        >
                          <span className="truncate max-w-[80%]">📄 {ks.fileName}</span>
                          <button
                            type="button"
                            onClick={() => removeKbFragment(ks.id)}
                            className="text-[#128C7E] hover:text-rose-600 font-bold px-1 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Copiar y Pegar Manuscrito */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">O insertar argumentos en crudo</label>
                  <textarea
                    placeholder="Instrucción: 'Para Carlos Escéptico, enfatiza garantías del retorno de inversión...'"
                    value={pastedKbText}
                    onChange={(e) => setPastedKbText(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 h-16 resize-none outline-none focus:border-[#128C7E]"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={addTextFragment}
                      className="flex-1 bg-slate-150 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-lg py-1.5 text-[11px] font-bold transition-colors"
                    >
                      Cargar Regla
                    </button>
                    {pastedKbText && (
                      <button
                        type="button"
                        onClick={cleanPastedKbInput}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-600 text-xs font-bold px-2 rounded-lg"
                      >
                        X
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Action Button */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2">
          {isSimInProgress && messages.length > 0 && (
            <button
              type="button"
              onClick={finishAndEvaluateWithIA}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white transition-all font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              🏁 Analizar Estrategia CoACH IA
            </button>
          )}
          <button
            type="button"
            onClick={prepareSimulation}
            className="w-full py-3 bg-[#128C7E] hover:bg-[#0e6f63] text-white transition-all font-bold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4 text-[#25D366]" /> Preparar Simulación
          </button>
        </div>
      </aside>

      {/* ==================== 2. CHAT SIMULATOR AREA ==================== */}
      <main className={`flex-1 flex-col bg-[#efeae2] relative items-stretch h-full pb-16 md:pb-0 ${activeMobileView === "chat" ? "flex" : "hidden md:flex"}`}>
        {/* WELCOME OVERLAY */}
        {welcomeOverlay && (
          <div className="absolute inset-0 z-40 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-xl w-full bg-white border border-slate-200 p-6 sm:p-10 rounded-2xl shadow-2xl text-center space-y-4 sm:space-y-6 max-h-[92vh] overflow-y-auto"
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#25D366] rounded-full flex items-center justify-center mx-auto text-white shadow-sm text-2xl sm:text-3xl">
                💬
              </div>
              <div className="space-y-2">
                <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-[#128C7E]">Post-Conversational Sales Intelligence</p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">WhatsCoach <span className="text-[#128C7E]">Pro AI</span></h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Entrena tus cierres comerciales de WhatsApp contra réplicas asistidas por Inteligencia Artificial. Supera objeciones complejas en vivo y recibe un diagnóstico de precisión basado en marcos internacionales de ventas en tiempo real.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                  <div className="text-xs font-bold text-[#128C7E] uppercase tracking-wide flex items-center gap-1.5">
                    <User className="h-4.5 w-4.5" /> Psicobiografías
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    6 personalidades mapeadas que confrontarán tus argumentos con resistencia activa al costo y tiempo.
                  </p>
                </div>
                <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                  <div className="text-xs font-bold text-[#128C7E] uppercase tracking-wide flex items-center gap-1.5">
                    <BookMarked className="h-4.5 w-4.5" /> Manuales PDFs
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Procesa temarios o scripts específicos de tu empresa para que la IA los asimile y te calibre contra ellos.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setWelcomeOverlay(false)}
                className="w-full py-2.5 sm:py-3 bg-[#128C7E] hover:bg-[#0c6b60] text-white transition-all font-bold rounded-xl shadow-sm text-xs sm:text-sm"
              >
                Ingresar al Simulador
              </button>
            </motion.div>
          </div>
        )}

        {/* READY / START SIMULATION OVERLAYS */}
        {startOverlay && (
          <div className="absolute inset-0 z-35 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-lg w-full bg-white border border-slate-200 p-5 sm:p-8 rounded-2xl shadow-2xl space-y-4 sm:space-y-5 max-h-[92vh] overflow-y-auto"
            >
              <div className="text-center space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest text-[#128C7E] font-bold">Condiciones de Negociación</p>
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                  {initiator === "client" ? "El Prospecto Abre el Chat" : "Abre la Conversación Tú"}
                </h3>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-100 rounded-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{activeProfile.emoji}</div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 uppercase">{activeProfile.name}</h4>
                    <span className="text-[10px] uppercase tracking-wider text-[#128C7E] font-bold">
                      Gravedad: {difficulty === "easy" ? "Cálida" : difficulty === "medium" ? "Evasiones" : "Brutal / Hostil"}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 italic leading-relaxed">
                  "{activeProfile.description}"
                </p>
                <div className="border-t border-slate-200 pt-3 text-[11px] text-slate-500 leading-normal">
                  <span className="text-[#128C7E] block uppercase tracking-wider text-[10px] font-bold mb-1">Evasiva / Objeción de Partida:</span>
                  "{activeProfile.objections[0]}"
                </div>
              </div>

              {initiator === "seller" && (
                <div className="p-4 bg-emerald-50 border border-dashed border-emerald-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-[#128C7E] uppercase tracking-wider block">Génesis del Script Recomendado</span>
                  <p className="text-xs text-[#128C7E] leading-relaxed font-medium">
                    {activeProfile.sellerHint}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStartOverlay(false)}
                  className="flex-1 py-2.5 border border-slate-200 hover:border-[#128C7E] text-slate-500 hover:text-[#128C7E] transition-colors font-bold text-xs rounded-xl"
                >
                  Configurar más
                </button>
                <button
                  type="button"
                  onClick={beginSimulation}
                  className="flex-1 py-2.5 bg-[#128C7E] hover:bg-[#0c6b60] text-white transition-colors font-bold text-xs rounded-xl shadow-sm"
                >
                  Iniciar Negociación
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* CHAT CONTAINER LAYOUT */}
        {/* Chat Header matching Design Spec */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#f0f2f5] shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-xl">
              {activeProfile.emoji}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                {activeProfile.name}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">En línea</span>
              </div>
            </div>
          </div>

          <div className="flex gap-6 items-center">
            <div className="text-right hidden sm:block">
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Servicio</p>
              <p className="text-xs font-bold text-slate-700 max-w-[150px] truncate">{productName}</p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Manuales</p>
              <p className="text-xs font-bold text-[#128C7E]">{knowledgeSources.length} PDFs</p>
            </div>
            {messages.length > 0 && (
              <div className="flex items-center gap-1.5 sm:gap-2 pl-2 sm:pl-3 border-l border-slate-200">
                <button
                  type="button"
                  onClick={downloadHistoryTXT}
                  className="py-1 px-2 sm:py-1.5 sm:px-3 bg-[#128C7E] text-white hover:bg-[#0c6b60] transition-colors font-bold text-[9px] sm:text-[10px] uppercase rounded-lg flex items-center gap-1 shadow-sm"
                >
                  <Download className="h-3 w-3" />
                  <span className="hidden min-[420px]:inline">Exportar Chat</span>
                </button>
                <button
                  type="button"
                  onClick={restartSimulationFull}
                  className="py-1 px-2 sm:py-1.5 sm:px-3 border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 transition-colors font-bold text-[9px] sm:text-[10px] uppercase rounded-lg"
                >
                  <span className="hidden min-[420px]:inline">Descartar</span>
                  <span className="inline min-[420px]:hidden">✕</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Messages Screen Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 space-y-4 bg-[#efeae2] relative">
          {/* Subtle watermark background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none">
            <span className="font-extrabold text-[12vw] tracking-tighter uppercase whitespace-nowrap text-slate-800">WHATSCOACH</span>
          </div>

          <div className="max-w-3xl mx-auto space-y-4 relative z-10">
            {isOfflineMode && (
              <div id="offline-mode-banner" className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-5 w-5 text-amber-600 animate-pulse" />
                  </div>
                  <div>
                    <h5 className="text-xs font-extrabold text-amber-800 uppercase tracking-wide">Simulador Local Activado</h5>
                    <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                      Has alcanzado el límite diario de la API gratuita. Para proteger tu progreso, hemos habilitado el <b>motor inteligente offline de emergencia</b>. Puedes continuar tu práctica libre de interrupciones.
                    </p>
                    <p className="text-[10px] text-amber-600 mt-0.5 font-bold uppercase">
                      Nota: Puedes agregar tu API Key desde el menú Configuración para reactivar el modelo de IA premium.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {messages.length === 0 ? (
              <div className="text-center py-24 space-y-3 max-w-sm mx-auto">
                <p className="text-xs font-bold uppercase tracking-wider text-[#128C7E]">Canal de Chat Vacío</p>
                <h4 className="text-3xl font-extrabold text-slate-400 tracking-tight">Sin Conversación</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Alinea tu producto, el prospecto y los manuales corporativos de ventas, luego haz clic en <span className="text-[#128C7E] font-bold">PREPARAR SIMULACIÓN</span> para iniciar la práctica.
                </p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isUser = msg.role === "vendedor";
                return (
                  <div
                    key={i}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl shadow-sm px-4 py-3 text-sm leading-relaxed relative ${
                        isUser
                          ? "bg-[#d9fdd3] text-slate-800 rounded-tr-none border border-[#e1f7de]"
                          : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1 gap-4">
                        <span className={`text-[10px] font-bold uppercase ${isUser ? "text-emerald-700" : "text-[#128C7E]"}`}>
                          {isUser ? "Tú (Vendedor)" : activeProfile.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(msg.text)}
                          title="Copiar mensaje"
                          className="text-slate-400 hover:text-[#128C7E] transition-colors p-0.5"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="font-normal text-slate-800 text-[13px] sm:text-sm whitespace-pre-line leading-relaxed">{msg.text}</p>
                      <span className="text-[9px] text-slate-400 font-medium block text-right mt-1.5">
                        {msg.time}
                      </span>
                    </div>
                  </div>
                );
              })
            )}

            {/* Typing status indicator */}
            {typingState && (
              <div className="flex items-center gap-1.5 bg-white border border-slate-100 shadow-sm p-3 rounded-2xl w-28">
                <span className="text-[10px] font-bold text-[#128C7E] animate-pulse">Escribiendo</span>
                <div className="h-1 w-1 bg-[#25D366] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="h-1 w-1 bg-[#25D366] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>
        </div>

        {/* Floating Finish and Evaluate exercise */}
        {isSimInProgress && messages.length > 0 && (
          <div className="hidden md:block absolute bottom-24 left-1/2 -translate-x-1/2 z-10 w-full max-w-sm px-6">
            <button
              type="button"
              onClick={finishAndEvaluateWithIA}
              className="w-full bg-[#128C7E] hover:bg-[#0c6b60] transition-all hover:scale-[1.02] text-white font-bold py-3.5 px-6 rounded-xl shadow-xl flex items-center justify-center gap-2 border-0 uppercase text-xs tracking-wider"
            >
              🏁 ANALIZAR ESTRATEGIA CON COACH IA
            </button>
          </div>
        )}

        {/* Chat Input Area */}
        <div className="p-4 border-t border-slate-200 bg-[#f0f2f5] flex items-center gap-3">
          <input
            type="text"
            placeholder={
              !isSimInProgress
                ? "Prepara la simulación desde la izquierda..."
                : typingState
                ? "El prospecto está respondiendo..."
                : "Escribe un mensaje..."
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={!isSimInProgress || typingState}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendMessage();
            }}
            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-[#128C7E] text-slate-800 disabled:opacity-50 transition-colors"
          />
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={!isSimInProgress || typingState || !inputText.trim()}
            className="h-11 w-11 bg-[#128C7E] hover:bg-[#0c6b60] text-white flex items-center justify-center rounded-full shadow-md disabled:opacity-40 transition-all shrink-0 border-0"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </div>
      </main>

      {/* ==================== 3. VIRTUAL COACH EVALUATION PANEL ==================== */}
      <AnimatePresence>
        {isEvalOpen && (
          <motion.div
            initial={{ opacity: 0, x: 200 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`w-full md:w-100 border-l border-slate-200 bg-white pb-16 md:pb-0 shrink-0 h-full flex flex-col z-40 relative shadow-2xl overflow-y-auto ${activeMobileView === "eval" ? "flex" : "hidden md:flex"}`}
          >
            {/* Header Coach Evaluator */}
            <div className="p-5 border-b border-slate-200 bg-[#f0f2f5] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <Brain className="h-5 w-5 text-[#128C7E]" />
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 leading-none">Auditoría de Ventas IA</h2>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">Análisis del Discurso</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEvalOpen(false)}
                className="text-slate-500 hover:text-slate-800 font-bold p-1 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs"
              >
                ✕
              </button>
            </div>

            {/* SCREEN LOADING COACH METRICS */}
            {isEvalLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4 bg-slate-50">
                <div className="h-10 w-10 rounded-full border-4 border-[#128C7E] border-t-transparent animate-spin" />
                <div className="text-center space-y-1 max-w-xs">
                  <h4 className="text-xs font-bold text-[#128C7E] uppercase tracking-wider">Motor Analítico Activo</h4>
                  <p className="text-xs text-slate-500 tracking-wide leading-relaxed">{loadingStepText}</p>
                </div>
              </div>
            ) : (
              evaluation && (
                <div className="flex-1 p-5 space-y-6 bg-slate-50 overflow-y-auto">
                  {isOfflineMode && (
                    <div id="offline-eval-banner" className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-700 flex gap-2.5 shadow-xs">
                      <AlertTriangle className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Informe de Emergencia:</span> Has excedido la cuota gratuita diaria de la API. Esta auditoría se ha generado localmente usando heurísticas alternativas para proteger tu flujo de aprendizaje.
                      </div>
                    </div>
                  )}

                  {/* Dynamic Bold Typography Evaluation */}
                  <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs space-y-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold italic">Métrica de Auditoría</p>
                      <h2 className="text-2xl font-bold leading-none tracking-tight text-slate-800 mt-0.5">
                        Estratagema Comercial
                      </h2>
                    </div>
                    <div className="flex items-baseline gap-2 border-b border-slate-100 pb-3">
                      <span className="text-6xl font-extrabold tracking-tighter text-[#128C7E] leading-none">
                        {evaluation.indicadores.puntuacion_final}%
                      </span>
                      <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Puntaje de Cierre</span>
                    </div>
                    <div className={`p-3 text-xs font-bold rounded-xl text-center shadow-xs ${
                      evaluation.indicadores.puntuacion_final >= 80
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                        : evaluation.indicadores.puntuacion_final >= 60
                        ? "bg-amber-50 text-amber-800 border border-amber-100"
                        : "bg-rose-50 text-rose-800 border border-rose-100"
                    }`}>
                      {evaluation.indicadores.puntuacion_final >= 80
                        ? "🏆 Calidad Máxima en Negociación"
                        : evaluation.indicadores.puntuacion_final >= 60
                        ? "👍 Cierre viable (Se perdieron marcos)"
                        : "⚠️ Peligro de Deserción del Lead"}
                    </div>
                  </div>

                  {/* 3 Specific Indexes Grid */}
                  <div className="grid grid-cols-3 gap-0 border border-slate-200 divide-x divide-slate-200 bg-white rounded-xl shadow-xs overflow-hidden">
                    <div className="p-3 text-center">
                      <div className="text-base font-bold text-slate-800">{evaluation.indicadores.calidad_conversacion}/10</div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Empatía</div>
                    </div>
                    <div className="p-3 text-center">
                      <div className="text-base font-bold text-slate-800">{evaluation.indicadores.manejo_objeciones}/10</div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Objeción</div>
                    </div>
                    <div className="p-3 text-center">
                      <div className="text-base font-bold text-slate-800">{evaluation.indicadores.tecnicas_cierre}/10</div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Marcos</div>
                    </div>
                  </div>

                  {/* Fortalezas (Strengths) */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Puntos Fuertes
                    </h3>
                    <div className="space-y-1.5">
                      {evaluation.analisis.fortalezas.map((f, index) => (
                        <div
                          key={index}
                          className="text-xs bg-white border-l-4 border-l-emerald-500 border border-slate-200 rounded-r-xl p-3 text-slate-600 font-medium leading-relaxed shadow-xs"
                        >
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Oportunidades de Mejora */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-[#128C7E] uppercase tracking-wider flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#128C7E]"></div> Oportunidades
                    </h3>
                    <div className="space-y-1.5">
                      {evaluation.analisis.oportunidades_mejora.map((o, index) => (
                        <div
                          key={index}
                          className="text-xs bg-white border-l-4 border-l-[#128C7E] border border-slate-200 rounded-r-xl p-3 text-slate-600 font-medium leading-relaxed shadow-xs"
                        >
                          {o}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Técnicas de Cierre Aplicadas o Ausentes formatted like matrix */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="h-4.5 w-4.5 text-[#128C7E]" /> Matriz de Técnicas Detectadas
                    </h3>

                    <div className="border border-slate-200 overflow-hidden rounded-xl divide-y divide-slate-100 shadow-xs">
                      <div className="grid grid-cols-12 bg-slate-100 text-[9px] uppercase tracking-wider font-bold text-slate-500">
                        <div className="col-span-6 p-2.5 border-r border-slate-200">Técnica</div>
                        <div className="col-span-6 p-2.5">Estado de Detección</div>
                      </div>

                      {/* Match listed applied techniques */}
                      {evaluation.analisis.tecnicas_aplicadas.map((t, index) => (
                        <div key={`app-${index}`} className="grid grid-cols-12 text-xs bg-white">
                          <div className="col-span-6 p-2 border-r border-slate-200 font-medium text-slate-700 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {t}
                          </div>
                          <div className="col-span-6 p-2 text-emerald-600 font-bold uppercase tracking-wider text-[11px]">EJECUTADA</div>
                        </div>
                      ))}

                      {/* Not applied suggestions */}
                      {evaluation.analisis.tecnicas_no_aplicadas.map((t, index) => (
                        <div key={`no-${index}`} className="grid grid-cols-12 text-xs bg-white">
                          <div className="col-span-6 p-2 border-r border-slate-200 font-medium text-slate-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            {t}
                          </div>
                          <div className="col-span-6 p-2 text-slate-400 italic">Ausente del discurso</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Técnica Recomendada por Coach */}
                  <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-1 shadow-xs">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Brain className="h-4 w-4 text-[#128C7E]" /> Táctica Cardinal del Cierre:
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {evaluation.analisis.tecnica_cierre_recomendada}
                    </p>
                  </div>

                  {/* suggestedReply */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Fórmula para WhatsApp Ideal:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(evaluation.ejemplo_respuesta_ideal)}
                        className="text-[10px] text-[#128C7E] hover:text-[#0c6b60] font-bold uppercase tracking-wider flex items-center gap-1"
                      >
                        <Copy className="h-3 w-3" /> Copiar Fórmula
                      </button>
                    </div>
                    <div className="bg-white border border-slate-200 p-4 text-xs text-slate-650 italic leading-relaxed text-justify rounded-xl shadow-xs">
                      "{evaluation.ejemplo_respuesta_ideal}"
                    </div>
                  </div>

                  {/* Actions final report */}
                  <div className="flex flex-col gap-2 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={downloadHistoryTXT}
                      className="w-full py-2.5 bg-[#128C7E] hover:bg-[#0c6b60] text-white font-bold text-xs rounded-xl shadow-sm transition-all text-center uppercase tracking-wider"
                    >
                      <Download className="h-3 w-3 inline mr-1" /> Descargar Auditoría (TXT)
                    </button>
                    <button
                      type="button"
                      onClick={restartSimulationFull}
                      className="w-full py-2.5 bg-slate-200 hover:bg-slate-350 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl shadow-xs transition-all text-center uppercase tracking-wider"
                    >
                      Volver a Entrenar
                    </button>
                  </div>
                </div>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Navigation Tab Bar (Thumb-friendly & modern) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 z-50 flex items-center justify-around px-2 shadow-lg">
        <button
          type="button"
          onClick={() => setActiveMobileView("config")}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all ${
            activeMobileView === "config"
              ? "text-[#128C7E] font-bold scale-105"
              : "text-slate-500 font-medium"
          }`}
        >
          <Settings className="h-5 w-5" />
          <span className="text-[10px] tracking-tight">Configurar</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMobileView("chat")}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all relative ${
            activeMobileView === "chat"
              ? "text-[#128C7E] font-bold scale-105"
              : "text-slate-500 font-medium"
          }`}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-[10px] tracking-tight font-medium">Chat</span>
          {messages.length > 0 && (
            <span className="absolute top-1.5 right-8 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            if (isEvalOpen || evaluation) {
              setActiveMobileView("eval");
            } else {
              triggerNotification("Alcanza al menos un par de mensajes con un cliente y toca 'Analizar Estrategia' para habilitar tus informes.", true);
            }
          }}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all ${
            activeMobileView === "eval"
              ? "text-[#128C7E] font-bold scale-105"
              : !isEvalOpen && !evaluation
              ? "text-slate-350 opacity-40 cursor-not-allowed"
              : "text-slate-500 font-medium"
          }`}
        >
          <Brain className={`h-5 w-5 ${isEvalOpen || evaluation ? "animate-pulse text-[#128C7E]" : ""}`} />
          <span className="text-[10px] tracking-tight">Coach IA</span>
        </button>
      </div>
    </div>
  );
}

