import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

function sanitizeForPrompt(value: unknown, maxLength = 1000): string {
  if (typeof value !== "string") return "";
  return value.slice(0, maxLength).replace(/<\/?[a-zA-Z_]+>/g, "").trim();
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

interface ParsedMessage {
  role: "vendedor" | "cliente";
  text: string;
  time: string;
}

function parseWhatsAppExport(rawText: string, vendorName: string): ParsedMessage[] {
  const messages: ParsedMessage[] = [];
  const vendorLower = vendorName.toLowerCase().trim();

  // Formato Android: [DD/MM/YYYY, HH:MM:SS] Nombre: mensaje
  const androidRegex = /\[(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s*(\d{1,2}:\d{2})(?::\d{2})?\]\s*([^:]+):\s*(.*)/;
  // Formato iOS: DD/MM/YYYY, HH:MM - Nombre: mensaje
  const iosRegex = /(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s*(\d{1,2}:\d{2})\s*-\s*([^:]+):\s*(.*)/;

  const lines = rawText.split(/\r?\n/);
  let currentMsg: ParsedMessage | null = null;

  for (const line of lines) {
    const matchAndroid = androidRegex.exec(line);
    const matchIos = !matchAndroid ? iosRegex.exec(line) : null;
    const match = matchAndroid || matchIos;

    if (match) {
      if (currentMsg) messages.push(currentMsg);
      const [, , time, name, text] = match;
      const nameLower = name.toLowerCase().trim();
      const role = nameLower.includes(vendorLower) || vendorLower.includes(nameLower)
        ? "vendedor"
        : "cliente";
      currentMsg = { role, text: text.trim(), time: time.trim() };
    } else if (currentMsg && line.trim()) {
      // Mensaje multilínea
      currentMsg.text += " " + line.trim();
    }
  }
  if (currentMsg) messages.push(currentMsg);

  return messages.filter(m => m.text.length > 0);
}

const MASTER_TECHNIQUES = [
  { name: "Straight Line", author: "Jordan Belfort", keywords: ["transferencia de certeza", "sería una estupidez", "seguro", "definitivamente", "absoluta certeza", "sin duda"], description: "Transferencia de certeza absoluta." },
  { name: "SPIN Selling", author: "Neil Rackham", keywords: ["situación", "problema", "implicación", "necesidad de pago", "consecuencia", "impacto", "qué pasaría si", "cuánto te cuesta"], description: "Preguntas de Situación, Problema, Implicación y Necesidad." },
  { name: "Feel-Felt-Found", author: "Clásica", keywords: ["entiendo cómo te sientes", "muchos se han sentido", "descubrieron que", "sé por lo que pasas", "otros clientes pensaban igual"], description: "Validación y empatía empática." },
  { name: "Benjamin Franklin Close", author: "Ben Franklin", keywords: ["pros y contras", "lista", "beneficios vs", "ventajas y desventajas", "balance", "lado positivo", "contrapesos"], description: "Listar pros contra los contras." },
  { name: "Assumptive Close", author: "Clásica", keywords: ["te envío el link", "¿con qué tarjeta?", "dirección de envío", "cuándo empezamos", "agenda abierta", "dónde te lo mando"], description: "Asumir el trato cerrado." },
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
  if (missing.length > 0) return res.status(500).json({ error: "Error de configuración del servidor." });

  const { user, error: authError } = await requireAuth(req);
  if (authError || !user) return res.status(401).json({ error: authError });

  const { rawText, vendorName, productName, productPrice, productDescription, vendorId } = req.body;

  if (!rawText || typeof rawText !== "string") return res.status(400).json({ error: "Falta el texto de la conversación." });
  if (!vendorName || typeof vendorName !== "string") return res.status(400).json({ error: "Indica el nombre del vendedor en el chat." });

  const parsedMessages = parseWhatsAppExport(rawText, vendorName);

  if (parsedMessages.length < 4) {
    return res.status(400).json({ error: `No se encontraron suficientes mensajes (mínimo 4, encontrados: ${parsedMessages.length}). Verifica el formato del export y el nombre del vendedor.` });
  }
  if (parsedMessages.length > 200) {
    parsedMessages.splice(200);
  }

  const safeProductName = sanitizeForPrompt(productName, 200);
  const safeProductPrice = sanitizeForPrompt(productPrice, 50);
  const safeProductDesc = sanitizeForPrompt(productDescription, 1000);
  const safeVendorName = sanitizeForPrompt(vendorName, 100);

  const formattedHistory = parsedMessages
    .slice(-50)
    .map(h => `${h.role === "vendedor" ? "Vendedor (Closer)" : "Cliente (Prospecto)"}: ${sanitizeForPrompt(h.text, 1000)}`)
    .join("\n");

  const systemInstruction = `
Eres WhatsCoach AI, un Coach de Ventas de Élite y mentor experto en cierres por WhatsApp en español.
Audita la conversación REAL del closer "${safeVendorName}" y entrena de forma analítica y constructiva.
Esta es una conversación real, no una simulación.

Catálogo Maestro de 12 Técnicas:
${JSON.stringify(MASTER_TECHNIQUES, null, 2)}

Instrucciones:
1. Puntúa de 1 a 10: calidad_conversacion, manejo_objeciones, tecnicas_cierre. De 0 a 100: puntuacion_final.
2. tecnicas_aplicadas: técnicas realmente usadas por el vendedor, cita la frase exacta.
3. tecnicas_no_aplicadas: técnicas útiles que el vendedor omitió.
4. tecnica_cierre_recomendada: cuál técnica era la más acertada para este prospecto específico y por qué.
5. ejemplo_respuesta_ideal: réplica perfecta en primera persona de WhatsApp que el closer debió enviar en el momento clave.
`;

  const promptText = `
<transcripcion_real>
${formattedHistory}
</transcripcion_real>
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

  let evalResult: any = null;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    try {
      const r = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: [{ text: systemInstruction }, { text: promptText }], config: schemaConfig });
      evalResult = JSON.parse(r.text || "");
    } catch {
      const r = await ai.models.generateContent({ model: "gemini-2.5-flash-lite", contents: [{ text: systemInstruction }, { text: promptText }], config: schemaConfig });
      evalResult = JSON.parse(r.text || "");
    }
  } catch {
    // Fallback heurístico
    const sellerWords = parsedMessages.filter(m => m.role === "vendedor").map(m => m.text.toLowerCase()).join(" ");
    const applied: string[] = [];
    const missing2: string[] = [];
    MASTER_TECHNIQUES.forEach(tech => {
      const matched = tech.keywords.some(kw => sellerWords.includes(kw.toLowerCase()));
      if (matched) applied.push(tech.name);
      else missing2.push(tech.name);
    });
    const cal = Math.min(10, 5 + Math.floor(parsedMessages.length / 4));
    const obj = Math.min(10, 4 + applied.length);
    const cie = Math.min(10, 3 + applied.length);
    evalResult = {
      indicadores: { calidad_conversacion: cal, manejo_objeciones: obj, tecnicas_cierre: cie, puntuacion_final: Math.round(((cal + obj + cie) / 30) * 100) },
      analisis: {
        fortalezas: ["Presencia activa en la conversación.", applied.length > 0 ? `Usó técnicas clave: ${applied.slice(0, 2).join(", ")}.` : "Cordialidad en los mensajes."],
        oportunidades_mejora: ["Mensajes muy largos — en WhatsApp son más efectivos los mensajes cortos.", "Incorporar preguntas abiertas para diagnosticar al prospecto.", "Cerrar con alternativas directas (opción A o B)."],
        tecnicas_aplicadas: applied,
        tecnicas_no_aplicadas: missing2.slice(0, 5),
        tecnica_cierre_recomendada: "Feel-Felt-Found para diluir objeciones con empatía.",
      },
      ejemplo_respuesta_ideal: `Entiendo perfectamente cómo te sientes. Otros clientes se sintieron igual al ver el precio de ${safeProductPrice}, pero descubrieron que recuperaron la inversión en semanas. ¿Empezamos con la opción básica o prefieres el plan completo?`,
    };
  }

  // Guardar en Supabase
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Obtener company_id del usuario que sube
  const { data: uploaderProfile } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", user.id)
    .single();

  const companyId = uploaderProfile?.role === "company" ? user.id
    : uploaderProfile?.company_id ?? null;

  const { data: diagnostic, error: insertError } = await supabase
    .from("diagnostics")
    .insert({
      uploaded_by: user.id,
      company_id: companyId,
      vendor_id: vendorId || null,
      product_name: safeProductName,
      product_price: safeProductPrice,
      vendor_name_raw: safeVendorName,
      parsed_messages: parsedMessages,
      score_conversation: evalResult.indicadores.calidad_conversacion,
      score_objections: evalResult.indicadores.manejo_objeciones,
      score_closing: evalResult.indicadores.tecnicas_cierre,
      score_final: evalResult.indicadores.puntuacion_final,
      strengths: evalResult.analisis.fortalezas,
      improvements: evalResult.analisis.oportunidades_mejora,
      techniques_applied: evalResult.analisis.tecnicas_aplicadas,
      techniques_missing: evalResult.analisis.tecnicas_no_aplicadas,
      recommended_close: evalResult.analisis.tecnica_cierre_recomendada,
      ideal_response: evalResult.ejemplo_respuesta_ideal,
    })
    .select("id")
    .single();

  if (insertError || !diagnostic) {
    return res.status(500).json({ error: "Error guardando el diagnóstico." });
  }

  return res.json({ diagnosticId: diagnostic.id, ...evalResult });
}
