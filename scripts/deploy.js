const { ethers } = require("hardhat");
const fs = require('fs');

// Get network from environment variable or command line arguments
const network = process.env.NETWORK || process.argv[2] || 'local';

// Network configurations
const NETWORKS = {
  local: {
    name: 'localhost',
    chainId: 31337,
    lzEndpoint: "0x0000000000000000000000000000000000000000", // Mock for local
    deploymentFile: 'src/contracts/deployments/localhost.json'
  },
  testnet: {
    name: 'etherlinkTestnet',
    chainId: 128123,
    lzEndpoint: "0x0000000000000000000000000000000000000000", // Mock for testnet
    deploymentFile: 'src/contracts/deployments/etherlinkTestnet.json'
  },
  mainnet: {
    name: 'etherlinkMainnet',
    chainId: 42793,
    lzEndpoint: "0x0000000000000000000000000000000000000000", // Mock for mainnet
    deploymentFile: 'src/contracts/deployments/etherlinkMainnet.json'
  }
};

async function main() {
  const config = NETWORKS[network];
  if (!config) {
    console.error(`❌ Invalid network: ${network}`);
    console.log("Available networks: local, testnet, mainnet");
    process.exit(1);
  }

  console.log(`🚀 Deploying to ${config.name} (Chain ID: ${config.chainId})`);
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Step 1: Deploy PriceOracle
  console.log("\n1. Deploying PriceOracle...");
  const PriceOracle = await ethers.getContractFactory("PriceOracle");
  const priceOracle = await PriceOracle.deploy();
  await priceOracle.waitForDeployment();
  console.log("PriceOracle deployed to:", await priceOracle.getAddress());

  // Step 2: Deploy BridgeAdapter
  console.log("\n2. Deploying BridgeAdapter...");
  const BridgeAdapter = await ethers.getContractFactory("BridgeAdapter");
  const bridgeAdapter = await BridgeAdapter.deploy(config.lzEndpoint);
  await bridgeAdapter.waitForDeployment();
  console.log("BridgeAdapter deployed to:", await bridgeAdapter.getAddress());

  // Step 3: Deploy EtherlinkFusionResolver Implementation
  console.log("\n3. Deploying EtherlinkFusionResolver Implementation...");
  const EtherlinkFusionResolver = await ethers.getContractFactory("EtherlinkFusionResolver");
  const fusionResolverImpl = await EtherlinkFusionResolver.deploy();
  await fusionResolverImpl.waitForDeployment();
  console.log("EtherlinkFusionResolver Implementation deployed to:", await fusionResolverImpl.getAddress());

  // Step 4: Deploy EtherlinkFusionFactory
  console.log("\n4. Deploying EtherlinkFusionFactory...");
  const EtherlinkFusionFactory = await ethers.getContractFactory("EtherlinkFusionFactory");
  const fusionFactory = await EtherlinkFusionFactory.deploy(
    await fusionResolverImpl.getAddress(),  // Implementation
    await bridgeAdapter.getAddress(),       // BridgeAdapter
    await priceOracle.getAddress(),         // PriceOracle
    deployer.address                        // Fee recipient
  );
  await fusionFactory.waitForDeployment();
  console.log("EtherlinkFusionFactory deployed to:", await fusionFactory.getAddress());

  // Step 5: Deploy CrossChainRouter
  console.log("\n5. Deploying CrossChainRouter...");
  const CrossChainRouter = await ethers.getContractFactory("CrossChainRouter");
  const crossChainRouter = await CrossChainRouter.deploy(
    await fusionResolverImpl.getAddress(),  // FusionResolver
    await bridgeAdapter.getAddress(),       // BridgeAdapter
    await priceOracle.getAddress()          // PriceOracle
  );
  await crossChainRouter.waitForDeployment();
  console.log("CrossChainRouter deployed to:", await crossChainRouter.getAddress());

  // Step 6: Initialize BridgeAdapter with supported chains
  console.log("\n6. Configuring BridgeAdapter...");
  await bridgeAdapter.setSupportedChain(1, true);      // Ethereum
  await bridgeAdapter.setSupportedChain(42161, true);  // Arbitrum
  await bridgeAdapter.setSupportedChain(10, true);     // Optimism
  await bridgeAdapter.setSupportedChain(42793, true);  // Etherlink
  console.log("BridgeAdapter configured with supported chains");

  // Step 7: Configure CrossChainRouter
  console.log("\n7. Configuring CrossChainRouter...");
  await crossChainRouter.setSupportedChain(1, true);      // Ethereum
  await crossChainRouter.setSupportedChain(42161, true);  // Arbitrum
  await crossChainRouter.setSupportedChain(10, true);     // Optimism
  await crossChainRouter.setSupportedChain(42793, true);  // Etherlink
  console.log("CrossChainRouter configured with supported chains");

  // Step 8: Set up route configurations in CrossChainRouter
  console.log("\n8. Setting up route configurations...");
  
  // Skip route configuration for now due to invalid address checksums
  // In production, use proper token addresses with valid checksums
  console.log("Route configuration skipped - use valid token addresses in production");
  
  // Example of how to set up routes with valid addresses:
  // const usdcEthAddress = "0xA0b86a33E6411b4B4F2a88F2Dd62f0C9C93a3a36"; // Replace with valid address
  // const usdcEtherlinkAddress = "0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9"; // Replace with valid address
  // 
  // await crossChainRouter.createRoute(
  //   1,      // srcChainId (Ethereum)
  //   42793,  // dstChainId (Etherlink)
  //   usdcEthAddress,      // USDC on Ethereum
  //   usdcEtherlinkAddress, // USDC on Etherlink
  //   usdcEthAddress,       // Bridge token (same as src)
  //   1000000,  // minAmount (1 USDC)
  //   1000000000000 // maxAmount (1,000,000 USDC)
  // );

  // Step 9: Save deployment addresses
  const deploymentInfo = {
    network: config.name,
    chainId: config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      PriceOracle: await priceOracle.getAddress(),
      BridgeAdapter: await bridgeAdapter.getAddress(),
      EtherlinkFusionResolverImpl: await fusionResolverImpl.getAddress(),
      EtherlinkFusionFactory: await fusionFactory.getAddress(),
      CrossChainRouter: await crossChainRouter.getAddress()
    }
  };

  console.log("\n=== DEPLOYMENT COMPLETE ===");
  console.log("Deployment Info:", JSON.stringify(deploymentInfo, null, 2));
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = 'src/contracts/deployments';
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  // Save to file
  fs.writeFileSync(config.deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Deployment info saved to ${config.deploymentFile}`);

  console.log("\n=== CONTRACT ADDRESSES ===");
  console.log("PriceOracle:", await priceOracle.getAddress());
  console.log("BridgeAdapter:", await bridgeAdapter.getAddress());
  console.log("EtherlinkFusionResolverImpl:", await fusionResolverImpl.getAddress());
  console.log("EtherlinkFusionFactory:", await fusionFactory.getAddress());
  console.log("CrossChainRouter:", await crossChainRouter.getAddress());
  
  console.log(`\n✅ Successfully deployed to ${config.name}!`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 