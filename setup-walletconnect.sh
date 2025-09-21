#!/bin/bash

echo "🚀 Setting up WalletConnect for Celestia Token Sender"
echo "=================================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ Created .env file"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🔧 WalletConnect Setup Steps:"
echo "1. Go to: https://cloud.walletconnect.com/"
echo "2. Sign up or sign in (free account)"
echo "3. Create a new project"
echo "4. Copy your Project ID"
echo "5. Edit the .env file and replace 'your_walletconnect_project_id_here' with your Project ID"
echo ""

# Check current configuration
echo "📋 Current Configuration:"
if [ -f ".env" ]; then
    if grep -q "your_walletconnect_project_id_here" .env; then
        echo "❌ WalletConnect Project ID not configured yet"
        echo "   Please edit .env file and add your Project ID"
    else
        PROJECT_ID=$(grep EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID .env | cut -d '=' -f2)
        if [ ${#PROJECT_ID} -gt 20 ]; then
            echo "✅ WalletConnect Project ID configured: ${PROJECT_ID:0:8}..."
        else
            echo "⚠️  WalletConnect Project ID seems too short"
        fi
    fi
fi

echo ""
echo "🧪 Testing Setup:"
echo "Run: npm start"
echo "Then tap '🔗 Connect Real Wallet' button in the app"
echo ""

echo "📱 Compatible Wallets to test with:"
echo "• Keplr Mobile (iOS/Android)"
echo "• Cosmostation (iOS/Android)"
echo "• Leap Wallet (iOS/Android)"
echo ""

echo "🛡️ Security Notes:"
echo "• Your private keys never leave your wallet app"
echo "• WalletConnect only facilitates secure connections"
echo "• You can disconnect anytime"
echo ""

echo "Need help? Check WALLETCONNECT_SETUP.md for detailed instructions!"