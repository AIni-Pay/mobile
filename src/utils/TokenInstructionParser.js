import { bech32 } from 'bech32';

export class TokenInstructionParser {
  constructor() {
    this.textToNumberMap = {
      'cero': 0, 'zero': 0,
      'uno': 1, 'una': 1, 'one': 1,
      'dos': 2, 'two': 2,
      'tres': 3, 'three': 3,
      'cuatro': 4, 'four': 4,
      'cinco': 5, 'five': 5,
      'seis': 6, 'six': 6,
      'siete': 7, 'seven': 7,
      'ocho': 8, 'eight': 8,
      'nueve': 9, 'nine': 9,
      'diez': 10, 'ten': 10
    };
  }

  parseInstruction(rawText) {
    const result = {
      raw_text: rawText,
      address: "",
      address_valid: false,
      chain: "unknown",
      amount: {
        original: "",
        numeric: null,
        unit: null
      },
      need_clarification: false,
      clarifying_questions: [],
      intent: "other",
      confidence: 0.0,
      error: null
    };

    try {
      // Detect intent
      const sendKeywords = ['envía', 'envia', 'manda', 'mande', 'send', 'transfer', 'transferir', 'enviar'];
      const hasSendIntent = sendKeywords.some(keyword => 
        rawText.toLowerCase().includes(keyword.toLowerCase())
      );

      if (!hasSendIntent) {
        result.intent = "other";
        result.confidence = 0.99;
        return result;
      }

      result.intent = "send";

      // Extract address - improved regex for bech32 addresses
      const addressMatch = rawText.match(/(celestia1[a-z0-9]{38,58}|mocha1[a-z0-9]{38,58})/i);
      if (addressMatch) {
        result.address = addressMatch[0];
        result.address_valid = this.validateBech32Address(result.address);
        
        // Determine chain from address prefix
        if (result.address.startsWith('celestia1')) {
          result.chain = "celestia";
        } else if (result.address.startsWith('mocha1')) {
          result.chain = "mocha";
        }
      } else {
        // Look for partial addresses that might be truncated in examples
        const partialMatch = rawText.match(/(celestia1[a-z0-9]{3,}|mocha1[a-z0-9]{3,})/i);
        if (partialMatch) {
          result.address = partialMatch[0];
          result.address_valid = false; // Mark as invalid since it's probably truncated
          result.error = "Dirección parece estar truncada";
          
          if (result.address.startsWith('celestia1')) {
            result.chain = "celestia";
          } else if (result.address.startsWith('mocha1')) {
            result.chain = "mocha";
          }
        }
      }

      // Extract amount and unit
      const amountResult = this.extractAmount(rawText);
      result.amount = amountResult;

      // Detect chain from text if not detected from address
      if (result.chain === "unknown") {
        if (rawText.toLowerCase().includes('celestia')) {
          result.chain = "celestia";
        } else if (rawText.toLowerCase().includes('mocha')) {
          result.chain = "mocha";
        }
      }

      // Check if clarification is needed
      const missingData = [];
      if (!result.address) {
        missingData.push("¿A qué dirección quieres enviar?");
      }
      if (result.amount.numeric === null) {
        missingData.push("¿Cuánto quieres enviar?");
      }
      if (!result.amount.unit) {
        missingData.push("¿En qué unidad (ej. TIA, MOCHA)?");
      }

      if (missingData.length > 0) {
        result.need_clarification = true;
        result.clarifying_questions = missingData.slice(0, 3);
        result.confidence = 0.60;
      } else {
        result.need_clarification = false;
        result.confidence = 0.95;
      }

      // Validate address format if present
      if (result.address && !result.address_valid) {
        result.error = "Formato de dirección inválido";
        result.confidence = Math.max(0.3, result.confidence - 0.2);
      }

    } catch (error) {
      result.error = "Error al procesar la instrucción";
      result.confidence = 0.1;
    }

    return result;
  }

  extractAmount(text) {
    const result = {
      original: "",
      numeric: null,
      unit: null
    };

    // Look for number patterns with units
    const patterns = [
      // Standard decimal numbers with units
      /(\d+(?:\.\d+)?)\s*(tia|mocha|utia|umocha|atom|uatom)/gi,
      // Text numbers with units
      /\b(uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|one|two|three|four|five|six|seven|eight|nine|ten)\s*(tia|mocha|utia|umocha|atom|uatom)/gi,
      // Just numbers without explicit units
      /(\d+(?:\.\d+)?)/g,
      // Just text numbers
      /\b(uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|one|two|three|four|five|six|seven|eight|nine|ten)\b/gi
    ];

    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        const match = matches[0];
        result.original = match;

        // Extract number and unit
        const numUnitMatch = match.match(/(\d+(?:\.\d+)?|\w+)\s*(\w+)?/i);
        if (numUnitMatch) {
          let numberPart = numUnitMatch[1];
          let unitPart = numUnitMatch[2];

          // Convert text to number if needed
          if (isNaN(numberPart)) {
            const textNum = this.textToNumberMap[numberPart.toLowerCase()];
            if (textNum !== undefined) {
              result.numeric = textNum;
            }
          } else {
            result.numeric = parseFloat(numberPart);
          }

          result.unit = unitPart || null;
          break;
        }
      }
    }

    // If we found a number but no unit, try to infer unit from context
    if (result.numeric !== null && !result.unit) {
      if (text.toLowerCase().includes('tia')) {
        result.unit = 'TIA';
      } else if (text.toLowerCase().includes('mocha')) {
        result.unit = 'MOCHA';
      }
    }

    return result;
  }

  validateBech32Address(address) {
    try {
      if (!address || typeof address !== 'string') {
        return false;
      }

      // Check if it starts with expected prefixes
      if (!address.startsWith('celestia1') && !address.startsWith('mocha1')) {
        return false;
      }

      // For now, just do basic format validation since bech32 library might need configuration
      // A proper celestia address should be celestia1 + 39 characters (total 48 chars)
      if (address.startsWith('celestia1')) {
        return address.length >= 45 && /^celestia1[a-z0-9]+$/.test(address);
      }
      
      if (address.startsWith('mocha1')) {
        return address.length >= 40 && /^mocha1[a-z0-9]+$/.test(address);
      }

      return false;

    } catch (error) {
      return false;
    }
  }

  // Method to detect dangerous instructions
  detectDangerousInstructions(text) {
    const dangerousKeywords = [
      'private key', 'clave privada', 'seed phrase', 'frase semilla',
      'mnemonic', 'mnemónica', 'password', 'contraseña'
    ];

    const lowerText = text.toLowerCase();
    return dangerousKeywords.some(keyword => lowerText.includes(keyword));
  }
}