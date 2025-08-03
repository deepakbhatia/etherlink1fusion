import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { SUPPORTED_CHAINS } from '../lib/1inch-price-api'

export interface CrossChainPrice {
  etherlinkPrice: number
  mainnetPrice: number
  bridgeRate: number
  source: 'cross-chain' | 'mock'
}

export interface TokenMapping {
  etherlinkAddress: string
  mainnetAddress: string
  symbol: string
}

// Token mappings for Etherlink mainnet
const ETHERLINK_TOKEN_MAPPINGS: TokenMapping[] = [
  {
    etherlinkAddress: '0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9', // USDC on Etherlink
    mainnetAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC on Ethereum
    symbol: 'USDC'
  },
  {
    etherlinkAddress: '0x4B6C6E6C6C6C6C6C6C6C6C6C6C6C6C6C6C6C6C6C', // WETH on Etherlink (example)
    mainnetAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH on Ethereum
    symbol: 'WETH'
  },
  {
    etherlinkAddress: '0x3C6C6C6C6C6C6C6C6C6C6C6C6C6C6C6C6C6C6C6C', // WBTC on Etherlink (example)
    mainnetAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC on Ethereum
    symbol: 'WBTC'
  }
]

export function useCrossChainPrices() {
  const { chainId } = useAccount()
  const [prices, setPrices] = useState<Record<string, CrossChainPrice>>({})
  const [loading, setLoading] = useState(false)

  // Check if we're on Etherlink mainnet
  const isEtherlinkMainnet = chainId === 42793

  useEffect(() => {
    if (!isEtherlinkMainnet) {
      // Not on Etherlink mainnet, use mock prices
      const mockPrices: Record<string, CrossChainPrice> = {}
      ETHERLINK_TOKEN_MAPPINGS.forEach(token => {
        mockPrices[token.etherlinkAddress] = {
          etherlinkPrice: 1.00, // Mock price
          mainnetPrice: 1.00,
          bridgeRate: 1.00,
          source: 'mock'
        }
      })
      setPrices(mockPrices)
      return
    }

    // On Etherlink mainnet - fetch cross-chain prices
    setLoading(true)
    fetchCrossChainPrices()
  }, [isEtherlinkMainnet])

  const fetchCrossChainPrices = async () => {
    try {
      const crossChainPrices: Record<string, CrossChainPrice> = {}

      for (const tokenMapping of ETHERLINK_TOKEN_MAPPINGS) {
        try {
          // Step 1: Get mainnet price from 1inch API
          const mainnetPrice = await fetch1inchPrice(tokenMapping.mainnetAddress)
          
          // Step 2: Get bridge exchange rate (simulated for demo)
          const bridgeRate = await getBridgeRate(tokenMapping.mainnetAddress, tokenMapping.etherlinkAddress)
          
          // Step 3: Calculate Etherlink price
          const etherlinkPrice = mainnetPrice * bridgeRate

          crossChainPrices[tokenMapping.etherlinkAddress] = {
            etherlinkPrice,
            mainnetPrice,
            bridgeRate,
            source: 'cross-chain'
          }

          console.log(`✅ Cross-chain price for ${tokenMapping.symbol}:`, {
            mainnetPrice: `$${mainnetPrice}`,
            bridgeRate: bridgeRate.toFixed(4),
            etherlinkPrice: `$${etherlinkPrice}`
          })

        } catch (error) {
          console.error(`❌ Failed to fetch cross-chain price for ${tokenMapping.symbol}:`, error)
          
          // Fallback to mock price
          crossChainPrices[tokenMapping.etherlinkAddress] = {
            etherlinkPrice: 1.00,
            mainnetPrice: 1.00,
            bridgeRate: 1.00,
            source: 'mock'
          }
        }
      }

      setPrices(crossChainPrices)
    } catch (error) {
      console.error('❌ Failed to fetch cross-chain prices:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch mainnet price from 1inch API
  const fetch1inchPrice = async (mainnetTokenAddress: string): Promise<number> => {
    const API_KEY = import.meta.env.VITE_1INCH_DATA_API_KEY || 'demo-key'
    const url = `https://api.1inch.dev/price/v1.1/1?tokens=${mainnetTokenAddress}`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`1inch API failed: ${response.status}`)
    }

    const data = await response.json()
    const tokenData = data[mainnetTokenAddress.toLowerCase()]
    
    if (!tokenData || !tokenData.price) {
      throw new Error('No price data from 1inch API')
    }

    return tokenData.price
  }

  // Get bridge exchange rate (simulated for demo)
  const getBridgeRate = async (mainnetToken: string, etherlinkToken: string): Promise<number> => {
    // In a real implementation, this would query the bridge contract
    // For demo purposes, we'll simulate a realistic exchange rate
    
    // Simulate slight price differences due to bridge liquidity
    const baseRate = 1.0
    const variation = 0.001 // 0.1% variation
    const randomVariation = (Math.random() - 0.5) * variation
    
    return baseRate + randomVariation
  }

  const getPrice = (tokenAddress: string): CrossChainPrice | null => {
    return prices[tokenAddress] || null
  }

  return {
    prices,
    loading,
    getPrice,
    isEtherlinkMainnet
  }
} 