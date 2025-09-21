import AsyncStorage from '@react-native-async-storage/async-storage';
import { CELESTIA_NETWORKS } from '../config/networks.js';
import { WalletConnectService } from './WalletConnectService.js';

export class MobileWalletService {
  constructor() {
    this.walletInfo = {
      isConnected: false,
      address: null,
      chain: null,
      walletType: null,
      balance: null
    };
    
    this.STORAGE_KEYS = {
      WALLET_INFO: '@celestia_wallet_info',
      DEMO_ADDRESS: '@celestia_demo_address',
    };

    // Initialize WalletConnect service for real wallet connections
    this.walletConnectService = new WalletConnectService();
  }

  async connectWallet(chainName = 'mocha', walletType = 'walletconnect') {
    try {
      console.log(`🔗 MobileWalletService.connectWallet called with: ${chainName}, ${walletType}`);
      
      if (walletType === 'demo') {
        console.log('📱 Connecting demo wallet...');
        const result = await this.connectDemoWallet(chainName);
        console.log('✅ Demo wallet connection successful:', result);
        return result;
      } else if (walletType === 'walletconnect') {
        console.log('🔗 Connecting real wallet...');
        const result = await this.connectRealWallet(chainName);
        console.log('✅ Real wallet connection successful:', result);
        return result;
      } else {
        throw new Error(`Unsupported wallet type: ${walletType}`);
      }
    } catch (error) {
      console.error('❌ MobileWalletService.connectWallet error:', error);
      console.error('❌ Full error stack:', error.stack);
      throw error;
    }
  }

  async connectRealWallet(chainName) {
    try {
      console.log('🔗 Connecting to real wallet via WalletConnect...');
      
      // Connect using WalletConnect
      const connectionResult = await this.walletConnectService.connect(chainName);
      
      // Fetch real balance
      let balance;
      try {
        balance = await this.fetchRealBalance(connectionResult.address, chainName);
      } catch (balanceError) {
        console.warn('⚠️ Failed to fetch balance:', balanceError.message);
        balance = { amount: '0.000000', denom: 'TIA' };
      }

      const walletInfo = {
        ...connectionResult,
        balance: balance
      };

      this.walletInfo = walletInfo;
      await this.saveWalletInfo(walletInfo);
      
      console.log('✅ Real wallet connected:', walletInfo);
      return walletInfo;
      
    } catch (error) {
      throw new Error(`Real wallet connection failed: ${error.message}`);
    }
  }

  async connectDemoWallet(chainName) {
    try {
      console.log(`🎯 connectDemoWallet called with chainName: ${chainName}`);
      
      // Use a valid Celestia address for demo
      const demoAddress = 'celestia16e3rskkaa8l7p92uny3pqh2c96mlkhq524aksf';
      
      console.log('🔗 Setting up demo wallet...');
      
      // For demo purposes, use a fixed balance instead of fetching from network
      // This ensures the demo works even without network connectivity
      const realBalance = {
        amount: '1.000000',
        denom: chainName === 'mocha' ? 'TIA' : 'TIA'
      };
      console.log('� Using demo balance:', realBalance);
      
      const walletInfo = {
        isConnected: true,
        address: demoAddress,
        chain: chainName,
        walletType: 'demo',
        balance: realBalance
      };

      console.log('💾 Setting wallet info:', walletInfo);
      this.walletInfo = walletInfo;
      
      console.log('💾 Saving wallet info to storage...');
      try {
        await this.saveWalletInfo(walletInfo);
        console.log('✅ Wallet info saved to storage');
      } catch (storageError) {
        console.warn('⚠️ Failed to save to storage (non-critical):', storageError.message);
        // Don't fail the connection if storage fails
      }
      
      console.log('✅ Demo wallet setup complete:', walletInfo);
      return walletInfo;
    } catch (error) {
      console.error('❌ connectDemoWallet error:', error);
      console.error('❌ Full error stack:', error.stack);
      throw new Error(`Demo wallet connection failed: ${error.message}`);
    }
  }

