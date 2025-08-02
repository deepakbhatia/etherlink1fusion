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
   
  }, [isEtherlinkMainnet])


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