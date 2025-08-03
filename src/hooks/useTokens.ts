import { useState, useEffect } from 'react'
import { usePrices } from './usePrices'
import { usePriceOracle } from './usePriceOracle'
import { useCrossChainPrices } from './useCrossChainPrices'
import { useAccount } from 'wagmi'
import { SUPPORTED_CHAINS } from '../lib/1inch-price-api'

export interface Token {
  symbol: string
  name: string
  address: string
  decimals: number
  price: number
  logo?: string
}

const mockTokens: Token[] = [
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0xA0b86a33E6411b4B4F2a88F2Dd62f0C9C93a3a36',
    decimals: 6,
    price: 1.00,
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    decimals: 6,
    price: 1.00,
  },
  {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    decimals: 18,
    price: 3500.00,
  },
  {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    decimals: 8,
    price: 45000.00,
  },
  {
    symbol: 'XTZ',
    name: 'Tezos',
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
    price: 1.20,
  },
]

export function useTokens() {
  const { chainId } = useAccount()
  const [tokens, setTokens] = useState<Token[]>(mockTokens)
  const [loading, setLoading] = useState(false)

  // Check if we're on Etherlink mainnet
  const isEtherlinkMainnet = chainId === 42793

  // Get cross-chain prices for Etherlink mainnet
  const { prices: crossChainPrices, loading: crossChainLoading, isEtherlinkMainnet: isMainnet } = useCrossChainPrices()

  // Get real prices from 1inch API (for other chains)
  const chainIdForAPI = SUPPORTED_CHAINS.ethereum // Use Ethereum mainnet for 1inch API
  const tokenAddresses = mockTokens.map(t => t.address)
  const { prices: apiPrices, loading: apiLoading } = usePrices(chainIdForAPI, tokenAddresses)

  // Get backup prices from PriceOracle contract
  const { price: oraclePrice, isLoading: oracleLoading } = usePriceOracle(tokenAddresses[0]) // Just for demo

  useEffect(() => {
    setLoading(true)
    
    const updatedTokens = mockTokens.map(token => {
      // On Etherlink mainnet - use cross-chain prices
      if (isEtherlinkMainnet) {
        const crossChainPrice = crossChainPrices[token.address]
        if (crossChainPrice && crossChainPrice.source === 'cross-chain') {
          console.log(`✅ Using cross-chain price for ${token.symbol}: $${crossChainPrice.etherlinkPrice}`)
          return {
            ...token,
            price: crossChainPrice.etherlinkPrice
          }
        } else {
          console.log(`⚠️ Using mock price for ${token.symbol}: $${token.price} (cross-chain unavailable)`)
          return token
        }
      }
      
      // On other chains - use 1inch API first, then PriceOracle backup
      const apiPrice = apiPrices[token.address]
      
      if (apiPrice && apiPrice.price > 0) {
        // Use 1inch API price (primary source)
        console.log(`✅ Using 1inch API price for ${token.symbol}: $${apiPrice.price}`)
        return {
          ...token,
          price: apiPrice.price
        }
      } else if (oraclePrice && oraclePrice > 0) {
        // Use PriceOracle as backup
        console.log(`🔄 Using PriceOracle backup price for ${token.symbol}: $${oraclePrice}`)
        return {
          ...token,
          price: oraclePrice
        }
      } else {
        // Fallback to mock price if both fail
        console.log(`⚠️ Using mock price for ${token.symbol}: $${token.price} (API and Oracle unavailable)`)
        return token
      }
    })

    setTokens(updatedTokens)
    setLoading(false)
  }, [crossChainPrices, apiPrices, oraclePrice, isEtherlinkMainnet])

  const getTokenByAddress = (address: string) => {
    return tokens.find(token => token.address.toLowerCase() === address.toLowerCase())
  }

  const getTokenBySymbol = (symbol: string) => {
    return tokens.find(token => token.symbol.toLowerCase() === symbol.toLowerCase())
  }

  return {
    tokens,
    loading: loading || crossChainLoading || apiLoading || oracleLoading,
    getTokenByAddress,
    getTokenBySymbol,
    isEtherlinkMainnet
  }
}
