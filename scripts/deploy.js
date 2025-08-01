const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Step 1: Deploy PriceOracle
  console.log("\n1. Deploying PriceOracle...");
  const PriceOracle = await ethers.getContractFactory("PriceOracle");
  const priceOracle = await PriceOracle.deploy();
  await priceOracle.deployed();
  console.log("PriceOracle deployed to:", priceOracle.address);

  // Step 2: Deploy BridgeAdapter
  console.log("\n2. Deploying BridgeAdapter...");
  const BridgeAdapter = await ethers.getContractFactory("BridgeAdapter");
  const lzEndpoint = "0x0000000000000000000000000000000000000000"; // Mock LayerZero endpoint
  const bridgeAdapter = await BridgeAdapter.deploy(lzEndpoint);
  await bridgeAdapter.deployed();
  console.log("BridgeAdapter deployed to:", bridgeAdapter.address);

  // Step 3: Deploy EtherlinkFusionResolver Implementation
  console.log("\n3. Deploying EtherlinkFusionResolver Implementation...");
  const EtherlinkFusionResolver = await ethers.getContractFactory("EtherlinkFusionResolver");
  const fusionResolverImpl = await EtherlinkFusionResolver.deploy();
  await fusionResolverImpl.deployed();
  console.log("EtherlinkFusionResolver Implementation deployed to:", fusionResolverImpl.address);

  // Step 4: Deploy EtherlinkFusionFactory
  console.log("\n4. Deploying EtherlinkFusionFactory...");
  const EtherlinkFusionFactory = await ethers.getContractFactory("EtherlinkFusionFactory");
  const fusionFactory = await EtherlinkFusionFactory.deploy(
    fusionResolverImpl.address,  // Implementation
    bridgeAdapter.address,       // BridgeAdapter
    priceOracle.address,         // PriceOracle
    deployer.address             // Fee recipient
  );
  await fusionFactory.deployed();
  console.log("EtherlinkFusionFactory deployed to:", fusionFactory.address);

  // Step 5: Deploy CrossChainRouter
  console.log("\n5. Deploying CrossChainRouter...");
  const CrossChainRouter = await ethers.getContractFactory("CrossChainRouter");
  const crossChainRouter = await CrossChainRouter.deploy(
    fusionResolverImpl.address,  // FusionResolver
    bridgeAdapter.address,       // BridgeAdapter
    priceOracle.address          // PriceOracle
  );
  await crossChainRouter.deployed();
  console.log("CrossChainRouter deployed to:", crossChainRouter.address);

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
  
  // Example route: USDC on Ethereum to USDC on Etherlink
  const routeId = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ["uint256", "uint16", "address", "address"],
      [1, 42793, "0xA0b86a33E6411b4B4F2a88F2Dd62f0C9C93a3a36", "0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9"]
    )
  );
  
  await crossChainRouter.createRoute(
    1,      // srcChainId (Ethereum)
    42793,  // dstChainId (Etherlink)
    "0xA0b86a33E6411b4B4F2a88F2Dd62f0C9C93a3a36", // USDC on Ethereum
    "0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9", // USDC on Etherlink
    "0xA0b86a33E6411b4B4F2a88F2Dd62f0C9C93a3a36", // Bridge token (same as src)
    1000000,  // minAmount (1 USDC)
    1000000000000 // maxAmount (1,000,000 USDC)
  );
  console.log("Route configuration created");

  // Step 9: Save deployment addresses
  const deploymentInfo = {
    network: "etherlinkTestnet",
    chainId: 128123,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      PriceOracle: priceOracle.address,
      BridgeAdapter: bridgeAdapter.address,
      EtherlinkFusionResolverImpl: fusionResolverImpl.address,
      EtherlinkFusionFactory: fusionFactory.address,
      CrossChainRouter: crossChainRouter.address
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
  console.log("PriceOracle:", priceOracle.address);
  console.log("BridgeAdapter:", bridgeAdapter.address);
  console.log("EtherlinkFusionResolverImpl:", fusionResolverImpl.address);
  console.log("EtherlinkFusionFactory:", fusionFactory.address);
  console.log("CrossChainRouter:", crossChainRouter.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 