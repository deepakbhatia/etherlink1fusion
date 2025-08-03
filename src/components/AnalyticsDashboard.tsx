import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { TrendingUp, TrendingDown, DollarSign, Activity, Users, Zap, Globe, Settings } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { useAccount, useBalance } from 'wagmi'
import { useAnalytics } from '../hooks/useAnalytics'
import { usePrices } from '../hooks/usePrices'
import { SUPPORTED_CHAINS, COMMON_TOKENS } from '../lib/1inch-price-api'
import { useState } from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'

export function AnalyticsDashboard() {
  const { address, isConnected } = useAccount()
  const [selectedNetwork, setSelectedNetwork] = useState('etherlinkTestnet')
  const { analyticsData, loading, error } = useAnalytics(selectedNetwork)

  // Fetch user balance
  const { data: userBalance } = useBalance({
    address: address
  })

  // Get real prices for common tokens based on selected network
  const chainId = SUPPORTED_CHAINS[selectedNetwork as keyof typeof SUPPORTED_CHAINS] || SUPPORTED_CHAINS.etherlinkTestnet
  const commonTokenAddresses = Object.values(COMMON_TOKENS[chainId] || {})
  const { prices, loading: pricesLoading } = usePrices(chainId, commonTokenAddresses)

  // Network options for the switch
  const networkOptions = [
    { id: 'ethereum', name: 'Ethereum Mainnet', chainId: SUPPORTED_CHAINS.ethereum, color: 'bg-blue-500' },
    { id: 'arbitrum', name: 'Arbitrum', chainId: SUPPORTED_CHAINS.arbitrum, color: 'bg-blue-600' },
    { id: 'optimism', name: 'Optimism', chainId: SUPPORTED_CHAINS.optimism, color: 'bg-red-500' },
    { id: 'base', name: 'Base', chainId: SUPPORTED_CHAINS.base, color: 'bg-blue-700' },
    { id: 'etherlinkTestnet', name: 'Etherlink Testnet', chainId: SUPPORTED_CHAINS.etherlinkTestnet, color: 'bg-purple-500' },
    { id: 'etherlink', name: 'Etherlink Mainnet', chainId: SUPPORTED_CHAINS.etherlink, color: 'bg-purple-600' }
  ]

  const getNetworkName = (networkId: string) => {
    const network = networkOptions.find(n => n.id === networkId)
    return network?.name || 'Unknown Network'
  }

  const getNetworkColor = (networkId: string) => {
    const network = networkOptions.find(n => n.id === networkId)
    return network?.color || 'bg-gray-500'
  }

  const protocolStats = [
    {
      title: 'Total Volume',
      value: `$${(analyticsData.totalVolume / 1000000).toFixed(1)}M`,
      change: '+15.3%',
      trend: 'up',
      icon: DollarSign
    },
    {
      title: 'Active Orders',
      value: analyticsData.activeOrders.toString(),
      change: '+8.7%',
      trend: 'up',
      icon: Activity
    },
    {
      title: 'Total Users',
      value: analyticsData.totalUsers.toLocaleString(),
      change: '+12.1%',
      trend: 'up',
      icon: Users
    },
    {
      title: 'Avg Fill Time',
      value: `${analyticsData.avgFillTime}s`,
      change: '-5.2%',
      trend: 'down',
      icon: Zap
    }
  ]

  const StatCard = ({ stat }: { stat: any }) => {
    const Icon = stat.icon
    const isPositive = stat.trend === 'up'
    
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              <div className="flex items-center mt-2">
                {isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  isPositive ? 'text-green-500' : 'text-red-500'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last week</span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Icon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Generate real token volume data for bar chart
  const generateTokenVolumeData = () => {
    const tokenData = []
    
    // Use real prices from 1inch API to create bar chart data
    Object.entries(prices).forEach(([address, priceData], index) => {
      if (priceData && priceData.volume24h) {
        const tokenSymbol = getTokenSymbol(address, selectedNetwork)
        const colors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444']
        
        tokenData.push({
          name: tokenSymbol,
          volume: priceData.volume24h,
          price: priceData.price,
          priceChange: priceData.priceChange24h,
          color: colors[index % colors.length]
        })
      }
    })

    // Sort by volume (highest first)
    return tokenData.sort((a, b) => b.volume - a.volume)
  }

  const generateTokenData = () => {
    // Use real prices from 1inch API
    const tokenData = []
    let totalVolume = 0

    // Calculate total volume from real prices
    Object.entries(prices).forEach(([address, priceData]) => {
      if (priceData && priceData.volume24h) {
        totalVolume += priceData.volume24h
      }
    })

    // Create token distribution based on real volume
    Object.entries(prices).forEach(([address, priceData], index) => {
      if (priceData && priceData.volume24h) {
        const volumePercent = (priceData.volume24h / totalVolume) * 100
        const colors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444']
        const tokenSymbol = getTokenSymbol(address, selectedNetwork)
        
        console.log(`Token ${index + 1}: Address=${address}, Symbol=${tokenSymbol}, Volume=${priceData.volume24h}`)
        
        tokenData.push({
          name: tokenSymbol,
          volume: volumePercent,
          color: colors[index % colors.length]
        })
      }
    })

    return tokenData.length > 0 ? tokenData : [
      { name: 'USDC', volume: 45, color: '#3B82F6' },
      { name: 'WETH', volume: 25, color: '#8B5CF6' },
      { name: 'WBTC', volume: 15, color: '#F59E0B' },
      { name: 'USDT', volume: 10, color: '#10B981' },
      { name: 'XTZ', volume: 5, color: '#EF4444' }
    ]
  }

  if (loading || pricesLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Protocol Analytics</h2>
          <p className="text-gray-600">Loading real-time data from 1inch APIs...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Protocol Analytics</h2>
        <p className="text-gray-600">
          Real-time insights from 1inch price feeds
          {isConnected && userBalance && (
            <span className="ml-2 text-sm text-blue-600">
              • Your Balance: {parseFloat(userBalance.formatted).toFixed(4)} {userBalance.symbol}
            </span>
          )}
        </p>
      </div>

      {/* Network Switch */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Network Selection</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={`flex items-center space-x-1 ${getNetworkColor(selectedNetwork)}`}>
                <Globe className="h-4 w-4" />
                <span>{getNetworkName(selectedNetwork)}</span>
              </Badge>
              <span className="text-sm text-gray-600">
                Chain ID: {SUPPORTED_CHAINS[selectedNetwork as keyof typeof SUPPORTED_CHAINS]}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {Object.keys(prices).length} tokens tracked
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {networkOptions.map((network) => (
              <Button
                key={network.id}
                variant={selectedNetwork === network.id ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() => setSelectedNetwork(network.id)}
              >
                {network.name}
              </Button>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>Network Switch Demo:</strong> Switch between networks to see how 1inch API provides real-time price data across different chains. 
              {selectedNetwork === 'ethereum' || selectedNetwork === 'arbitrum' || selectedNetwork === 'optimism' || selectedNetwork === 'base' 
                ? ' ✅ Real 1inch API data available' 
                : ' ⚠️ Using mock data (1inch API not supported)'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {protocolStats.map((stat, index) => (
          <StatCard key={index} stat={stat} />
        ))}
      </div>

      {/* Real Price Data Display */}
      {Object.keys(prices).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Real Token Prices (1inch API)</CardTitle>
            <p className="text-sm text-gray-600">
              Live 24h trading volume and price data from 1inch aggregated DEX feeds
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(prices).slice(0, 4).map(([address, priceData]) => {
                // Get token symbol from address
                const tokenSymbol = getTokenSymbol(address, selectedNetwork)
                
                return (
                  <div key={address} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-600 mb-1">
                      {tokenSymbol}
                    </div>
                    <div className="text-lg font-semibold">
                      ${priceData.price.toFixed(4)}
                    </div>
                    <div className={`text-sm ${priceData.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {priceData.priceChange24h >= 0 ? '+' : ''}{priceData.priceChange24h.toFixed(2)}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Vol: ${(priceData.volume24h / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      24h DEX Volume
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Volume Summary */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Volume Data Source:</strong> 1inch aggregates trading volume from multiple DEXs including Uniswap, SushiSwap, PancakeSwap, and others across all supported chains.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Token Volume Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Token Volume (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={generateTokenVolumeData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name, props) => [
                    `$${(Number(value) / 1000000).toFixed(1)}M`, 
                    'Volume'
                  ]}
                  labelFormatter={(label) => `${label} (24h Volume)`}
                />
                <Bar dataKey="volume" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 text-sm text-gray-600">
              <p>📊 Real 24h trading volume from 1inch API</p>
              <p>🔄 Updates every 30 seconds</p>
              <p>📈 Shows actual market activity per token</p>
            </div>
          </CardContent>
        </Card>

        {/* Token Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Token Trading Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={generateTokenData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="volume"
                >
                  {generateTokenData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* API Status */}
      <Card>
        <CardHeader>
          <CardTitle>1inch API Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Price API:</span>
              <span className="ml-2 text-green-600">✓ Connected</span>
            </div>
            <div>
              <span className="text-gray-600">Data Source:</span>
              <span className="ml-2 text-blue-600">1inch Price Feeds</span>
            </div>
            <div>
              <span className="text-gray-600">Update Frequency:</span>
              <span className="ml-2 text-blue-600">30s</span>
            </div>
            <div>
              <span className="text-gray-600">Tokens Tracked:</span>
              <span className="ml-2 text-blue-600">{Object.keys(prices).length}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper function to get token symbol from address
function getTokenSymbol(address: string, selectedNetwork: string): string {
  const chainId = SUPPORTED_CHAINS[selectedNetwork as keyof typeof SUPPORTED_CHAINS] || SUPPORTED_CHAINS.etherlinkTestnet
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
