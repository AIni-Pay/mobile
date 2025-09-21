import axios from 'axios';

export class DeepSeekService {
  constructor() {
    // For React Native, we'll use a different approach to get environment variables
    this.apiKey = process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY;
    this.baseURL = 'https://api.deepseek.com/v1';
  }

  async parseInstruction(userInput) {
    if (!this.apiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    const systemPrompt = `Eres un asistente que extrae instrucciones de envío de tokens para integrarlas en una dApp (frontend en React Native + Mobile Wallet). Tu trabajo: analizar el texto del usuario y devolver **solo** un JSON con los campos necesarios para construir la transacción. **Nunca** devolverás texto fuera del JSON. Si la entrada es ambigua o faltan datos, devuelve un JSON que indique claramente qué falta y las preguntas necesarias para aclararlo.

Reglas generales:
1. Salida: Únicamente un **objeto JSON** (sin explicaciones, sin texto libre).
2. No intentes firmar ni enviar transacciones. Solo parsea y valida lo que puedas.
3. Mantén el campo \`raw_text\` con el mensaje original para trazabilidad.
4. Intenta detectar la cadena: \`"celestia"\` o \`"mocha"\`. Si no puedes decidir, usa \`"unknown"\`.
5. Valida la dirección si es posible (ej. formato bech32). Si no puedes validar, marca \`address_valid:false\` y explica brevemente en \`error\`.
6. Convierte la cantidad a número decimal en \`amount.numeric\` cuando sea posible. Mantén \`amount.original\` tal como lo escribió el usuario.
7. Si falta \`amount\` o \`address\` o \`chain\`, devuelve \`need_clarification:true\` y un array \`clarifying_questions\` con preguntas cortas y directas (máx. 3).
8. Añade un \`confidence\` (0.0–1.0) sobre la extracción.
9. Si detectas instrucciones peligrosas (por ejemplo: pedir llaves privadas), devuelve \`error\` indicando rechazo y no incluyas datos sensibles.

Esquema JSON exacto (devuelve solo esto):
{
  "raw_text": "string",
  "address": "string or empty",
  "address_valid": true|false,
  "chain": "celestia" | "mocha" | "unknown",
  "amount": {
    "original": "string (tal como lo escribió el usuario)",
    "numeric": number|null,
    "unit": "string|null"
  },
  "need_clarification": true|false,
  "clarifying_questions": ["string", ...],
  "intent": "send" | "other",
  "confidence": number,
  "error": null | "short description of error"
}`;

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userInput
            }
          ],
          temperature: 0.1,
          max_tokens: 500,
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          }
        }
      );

      const content = response.data.choices[0].message.content;
      
      try {
        return JSON.parse(content);
      } catch (parseError) {
        // Fallback if JSON parsing fails
        return {
          raw_text: userInput,
          address: "",
          address_valid: false,
          chain: "unknown",
          amount: { original: "", numeric: null, unit: null },
          need_clarification: true,
          clarifying_questions: ["Error al procesar la respuesta del AI"],
          intent: "other",
          confidence: 0.1,
          error: "Error parsing AI response"
        };
      }
    } catch (error) {
      console.error('DeepSeek API Error:', error);
      
      // Return error response in the expected format
      return {
        raw_text: userInput,
        address: "",
        address_valid: false,
        chain: "unknown",
        amount: { original: "", numeric: null, unit: null },
        need_clarification: true,
        clarifying_questions: ["Error conectando con el servicio AI"],
        intent: "other",
        confidence: 0.1,
        error: `API Error: ${error.response?.data?.error?.message || error.message}`
      };
    }
  }

  async enhanceParsingWithAI(localResult, originalText) {
    // If local parsing was successful, we can still use AI to double-check or enhance
    if (localResult.confidence > 0.8 && !localResult.need_clarification) {
      return localResult;
    }

    try {
      const aiResult = await this.parseInstruction(originalText);
      
      // Merge results, preferring AI results for ambiguous cases
      const mergedResult = {
        ...localResult,
        // Use AI results if local parsing had low confidence
        ...(localResult.confidence < 0.7 ? aiResult : {}),
        // Always keep the original text
        raw_text: originalText
      };

      // Take the higher confidence score
      mergedResult.confidence = Math.max(localResult.confidence, aiResult.confidence || 0);

      return mergedResult;
    } catch (error) {
      // If AI fails, return local result
      return localResult;
    }
  }
}