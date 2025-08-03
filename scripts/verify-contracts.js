const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Verifying contract deployments on Etherlink Testnet...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Checking from account:", deployer.address);

  // Contract addresses from deployment file
  const priceOracleAddress = "0xaFf493AaA8989509dC82b11315d7E2d08b1B4F9F";
  const bridgeAdapterAddress = "0xfcd72FD2C49a91a6aC94935a221E23E246DE2723";
  const fusionResolverImplAddress = "0x0e48a6439Ed91398DeEF51171CA505B5950F89F4";
  const fusionFactoryAddress = "0x3A6d7F2911776A985B0A09e33e8FB6dd93d74430";
  const crossChainRouterAddress = "0x3115Ff33a21a5F99f8eeAC6E52e2d3e3Bc49dC87";

  console.log("\n📋 Contract Addresses to Verify:");
  console.log("PriceOracle:", priceOracleAddress);
  console.log("BridgeAdapter:", bridgeAdapterAddress);
  console.log("EtherlinkFusionResolverImpl:", fusionResolverImplAddress);
  console.log("EtherlinkFusionFactory:", fusionFactoryAddress);
  console.log("CrossChainRouter:", crossChainRouterAddress);

  try {
    // Check if addresses have code (are contracts)
    console.log("\n🔍 Checking if addresses are contracts...");
    
    const provider = deployer.provider;
    
    // Check PriceOracle
    console.log("\n1. Verifying PriceOracle...");
    const priceOracleCode = await provider.getCode(priceOracleAddress);
    if (priceOracleCode !== "0x") {
      console.log("✅ PriceOracle has code (is a contract)");
      // Try to get price (basic method test)
      try {
        const PriceOracle = await ethers.getContractFactory("PriceOracle");
        const priceOracle = PriceOracle.attach(priceOracleAddress);
        const price = await priceOracle.getPrice("0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9"); // USDC
        console.log("✅ PriceOracle.getPrice() method works, price:", ethers.formatEther(price));
      } catch (error) {
        console.log("❌ PriceOracle.getPrice() failed:", error.message);
      }
    } else {
      console.log("❌ PriceOracle has no code (not deployed)");
    }

    // Check BridgeAdapter
    console.log("\n2. Verifying BridgeAdapter...");
    const bridgeAdapterCode = await provider.getCode(bridgeAdapterAddress);
    if (bridgeAdapterCode !== "0x") {
      console.log("✅ BridgeAdapter has code (is a contract)");
      // Try to check supported chain (basic method test)
      try {
        const BridgeAdapter = await ethers.getContractFactory("BridgeAdapter");
        const bridgeAdapter = BridgeAdapter.attach(bridgeAdapterAddress);
        const isSupported = await bridgeAdapter.isChainSupported(1); // Ethereum
        console.log("✅ BridgeAdapter.isChainSupported() method works, Ethereum supported:", isSupported);
      } catch (error) {
        console.log("❌ BridgeAdapter.isChainSupported() failed:", error.message);
      }
    } else {
      console.log("❌ BridgeAdapter has no code (not deployed)");
    }

    // Check EtherlinkFusionResolverImpl
    console.log("\n3. Verifying EtherlinkFusionResolverImpl...");
    const fusionResolverCode = await provider.getCode(fusionResolverImplAddress);
    if (fusionResolverCode !== "0x") {
      console.log("✅ EtherlinkFusionResolverImpl has code (is a contract)");
      // Try to check owner (basic method test)
      try {
        const EtherlinkFusionResolver = await ethers.getContractFactory("EtherlinkFusionResolver");
        const fusionResolver = EtherlinkFusionResolver.attach(fusionResolverImplAddress);
        const owner = await fusionResolver.owner();
        console.log("✅ EtherlinkFusionResolver.owner() method works, owner:", owner);
      } catch (error) {
        console.log("❌ EtherlinkFusionResolver.owner() failed:", error.message);
      }
    } else {
      console.log("❌ EtherlinkFusionResolverImpl has no code (not deployed)");
    }

    // Check EtherlinkFusionFactory
    console.log("\n4. Verifying EtherlinkFusionFactory...");
    const fusionFactoryCode = await provider.getCode(fusionFactoryAddress);
    if (fusionFactoryCode !== "0x") {
      console.log("✅ EtherlinkFusionFactory has code (is a contract)");
      // Try to get implementation (basic method test)
      try {
        const EtherlinkFusionFactory = await ethers.getContractFactory("EtherlinkFusionFactory");
        const fusionFactory = EtherlinkFusionFactory.attach(fusionFactoryAddress);
        const implementation = await fusionFactory.implementation();
        console.log("✅ EtherlinkFusionFactory.implementation() method works, implementation:", implementation);
      } catch (error) {
        console.log("❌ EtherlinkFusionFactory.implementation() failed:", error.message);
      }
    } else {
      console.log("❌ EtherlinkFusionFactory has no code (not deployed)");
    }

    // Check CrossChainRouter
    console.log("\n5. Verifying CrossChainRouter...");
    const crossChainRouterCode = await provider.getCode(crossChainRouterAddress);
    if (crossChainRouterCode !== "0x") {
      console.log("✅ CrossChainRouter has code (is a contract)");
      // Try to check supported chain (basic method test)
      try {
        const CrossChainRouter = await ethers.getContractFactory("CrossChainRouter");
        const crossChainRouter = CrossChainRouter.attach(crossChainRouterAddress);
        const isSupported = await crossChainRouter.isChainSupported(1); // Ethereum
        console.log("✅ CrossChainRouter.isChainSupported() method works, Ethereum supported:", isSupported);
      } catch (error) {
        console.log("❌ CrossChainRouter.isChainSupported() failed:", error.message);
      }
    } else {
      console.log("❌ CrossChainRouter has no code (not deployed)");
    }

    console.log("\n🎉 Contract verification complete!");

  } catch (error) {
    console.error("❌ Error verifying contracts:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification script failed:", error);
    process.exit(1);
  }); 