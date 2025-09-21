import { TokenInstructionParser } from '../utils/TokenInstructionParser';
import { DeepSeekService } from './DeepSeekService';

export class ChatbotService {
  constructor() {
    this.parser = new TokenInstructionParser();
    this.deepSeekService = new DeepSeekService();
    this.conversationState = {
      pendingTransaction: null,
      lastParseResult: null,
      awaitingConfirmation: false
    };
  }

  async processMessage(userMessage) {
    const response = {
      responses: [],
      transactionReady: false,
      transactionData: null
    };

    try {
      // Parse the instruction
      let parseResult;
      
      try {
        // Try AI-enhanced parsing first
        const localResult = this.parser.parseInstruction(userMessage);
        parseResult = await this.deepSeekService.enhanceParsingWithAI(localResult, userMessage);
      } catch (error) {
        // Fallback to local parsing
        parseResult = this.parser.parseInstruction(userMessage);
      }

      this.conversationState.lastParseResult = parseResult;

      // Handle different scenarios
      if (parseResult.intent !== 'send') {
        response.responses.push(
          "Entiendo que quieres hacer algo, pero no veo una instrucción clara para enviar tokens.",
          "Puedes decirme algo como: 'Envía 5 TIA a celestia1abc...' o '¿Podrías mandar 2 mocha a celestia1xyz...?'"
        );
        return response;
      }

      if (parseResult.need_clarification) {
        response.responses.push(
          "Necesito más información para procesar tu transacción:"
        );
        response.responses.push(...parseResult.clarifying_questions);
        response.responses.push("¿Podrías proporcionar estos datos?");
        return response;
      }

      if (!parseResult.address_valid) {
        response.responses.push(
          "La dirección que proporcionaste no parece válida.",
          "Las direcciones de Celestia deben empezar con 'celestia1' seguido de caracteres alfanuméricos.",
          "¿Podrías verificar la dirección?"
        );
        return response;
      }

      // Transaction is ready
      if (parseResult.intent === 'send' && 
          parseResult.address && 
          parseResult.address_valid && 
          parseResult.amount.numeric !== null &&
          !parseResult.need_clarification) {
        
        const amount = parseResult.amount.numeric;
        const unit = parseResult.amount.unit || 'TIA';
        const address = parseResult.address;

        response.responses.push(
          `✅ ¡Perfecto! He entendido tu solicitud:`,
          `💰 Cantidad: ${amount} ${unit}`,
          `📍 Destino: ${address.substring(0, 20)}...`,
          `🌐 Red: ${parseResult.chain || 'celestia'}`,
          "",
          "Procediendo a ejecutar la transacción..."
        );

        response.transactionReady = true;
        response.transactionData = {
          toAddress: address,
          amount: amount,
          unit: unit,
          chain: parseResult.chain || 'celestia'
        };

        this.conversationState.pendingTransaction = response.transactionData;
      }

    } catch (error) {
      console.error('Error processing message:', error);
      response.responses.push(
        "Disculpa, hubo un error procesando tu mensaje.",
        "¿Podrías intentar de nuevo con una instrucción más específica?"
      );
    }

    return response;
  }

  generateHelpResponse() {
    return [
      "¡Hola! Soy tu asistente para transacciones de Celestia 🚀",
      "",
      "Puedo ayudarte a enviar tokens TIA usando lenguaje natural.",
      "",
      "Ejemplos de comandos:",
      "• 'Envía 5 TIA a celestia1abc...'",
      "• 'Manda 0.1 TIA a celestia1xyz...'",
      "• 'Transfiere 2 mocha a celestia1...'",
      "",
      "Necesito estos datos para procesar tu transacción:",
      "🪙 Cantidad y tipo de token (ej: '5 TIA')",
      "📍 Dirección de destino (celestia1...)",
      "",
      "¿En qué te puedo ayudar hoy?"
    ];
  }

  reset() {
    this.conversationState = {
      pendingTransaction: null,
      lastParseResult: null,
      awaitingConfirmation: false
    };
  }
}