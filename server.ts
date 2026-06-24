import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini client
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("La variable de entorno GEMINI_API_KEY es obligatoria pero no está configurada.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// 12 Técnicas maestras definidas para el análisis
const MASTER_TECHNIQUES = [
  {
    name: "Straight Line",
    author: "Jordan Belfort",
    keywords: ["transferencia de certeza", "sería una estupidez", "seguro", "definitivamente", "absoluta certeza", "sin duda"],
    description: "Transferencia de certeza absoluta de que el producto resolverá el problema y que sería irracional no comprarlo."
  },
  {
    name: "SPIN Selling",
    author: "Neil Rackham",
    keywords: ["situación", "problema", "implicación", "necesidad de pago", "consecuencia", "impacto", "qué pasaría si", "cuánto te cuesta"],
    description: "Preguntas de Situación, Problema, Implicación y Necesidad de beneficio para hacer que el cliente descubra su propio dolor."
  },
  {
    name: "Feel-Felt-Found",
    author: "Clásica",
    keywords: ["entiendo cómo te sientes", "muchos se han sentido", "descubrieron que", "sé por lo que pasas", "otros clientes pensaban igual"],
    description: "Validación y empatía empática: 'Entiendo cómo te sientes, otros se sintieron así, y descubrieron que el producto solucionó...'"
  },
  {
    name: "Benjamin Franklin Close",
    author: "Ben Franklin",
    keywords: ["pros y contras", "lista", "beneficios vs", "ventajas y desventajas", "balance", "lado positivo", "contrapesos"],
    description: "Listar de manera lógica los pros (muchos) contra los contras (pocos) para que el cliente decida de manera racional."
  },
  {
    name: "Assumptive Close",
    author: "Clásica",
    keywords: ["te envío el link", "¿con qué tarjeta?", "dirección de envío", "cuándo empezamos", "agenda abierta", "dónde te lo mando"],
    description: "Asumir con total naturalidad que el trato está cerrado y pasar directamente a los detalles de cobro o logística."
  },
  {
    name: "Urgencia Real",
    author: "Escasez",
    keywords: ["quedan", "últimos", "solo hoy", "se acaba", "cupo limitado", "plazas limitadas", "precio sube hoy", "hora crucial"],
    description: "Crear urgencia auténtica limitando los cupos, los materiales o los bonus exclusivos sólo por un lapso breve."
  },
  {
    name: "Prueba Social",
    author: "Cialdini",
    keywords: ["testimonio", "caso de éxito", "mira esto", "te paso el caso", "resultados reales", "captura de pantalla", "audio de alumno"],
    description: "Mostrar evidencia innegable de otros clientes que ya lograron el resultado deseado para disipar el escepticismo."
  },
  {
    name: "Reframing",
    author: "PNL/Ventas",
    keywords: ["inversión", "no es un gasto", "se paga solo", "retorno", "ahorras tiempo", "ganancia en lugar de", "en realidad representa"],
    description: "Re-encuadrar el costo como una inversión semilla amortizada rápidamente por el ahorro o retorno generado."
  },
  {
    name: "Alternative Close",
    author: "Clásica",
    keywords: ["opción A", "¿cuál prefieres?", "tarjeta o transferencia", "3 o 6 pagos", "mañana o tarde", "básico o premium"],
    description: "Dar a elegir entre dos opciones afirmativas (A o B) en lugar de dar la opción de elegir sí o no, guiando la acción."
  },
  {
    name: "Porque (Cialdini)",
    author: "Cialdini",
    keywords: ["porque", "ya que", "la razón es", "te lo digo porque", "debido a que"],
    description: "Explicar siempre el motivo racional de una solicitud o propuesta usando la estructura 'porque...' para aumentar docilidad."
  },
  {
    name: "Pain Agitate Solve",
    author: "Copywriting",
    keywords: ["imagina", "cada día que pasa", "mientras tanto", "lo que te está pasando", "frustración acumulada", "cuánto tiempo seguirás"],
    description: "Declarar el punto de dolor, revolver la herida (agitar consecuencias negativas) y luego presentar el producto como la única sanación."
  },
  {
    name: "Takeaway",
    author: "Clásica",
    keywords: ["quizás no sea para ti", "no cualquiera", "no todos califican", "tengo que evaluar", "filtrar alumnos", "verificar si hay compatibilidad"],
    description: "Retirar sutilmente la oportunidad para generar deseo ardiente de pertenecer y revertir que el cliente califique para entrar."
  }
];

// POST /api/chat - Generar respuesta del cliente simulado con IA (con fallback elegante)
app.post("/api/chat", async (req, res) => {
  try {
    const { profile, product, history, difficulty, knowledge } = req.body;

    if (!profile || !product) {
      return res.status(400).json({ error: "Faltan datos obligatorios (perfil del cliente o producto)." });
    }

    const systemInstruction = `
Eres un cliente potencial conversando por un chat de WhatsApp con un vendedor. Sé ultra realista, coherente y humano.
Tu nombre y temperamento: ${profile.name} (${profile.emoji}). Perfil: ${profile.description}. Nivel de dificultad: ${difficulty}.
Producto ofrecido: "${product.name}", Precio: "${product.price}", Detalles del producto: "${product.description}".

Reglas estrictas de comportamiento en WhatsApp:
1. Responde de forma muy natural, con el tono informal y casual de WhatsApp. Usa abreviaciones simples, mensajes cortos (1 a 3 líneas máximo por mensaje).
2. Dificultad de la simulación:
   - "easy" (Principiante): Eres amable, tus dudas son sencillas y te convences rápido si el vendedor es atento.
   - "medium" (Intermedio): Haces objeciones normales del día a día (precio, tiempo, credibilidad). Necesitas ver empatía y argumentos sólidos.
   - "hard" (Avanzado): Eres muy frío, escéptico u ocupado. Si el vendedor te envía un párrafo súper largo ("muro de texto"), puedes quejarte de que no tienes tiempo de leer testamentos, pedir que sea breve o dejarlo "en visto" parcialmente.
3. No cedas la venta al primer intento. Utiliza de forma espontánea y progresiva las siguientes objeciones del perfil: ${JSON.stringify(profile.objections)}.
4. Si el vendedor utiliza la Base de conocimiento adicional o te brinda valor con técnicas apropiadas, muéstrate más receptivo. Si es insistente desmedido, frío o robótico, sé más cortante.

Conversación hasta el momento:
${history.map((h: any) => `${h.role === 'vendedor' ? 'Vendedor' : 'Cliente'}: ${h.text}`).join('\n')}

Escribe únicamente el mensaje que responderías como el Cliente en WhatsApp. No agregues formatos de etiqueta como "Cliente: " ni comillas. Responde tal y como escribirías en tu celular.
`;

    const promptText = history.length === 0 
      ? "Inicia la conversación saludando o haciendo una pregunta inicial acorde a tu perfil."
      : "Genera tu siguiente respuesta corta a la última intervención del vendedor.";

    let reply = "";
    let usedFallbackModel = false;

    try {
      const ai = getGeminiClient();
      // Intentar primero con gemini-3.5-flash
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.75,
        }
      });
      reply = response.text?.trim() || "";
    } catch (primaryError: any) {
      console.warn("Falla de cuota o error con gemini-3.5-flash. Intentando fallback a gemini-3.1-flash-lite...", primaryError.message);
      
      try {
        const ai = getGeminiClient();
        // Fallback a un modelo de peso ultra liviano y cuotas independientes
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: promptText,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.75,
          }
        });
        reply = response.text?.trim() || "";
        usedFallbackModel = true;
      } catch (fallbackModelError) {
        // Si ambos modelos fallan (por cuota agotada de la API), arrojamos para activar el simulador local de emergencia
        throw new Error("API_COULD_NOT_FULFILL_REQUEST");
      }
    }

    if (!reply) {
      throw new Error("API_RETURNED_EMPTY_RESPONSE");
    }

    res.json({ text: reply, quotaWarning: usedFallbackModel });

  } catch (error: any) {
    console.error("Iniciando simulador local de emergencia por fallo de API o Cuota:", error.message);
    
    // Heurística local de emergencia para que la simulación siga funcionando fluidamente
    try {
      const { profile, product, history } = req.body;
      const textHistory = history || [];
      const clientObjections = (profile && profile.objections) || [
        "El precio es un poco elevado para mí presupuesto actual.",
        "No tengo tiempo para ponerme a estudiar o implementar esto ahora mismo.",
        "Déjame consultarlo primero con mis socios antes de tomar una decisión."
      ];
      
      const objectionIndex = Math.max(0, Math.floor(textHistory.length / 2)) % clientObjections.length;
      const currentObjection = clientObjections[objectionIndex];
      const lowName = (profile && profile.name || "").toLowerCase();
      
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
        if (lowName.includes("carlos") || lowName.includes("escéptico")) {
          generatedReply = `Mmm, entiendo tus ventajas, pero mira... ${currentObjection.toLowerCase()}. No me da confianza tirar mi inversión. ¿Cómo me garantizas que no es humo?`;
        } else if (lowName.includes("karla") || lowName.includes("apurada")) {
          generatedReply = `Vale, pero decime al grano si eso soluciona lo mío ya mismo, porque la verdad ${currentObjection.toLowerCase()} y tengo que cortar ya en 3 minutos.`;
        } else if (lowName.includes("sofía") || lowName.includes("cotizada")) {
          generatedReply = `Me parece una propuesta más del montón. Para mí, ${currentObjection.toLowerCase()}. ¿Ofrecen algún descuento por pago al contado o de verdad es lo mínimo?`;
        } else {
          generatedReply = `Suena bien lo que dices, pero el problema es que ${currentObjection.toLowerCase()}. ¿Tenés alguna opción de financiamiento o flexibilidad para eso?`;
        }
      }
      
      // Escribir error en log de depuración
      try {
        fs.writeFileSync("api-error.log", JSON.stringify({
          endpoint: "/api/chat",
          time: new Date().toISOString(),
          message: error.message,
          info: "Simulador de emergencia local activado exitosamente."
        }, null, 2));
      } catch (e) {}

      return res.json({ 
        text: generatedReply, 
        quotaWarning: true, 
        isLocalSimulated: true 
      });

    } catch (simError: any) {
      console.error("Falla crítica inclusive en el simulador local:", simError);
      res.status(500).json({ error: "No se pudo recuperar la simulación de respaldo local autónoma." });
    }
  }
});

