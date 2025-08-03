# Etherlink Fusion+ Deployment Guide

## Quick Start

### Prerequisites
- Node.js 18.0.0 or higher
- npm or pnpm
- Hardhat installed
- Private key with testnet XTZ (for testnet deployment)

### Setup
1. Install dependencies: `npm install`
2. Create `.env` file with your private key:
   ```
    # WalletConnect Project ID (optional - will use demo if not provided)
    PRIVATE_KEY=PRIVATE_KEY
    VITE_WALLETCONNECT_PROJECT_ID=
    VITE_1INCH_DATA_API_KEY=ymdoS0TYnsR3THMgrZwF3TjmbK2X9N4G

    # Optional: Custom RPC URLs if needed
    VITE_ETHERLINK_TESTNET_RPC=https://node.ghostnet.etherlink.com
    VITE_ETHERLINK_MAINNET_RPC=https://node.mainnet.etherlink.com
   ```
3. Compile contracts: `npm run compile`
4. Copy ABIs: `npm run copy-abis`

## Deployment Commands

### Local Development
```bash
# Start local Hardhat node
npm run node

# In another terminal, deploy to localhost
npm run deploy:local
```

### Testnet Deployment
```bash
# Deploy to Etherlink Testnet
npm run deploy:testnet
```

### Mainnet Deployment
```bash
# Deploy to Etherlink Mainnet
npm run deploy:mainnet
```

### Manual Deployment
You can also run the deploy script directly with network arguments:

```bash
# Deploy to localhost
npx hardhat run scripts/deploy.js local --network localhost

# Deploy to testnet
npx hardhat run scripts/deploy.js testnet --network etherlinkTestnet

# Deploy to mainnet
npx hardhat run scripts/deploy.js mainnet --network etherlinkMainnet
```

## Network Configurations

| Network | Chain ID | RPC URL | Deployment File |
|---------|----------|---------|-----------------|
| Local | 31337 | http://127.0.0.1:8545 | `localhost.json` |
| Testnet | 128123 | https://node.ghostnet.teztnets.xyz | `etherlinkTestnet.json` |
| Mainnet | 42793 | https://node.etherlink.com | `etherlinkMainnet.json` |

## Deployment Order

1. **PriceOracle** - Price feed contract
2. **BridgeAdapter** - Cross-chain bridge adapter
3. **EtherlinkFusionResolver** - Core trading logic implementation
4. **EtherlinkFusionFactory** - Factory for user-specific resolvers
5. **CrossChainRouter** - Cross-chain routing logic

## Post-Deployment Steps

### 1. Verify Contracts (Optional)
```bash
# Verify on Etherlink Explorer
npx hardhat verify --network etherlinkTestnet CONTRACT_ADDRESS
```

### 2. Set Trusted Remotes
After deployment, you'll need to set trusted remote addresses for cross-chain communication:

```javascript
// Example: Set trusted remote for Ethereum
await bridgeAdapter.setTrustedRemote(
  1, // Ethereum chain ID
  "0x..." // BridgeAdapter address on Ethereum
);
```

### 3. Configure Routes
Set up cross-chain routes in the CrossChainRouter:

```javascript
// Example: Create USDC route from Ethereum to Etherlink
await crossChainRouter.createRoute(
  1,      // srcChainId (Ethereum)
  42793,  // dstChainId (Etherlink)
  "0x...", // USDC on Ethereum
  "0x...", // USDC on Etherlink
  "0x...", // Bridge token
  1000000, // minAmount
  1000000000000 // maxAmount
);
```

### 4. Update Frontend
Update your frontend configuration with the new contract addresses from the deployment JSON files.

## Contract Addresses

After deployment, contract addresses will be saved to:
- `src/contracts/deployments/localhost.json`
- `src/contracts/deployments/etherlinkTestnet.json`
- `src/contracts/deployments/etherlinkMainnet.json`

## Testing

### Run Tests
```bash
npm run test
```

### Test on Local Network
```bash
# Start local node
npm run node

# Deploy contracts
npm run deploy:local

# Run tests
npm run test
```

### To deploy on mainnet, ensure

```bash
    # Put the mainnet private key in .env file
     PRIVATE_KEY=your_mainnet_private_key
```

```javascript
    //In scripts/deploy.js - line 18
    lzEndpoint: "0x0000000000000000000000000000000000000000", // Mock for mainnet

    //In src/lib/web3.ts - add mainnet token addresses
    [etherlinkMainnet.id]: {
     USDC: '0x...', // Real USDC on Etherlink mainnet
     WETH: '0x...', // Real WETH on Etherlink mainnet
     // etc.
    }
```


## Troubleshooting

### Common Issues

1. **"Account balance: 0"**
   - For testnet: Get testnet XTZ from faucet
   - For local: The Hardhat node provides pre-funded accounts

2. **"Cannot connect to network"**
   - Ensure Hardhat node is running for local deployment
   - Check RPC URL configuration in `hardhat.config.js`

3. **"Invalid private key"**
   - Check your `.env` file format
   - Ensure private key starts with `0x`

4. **"Gas estimation failed"**
   - Increase gas limit in `hardhat.config.js`
   - Check if contracts are properly compiled

### Gas Optimization

For mainnet deployment, consider:
- Using `--optimizer` in Hardhat config
- Setting appropriate gas limits
- Testing on testnet first

## Security Considerations

1. **Private Keys**: Never commit `.env` files to git
2. **Verification**: Verify contracts on Etherlink Explorer
3. **Testing**: Always test on testnet before mainnet
4. **Audits**: Consider professional audits for mainnet deployment

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Hardhat documentation
3. Check Etherlink documentation for network-specific issues 