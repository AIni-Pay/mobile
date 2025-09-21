import { UniversalProvider } from '@walletconnect/universal-provider';
import { CELESTIA_NETWORKS } from '../config/networks.js';

/**
 * WalletConnect service for real wallet connections
 * This allows users to connect their actual mobile wallets (Keplr, Cosmostation, etc.)
 */
export class WalletConnectService {
  constructor() {
    this.provider = null;
    this.session = null;
    this.accounts = [];
    this.chainId = null;
  }

  async initialize() {
    try {
      console.log('🔗 Initializing WalletConnect...');
      
      // Get Project ID from environment variables
      const projectId = process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID;
      
      if (!projectId || projectId === 'your_walletconnect_project_id_here') {
        throw new Error('WalletConnect Project ID not configured. Please set EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID in your .env file.\n\nGet your free Project ID at: https://cloud.walletconnect.com/');
      }
      
      this.provider = await UniversalProvider.init({
        projectId: projectId,
        metadata: {
          name: process.env.EXPO_PUBLIC_APP_NAME || 'Celestia Token Sender',
          description: process.env.EXPO_PUBLIC_APP_DESCRIPTION || 'Mobile app for sending Celestia tokens with AI chatbot',
          url: process.env.EXPO_PUBLIC_APP_URL || 'https://celestia.org',
          icons: [process.env.EXPO_PUBLIC_APP_ICON || 'https://celestia.org/favicon.ico']
        },
        chains: ['cosmos:mocha-4', 'cosmos:celestia'] // Cosmos chain format
      });

      // Set up event listeners
      this.setupEventListeners();
      
      console.log('✅ WalletConnect initialized with Project ID:', projectId.substring(0, 8) + '...');
      return true;
    } catch (error) {
      console.error('❌ WalletConnect initialization failed:', error);
      throw new Error(`WalletConnect initialization failed: ${error.message}`);
    }
  }

  setupEventListeners() {
    if (!this.provider) return;

    // Session established
    this.provider.on('session_event', (event) => {
      console.log('📱 Session event:', event);
    });

    // Session updated
    this.provider.on('session_update', ({ topic, params }) => {
      console.log('🔄 Session updated:', { topic, params });
      const { namespaces } = params;
      const session = this.provider.session.get(topic);
      // Update the session with new namespaces
      const updatedSession = { ...session, namespaces };
      this.session = updatedSession;
    });

    // Session deleted
    this.provider.on('session_delete', () => {
      console.log('🗑️ Session deleted');
      this.session = null;
      this.accounts = [];
      this.chainId = null;
    });
  }

  async connect(chainName = 'mocha') {
    try {
      if (!this.provider) {
        await this.initialize();
      }

      console.log(`🔗 Connecting to ${chainName} network...`);

      const network = chainName === 'mocha' ? CELESTIA_NETWORKS.MOCHA_TESTNET : CELESTIA_NETWORKS.MAINNET;
      const cosmosChainId = `cosmos:${network.chainId}`;

      // Define the required namespaces for the session
      const requiredNamespaces = {
        cosmos: {
          methods: [
            'cosmos_getAccounts',
            'cosmos_signDirect',
            'cosmos_signAmino',
          ],
          chains: [cosmosChainId],
          events: ['chainChanged', 'accountsChanged'],
        },
      };

      // Request connection
      const { uri, approval } = await this.provider.client.connect({
        requiredNamespaces,
      });

      // Show QR code or handle deep linking
      if (uri) {
        console.log('📱 WalletConnect URI generated');
        console.log('🔗 URI for QR code:', uri);
        
        // Create a user-friendly connection message
        const connectionMessage = `
🔗 Connect Your Wallet

1. Open your wallet app (Keplr, Cosmostation, Leap)
2. Look for "WalletConnect" or "Connect to dApp" 
3. Scan this QR code or copy the connection URI:

${uri}

🎯 Supported Wallets:
• Keplr Mobile
• Cosmostation  
• Leap Wallet
• Any WalletConnect-compatible wallet

⏱️ Connection will timeout in 5 minutes
        `;
        
        // In a real app, you would show this in a modal with QR code
        // For now, we'll show an alert with instructions
        alert(connectionMessage);
        
        // Optional: Try deep linking to common wallets
        this.attemptDeepLinking(uri);
      }

      // Wait for session approval
      const session = await approval();
      this.session = session;

      // Extract account information
      const cosmosNamespace = session.namespaces.cosmos;
      if (cosmosNamespace) {
        this.accounts = cosmosNamespace.accounts.map(account => {
          const [namespace, chainId, address] = account.split(':');
          return { namespace, chainId, address };
        });
        this.chainId = network.chainId;
      }

      console.log('✅ WalletConnect session established:', {
        accounts: this.accounts,
        chainId: this.chainId
      });

      return {
        isConnected: true,
        address: this.accounts[0]?.address || null,
        chain: chainName,
        walletType: 'walletconnect',
        accounts: this.accounts
      };

    } catch (error) {
      console.error('❌ WalletConnect connection failed:', error);
      throw new Error(`Connection failed: ${error.message}`);
    }
  }

