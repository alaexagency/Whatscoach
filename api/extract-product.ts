import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

function sanitizeForPrompt(value: unknown, maxLength = 50000): string {
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

type FieldSource = "found" | "inferred" | "not_found";

interface ExtractedField {
  value: string;
  source: FieldSource;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const missing = ["GEMINI_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].filter(k => !process.env[k]);
  if (missing.length > 0) return res.status(500).json({ error: "Error de configuración del servidor." });

  const { user, error: authError } = await requireAuth(req);
  if (authError || !user) return res.status(401).json({ error: authError });

  const { text } = req.body;
  if (!text || typeof text !== "string") return res.status(400).json({ error: "Falta el texto del PDF." });
  if (text.trim().length < 50) return res.status(400).json({ error: "El texto es demasiado corto para analizar." });

  const safeText = sanitizeForPrompt(text, 50000);

  const systemInstruction = `
Eres un experto en análisis de fichas de productos y materiales de ventas.
Tu tarea es extraer información clave de un documento de producto para crear una ficha de entrenamiento comercial.

Para cada campo debes indicar:
- "found": la información está explícitamente en el documento
- "inferred": la información se puede deducir razonablemente del contexto
- "not_found": la información no está disponible en el documento

REGLAS CRÍTICAS:
1. NUNCA inventes precios — si no aparece explícitamente, usa "not_found"
2. NUNCA inventes nombres de empresa o producto si no aparecen
3. Para campos "not_found", el value debe ser "" (string vacío)
4. Para "main_benefits" y "common_objections", devuelve arrays de strings cortos (máx 5 items cada uno)
5. Si detectas múltiples productos, extrae el principal o el que aparece primero
6. Responde siempre en español
`;

  const promptText = `
Analiza este documento de producto y extrae la información para crear una ficha comercial:

<documento>
${safeText}
</documento>

Extrae estos campos. Para cada uno indica el valor y la fuente (found/inferred/not_found).
`;

  const schemaConfig = {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      required: ["name", "what_we_sell", "ideal_client", "problem_solved", "value_proposition", "price", "main_benefits", "common_objections"],
      properties: {
        name:              { type: Type.OBJECT, required: ["value", "source"], properties: { value: { type: Type.STRING }, source: { type: Type.STRING } } },
        what_we_sell:      { type: Type.OBJECT, required: ["value", "source"], properties: { value: { type: Type.STRING }, source: { type: Type.STRING } } },
        ideal_client:      { type: Type.OBJECT, required: ["value", "source"], properties: { value: { type: Type.STRING }, source: { type: Type.STRING } } },
        problem_solved:    { type: Type.OBJECT, required: ["value", "source"], properties: { value: { type: Type.STRING }, source: { type: Type.STRING } } },
        value_proposition: { type: Type.OBJECT, required: ["value", "source"], properties: { value: { type: Type.STRING }, source: { type: Type.STRING } } },
        price:             { type: Type.OBJECT, required: ["value", "source"], properties: { value: { type: Type.STRING }, source: { type: Type.STRING } } },
        main_benefits:     { type: Type.OBJECT, required: ["value", "source"], properties: { value: { type: Type.ARRAY, items: { type: Type.STRING } }, source: { type: Type.STRING } } },
        common_objections: { type: Type.OBJECT, required: ["value", "source"], properties: { value: { type: Type.ARRAY, items: { type: Type.STRING } }, source: { type: Type.STRING } } },
      },
    },
    temperature: 0.1,
  };

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    let resultText = "";
    try {
      const r = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: [{ text: systemInstruction }, { text: promptText }], config: schemaConfig });
      resultText = r.text || "";
    } catch {
      const r = await ai.models.generateContent({ model: "gemini-2.5-flash-lite", contents: [{ text: systemInstruction }, { text: promptText }], config: schemaConfig });
      resultText = r.text || "";
    }
    if (!resultText) throw new Error("empty");
    const parsed = JSON.parse(resultText);
    return res.json(parsed);
  } catch {
    // Fallback: devuelve estructura vacía para que el usuario llene manualmente
    const empty = (source: FieldSource = "not_found"): ExtractedField => ({ value: "", source });
    return res.json({
      name:              empty(),
      what_we_sell:      empty(),
      ideal_client:      empty(),
      problem_solved:    empty(),
      value_proposition: empty(),
      price:             empty(),
      main_benefits:     { value: [], source: "not_found" },
      common_objections: { value: [], source: "not_found" },
    });
  }
}
