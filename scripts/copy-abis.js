const fs = require('fs');
const path = require('path');

// Create abis directory if it doesn't exist
const abisDir = path.join(__dirname, '../src/contracts/abis');
if (!fs.existsSync(abisDir)) {
  fs.mkdirSync(abisDir, { recursive: true });
}

// List of contracts to copy ABIs for
const contracts = [
  'PriceOracle',
  'BridgeAdapter', 
  'EtherlinkFusionResolver',
  'EtherlinkFusionFactory',
  'CrossChainRouter'
];

console.log('Copying ABIs to frontend...');

contracts.forEach(contractName => {
  try {
    // Source path in artifacts
    const sourcePath = path.join(__dirname, `../artifacts/src/contracts/${contractName}.sol/${contractName}.json`);
    
    // Destination path in frontend
    const destPath = path.join(__dirname, `../src/contracts/abis/${contractName}.json`);
    
    if (fs.existsSync(sourcePath)) {
      // Read the artifact file
      const artifact = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
      
      // Extract just the ABI
      const abi = artifact.abi;
      
      // Write the ABI to the frontend
      fs.writeFileSync(destPath, JSON.stringify(abi, null, 2));
      
      console.log(`✅ Copied ${contractName}.json`);
    } else {
      console.log(`❌ ${contractName}.json not found in artifacts`);
    }
  } catch (error) {
    console.error(`Error copying ${contractName}:`, error.message);
  }
});

console.log('\nABI copying complete!');
console.log('ABIs are now available in: src/contracts/abis/'); 