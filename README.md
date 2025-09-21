# Celestia Transaction Mobile

A React Native mobile application for sending Celestia tokens using natural language with an AI-powered chatbot assistant.

## Features

- 🤖 **AI-Powered Chat Interface**: Natural language processing for transaction instructions
- 🌟 **Celestia Blockchain Integration**: Send TIA tokens on Celestia mainnet and Mocha testnet  
- 📱 **Mobile-First Design**: Optimized for iOS and Android devices
- 🔐 **Wallet Integration**: Demo wallet connectivity (ready for real wallet integration)
- 🌐 **Multi-Network Support**: Supports both Celestia mainnet and Mocha testnet
- ⚡ **Real-time Chat**: Interactive chatbot for transaction guidance

## Technology Stack

- **React Native** with Expo
- **CosmJS** for Cosmos blockchain interactions
- **Axios** for HTTP requests
- **AsyncStorage** for local data persistence
- **React Native components** for mobile UI
- **DeepSeek AI** for natural language processing (optional)

## Migration from Web

This app is migrated from a React web application to React Native. Key changes include:

### Components Migration
- ✅ `App.jsx` → `App.js` (React Native components)
- ✅ `ChatInterface.jsx` → `ChatInterface.js` (FlatList, TextInput, TouchableOpacity)
- ✅ CSS styles → StyleSheet API

### Services Migration  
- ✅ `KeplrWalletService` → `MobileWalletService` (adapted for mobile wallets)
- ✅ `DeepSeekService` → React Native compatible (environment variables)
- ✅ `TokenInstructionParser` → No changes needed
- ✅ Network configurations → Maintained same structure

### Dependencies Migration
- ✅ **CosmJS libraries**: Compatible with React Native
- ✅ **Axios**: Works in React Native
- ✅ **bech32**: Address validation library  
- ✅ **WalletConnect**: For mobile wallet connectivity
- ✅ **AsyncStorage**: Replaces localStorage

## Installation

1. **Prerequisites**
   ```bash
   npm install -g @expo/cli
   ```

2. **Install dependencies**
   ```bash
   cd CelestiaTransactionMobile
   npm install
   ```

3. **Environment setup** (optional)
   ```bash
   cp .env.example .env
   # Add your API keys to .env
   ```

4. **Start development server**
   ```bash
   npm start
   ```

## Usage

### Development

1. **Start Expo server**
   ```bash
   npm start
   ```

2. **Run on device/simulator**
   - Scan QR code with Expo Go app (Android/iOS)
   - Press `a` for Android emulator
   - Press `i` for iOS simulator  
   - Press `w` for web version

### Demo Wallet Connection

The app includes a demo wallet for testing:

1. Tap "Conectar Demo Wallet"
2. Demo address will be stored locally
3. You can now test transaction parsing and UI flow

**Note**: Real transactions require integration with actual mobile wallets (Keplr Mobile, Trust Wallet, etc.)

## Chat Commands Examples

The AI chatbot understands natural language for transactions:

- "Envía 5 TIA a celestia1qnk2n4nlkpw9xfqntladh74w6ujtulwnmxnh3k"
- "Send 0.1 TIA to celestia1abc..."
- "Manda 2 mocha tokens a celestia1xyz..."
- "Transfer 10 TIA to celestia1..."

## Configuration

### Environment Variables

Create a `.env` file with:

```env
# Optional: DeepSeek AI API key for enhanced parsing
EXPO_PUBLIC_DEEPSEEK_API_KEY=your_api_key_here

# Optional: WalletConnect project ID  
EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### Network Configuration

Networks are configured in `src/config/networks.js`:

- **Celestia Mainnet**: Production network
- **Mocha Testnet**: Testing network

## Real Wallet Integration

To integrate with real mobile wallets:

1. **WalletConnect Integration**
   - Configure WalletConnect project ID
   - Implement wallet connection flow
   - Handle signing requests

2. **Direct Wallet SDK**
   - Integrate Keplr Mobile SDK
   - Or other Cosmos wallet mobile SDKs
   
3. **Update MobileWalletService**
   - Replace demo implementation
   - Add real signing capabilities
   - Handle wallet events

## Project Structure

```
CelestiaTransactionMobile/
├── App.js                          # Main app component
├── src/
│   ├── components/
│   │   └── ChatInterface.js        # Chat UI component
│   ├── services/
│   │   ├── MobileWalletService.js  # Wallet connectivity
│   │   ├── DeepSeekService.js      # AI parsing service
│   │   └── ChatbotService.js       # Chat logic
│   ├── utils/
│   │   └── TokenInstructionParser.js # Local parsing
│   └── config/
│       └── networks.js             # Network configurations
├── package.json
└── README.md
```

## Known Limitations

- **Demo Wallet**: Currently uses simulated wallet for demo
- **Transaction Signing**: Requires real wallet integration
- **Network Connectivity**: Some RPC endpoints may have CORS issues
- **AI Dependency**: Enhanced parsing requires API key

## Next Steps

1. **Real Wallet Integration**: Connect to Keplr Mobile or other wallets
2. **Enhanced UI**: Add transaction history, balance charts
3. **Push Notifications**: Transaction confirmations
4. **Biometric Auth**: Add fingerprint/face unlock
5. **QR Code Scanner**: For easy address input

## Testing

The app can be tested using Expo Go:

1. Install Expo Go on your mobile device
2. Scan the QR code from the development server
3. Test the chat interface and demo wallet
4. Try various transaction commands

## Support

For issues or questions:
- Check the console for debugging info
- Verify network connectivity
- Ensure all dependencies are installed
- Test on different devices/simulators

## License

MIT License - feel free to use and modify for your projects.
>>>>>>> d2021ac (feat: create mobile app)
