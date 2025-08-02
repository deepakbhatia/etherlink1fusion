import { useState, useEffect } from 'react'
import { oneInchPriceAPI, TokenPrice, PriceResponse } from '../lib/1inch-price-api'

export function usePrices(chainId: number, tokens: string[]) {
  const [prices, setPrices] = useState<PriceResponse>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPrices = async () => {
      if (!tokens.length) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const priceData = await oneInchPriceAPI.getTokenPrices({
          chainId,
          tokens
        })
        setPrices(priceData)
      } catch (err) {
        console.error('Error fetching prices:', err)
        setError('Failed to fetch prices')
      } finally {
        setLoading(false)
      }
    }

    fetchPrices()

    // Set up periodic price updates (every 30 seconds)
    const interval = setInterval(fetchPrices, 30000)

    return () => clearInterval(interval)
  }, [chainId, tokens.join(',')])

  const getTokenPrice = (tokenAddress: string): TokenPrice | null => {
    return prices[tokenAddress] || null
  }

  const getExchangeRate = (srcToken: string, dstToken: string): number => {
    const srcPrice = prices[srcToken]
    const dstPrice = prices[dstToken]

    if (!srcPrice || !dstPrice) {
      return 0
    }

    return srcPrice.price / dstPrice.price
  }

  return {
    prices,
    loading,
    error,
    getTokenPrice,
    getExchangeRate,
    refetch: () => {
      setLoading(true)
      oneInchPriceAPI.getTokenPrices({ chainId, tokens })
        .then(setPrices)
        .catch(setError)
        .finally(() => setLoading(false))
    }
  }
}

// Hook for single token price
export function useTokenPrice(chainId: number, tokenAddress: string) {
  const { prices, loading, error } = usePrices(chainId, [tokenAddress])
  const price = prices[tokenAddress] || null

  return {
    price,
    loading,
    error
  }
}

// Hook for exchange rate between two tokens
export function useExchangeRate(chainId: number, srcToken: string, dstToken: string) {
  const { prices, loading, error } = usePrices(chainId, [srcToken, dstToken])
  
  const exchangeRate = (() => {
    const srcPrice = prices[srcToken]
    const dstPrice = prices[dstToken]

    if (!srcPrice || !dstPrice) {
      return 0
    }

    return srcPrice.price / dstPrice.price
  })()

  return {
    exchangeRate,
    loading,
    error
  }
} 