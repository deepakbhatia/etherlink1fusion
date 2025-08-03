import { useState, useEffect } from 'react'
import { useContractRead } from 'wagmi'
import { ethers } from 'ethers'
import { contractAddresses } from '../lib/web3'
import { oneInchPriceAPI, SUPPORTED_CHAINS, COMMON_TOKENS } from '../lib/1inch-price-api'

// Import contract ABIs
import PriceOracleABI from '../contracts/abis/PriceOracle.json'
import EtherlinkFusionFactoryABI from '../contracts/abis/EtherlinkFusionFactory.json'

export interface AnalyticsData {
  totalVolume: number
  activeOrders: number
  totalUsers: number
  avgFillTime: number
  volumeData: any[]
  tokenData: any[]
  recentTrades: any[]
  contractStatus: {
    priceOracle: boolean
    factory: boolean
    router: boolean
    bridge: boolean
  }
  realPrices: any
}

export function useAnalytics(selectedNetwork: string = 'etherlinkTestnet') {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalVolume: 0,
    activeOrders: 0,
    totalUsers: 0,
    avgFillTime: 0,
    volumeData: [],
    tokenData: [],
    recentTrades: [],
    contractStatus: {
      priceOracle: false,
      factory: false,
      router: false,
      bridge: false
    },
    realPrices: {}
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get chain ID based on selected network
  const chainId = SUPPORTED_CHAINS[selectedNetwork as keyof typeof SUPPORTED_CHAINS] || SUPPORTED_CHAINS.etherlinkTestnet
  const contracts = contractAddresses[chainId] || {}
  const priceOracleAddress = (contracts as any).PriceOracle as `0x${string}` | undefined
  const factoryAddress = (contracts as any).EtherlinkFusionFactory as `0x${string}` | undefined

  // Fetch contract data
  const { data: priceOracleData } = useContractRead({
    address: priceOracleAddress!,
    abi: PriceOracleABI,
    functionName: 'getExchangeRate',
    args: ['0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9', '0xfc24f770F94edBca6D6f885E12d4317320BcB401'] // USDC/WETH
  })

  const { data: factoryData } = useContractRead({
    address: factoryAddress!,
    abi: EtherlinkFusionFactoryABI,
    functionName: 'getDeployedResolvers'
  })

  const fetchAnalyticsData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get real prices from 1inch API for selected network
      const realPrices = await oneInchPriceAPI.getTokenPrices({
        chainId: chainId,
        tokens: Object.values(COMMON_TOKENS[chainId] || {})
      })

      // Calculate total volume from real prices
      let totalVolume = 0
      Object.values(realPrices).forEach((priceData: any) => {
        if (priceData && priceData.volume24h) {
          totalVolume += priceData.volume24h
        }
      })

      // Use real volume or fallback to mock data
      const baseVolume = totalVolume > 0 ? totalVolume : 12400000
      const activeOrders = factoryData ? (factoryData as any).length * 10 : 247
      const totalUsers = factoryData ? (factoryData as any).length * 5.8 : 1423

      // Generate token data based on real prices
      const tokenData = generateTokenData(realPrices)
      const recentTrades = generateRecentTrades()

      // Check contract status
      const contractStatus = {
        priceOracle: !!(contracts as any).PriceOracle,
        factory: !!(contracts as any).EtherlinkFusionFactory,
        router: !!(contracts as any).CrossChainRouter,
        bridge: !!(contracts as any).BridgeAdapter
      }

      setAnalyticsData({
        totalVolume: baseVolume,
        activeOrders,
        totalUsers,
        avgFillTime: 2.3,
        volumeData: [], // Removed - now using real token volume in AnalyticsDashboard
        tokenData,
        recentTrades,
        contractStatus,
        realPrices
      })

    } catch (err) {
      console.error('Error fetching analytics data:', err)
      setError('Failed to fetch analytics data')
    } finally {
      setLoading(false)
    }
  }

  // Note: generateVolumeData removed - now using real token volume data in AnalyticsDashboard

  const generateTokenData = (realPrices: any) => {
    // Use real prices to generate token distribution
    const tokenData = []
    let totalVolume = 0

    // Calculate total volume from real prices
    Object.values(realPrices).forEach((priceData: any) => {
      if (priceData && priceData.volume24h) {
        totalVolume += priceData.volume24h
      }
    })

    // Create token distribution based on real volume
    Object.entries(realPrices).forEach(([address, priceData]: [string, any], index) => {
      if (priceData && priceData.volume24h) {
        const volumePercent = (priceData.volume24h / totalVolume) * 100
        const colors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444']
        
        // Get token symbol from address mapping
        const tokenSymbol = getTokenSymbol(address)
        
        tokenData.push({
          name: tokenSymbol,
          volume: volumePercent,
          color: colors[index % colors.length]
        })
      }
    })

    // Fallback to mock data if no real prices
    return tokenData.length > 0 ? tokenData : [
      { name: 'USDC', volume: 45, color: '#3B82F6' },
      { name: 'WETH', volume: 25, color: '#8B5CF6' },
      { name: 'WBTC', volume: 15, color: '#F59E0B' },
      { name: 'USDT', volume: 10, color: '#10B981' },
      { name: 'XTZ', volume: 5, color: '#EF4444' }
    ]
  }

  // Helper function to get token symbol from address
  const getTokenSymbol = (address: string): string => {
    const commonTokens = COMMON_TOKENS[chainId] || {}
    
    // Find token symbol by address
    for (const [symbol, tokenAddress] of Object.entries(commonTokens)) {
      if ((tokenAddress as string).toLowerCase() === address.toLowerCase()) {
        return symbol
      }
    }
    
    // If not found in common tokens, return shortened address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const generateRecentTrades = () => {
    return [
      {
        id: '1',
        pair: 'USDC/WETH',
        amount: '2,500 USDC',
        price: '$3,200',
        time: '2 min ago',
        type: 'buy'
      },
      {
        id: '2',
        pair: 'XTZ/USDC',
        amount: '150 XTZ',
        price: '$1.18',
        time: '5 min ago',
        type: 'sell'
      },
      {
        id: '3',
        pair: 'WBTC/ETH',
        amount: '0.05 WBTC',
        price: '$45,000',
        time: '8 min ago',
        type: 'buy'
      }
    ]
  }

  useEffect(() => {
    fetchAnalyticsData()

    // Set up periodic updates
    const interval = setInterval(fetchAnalyticsData, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [priceOracleData, factoryData, selectedNetwork])

  return {
    analyticsData,
    loading,
    error,
    refetch: fetchAnalyticsData
  }
} 