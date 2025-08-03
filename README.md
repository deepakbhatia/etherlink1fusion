# Etherlink Fusion+ dApp

**Cross-Chain DeFi Trading with 1inch Fusion+ Integration**

A next-generation decentralized application that combines the power of 1inch Fusion+ protocol with cross-chain bridging capabilities on Etherlink. Experience advanced order types, real-time analytics, and seamless multi-chain trading.

## 🚀 Features

### **Advanced Trading**
- **Dutch Auctions**: Time-decay pricing mechanism for optimal execution
- **Limit Orders**: Traditional limit order functionality
- **Real-time Price Feeds**: Live market data from 1inch Fusion+ APIs
- **Cross-Chain Swaps**: Seamless transfers between multiple blockchains

### **Multi-Chain Support**
- **Etherlink Testnet/Mainnet**: Native chain with deployed smart contracts
- **Ethereum**: Full 1inch Fusion+ integration
- **Arbitrum, Optimism, Base**: Layer 2 scaling solutions
- **Cross-Chain Bridging**: Asset transfers between all supported chains

### **Analytics & Insights**
- **Real-time Trading Data**: Live volume, price charts, and market metrics
- **1inch Fusion+ API Integration**: Aggregated DEX data across mainnets
- **Portfolio Performance**: Comprehensive trading analytics
- **Network-Specific Metrics**: Chain-specific trading insights

### **User Experience**
- **One-Click Wallet Connection**: Multi-chain wallet support
- **Intuitive Interface**: Modern, responsive design
- **Demo Mode**: Interactive learning environment
- **Order Management**: Complete trading order lifecycle

## 🛠️ Technology Stack

### **Frontend**
- **React 18**: Modern UI framework with hooks
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first styling
- **Radix UI**: Accessible component library

### **Blockchain Integration**
- **Wagmi**: React hooks for Ethereum
- **Viem**: TypeScript interface for Ethereum
- **Hardhat**: Development environment and testing
- **Ethers.js**: Ethereum library for smart contracts

### **Smart Contracts**
- **Solidity 0.8.20**: Smart contract development
- **OpenZeppelin**: Secure contract libraries
- **Proxy Pattern**: Upgradeable contract architecture
- **Factory Pattern**: Gas-efficient contract deployment

### **APIs & Data**
- **1inch Fusion+ API**: Real-time price feeds and trading data
- **Cross-Chain Messaging**: LayerZero integration (mocked)
- **Price Oracle**: On-chain price verification
- **Bridge Adapter**: Cross-chain asset transfers

### **Development Tools**
- **Node.js**: Runtime environment
- **pnpm**: Fast package manager
- **ESLint**: Code quality and consistency
- **TypeScript**: Static type checking

## 📊 Analytics Integration

The analytics dashboard leverages **1inch Fusion+ APIs** to provide real-time data across mainnet networks:

- **Price Feeds**: Live token prices from aggregated DEX data
- **Trading Volume**: 24-hour volume metrics from multiple sources
- **Market Data**: Token metadata, symbols, and market caps
- **Cross-Chain Metrics**: Network-specific trading insights

## 🔗 Deployed Contracts

### **Etherlink Testnet**
```
Network: Etherlink Testnet (Chain ID: 128123)
RPC: https://node.ghostnet.etherlink.com
Explorer: https://testnet.explorer.etherlink.com

Smart Contracts:
├── PriceOracle: 0xaFf493AaA8989509dC82b11315d7E2d08b1B4F9F
├── BridgeAdapter: 0xfcd72FD2C49a91a6aC94935a221E23E246DE2723
├── EtherlinkFusionResolver: 0x0e48a6439Ed91398DeEF51171CA505B5950F89F4
├── EtherlinkFusionFactory: 0x3A6d7F2911776A985B0A09e33e8FB6dd93d74430
└── CrossChainRouter: 0x3115Ff33a21a5F99f8eeAC6E52e2d3e3Bc49dC87

Mock Tokens:
├── Mock USDT: 0xb8fB2E8738e60d9CDb53117aC5ac3B6d3313D4c2
├── Mock WETH: [To be deployed]
├── Mock USDC: [To be deployed]
└── Mock WBTC: [To be deployed]
```

### **Supported Networks**
- **Etherlink Testnet**: 128123 (Primary development network)
- **Etherlink Mainnet**: 42793 (Production network)
- **Ethereum**: 1 (1inch Fusion+ integration)
- **Arbitrum**: 42161 (Layer 2 scaling)
- **Optimism**: 10 (Layer 2 scaling)
- **Base**: 8453 (Layer 2 scaling)

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ 
- MetaMask or compatible wallet
- Etherlink testnet tokens (for testing)
- 1inch API key (optional, for enhanced price feeds)

### **Installation**
```bash
# Clone the repository
git clone <repository-url>
cd etherlink-fusion-dapp

# Install dependencies
npm install
```

### **Environment Configuration**

Create a `.env` file in the root directory with the following variables:

```bash
# Required: Private key for contract deployment
PRIVATE_KEY=your_private_key_here

# Required: Network for deployment (testnet/mainnet)
NETWORK=testnet

# Optional: 1inch API key for enhanced price feeds
VITE_1INCH_DATA_API_KEY=your_1inch_api_key_here
```

**Important Notes:**
- **PRIVATE_KEY**: Your wallet's private key for deploying contracts (keep secure!)
- **NETWORK**: Set to `testnet` for development, `mainnet` for production
- **VITE_1INCH_DATA_API_KEY**: Optional API key for real-time price data from 1inch

**Security Warning:** Never commit your `.env` file to version control. It's already included in `.gitignore`.

### **Testing**
```bash
# Start development server
npm run dev

# Test smart contracts
npm run test

# Deploy to testnet
npm run deploy:testnet

# Verify contracts
npm run verify-contracts
```

## 🎯 Key Features Demo

### **1. Dutch Auction Trading**
- Create time-decay orders with automatic price reduction
- Real-time countdown timers and price updates
- Optimal execution for large orders

### **2. Cross-Chain Bridging**
- Seamless asset transfers between chains
- Optimized routing and fee calculation
- Real-time transaction status updates

### **3. Advanced Analytics**
- Live trading volume and market data
- Network-specific performance metrics
- Portfolio tracking and performance analysis

### **4. Multi-Chain Support**
- Single wallet connection for all chains
- Network-aware token selection
- Chain-specific price feeds and data

## 🔧 Development

### **Smart Contract Architecture**
- **Factory Pattern**: Gas-efficient user-specific resolver deployment
- **Proxy Pattern**: Upgradeable contract infrastructure
- **Modular Design**: Separated concerns for price feeds, bridging, and trading

### **Frontend Architecture**
- **Context API**: Shared state management
- **Custom Hooks**: Reusable blockchain interactions
- **Responsive Design**: Mobile-first approach
- **Type Safety**: Full TypeScript coverage

## 📈 Roadmap

- [ ] **Mainnet Deployment**: Production-ready contracts
- [ ] **Additional Tokens**: More mock token deployments
- [ ] **Enhanced Analytics**: Advanced trading metrics

## 📄 License

This project is licensed under the MIT License.

---