// POST /api/evaluate - Evaluar la sesión de ventas con IA Coach Experto (con fallback elegante)
app.post("/api/evaluate", async (req, res) => {
  try {
    const { profile, product, history, knowledge } = req.body;

    if (!history || history.length === 0) {
      return res.status(400).json({ error: "No hay historial para evaluar." });
    }

    const formattedHistory = history.map((h: any) => `${h.role === 'vendedor' ? 'Vendedor (Usuario)' : 'Cliente (Simulado)'}: ${h.text}`).join('\n');

    const systemInstruction = `
Eres WhatsCoach AI, un Coach de Ventas de Élite y mentor experto en cierres por WhatsApp de alto impacto en español.
Tu trabajo es auditar meticulosamente la conversación enviada y entrenar al vendedor de forma sumamente analítica y constructiva.

Tu evaluación debe basarse y hacer match explícito con este "Catálogo Maestro de 12 Técnicas de Venta":
${JSON.stringify(MASTER_TECHNIQUES, null, 2)}

Si el usuario cargó una Base de Conocimiento adicional (por ejemplo, textos de Best Sellers de sus PDFs), considera estas instrucciones adicionales para evaluar:
"${knowledge || 'No se suministró Base de Conocimiento adicional.'}"

Instrucciones de puntaje y dictamen científico:
1. Pondera justamente los indicadores de 1 a 10:
   - "calidad_conversacion": Capacidad de reportar empatía sincera, fluidez de chat, no saturar al cliente con muros de texto (WhatsApp exige respuestas cortas e interactivas).
   - "manejo_objeciones": Cómo reaccionó a las evasivas u objeciones de ${profile.name} sin ponerse a la defensiva. ¿Presentó valor o simplemente empujó a la compra?
   - "tecnicas_cierre": Si propuso llamadas a la acción claras (CTA) y usó alguna técnica de cierre del catálogo maestro.
   - "puntuacion_final": Del 1 al 100 ponderando los 3 anteriores (máximo 100).
2. En la propiedad "tecnicas_aplicadas", examina la transcripción y detecta cuáles técnicas de las 12 del Catálogo Maestro o de la Base de conocimiento del PDF fueron aplicadas REALMENTE por el vendedor. Menciona la técnica y cita textualmente la frase donde se nota su uso (por ejemplo: "Uso de Feel-Felt-Found en la frase: 'Entiendo que te sientas...'"). Si no usó ninguna, devuelve un arreglo vacío.
3. En "tecnicas_no_aplicadas", lista técnicas que habrían sido de magnífico apoyo para el vendedor dadas las objeciones que presentó el cliente, pero que omitió por completo.
4. En "tecnica_cierre_recomendada", haz un diagnóstico magistral y dinámico: dile al usuario cuál o cuáles de las técnicas de las 12 del Catálogo Maestro hubiesen sido las MÁS acertadas o ideales para cerrar a ESTE cliente con este perfil (${profile.name}), detallando el porqué psicológico y táctico de dicha elección.
5. En la propiedad "ejemplo_respuesta_ideal", confecciona una réplica perfecta y real en primera persona de WhatsApp para manejar la objeción clave o para el cierre con elegancia máxima. Debe sonar carismática, magnética y persuasiva.
`;

    const promptText = `
Transcripción de la Conversación a Evaluar:
${formattedHistory}

Producto Ofrecido:
Nombre: ${product.name}
Precio: ${product.price}
Descripción: ${product.description}

Formato de Respuesta obligatorio (JSON). El JSON que devuelvas debe ceñirse exactamente al siguiente esquema con los tipos de datos correctos:
`;

    let resultText = "";
    let isFallbackModelUsed = false;

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
              calidad_conversacion: { type: Type.INTEGER, description: "Puntuación de 1 a 10 de la fluidez y empatía" },
              manejo_objeciones: { type: Type.INTEGER, description: "Puntuación de 1 a 10 de cómo disolvió las objeciones del perfil" },
              tecnicas_cierre: { type: Type.INTEGER, description: "Puntuación de 1 a 10 en llamados a la acción y empuje final" },
              puntuacion_final: { type: Type.INTEGER, description: "De 0 a 100 de desempeño integral" },
            }
          },
          analisis: {
            type: Type.OBJECT,
            required: ["fortalezas", "oportunidades_mejora", "tecnicas_aplicadas", "tecnicas_no_aplicadas", "tecnica_cierre_recomendada"],
            properties: {
              fortalezas: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Lista de 2 a 3 fortalezas principales encontradas"
              },
              oportunidades_mejora: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Lista de errores que necesitan corrección o áreas críticas"
              },
              tecnicas_aplicadas: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Técnicas del catálogo de 12 o PDF detectadas en la charla, citando la frase precisa"
              },
              tecnicas_no_aplicadas: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Técnicas útiles que se omitieron"
              },
              tecnica_cierre_recomendada: {
                type: Type.STRING,
                description: "Explicación detallada de cuál técnica del Catálogo maestro era idónea y por qué"
              }
            }
          },
          ejemplo_respuesta_ideal: {
            type: Type.STRING,
            description: "Redacción exacta de qué responder por WhatsApp para cerrar o disolver el ataque final del cliente con maestría"
          }
        }
      },
      temperature: 0.15,
    };

    try {
      const ai = getGeminiClient();
      // Intentar primero con gemini-3.5-flash
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          { text: systemInstruction },
          { text: promptText }
        ],
        config: schemaConfig
      });
      resultText = response.text || "";
    } catch (primaryError: any) {
      console.warn("Falla de cuota o error con gemini-3.5-flash en evaluación. Intentando fallback a gemini-3.1-flash-lite...", primaryError.message);
      
      try {
        const ai = getGeminiClient();
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: [
            { text: systemInstruction },
            { text: promptText }
          ],
          config: schemaConfig
        });
        resultText = response.text || "";
        isFallbackModelUsed = true;
      } catch (fallbackModelError) {
        throw new Error("API_COULD_NOT_FULFILL_EVALUATION");
      }
    }

    if (!resultText) {
      throw new Error("API_RETURNED_EMPTY_RESPONSE");
    }

    const parsedJson = JSON.parse(resultText);
    res.json({ ...parsedJson, quotaUsedAlternative: isFallbackModelUsed });

  } catch (error: any) {
    console.error("Iniciando Coach del Simulador Local de respaldo para la evaluación:", error.message);
    
    // Heurística local de evaluación sumamente sofisticada para mantener el funcionamiento excelente sin API
    try {
      const { profile, product, history } = req.body;
      const textHistory = history || [];

      // Analizar técnicas aplicadas por palabra clave
      const appliedTechs: string[] = [];
      const unappliedTechs: string[] = [];
      
      // Unir todo el texto del vendedor
      const sellerWordsCombined = textHistory
        .filter((h: any) => h.role === "vendedor")
        .map((h: any) => (h.text || "").toLowerCase())
        .join(" ");

      MASTER_TECHNIQUES.forEach((tech) => {
        const isMatched = tech.keywords.some((keyword) => sellerWordsCombined.includes(keyword.toLowerCase()));
        if (isMatched) {
          const matchingMsg = textHistory.find((h: any) => h.role === "vendedor" && tech.keywords.some((kw) => h.text.toLowerCase().includes(kw.toLowerCase())));
          const excerpt = matchingMsg ? `"${matchingMsg.text.substring(0, 35)}..."` : "";
          appliedTechs.push(`Uso de ${tech.name} ${excerpt ? `en: ${excerpt}` : ""}`);
        } else {
          unappliedTechs.push(tech.name);
        }
      });

      // Calcular puntajes basados en calidad de la charla
      const matchesCount = appliedTechs.length;
      let calidad_conversacion = Math.min(10, 5 + Math.floor(textHistory.length / 2));
      const manejo_objeciones = Math.min(10, 4 + (matchesCount * 2));
      const tecnicas_cierre = Math.min(10, 4 + matchesCount);
      const puntuacion_final = Math.min(100, Math.round(((calidad_conversacion + manejo_objeciones + tecnicas_cierre) / 30) * 100));

      const fortalezas = [
        "Involucramiento activo en la simulación abordando con seriedad los puntos clave.",
        "Mantuvo una ortografía óptima y estructura formal en las respuestas de WhatsApp."
      ];
      if (matchesCount > 0) {
        fortalezas.push(`Identificación exitosa del dolor empleando la técnica: ${appliedTechs[0].split(" ")[2]}.`);
      } else {
        fortalezas.push("Cordialidad destacada y uso adecuado de saludos introductorios.");
      }

      const oportunidades_mejora = [
        "Respuestas muy elaboradas. Recuerda que en WhatsApp es preferible enviar frases cortas para incentivar la agilidad.",
        "Integra preguntas abiertas para diagnosticar la situación real del prospecto antes de brindar alternativas de costo.",
        "Asegura un cierre asertivo empleando alternativas directas ('¿Opción básica o premium?')."
      ];

      // Ejemplo de respuesta ideal redactado con inteligencia
      const clientName = profile?.name || "Prospecto";
      const exampleIdeal = `Entiendo plenamente cómo te sientes, ${clientName}. De hecho, otros clientes se sintieron exactamente igual de reacios con la inversión de ${product?.price || "el servicio"} al principio. Sin embargo, descubrieron que tras iniciar, la automatización les liberó 2 horas operativas al día, amortizando el plan en semanas. ¿Qué te parece si empezamos con la opción básica y evaluamos el avance, o prefieres revisar el demo interactivo directo?`;

      const localEvaluation = {
        indicadores: {
          calidad_conversacion,
          manejo_objeciones,
          tecnicas_cierre,
          puntuacion_final
        },
        analisis: {
          fortalezas,
          oportunidades_mejora,
          tecnicas_aplicadas: appliedTechs.length > 0 ? appliedTechs : ["Análisis empático básico de dudas"],
          tecnicas_no_aplicadas: unappliedTechs.slice(0, 4),
          tecnica_cierre_recomendada: "Se recomienda enfáticamente usar Feel-Felt-Found (Sentir-Sentido-Encontrado) para diluir el rechazo por costo inicial de manera altamente empática."
        },
        ejemplo_respuesta_ideal: exampleIdeal,
        isLocalHeuristics: true
      };

      try {
        fs.writeFileSync("api-error.log", JSON.stringify({
          endpoint: "/api/evaluate",
          time: new Date().toISOString(),
          message: error.message,
          info: "Coach local de emergencia activado con éxito."
        }, null, 2));
      } catch (e) {}

      res.json(localEvaluation);

    } catch (localEvalError: any) {
      console.error("Fallo crítico en evaluación local:", localEvalError);
      res.status(500).json({ error: "Falla general al procesar la evaluación local persistente." });
    }
  }
});

// Configure Vite as middleware in development or serve static assets in production
async function main() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Iniciando en modo de DESARROLLO...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Iniciando en modo de PRODUCCIÓN...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

main().catch(err => {
  console.error("Falla al iniciar el servidor express:", err);
});
