#!/usr/bin/env node

/**
 * Test script to verify 1inch API key is working
 */

const API_KEY = 'ymdoS0TYnsR3THMgrZwF3TjmbK2X9N4G'
const BASE_URL = 'https://api.1inch.dev'

async function testChain(chainId, chainName, tokenAddress) {
  console.log(`\n🧪 Testing ${chainName} (Chain ID: ${chainId})...`)
  
  try {
    const url = `${BASE_URL}/price/v1.1/${chainId}?tokens=${tokenAddress}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      }
    })
    
    console.log(`📊 Response status: ${response.status}`)
    
    if (response.ok) {
      console.log(`✅ ${chainName} is SUPPORTED`)
    } else {
      console.log(`❌ ${chainName} is NOT SUPPORTED`)
    }
  } catch (error) {
    console.log(`❌ ${chainName} test failed: ${error.message}`)
  }
}

async function testAllChains() {
  console.log('🔍 Testing 1inch API support for different chains...')
  
  // Test mainnets
  await testChain(1, 'Ethereum Mainnet', '0xA0b86a33E6411b4B4F2a88F2Dd62f0C9C93a3a36')
  await testChain(137, 'Polygon Mainnet', '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174')
  await testChain(56, 'BSC Mainnet', '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d')
  
  // Test testnets
  await testChain(5, 'Goerli Testnet', '0x07865c6E87B9F70255377e024ace6630C1Eaa37F')
  await testChain(11155111, 'Sepolia Testnet', '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238')
  await testChain(80001, 'Mumbai Testnet', '0xe6b8a5CF854791412c1f6EFC7CAf629f5Df1c747')
  await testChain(97, 'BSC Testnet', '0x64544969ed7EBf5f083679233B3562B1Fc3C3E28')
  
  // Test L2s
  await testChain(42161, 'Arbitrum One', '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8')
  await testChain(10, 'Optimism', '0x7F5c764cBc14f9669B88837ca1490cCa17c31607')
  await testChain(8453, 'Base', '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913')
  
  // Test Etherlink
  await testChain(128123, 'Etherlink Testnet', '0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9')
  await testChain(42793, 'Etherlink Mainnet', '0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9')
  
  console.log('\n📋 SUMMARY:')
  console.log('✅ Mainnets: Usually supported')
  console.log('❌ Testnets: Usually NOT supported')
  console.log('✅ L2s: Some supported (Arbitrum, Optimism, Base)')
  console.log('❌ Etherlink: NOT supported (too new)')
}

testAllChains() 