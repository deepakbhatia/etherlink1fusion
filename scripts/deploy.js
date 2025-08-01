const { ethers } = require("hardhat");

async function main() {
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
  const lzEndpoint = "0x0000000000000000000000000000000000000000"; // Mock LayerZero endpoint
  const bridgeAdapter = await BridgeAdapter.deploy(lzEndpoint);
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
    network: "etherlinkTestnet",
    chainId: 128123,
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
  
  // Save to file
  const fs = require('fs');
  fs.writeFileSync(
    'src/contracts/deployments/etherlinkTestnet.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("Deployment info saved to src/contracts/deployments/etherlinkTestnet.json");

  console.log("\n=== CONTRACT ADDRESSES ===");
  console.log("PriceOracle:", await priceOracle.getAddress());
  console.log("BridgeAdapter:", await bridgeAdapter.getAddress());
  console.log("EtherlinkFusionResolverImpl:", await fusionResolverImpl.getAddress());
  console.log("EtherlinkFusionFactory:", await fusionFactory.getAddress());
  console.log("CrossChainRouter:", await crossChainRouter.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 