  async disconnect() {
    try {
      if (this.session) {
        await this.provider.disconnect({
          topic: this.session.topic,
          reason: {
            code: 6000,
            message: 'User disconnected',
          },
        });
      }

      this.session = null;
      this.accounts = [];
      this.chainId = null;

      console.log('✅ WalletConnect disconnected');
    } catch (error) {
      console.error('❌ Disconnect error:', error);
      throw new Error(`Disconnect failed: ${error.message}`);
    }
  }

  async signAndBroadcastTransaction(transaction) {
    try {
      if (!this.session || !this.accounts.length) {
        throw new Error('No active WalletConnect session');
      }

      console.log('📝 Signing transaction via WalletConnect...');

      // Request signature from connected wallet
      const result = await this.provider.request({
        topic: this.session.topic,
        chainId: `cosmos:${this.chainId}`,
        request: {
          method: 'cosmos_signDirect',
          params: {
            signerAddress: this.accounts[0].address,
            signDoc: transaction.signDoc,
          },
        },
      });

      console.log('✅ Transaction signed:', result);

      // Broadcast the signed transaction to the network
      const broadcastResult = await this.broadcastTransaction(result, transaction);

      return {
        success: true,
        transactionHash: broadcastResult.transactionHash,
        signature: result.signature,
        gasUsed: broadcastResult.gasUsed || 'unknown',
        fee: broadcastResult.fee || { amount: 'unknown', denom: 'utia' }
      };

    } catch (error) {
      console.error('❌ Transaction signing failed:', error);
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }

  async broadcastTransaction(signedTx, transaction) {
    try {
      console.log('📡 Broadcasting transaction to network...');

      // Get network configuration
      const network = this.chainId === 'mocha-4' ? CELESTIA_NETWORKS.MOCHA_TESTNET : CELESTIA_NETWORKS.MAINNET;

      // In a real implementation, you would:
      // 1. Encode the signed transaction properly
      // 2. Send it to the network's RPC endpoint
      // 3. Handle the response and extract transaction hash

      // For now, we'll simulate the broadcast
      // TO IMPLEMENT REAL BROADCASTING:
      // - Use @cosmjs/stargate to broadcast to Cosmos RPC
      // - Handle network responses and errors
      // - Parse transaction hash from response

      console.log('⚠️ Simulating transaction broadcast (not yet implemented)');

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Return mock result for now
      return {
        transactionHash: 'WC_' + Math.random().toString(36).substring(2, 15).toUpperCase(),
        gasUsed: '180000',
        fee: {
          amount: '5000',
          denom: 'utia'
        }
      };

    } catch (error) {
      console.error('❌ Transaction broadcast failed:', error);
      throw new Error(`Broadcast failed: ${error.message}`);
    }
  }

  isConnected() {
    return this.session !== null && this.accounts.length > 0;
  }

  getAccounts() {
    return this.accounts;
  }

  getCurrentAddress() {
    return this.accounts[0]?.address || null;
  }

  // Helper method for deep linking to popular wallets
  attemptDeepLinking(uri) {
    try {
      console.log('🔗 Attempting deep linking to wallet apps...');
      
      // Common wallet deep link schemes
      const walletSchemes = [
        `keplr://wcV2?uri=${encodeURIComponent(uri)}`, // Keplr Mobile
        `cosmostation://wc?uri=${encodeURIComponent(uri)}`, // Cosmostation
        `leap://wc?uri=${encodeURIComponent(uri)}`, // Leap Wallet
      ];

      // In React Native, you would use Linking.openURL() here
      // For now, we'll just log the available options
      console.log('📱 Available deep links:');
      walletSchemes.forEach((scheme, index) => {
        const walletNames = ['Keplr Mobile', 'Cosmostation', 'Leap Wallet'];
        console.log(`${index + 1}. ${walletNames[index]}: ${scheme}`);
      });
      
      // TODO: Implement actual deep linking with React Native Linking API
      
    } catch (error) {
      console.warn('⚠️ Deep linking failed:', error.message);
    }
  }
}