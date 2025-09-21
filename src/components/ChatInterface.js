import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { ChatbotService } from '../services/ChatbotService.js';

const ChatInterface = ({ onSendTransaction, walletInfo, isConnected }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatbot, setChatbot] = useState(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    // Initialize the chatbot service
    const service = new ChatbotService();
    setChatbot(service);
    
    // Initial bot messages
    addBotMessages([
      "¡Hola amigo! 👋 ¿Qué tal? Te puedo ayudar a realizar una transacción.",
      "Para enviar tokens necesito algunos datos:",
      "🪙 El tipo de moneda y monto (ej: '5 TIA' o '0.001 mocha')",
      "📍 La dirección del destinatario",
      "💡 Esta es una demostración con wallet conectada automáticamente",
      "¿Con qué te gustaría empezar?"
    ]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const addBotMessages = (botMessages, delay = 1000) => {
    setIsTyping(true);
    
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          type: 'bot',
          content: botMessages,
          timestamp: new Date(),
          id: Date.now() + Math.random()
        }
      ]);
      setIsTyping(false);
    }, delay);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
      id: Date.now() + Math.random()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage.trim();
    setInputMessage('');

    // Process with chatbot if available
    if (chatbot) {
      try {
        setIsTyping(true);
        const response = await chatbot.processMessage(currentMessage);
        
        setTimeout(() => {
          if (response.responses && response.responses.length > 0) {
            setMessages(prev => [
              ...prev,
              {
                type: 'bot',
                content: response.responses,
                timestamp: new Date(),
                id: Date.now() + Math.random()
              }
            ]);
          }

          // If transaction is ready, call the parent handler
          if (response.transactionReady && onSendTransaction) {
            console.log('🎯 ChatInterface: Transaction ready, calling onSendTransaction with:', response.transactionData);
            onSendTransaction(response.transactionData)
              .then(() => {
                console.log('✅ ChatInterface: Transaction completed successfully');
              })
              .catch((transactionError) => {
                console.error('❌ ChatInterface: Transaction failed:', transactionError);
                // Add error message to chat
                setTimeout(() => {
                  setMessages(prev => [
                    ...prev,
                    {
                      type: 'bot',
                      content: ['❌ Error en la transacción: ' + transactionError.message],
                      timestamp: new Date(),
                      id: Date.now() + Math.random()
                    }
                  ]);
                }, 500);
              });
          }
          
          setIsTyping(false);
        }, 1000);
        
      } catch (error) {
        setIsTyping(false);
        setMessages(prev => [
          ...prev,
          {
            type: 'bot',
            content: ['Error procesando el mensaje. Intenta de nuevo.'],
            timestamp: new Date(),
            id: Date.now() + Math.random()
          }
        ]);
      }
    }
  };

  const renderMessage = ({ item }) => {
    const isBot = item.type === 'bot';
    
    return (
      <View style={[
        styles.messageContainer,
        isBot ? styles.botMessageContainer : styles.userMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isBot ? styles.botBubble : styles.userBubble
        ]}>
          {Array.isArray(item.content) ? (
            item.content.map((line, index) => (
              <Text
                key={index}
                style={[
                  styles.messageText,
                  isBot ? styles.botText : styles.userText
                ]}
              >
                {line}
              </Text>
            ))
          ) : (
            <Text style={[
              styles.messageText,
              isBot ? styles.botText : styles.userText
            ]}>
              {item.content}
            </Text>
          )}
        </View>
        <Text style={styles.timestamp}>
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;
    
    return (
      <View style={[styles.messageContainer, styles.botMessageContainer]}>
        <View style={[styles.messageBubble, styles.botBubble]}>
          <View style={styles.typingIndicator}>
            <ActivityIndicator size="small" color="#666" />
            <Text style={styles.typingText}>El bot está escribiendo...</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Asistente Celestia 🤖</Text>
        <Text style={styles.headerSubtitle}>
          {isConnected 
            ? `🟢 Demo Wallet - ${walletInfo.chain}` 
            : '� Modo Demo'
          }
        </Text>
      </View>
      
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        ListFooterComponent={renderTypingIndicator}
      />
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="Escribe tu mensaje (ej: 'Envía 5 TIA a celestia1...')"
          placeholderTextColor="#999"
          multiline={true}
          maxLength={500}
          onSubmitEditing={handleSendMessage}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !inputMessage.trim() && styles.sendButtonDisabled
          ]}
          onPress={handleSendMessage}
          disabled={!inputMessage.trim() || isTyping}
        >
          <Text style={styles.sendButtonText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2d1b69',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 4,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    marginVertical: 4,
  },
  botMessageContainer: {
    alignItems: 'flex-start',
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  botBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#2d1b69',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  botText: {
    color: '#333',
  },
  userText: {
    color: 'white',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    marginHorizontal: 8,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#2d1b69',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ChatInterface;