  async fetchRealBalance(address, chainName) {
    try {
      // Get network config
      const network = chainName === 'mocha' ? CELESTIA_NETWORKS.MOCHA_TESTNET : CELESTIA_NETWORKS.MAINNET;
      
      if (!network) {
        throw new Error(`Unsupported network: ${chainName}`);
      }

      console.log(`🌐 Fetching balance from ${network.name} for ${address}`);
      
      // Query balance using Cosmos REST API
      const balanceUrl = `${network.rest}/cosmos/bank/v1beta1/balances/${address}`;
      
      const response = await fetch(balanceUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        timeout: 10000 // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 Balance data:', data);

      // Find TIA balance (utia denomination)
      const tiaBalance = data.balances?.find(balance => balance.denom === network.currency.baseDenom);
      
      if (tiaBalance) {
        // Convert from base denomination to human-readable format
        const amount = (parseFloat(tiaBalance.amount) / network.currency.baseMultiplier).toFixed(6);
        return {
          amount: amount,
          denom: network.currency.symbol,
          raw: tiaBalance.amount,
          baseDenom: tiaBalance.denom
        };
      } else {
        // No balance found, return zero
        return {
          amount: '0.000000',
          denom: network.currency.symbol,
          raw: '0',
          baseDenom: network.currency.baseDenom
        };
      }
    } catch (error) {
      console.error('💥 Balance fetch error:', error);
      throw new Error(`Failed to fetch balance: ${error.message}`);
    }
  }

  // Real wallet connection methods
  async connectKeplrMobile(chainName) {
    try {
      // This would require Keplr Mobile app to be installed
      // and would use deep linking to connect
      console.log('🔗 Attempting Keplr Mobile connection...');
      
      // For now, this is a placeholder - real implementation would need:
      // 1. Deep link to Keplr Mobile app
      // 2. Handle response with connected account
      // 3. Store connection details
      
      throw new Error('Keplr Mobile integration not yet implemented. Install Keplr Mobile and implement deep linking.');
    } catch (error) {
      throw new Error(`Keplr connection failed: ${error.message}`);
    }
  }

  async connectWalletConnect(chainName) {
    try {
      // This would use WalletConnect to connect to various mobile wallets
      console.log('🔗 Attempting WalletConnect connection...');
      
      // Real implementation would need:
      // 1. Initialize WalletConnect client
      // 2. Show QR code or deep link
      // 3. Handle wallet approval
      // 4. Store session
      
      throw new Error('WalletConnect integration not yet implemented. Requires WalletConnect setup.');
    } catch (error) {
      throw new Error(`WalletConnect connection failed: ${error.message}`);
    }
  }

  async importPrivateKey(privateKey, chainName) {
    try {
      // WARNING: This is for development only - never use in production
      console.log('⚠️ Importing private key (DEVELOPMENT ONLY)...');
      
      // This would need:
      // 1. Validate private key format
      // 2. Derive address from private key
      // 3. Store securely (encrypted)
      // 4. Set up signing capability
      
      throw new Error('Private key import not implemented. Use secure wallet apps instead.');
    } catch (error) {
      throw new Error(`Private key import failed: ${error.message}`);
    }
  }

  // Real wallet connection methods
  async connectKeplrMobile(chainName) {
    try {
      // This would require Keplr Mobile app to be installed
      // and would use deep linking to connect
      console.log('🔗 Attempting Keplr Mobile connection...');
      
      // For now, this is a placeholder - real implementation would need:
      // 1. Deep link to Keplr Mobile app
      // 2. Handle response with connected account
      // 3. Store connection details
      
      throw new Error('Keplr Mobile integration not yet implemented. Install Keplr Mobile and implement deep linking.');
    } catch (error) {
      throw new Error(`Keplr connection failed: ${error.message}`);
    }
  }

  async connectWalletConnect(chainName) {
    try {
      // This would use WalletConnect to connect to various mobile wallets
      console.log('🔗 Attempting WalletConnect connection...');
      
      // Real implementation would need:
      // 1. Initialize WalletConnect client
      // 2. Show QR code or deep link
      // 3. Handle wallet approval
      // 4. Store session
      
      throw new Error('WalletConnect integration not yet implemented. Requires WalletConnect setup.');
    } catch (error) {
      throw new Error(`WalletConnect connection failed: ${error.message}`);
    }
  }

  async importPrivateKey(privateKey, chainName) {
    try {
      // WARNING: This is for development only - never use in production
      console.log('⚠️ Importing private key (DEVELOPMENT ONLY)...');
      
      // This would need:
      // 1. Validate private key format
      // 2. Derive address from private key
      // 3. Store securely (encrypted)
      // 4. Set up signing capability
      
      throw new Error('Private key import not implemented. Use secure wallet apps instead.');
    } catch (error) {
      throw new Error(`Private key import failed: ${error.message}`);
    }
  }

  async disconnectWallet() {
    try {
      this.walletInfo = {
        isConnected: false,
        address: null,
        chain: null,
        walletType: null,
        balance: null
      };

      await AsyncStorage.removeItem(this.STORAGE_KEYS.WALLET_INFO);
      return true;
    } catch (error) {
      throw new Error(`Failed to disconnect wallet: ${error.message}`);
    }
  }

  async getBalance(address, chainName) {
    try {
      // For demo wallet, return mock balance
      if (this.walletInfo.walletType === 'demo') {
        return {
          amount: '1.000000', // 1 TIA
          denom: 'TIA'
        };
      }

      // TODO: Implement real balance fetching
      throw new Error('Real balance fetching not yet implemented');
    } catch (error) {
      console.error('Balance fetch error:', error);
      return {
        amount: '0',
        denom: 'TIA'
      };
    }
  }

  async sendTokens(toAddress, amount, denom, memo = '') {
    try {
      console.log('🚀 MobileWalletService.sendTokens called with:', {
        toAddress,
        amount,
        denom,
        memo,
        walletConnected: this.walletInfo.isConnected,
        walletType: this.walletInfo.walletType,
        walletAddress: this.walletInfo.address
      });

      if (!this.walletInfo.isConnected) {
        throw new Error('Wallet not connected');
      }

      // For demo wallet, simulate transaction
      if (this.walletInfo.walletType === 'demo') {
        console.log('📝 Executing demo transaction...');
        return await this.simulateTransaction(toAddress, amount, denom, memo);
      }

      // For real wallets, use WalletConnect to sign and broadcast
      if (this.walletInfo.walletType === 'walletconnect') {
        console.log('📝 Executing real WalletConnect transaction...');
        return await this.executeRealTransaction(toAddress, amount, denom, memo);
      }

      throw new Error('Unsupported wallet type for transactions');
    } catch (error) {
      console.error('❌ MobileWalletService.sendTokens error:', error);
      throw error;
    }
  }

  async executeRealTransaction(toAddress, amount, denom, memo) {
    try {
      console.log('🚀 Executing real transaction via WalletConnect...', {
        to: toAddress,
        amount,
        denom,
        from: this.walletInfo.address
      });

      // Validate inputs
      if (!toAddress || !amount || !denom) {
        throw new Error('Missing required transaction parameters');
      }

      // Get network configuration
      const network = this.walletInfo.chain === 'mocha' 
        ? CELESTIA_NETWORKS.MOCHA_TESTNET 
        : CELESTIA_NETWORKS.MAINNET;

      // Convert amount to base denomination (utia)
      const amountInBaseUnits = Math.floor(parseFloat(amount) * network.currency.baseMultiplier).toString();

      // Create transaction object for signing
      const transaction = await this.createTransaction(
        this.walletInfo.address,
        toAddress,
        amountInBaseUnits,
        network.currency.baseDenom,
        memo,
        network
      );

      // Use WalletConnect service to sign and broadcast
      const result = await this.walletConnectService.signAndBroadcastTransaction(transaction);

      // Return standardized result
      return {
        success: true,
        transactionHash: result.transactionHash,
        from: this.walletInfo.address,
        to: toAddress,
        amount: amount,
        denom: denom,
        memo: memo,
        timestamp: new Date().toISOString(),
        gasUsed: result.gasUsed || 'unknown',
        fee: result.fee || { amount: 'unknown', denom: network.currency.baseDenom }
      };

    } catch (error) {
      console.error('❌ Real transaction execution failed:', error);
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }

  async createTransaction(fromAddress, toAddress, amount, denom, memo, network) {
    try {
      // This is a simplified transaction structure
      // In a real implementation, you would need to:
      // 1. Fetch account info (sequence, account number)
      // 2. Calculate proper gas and fees
      // 3. Create proper Cosmos transaction structure

      console.log('📝 Creating transaction structure...');

      // Basic transaction structure for Cosmos-based chains
      const signDoc = {
        chain_id: network.chainId,
        account_number: "0", // Should fetch from network
        sequence: "0", // Should fetch from network
        fee: {
          amount: [{ denom: denom, amount: "5000" }], // Basic fee
          gas: "200000" // Basic gas limit
        },
        msgs: [{
          type: "cosmos-sdk/MsgSend",
          value: {
            from_address: fromAddress,
            to_address: toAddress,
            amount: [{ denom: denom, amount: amount }]
          }
        }],
        memo: memo
      };

      return {
        signDoc: signDoc,
        fromAddress: fromAddress,
        toAddress: toAddress,
        amount: amount,
      };

    } catch (error) {
      console.error('❌ Transaction creation failed:', error);
      throw new Error(`Failed to create transaction: ${error.message}`);
    }
  }

  async simulateTransaction(toAddress, amount, denom, memo) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      success: true,
      transactionHash: 'DEMO-' + Math.random().toString(36).substring(2, 15),
      from: this.walletInfo.address,
      to: toAddress,
      amount: amount,
      denom: denom,
      memo: memo,
      timestamp: new Date().toISOString(),
      blockHeight: Math.floor(Math.random() * 1000000),
      gasUsed: '100000',
      fee: {
        amount: '1000',
        denom: 'utia'
      }
    };
  }

