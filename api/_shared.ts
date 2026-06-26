import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

let aiInstance: GoogleGenAI | null = null;
export function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY no configurada.");
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });
  }
  return aiInstance;
}

export function sanitizeForPrompt(value: unknown, maxLength = 1000): string {
  if (typeof value !== "string") return "";
  return value
    .slice(0, maxLength)
    .replace(/<\/?[a-zA-Z_]+>/g, "")
    .trim();
}

export async function requireAuth(req: any): Promise<{ user: any; error: string | null }> {
  const authHeader = req.headers["authorization"] as string | undefined;
  if (!authHeader?.startsWith("Bearer ")) return { user: null, error: "No autenticado." };
  const token = authHeader.split(" ")[1];
  console.log("🔷 Llamando a Supabase (auth.getUser)...");
  const { data: { user }, error } = await getSupabaseAdmin().auth.getUser(token);
  console.log("✅ Data:", user?.id ?? null);
  console.log("❌ Error:", error);
  if (error || !user) return { user: null, error: "Token inválido o expirado." };
  return { user, error: null };
}

export const MASTER_TECHNIQUES = [
  {
    name: "Straight Line", author: "Jordan Belfort",
    keywords: ["transferencia de certeza", "sería una estupidez", "seguro", "definitivamente", "absoluta certeza", "sin duda"],
    description: "Transferencia de certeza absoluta de que el producto resolverá el problema y que sería irracional no comprarlo."
  },
  {
    name: "SPIN Selling", author: "Neil Rackham",
    keywords: ["situación", "problema", "implicación", "necesidad de pago", "consecuencia", "impacto", "qué pasaría si", "cuánto te cuesta"],
    description: "Preguntas de Situación, Problema, Implicación y Necesidad de beneficio para hacer que el cliente descubra su propio dolor."
  },
  {
    name: "Feel-Felt-Found", author: "Clásica",
    keywords: ["entiendo cómo te sientes", "muchos se han sentido", "descubrieron que", "sé por lo que pasas", "otros clientes pensaban igual"],
    description: "Validación y empatía empática: 'Entiendo cómo te sientes, otros se sintieron así, y descubrieron que el producto solucionó...'"
  },
  {
    name: "Benjamin Franklin Close", author: "Ben Franklin",
    keywords: ["pros y contras", "lista", "beneficios vs", "ventajas y desventajas", "balance", "lado positivo", "contrapesos"],
    description: "Listar de manera lógica los pros (muchos) contra los contras (pocos) para que el cliente decida de manera racional."
  },
  {
    name: "Assumptive Close", author: "Clásica",
    keywords: ["te envío el link", "¿con qué tarjeta?", "dirección de envío", "cuándo empezamos", "agenda abierta", "dónde te lo mando"],
    description: "Asumir con total naturalidad que el trato está cerrado y pasar directamente a los detalles de cobro o logística."
  },
  {
    name: "Urgencia Real", author: "Escasez",
    keywords: ["quedan", "últimos", "solo hoy", "se acaba", "cupo limitado", "plazas limitadas", "precio sube hoy", "hora crucial"],
    description: "Crear urgencia auténtica limitando los cupos, los materiales o los bonus exclusivos sólo por un lapso breve."
  },
  {
    name: "Prueba Social", author: "Cialdini",
    keywords: ["testimonio", "caso de éxito", "mira esto", "te paso el caso", "resultados reales", "captura de pantalla", "audio de alumno"],
    description: "Mostrar evidencia innegable de otros clientes que ya lograron el resultado deseado para disipar el escepticismo."
  },
  {
    name: "Reframing", author: "PNL/Ventas",
    keywords: ["inversión", "no es un gasto", "se paga solo", "retorno", "ahorras tiempo", "ganancia en lugar de", "en realidad representa"],
    description: "Re-encuadrar el costo como una inversión semilla amortizada rápidamente por el ahorro o retorno generado."
  },
  {
    name: "Alternative Close", author: "Clásica",
    keywords: ["opción A", "¿cuál prefieres?", "tarjeta o transferencia", "3 o 6 pagos", "mañana o tarde", "básico o premium"],
    description: "Dar a elegir entre dos opciones afirmativas (A o B) en lugar de dar la opción de elegir sí o no, guiando la acción."
  },
  {
    name: "Porque (Cialdini)", author: "Cialdini",
    keywords: ["porque", "ya que", "la razón es", "te lo digo porque", "debido a que"],
    description: "Explicar siempre el motivo racional de una solicitud o propuesta usando la estructura 'porque...' para aumentar docilidad."
  },
  {
    name: "Pain Agitate Solve", author: "Copywriting",
    keywords: ["imagina", "cada día que pasa", "mientras tanto", "lo que te está pasando", "frustración acumulada", "cuánto tiempo seguirás"],
    description: "Declarar el punto de dolor, revolver la herida y luego presentar el producto como la única sanación."
  },
  {
    name: "Takeaway", author: "Clásica",
    keywords: ["quizás no sea para ti", "no cualquiera", "no todos califican", "tengo que evaluar", "filtrar alumnos", "verificar si hay compatibilidad"],
    description: "Retirar sutilmente la oportunidad para generar deseo ardiente de pertenecer y revertir que el cliente califique para entrar."
  }
];
