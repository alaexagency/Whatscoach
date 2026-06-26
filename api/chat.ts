import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth, getGeminiClient, sanitizeForPrompt } from "./_shared.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const missing = ["GEMINI_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].filter(k => !process.env[k]);
  if (missing.length > 0) {
    console.error("❌ Variables de entorno faltantes:", missing.join(", "));
    return res.status(500).json({ error: `Configuración incompleta en el servidor: ${missing.join(", ")}` });
  }

  const { user, error: authError } = await requireAuth(req);
  if (authError || !user) return res.status(401).json({ error: authError });

  try {
    const { profile, product, history, difficulty, knowledge } = req.body;

    if (!profile || !product || !product.name || !product.price)
      return res.status(400).json({ error: "Faltan datos obligatorios (perfil del cliente o producto)." });
    if (!Array.isArray(history))
      return res.status(400).json({ error: "El historial debe ser un array." });
    if (history.length > 100)
      return res.status(400).json({ error: "Historial demasiado largo." });

    const safeProductName = sanitizeForPrompt(product.name, 200);
    const safeProductPrice = sanitizeForPrompt(product.price, 50);
    const safeProductDesc = sanitizeForPrompt(product.description, 1000);
    const safeKnowledge = sanitizeForPrompt(knowledge, 50000);
    const safeHistory = history
      .slice(-50)
      .map((h: any) => `${h.role === "vendedor" ? "Vendedor" : "Cliente"}: ${sanitizeForPrompt(h.text, 1000)}`)
      .join("\n");

    const systemInstruction = `
Eres un cliente potencial conversando por un chat de WhatsApp con un vendedor. Sé ultra realista, coherente y humano.
Tu nombre y temperamento: ${profile.name} (${profile.emoji}). Perfil: ${profile.description}. Nivel de dificultad: ${difficulty}.

<producto>
Nombre: ${safeProductName}
Precio: ${safeProductPrice}
Descripción: ${safeProductDesc}
</producto>

Reglas estrictas de comportamiento en WhatsApp:
1. Responde de forma muy natural, con el tono informal y casual de WhatsApp. Usa abreviaciones simples, mensajes cortos (1 a 3 líneas máximo por mensaje).
2. Dificultad de la simulación:
   - "easy": Eres amable, tus dudas son sencillas y te convences rápido si el vendedor es atento.
   - "medium": Haces objeciones normales del día a día. Necesitas ver empatía y argumentos sólidos.
   - "hard": Eres muy frío, escéptico u ocupado. Si el vendedor te envía un párrafo muy largo, puedes quejarte.
3. No cedas la venta al primer intento. Utiliza de forma espontánea y progresiva las siguientes objeciones del perfil: ${JSON.stringify(profile.objections)}.
4. Si el vendedor utiliza la Base de conocimiento adicional o te brinda valor con técnicas apropiadas, muéstrate más receptivo.

<base_conocimiento>
${safeKnowledge || "No se suministró base de conocimiento adicional."}
</base_conocimiento>

<conversacion>
${safeHistory}
</conversacion>

Escribe únicamente el mensaje que responderías como el Cliente en WhatsApp. No agregues formatos de etiqueta como "Cliente: " ni comillas.
`;

    const promptText =
      history.length === 0
        ? "Inicia la conversación saludando o haciendo una pregunta inicial acorde a tu perfil."
        : "Genera tu siguiente respuesta corta a la última intervención del vendedor.";

    let reply = "";
    let usedFallbackModel = false;

    try {
      const ai = getGeminiClient();
      console.log("🔷 Llamando a Gemini (gemini-2.0-flash) [/api/chat]...");
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: promptText,
        config: { systemInstruction, temperature: 0.75 },
      });
      console.log("✅ Respuesta Gemini [/api/chat]:", response.text?.slice(0, 100));
      reply = response.text?.trim() || "";
    } catch (primaryError: any) {
      console.warn("Fallo gemini-2.0-flash, intentando gemini-1.5-flash-8b...", primaryError.message);
      try {
        const ai = getGeminiClient();
        console.log("🔷 Llamando a Gemini (gemini-1.5-flash-8b) fallback [/api/chat]...");
        const response = await ai.models.generateContent({
          model: "gemini-1.5-flash-8b",
          contents: promptText,
          config: { systemInstruction, temperature: 0.75 },
        });
        console.log("✅ Respuesta Gemini fallback [/api/chat]:", response.text?.slice(0, 100));
        reply = response.text?.trim() || "";
        usedFallbackModel = true;
      } catch {
        throw new Error("API_COULD_NOT_FULFILL_REQUEST");
      }
    }

    if (!reply) throw new Error("API_RETURNED_EMPTY_RESPONSE");

    return res.json({ text: reply, quotaWarning: usedFallbackModel });
  } catch (error: any) {
    console.error("Activando simulador local de emergencia:", error.message);

    try {
      const { profile, product, history } = req.body;
      const textHistory = history || [];
      const clientObjections = (profile && profile.objections) || [
        "El precio es un poco elevado para mi presupuesto actual.",
        "No tengo tiempo para implementar esto ahora mismo.",
        "Déjame consultarlo primero con mis socios.",
      ];

      const objectionIndex = Math.max(0, Math.floor(textHistory.length / 2)) % clientObjections.length;
      const currentObjection = clientObjections[objectionIndex];
      const lowName = (profile?.name || "").toLowerCase();

      let generatedReply = "";
      if (textHistory.length === 0) {
        if (lowName.includes("carlos") || lowName.includes("escéptico")) {
          generatedReply = "Hola. Me dieron este contacto... pero la verdad dudo una banda de lo que ofrecen en redes sociales. ¿De qué se trata realmente?";
        } else if (lowName.includes("karla") || lowName.includes("apurada")) {
          generatedReply = "Hola! Vi el anuncio en Instagram. Contame rápido de qué trata y el precio, dale que ando super corta de tiempo.";
        } else {
          generatedReply = `Hola! Estaba con dudas sobre ${product?.name || "el producto"}. ¿Me podrías brindar información detallada y precios?`;
        }
      } else {
        generatedReply = `Suena bien lo que dices, pero el problema es que ${currentObjection.toLowerCase()}. ¿Tenés alguna opción de financiamiento o flexibilidad para eso?`;
      }

      return res.json({ text: generatedReply, quotaWarning: true, isLocalSimulated: true });
    } catch (simError: any) {
      console.error("Falla crítica en el simulador local:", simError);
      return res.status(500).json({ error: "No se pudo recuperar la simulación de respaldo." });
    }
  }
}
