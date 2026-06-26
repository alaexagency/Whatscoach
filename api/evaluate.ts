import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

function sanitizeForPrompt(value: unknown, maxLength = 1000): string {
  if (typeof value !== "string") return "";
  return value.slice(0, maxLength).replace(/<\/?[a-zA-Z_]+>/g, "").trim();
}

function getGeminiClient() {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
}

async function requireAuth(req: VercelRequest): Promise<{ user: any; error: string | null }> {
  const authHeader = req.headers["authorization"] as string | undefined;
  if (!authHeader?.startsWith("Bearer ")) return { user: null, error: "No autenticado." };
  const token = authHeader.split(" ")[1];
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return { user: null, error: "Token inválido o expirado." };
  return { user, error: null };
}

const MASTER_TECHNIQUES = [
  { name: "Straight Line", author: "Jordan Belfort", keywords: ["transferencia de certeza", "sería una estupidez", "seguro", "definitivamente", "absoluta certeza", "sin duda"], description: "Transferencia de certeza absoluta." },
  { name: "SPIN Selling", author: "Neil Rackham", keywords: ["situación", "problema", "implicación", "necesidad de pago", "consecuencia", "impacto", "qué pasaría si", "cuánto te cuesta"], description: "Preguntas de Situación, Problema, Implicación y Necesidad." },
  { name: "Feel-Felt-Found", author: "Clásica", keywords: ["entiendo cómo te sientes", "muchos se han sentido", "descubrieron que", "sé por lo que pasas", "otros clientes pensaban igual"], description: "Validación y empatía empática." },
  { name: "Benjamin Franklin Close", author: "Ben Franklin", keywords: ["pros y contras", "lista", "beneficios vs", "ventajas y desventajas", "balance", "lado positivo", "contrapesos"], description: "Listar pros (muchos) contra los contras (pocos)." },
  { name: "Assumptive Close", author: "Clásica", keywords: ["te envío el link", "¿con qué tarjeta?", "dirección de envío", "cuándo empezamos", "agenda abierta", "dónde te lo mando"], description: "Asumir el trato cerrado y pasar a detalles de cobro." },
  { name: "Urgencia Real", author: "Escasez", keywords: ["quedan", "últimos", "solo hoy", "se acaba", "cupo limitado", "plazas limitadas", "precio sube hoy", "hora crucial"], description: "Crear urgencia auténtica." },
  { name: "Prueba Social", author: "Cialdini", keywords: ["testimonio", "caso de éxito", "mira esto", "te paso el caso", "resultados reales", "captura de pantalla", "audio de alumno"], description: "Mostrar evidencia de otros clientes." },
  { name: "Reframing", author: "PNL/Ventas", keywords: ["inversión", "no es un gasto", "se paga solo", "retorno", "ahorras tiempo", "ganancia en lugar de", "en realidad representa"], description: "Re-encuadrar el costo como inversión." },
  { name: "Alternative Close", author: "Clásica", keywords: ["opción A", "¿cuál prefieres?", "tarjeta o transferencia", "3 o 6 pagos", "mañana o tarde", "básico o premium"], description: "Dar a elegir entre dos opciones afirmativas." },
  { name: "Porque (Cialdini)", author: "Cialdini", keywords: ["porque", "ya que", "la razón es", "te lo digo porque", "debido a que"], description: "Explicar el motivo con 'porque...'." },
  { name: "Pain Agitate Solve", author: "Copywriting", keywords: ["imagina", "cada día que pasa", "mientras tanto", "lo que te está pasando", "frustración acumulada", "cuánto tiempo seguirás"], description: "Declarar el dolor, agitar y presentar la solución." },
  { name: "Takeaway", author: "Clásica", keywords: ["quizás no sea para ti", "no cualquiera", "no todos califican", "tengo que evaluar", "filtrar alumnos", "verificar si hay compatibilidad"], description: "Retirar sutilmente la oportunidad." },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const missing = ["GEMINI_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].filter(k => !process.env[k]);
  if (missing.length > 0) {
    console.error("❌ Variables de entorno faltantes:", missing.join(", "));
    return res.status(500).json({ error: `Configuración incompleta: ${missing.join(", ")}` });
  }

  const { user, error: authError } = await requireAuth(req);
  if (authError || !user) return res.status(401).json({ error: authError });

  try {
    const { profile, product, history, knowledge } = req.body;

    if (!history || !Array.isArray(history) || history.length === 0)
      return res.status(400).json({ error: "No hay historial para evaluar." });
    if (history.length > 100)
      return res.status(400).json({ error: "Historial demasiado largo." });
    if (!profile || !product)
      return res.status(400).json({ error: "Faltan datos del perfil o producto." });

    const safeProductName = sanitizeForPrompt(product.name, 200);
    const safeProductPrice = sanitizeForPrompt(product.price, 50);
    const safeProductDesc = sanitizeForPrompt(product.description, 1000);
    const safeKnowledge = sanitizeForPrompt(knowledge, 50000);
    const formattedHistory = history
      .slice(-50)
      .map((h: any) => `${h.role === "vendedor" ? "Vendedor (Usuario)" : "Cliente (Simulado)"}: ${sanitizeForPrompt(h.text, 1000)}`)
      .join("\n");

    const systemInstruction = `
Eres WhatsCoach AI, un Coach de Ventas de Élite y mentor experto en cierres por WhatsApp en español.
Audita la conversación y entrena al vendedor de forma analítica y constructiva.

Catálogo Maestro de 12 Técnicas:
${JSON.stringify(MASTER_TECHNIQUES, null, 2)}

<base_conocimiento>
${safeKnowledge || "No se suministró Base de Conocimiento adicional."}
</base_conocimiento>

Instrucciones:
1. Puntúa de 1 a 10: calidad_conversacion, manejo_objeciones, tecnicas_cierre. De 0 a 100: puntuacion_final.
2. tecnicas_aplicadas: técnicas realmente usadas por el vendedor, cita la frase.
3. tecnicas_no_aplicadas: técnicas útiles que el vendedor omitió.
4. tecnica_cierre_recomendada: cuál técnica era la más acertada para cerrar a ${profile.name} y por qué.
5. ejemplo_respuesta_ideal: réplica perfecta en primera persona de WhatsApp.
`;

    const promptText = `
<transcripcion>
${formattedHistory}
</transcripcion>
<producto>
Nombre: ${safeProductName}
Precio: ${safeProductPrice}
Descripción: ${safeProductDesc}
</producto>
Responde en JSON con el esquema indicado.
`;

    const schemaConfig = {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["indicadores", "analisis", "ejemplo_respuesta_ideal"],
        properties: {
          indicadores: {
            type: Type.OBJECT,
            required: ["calidad_conversacion", "manejo_objeciones", "tecnicas_cierre", "puntuacion_final"],
            properties: {
              calidad_conversacion: { type: Type.INTEGER },
              manejo_objeciones: { type: Type.INTEGER },
              tecnicas_cierre: { type: Type.INTEGER },
              puntuacion_final: { type: Type.INTEGER },
            },
          },
          analisis: {
            type: Type.OBJECT,
            required: ["fortalezas", "oportunidades_mejora", "tecnicas_aplicadas", "tecnicas_no_aplicadas", "tecnica_cierre_recomendada"],
            properties: {
              fortalezas: { type: Type.ARRAY, items: { type: Type.STRING } },
              oportunidades_mejora: { type: Type.ARRAY, items: { type: Type.STRING } },
              tecnicas_aplicadas: { type: Type.ARRAY, items: { type: Type.STRING } },
              tecnicas_no_aplicadas: { type: Type.ARRAY, items: { type: Type.STRING } },
              tecnica_cierre_recomendada: { type: Type.STRING },
            },
          },
          ejemplo_respuesta_ideal: { type: Type.STRING },
        },
      },
      temperature: 0.15,
    };

    let resultText = "";
    let isFallbackModelUsed = false;

    try {
      const ai = getGeminiClient();
      console.log("🔷 Llamando a Gemini (gemini-2.0-flash-lite) [/api/evaluate]...");
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ text: systemInstruction }, { text: promptText }],
        config: schemaConfig,
      });
      console.log("✅ Gemini evaluate OK:", response.text?.slice(0, 80));
      resultText = response.text || "";
    } catch (primaryError: any) {
      console.warn("⚠️ gemini-2.0-flash falló en evaluate:", primaryError.message);
      try {
        const ai = getGeminiClient();
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ text: systemInstruction }, { text: promptText }],
          config: schemaConfig,
        });
        resultText = response.text || "";
        isFallbackModelUsed = true;
      } catch {
        throw new Error("API_COULD_NOT_FULFILL_EVALUATION");
      }
    }

    if (!resultText) throw new Error("API_RETURNED_EMPTY_RESPONSE");

    const parsedJson = JSON.parse(resultText);
    return res.json({ ...parsedJson, quotaUsedAlternative: isFallbackModelUsed });

  } catch (error: any) {
    console.error("⚠️ Activando Coach local de emergencia:", error.message);
    try {
      const { profile, product, history } = req.body;
      const textHistory = history || [];
      const appliedTechs: string[] = [];
      const unappliedTechs: string[] = [];
      const sellerWords = textHistory.filter((h: any) => h.role === "vendedor").map((h: any) => (h.text || "").toLowerCase()).join(" ");

      MASTER_TECHNIQUES.forEach((tech) => {
        const matched = tech.keywords.some((kw) => sellerWords.includes(kw.toLowerCase()));
        if (matched) {
          const msg = textHistory.find((h: any) => h.role === "vendedor" && tech.keywords.some((kw) => h.text.toLowerCase().includes(kw.toLowerCase())));
          appliedTechs.push(`Uso de ${tech.name}${msg ? ` en: "${msg.text.substring(0, 35)}..."` : ""}`);
        } else {
          unappliedTechs.push(tech.name);
        }
      });

      const matchesCount = appliedTechs.length;
      const calidad_conversacion = Math.min(10, 5 + Math.floor(textHistory.length / 2));
      const manejo_objeciones = Math.min(10, 4 + matchesCount * 2);
      const tecnicas_cierre = Math.min(10, 4 + matchesCount);
      const puntuacion_final = Math.min(100, Math.round(((calidad_conversacion + manejo_objeciones + tecnicas_cierre) / 30) * 100));

      return res.json({
        indicadores: { calidad_conversacion, manejo_objeciones, tecnicas_cierre, puntuacion_final },
        analisis: {
          fortalezas: [
            "Involucramiento activo en la simulación abordando los puntos clave.",
            "Ortografía óptima y estructura formal en las respuestas de WhatsApp.",
            matchesCount > 0 ? `Identificación exitosa del dolor empleando: ${appliedTechs[0].split(" ")[2]}.` : "Cordialidad destacada y uso adecuado de saludos.",
          ],
          oportunidades_mejora: [
            "Respuestas muy elaboradas. En WhatsApp es preferible enviar frases cortas.",
            "Integra preguntas abiertas para diagnosticar la situación real del prospecto.",
            "Asegura un cierre asertivo empleando alternativas directas ('¿Opción básica o premium?').",
          ],
          tecnicas_aplicadas: appliedTechs.length > 0 ? appliedTechs : ["Análisis empático básico de dudas"],
          tecnicas_no_aplicadas: unappliedTechs.slice(0, 4),
          tecnica_cierre_recomendada: "Se recomienda usar Feel-Felt-Found para diluir el rechazo por costo de manera altamente empática.",
        },
        ejemplo_respuesta_ideal: `Entiendo plenamente cómo te sientes, ${profile?.name || "cliente"}. Otros clientes se sintieron igual de reacios con la inversión de ${product?.price || "el servicio"} al principio, pero descubrieron que amortizaron el plan en semanas. ¿Empezamos con la opción básica o prefieres revisar el demo?`,
        isLocalHeuristics: true,
      });
    } catch (localErr: any) {
      console.error("Fallo crítico en evaluación local:", localErr);
      return res.status(500).json({ error: "Falla general al procesar la evaluación." });
    }
  }
}
