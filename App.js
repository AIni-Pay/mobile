import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { TokenInstructionParser } from './src/utils/TokenInstructionParser';
import { DeepSeekService } from './src/services/DeepSeekService';
import { MobileWalletService } from './src/services/MobileWalletService';
import ChatInterface from './src/components/ChatInterface';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [walletInfo, setWalletInfo] = useState({ 
    isConnected: false, 
    address: null, 
    chain: null 
  });
  const [balance, setBalance] = useState(null);

  // Initialize services - use useMemo to ensure single instances
  const parser = useMemo(() => new TokenInstructionParser(), []);
  const deepSeekService = useMemo(() => new DeepSeekService(), []);
  const walletService = useMemo(() => new MobileWalletService(), []);

  useEffect(() => {
    // Auto-connect demo wallet on app start
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Initializing app...');
      
      // For now, auto-connect with demo wallet
      console.log('🔗 Attempting to connect demo wallet...');
      console.log('� WalletService instance:', walletService);
      
      const result = await walletService.connectWallet('mocha', 'demo');
      console.log('✅ Demo wallet connection result:', result);
      
      if (result && result.isConnected) {
        setWalletInfo(result);
        setBalance(result.balance);
        console.log('💾 Wallet info set in state:', result);
      } else {
        console.error('❌ Wallet connection result was not successful:', result);
        throw new Error('Demo wallet connection returned invalid result');
      }
      
    } catch (error) {
      console.error('❌ App initialization error:', error);
      console.error('❌ Full error stack:', error.stack);
      
      // Create a fallback demo wallet if connection completely fails
      console.log('🔄 Creating fallback wallet connection...');
      const fallbackWallet = {
        isConnected: true,
        address: 'celestia16e3rskkaa8l7p92uny3pqh2c96mlkhq524aksf',
        chain: 'mocha',
        walletType: 'demo',
        balance: { amount: '1.000000', denom: 'TIA' }
      };
      
      setWalletInfo(fallbackWallet);
      setBalance(fallbackWallet.balance);
      
      console.log('✅ Fallback wallet created:', fallbackWallet);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to connect real wallet (can be called from UI)
  const connectRealWallet = async () => {
    try {
      setIsLoading(true);
      
      Alert.alert(
        '🔗 Connecting Real Wallet',
        'Make sure you have a compatible wallet app installed:\n\n• Keplr Mobile\n• Cosmostation\n• Leap Wallet\n\nReady to continue?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setIsLoading(false) },
          { text: 'Connect', onPress: async () => {
            try {
              console.log('🔗 Connecting real wallet via WalletConnect...');
              const result = await walletService.connectWallet('mocha', 'walletconnect');
              console.log('✅ Real wallet connected:', result);
              
              setWalletInfo(result);
              setBalance(result.balance);
              
              Alert.alert(
                'Real Wallet Connected! 🎉',
                `✅ Successfully connected!\n\n📍 Address: ${result.address.substring(0, 20)}...\n💰 Balance: ${result.balance.amount} ${result.balance.denom}\n🌐 Network: ${result.chain}`,
                [{ text: 'Awesome!' }]
              );
            } catch (error) {
              console.error('❌ Real wallet connection error:', error);
              
              let errorMessage = error.message;
              let title = 'Connection Failed';
              
              if (error.message.includes('Project ID not configured')) {
                title = 'Setup Required';
                errorMessage = `⚠️ WalletConnect not configured yet!\n\n1. Get a free Project ID from:\n   https://cloud.walletconnect.com/\n\n2. Add it to your .env file\n\n3. Restart the app\n\nSee WALLETCONNECT_SETUP.md for details.`;
              } else if (error.message.includes('User rejected')) {
                title = 'Connection Rejected';
                errorMessage = 'Connection was cancelled in your wallet app. Try again when ready!';
              } else if (error.message.includes('timeout')) {
                title = 'Connection Timeout';
                errorMessage = 'Connection timed out. Make sure your wallet app is open and try again.';
              }
              
              Alert.alert(title, errorMessage, [{ text: 'OK' }]);
            } finally {
              setIsLoading(false);
            }
          }}
        ]
      );
    } catch (error) {
      console.error('Real wallet setup error:', error);
      setIsLoading(false);
      Alert.alert('Setup Error', error.message, [{ text: 'OK' }]);
    }
  };

  // Function for chat to execute transactions
  const handleChatTransaction = async (transactionData) => {
    try {
      console.log('🚀 App.js handleChatTransaction called with:', transactionData);
      console.log('📊 Current wallet info:', walletInfo);
      
      if (!walletInfo.isConnected) {
        throw new Error('Wallet not connected. Please connect a wallet first.');
      }

      const { toAddress, amount, unit } = transactionData;
      
      // Validate transaction data
      if (!toAddress || !amount || !unit) {
        console.error('❌ Missing transaction data:', { toAddress, amount, unit });
        throw new Error('Missing required transaction data');
      }

      console.log('📝 Validated transaction data:', { toAddress, amount, unit });

      // Execute transaction through wallet service
      console.log('💸 Calling walletService.sendTokens...');
      const result = await walletService.sendTokens(toAddress, amount, unit, 'Sent via Celestia Chatbot Assistant');
      
      console.log('✅ Transaction result received:', result);

      // Show success message
      const isDemo = walletInfo.walletType === 'demo';
      Alert.alert(
        'Transaction Completed',
        `✅ Transaction ${isDemo ? 'simulated' : 'executed'} successfully!\n\n` +
        `Hash: ${result.transactionHash}\n` +
        `Sent: ${amount} ${unit}\n` +
        `To: ${toAddress.substring(0, 20)}...\n` +
        `Gas Used: ${result.gasUsed}\n\n` +
        `${isDemo ? 'This was a demo transaction.' : 'Real transaction completed!'}`,
        [{ text: 'Awesome!' }]
      );
      
      console.log('✅ Transaction completed successfully');
      
      // Update balance after successful transaction
      if (result.success && walletInfo.balance) {
        const newBalance = parseFloat(walletInfo.balance.amount) - parseFloat(amount);
        const updatedWalletInfo = {
          ...walletInfo,
          balance: {
            ...walletInfo.balance,
            amount: Math.max(0, newBalance).toFixed(6)
          }
        };
        setWalletInfo(updatedWalletInfo);
        setBalance(updatedWalletInfo.balance);
        console.log('💰 Updated balance:', updatedWalletInfo.balance);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ handleChatTransaction error:', error);
      console.error('❌ Error stack:', error.stack);
      
      let errorTitle = 'Transaction Failed';
      let errorMessage = error.message;
      
      // Provide specific error handling
      if (error.message.includes('not connected')) {
        errorTitle = 'Wallet Not Connected';
        errorMessage = 'Please connect your wallet before sending transactions.';
      } else if (error.message.includes('insufficient')) {
        errorTitle = 'Insufficient Balance';
        errorMessage = 'You don\'t have enough tokens for this transaction.';
      } else if (error.message.includes('invalid address')) {
        errorTitle = 'Invalid Address';
        errorMessage = 'The recipient address appears to be invalid. Please check and try again.';
      } else if (error.message.includes('WalletConnect')) {
        errorTitle = 'WalletConnect Error';
        errorMessage = 'There was a problem with the wallet connection. Please reconnect and try again.';
      }
      
      Alert.alert(errorTitle, errorMessage, [{ text: 'OK' }]);
      throw error;
    }
  };

  // Show loading screen while initializing
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#2d1b69" />
        <View style={styles.loadingContent}>
          <Text style={styles.loadingTitle}>🌟 Celestia Token Sender</Text>
          <ActivityIndicator size="large" color="#7B68EE" style={styles.loadingSpinner} />
          <Text style={styles.loadingText}>Inicializando chatbot...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2d1b69" />
      
      <View style={styles.header}>
        <Text style={styles.title}>🌟 Celestia Token Sender</Text>
        <Text style={styles.subtitle}>
          Chatbot inteligente para enviar tokens TIA usando lenguaje natural
        </Text>
      </View>

      <ChatInterface 
        onSendTransaction={handleChatTransaction}
        walletInfo={walletInfo}
        isConnected={walletInfo.isConnected}
      />

      {/* Simple status indicator */}
      <View style={styles.statusBar}>
        <View style={styles.statusLeft}>
          <Text style={styles.statusText}>
            {walletInfo.isConnected 
              ? `🟢 ${walletInfo.walletType === 'demo' ? 'Demo' : 'Real'} Wallet - ${walletInfo.chain}` 
              : '🟡 Modo Demo'
            }
          </Text>
          {balance && (
            <Text style={styles.balanceText}>
              💰 {balance.amount} {balance.denom}
            </Text>
          )}
        </View>
        
        {walletInfo.walletType === 'demo' && (
          <TouchableOpacity 
            style={styles.connectRealButton} 
            onPress={connectRealWallet}
            disabled={isLoading}
          >
            <Text style={styles.connectRealButtonText}>
              {isLoading ? '⏳' : '🔗 Connect Real Wallet'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    padding: 40,
  },
  loadingTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 40,
  },
  loadingSpinner: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#2d1b69',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 22,
  },
  statusBar: {
    backgroundColor: '#2d1b69',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLeft: {
    flex: 1,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  balanceText: {
    color: '#7B68EE',
    fontSize: 14,
    fontWeight: '500',
  },
  connectRealButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 12,
  },
  connectRealButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