  async switchChain(chainName) {
    try {
      if (!this.walletInfo.isConnected) {
        throw new Error('Wallet not connected');
      }

      // For demo wallet, just update the chain
      if (this.walletInfo.walletType === 'demo') {
        this.walletInfo.chain = chainName;
        this.walletInfo.balance = {
          amount: '1.000000',
          denom: 'TIA'
        };

        await this.saveWalletInfo(this.walletInfo);
        return this.walletInfo;
      }

      // TODO: Implement real chain switching
      throw new Error('Real chain switching not yet implemented');
    } catch (error) {
      console.error('Chain switch error:', error);
      throw error;
    }
  }

  getWalletInfo() {
    return this.walletInfo;
  }

  isWalletConnected() {
    return this.walletInfo.isConnected;
  }

  async saveWalletInfo(walletInfo) {
    try {
      console.log('💾 Attempting to save wallet info:', walletInfo);
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.WALLET_INFO,
        JSON.stringify(walletInfo)
      );
      console.log('✅ Wallet info saved successfully');
    } catch (error) {
      console.error('❌ Failed to save wallet info:', error);
      // Don't throw error - saving to storage is not critical for functionality
      console.warn('⚠️ Storage save failed but continuing...');
    }
  }

  async loadWalletInfo() {
    try {
      const storedInfo = await AsyncStorage.getItem(this.STORAGE_KEYS.WALLET_INFO);
      if (storedInfo) {
        this.walletInfo = JSON.parse(storedInfo);
        return this.walletInfo;
      }
      return null;
    } catch (error) {
      console.error('Failed to load wallet info:', error);
      return null;
    }
  }

  async checkStoredConnection() {
    try {
      const storedInfo = await this.loadWalletInfo();
      if (storedInfo && storedInfo.isConnected) {
        // Verify connection is still valid
        if (storedInfo.walletType === 'demo') {
          return storedInfo;
        }

        // TODO: For real wallets, verify connection is still active
        await this.disconnectWallet();
      }
      return null;
    } catch (error) {
      console.error('Check stored connection error:', error);
      return null;
    }
  }
}