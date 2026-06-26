import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Type } from "@google/genai";
import { requireAuth, getGeminiClient, sanitizeForPrompt, MASTER_TECHNIQUES } from "./_shared";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

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
Eres WhatsCoach AI, un Coach de Ventas de Élite y mentor experto en cierres por WhatsApp de alto impacto en español.
Tu trabajo es auditar meticulosamente la conversación enviada y entrenar al vendedor de forma sumamente analítica y constructiva.

Tu evaluación debe basarse y hacer match explícito con este "Catálogo Maestro de 12 Técnicas de Venta":
${JSON.stringify(MASTER_TECHNIQUES, null, 2)}

<base_conocimiento>
${safeKnowledge || "No se suministró Base de Conocimiento adicional."}
</base_conocimiento>

Instrucciones de puntaje:
1. Pondera justamente los indicadores de 1 a 10:
   - "calidad_conversacion": Empatía sincera, fluidez, no saturar con muros de texto.
   - "manejo_objeciones": Cómo reaccionó a las evasivas u objeciones de ${profile.name}.
   - "tecnicas_cierre": Si propuso CTA claras y usó alguna técnica de cierre del catálogo maestro.
   - "puntuacion_final": Del 1 al 100 ponderando los 3 anteriores.
2. En "tecnicas_aplicadas", detecta cuáles técnicas fueron aplicadas REALMENTE por el vendedor. Cita la frase.
3. En "tecnicas_no_aplicadas", lista técnicas que habrían sido de gran apoyo pero que el vendedor omitió.
4. En "tecnica_cierre_recomendada", indica cuál técnica hubiese sido más acertada para cerrar a ${profile.name} y por qué.
5. En "ejemplo_respuesta_ideal", confecciona una réplica perfecta en primera persona de WhatsApp para manejar la objeción clave o el cierre.
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

Formato de Respuesta obligatorio (JSON). El JSON que devuelvas debe ceñirse exactamente al siguiente esquema:
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
      console.log("🔷 Llamando a Gemini (gemini-2.0-flash) [/api/evaluate]...");
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{ text: systemInstruction }, { text: promptText }],
        config: schemaConfig,
      });
      console.log("✅ Respuesta Gemini [/api/evaluate]:", response.text?.slice(0, 100));
      resultText = response.text || "";
    } catch (primaryError: any) {
      console.warn("Fallo gemini-2.0-flash en evaluación, intentando gemini-1.5-flash-8b...", primaryError.message);
      try {
        const ai = getGeminiClient();
        console.log("🔷 Llamando a Gemini (gemini-1.5-flash-8b) fallback [/api/evaluate]...");
        const response = await ai.models.generateContent({
          model: "gemini-1.5-flash-8b",
          contents: [{ text: systemInstruction }, { text: promptText }],
          config: schemaConfig,
        });
        console.log("✅ Respuesta Gemini fallback [/api/evaluate]:", response.text?.slice(0, 100));
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
    console.error("Activando Coach local de emergencia para evaluación:", error.message);

    try {
      const { profile, product, history } = req.body;
      const textHistory = history || [];

      const appliedTechs: string[] = [];
      const unappliedTechs: string[] = [];

      const sellerWords = textHistory
        .filter((h: any) => h.role === "vendedor")
        .map((h: any) => (h.text || "").toLowerCase())
        .join(" ");

      MASTER_TECHNIQUES.forEach((tech) => {
        const matched = tech.keywords.some((kw) => sellerWords.includes(kw.toLowerCase()));
        if (matched) {
          const msg = textHistory.find((h: any) => h.role === "vendedor" && tech.keywords.some((kw) => h.text.toLowerCase().includes(kw.toLowerCase())));
          const excerpt = msg ? `"${msg.text.substring(0, 35)}..."` : "";
          appliedTechs.push(`Uso de ${tech.name} ${excerpt ? `en: ${excerpt}` : ""}`);
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
        ejemplo_respuesta_ideal: `Entiendo plenamente cómo te sientes, ${profile?.name || "cliente"}. De hecho, otros clientes se sintieron exactamente igual de reacios con la inversión de ${product?.price || "el servicio"} al principio. Sin embargo, descubrieron que tras iniciar, la automatización les liberó tiempo y amortizaron el plan en semanas. ¿Empezamos con la opción básica o prefieres revisar el demo interactivo?`,
        isLocalHeuristics: true,
      });
    } catch (localErr: any) {
      console.error("Fallo crítico en evaluación local:", localErr);
      return res.status(500).json({ error: "Falla general al procesar la evaluación." });
    }
  }
}
