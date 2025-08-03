import { useState, useMemo } from 'react'
import { ArrowUpDown, Settings, Clock, Zap, TrendingUp } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { TokenSelector } from './TokenSelector'
import { DutchAuctionTimer } from './DutchAuctionTimer'
import { PriceImpactIndicator } from './PriceImpactIndicator'
import { useTokens, Token } from '../hooks/useTokens'
import { useOrders } from '../contexts/OrdersContext'
import toast from 'react-hot-toast'

export function SwapInterface() {
  const { tokens, isEtherlinkMainnet } = useTokens()
  const { createOrder, isTestnet, isMainnet, resolverAddress } = useOrders()
  
  const [fromToken, setFromToken] = useState<Token | null>(null)
  const [toToken, setToToken] = useState<Token | null>(null)
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [swapType, setSwapType] = useState<'limit' | 'dutch_auction'>('dutch_auction')
  const [slippage, setSlippage] = useState(0.5)
  const [isLoading, setIsLoading] = useState(false)

  // Calculate exchange rate and price impact
  const exchangeRate = useMemo(() => {
    if (!fromToken || !toToken || !fromAmount) return null
    const rate = (parseFloat(fromAmount) * fromToken.price) / toToken.price
    return rate
  }, [fromToken, toToken, fromAmount])

  const priceImpact = useMemo(() => {
    if (!exchangeRate || !fromAmount) return 0
    // Mock price impact calculation (in real app, would call price oracle)
    const amount = parseFloat(fromAmount)
    if (amount < 10) return 0.1
    if (amount < 100) return 0.3
    if (amount < 1000) return 0.8
    return 1.5
  }, [exchangeRate, fromAmount])

  // Determine price source for display
  const getPriceSource = () => {
    if (!fromToken || !toToken) return null
    
    // Check if we're on Etherlink mainnet (cross-chain prices)
    if (isEtherlinkMainnet) {
      return { source: 'Cross-Chain Bridge', color: 'text-purple-600', icon: '🌉' }
    }
    
    // Check if prices are from 1inch API (real prices)
    const isFromAPI = fromToken.price !== 1.00 && fromToken.price !== 3500.00 && 
                     fromToken.price !== 45000.00 && fromToken.price !== 1.20
    
    if (isFromAPI) {
      return { source: '1inch API', color: 'text-green-600', icon: '🌐' }
    } else {
      return { source: 'PriceOracle Contract', color: 'text-blue-600', icon: '📋' }
    }
  }

  const priceSource = getPriceSource()

  const handleSwapTokens = () => {
    const temp = fromToken
    setFromToken(toToken)
    setToToken(temp)
    setFromAmount(toAmount)
    setToAmount(fromAmount)
  }

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value)
    if (exchangeRate && value) {
      setToAmount((parseFloat(value) * exchangeRate).toFixed(6))
    } else {
      setToAmount('')
    }
  }

  const handleCreateOrder = async () => {
    if (!fromToken || !toToken || !fromAmount || !toAmount) {
      toast.error('Please select tokens and amounts')
      return
    }

    setIsLoading(true)
    try {
      const orderData = {
        makerAsset: fromToken.address,
        takerAsset: toToken.address,
        makingAmount: (parseFloat(fromAmount) * Math.pow(10, fromToken.decimals)).toString(),
        takingAmount: (parseFloat(toAmount) * Math.pow(10, toToken.decimals)).toString(),
        type: swapType,
        expiry: new Date(Date.now() + (swapType === 'dutch_auction' ? 300000 : 86400000)), // 5 min for auction, 24h for limit
        currentPrice: toAmount
      }

      console.log('🚀 Creating order with data:', orderData)
      const result = await createOrder(orderData)
      console.log('✅ Order creation result:', result)
      toast.success(`${swapType === 'dutch_auction' ? 'Dutch auction' : 'Limit'} order created successfully!`)
      
      // Reset form
      setFromAmount('')
      setToAmount('')
    } catch (error) {
      toast.error('Failed to create order')
    } finally {
      setIsLoading(false)
    }
  }

  const canCreateOrder = fromToken && toToken && fromAmount && toAmount && !isLoading

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Token Swap</CardTitle>
          <div className="flex items-center space-x-2">
            {priceSource && (
              <div className={`text-xs ${priceSource.color} flex items-center space-x-1`}>
                <span>{priceSource.icon}</span>
                <span>{priceSource.source}</span>
              </div>
            )}
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Swap Type Selector */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setSwapType('dutch_auction')}
            className={`flex-1 py-2 px-3 text-sm rounded-md transition-colors ${
              swapType === 'dutch_auction'
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="flex items-center justify-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>Dutch Auction</span>
            </div>
          </button>
          <button
            onClick={() => setSwapType('limit')}
            className={`flex-1 py-2 px-3 text-sm rounded-md transition-colors ${
              swapType === 'limit'
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="flex items-center justify-center space-x-1">
              <Zap className="h-3 w-3" />
              <span>Limit Order</span>
            </div>
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* From Token */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">From</label>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <TokenSelector
                tokens={tokens}
                selectedToken={fromToken}
                onSelectToken={setFromToken}
              />
              {fromToken && (
                <span className="text-xs text-gray-500">
                  Balance: -- {fromToken.symbol}
                </span>
              )}
            </div>
            <input
              type="number"
              placeholder="0.0"
              value={fromAmount}
              onChange={(e) => handleFromAmountChange(e.target.value)}
              className="w-full text-2xl font-semibold bg-transparent border-none outline-none placeholder-gray-400"
            />
            {fromToken && fromAmount && (
              <p className="text-sm text-gray-500 mt-1">
                ≈ ${(parseFloat(fromAmount) * fromToken.price).toFixed(2)}
              </p>
            )}
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSwapTokens}
            className="rounded-full p-2 border-2 border-gray-200 bg-white hover:bg-gray-50"
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>

        {/* To Token */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">To</label>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <TokenSelector
                tokens={tokens}
                selectedToken={toToken}
                onSelectToken={setToToken}
              />
              {toToken && (
                <span className="text-xs text-gray-500">
                  Balance: -- {toToken.symbol}
                </span>
              )}
            </div>
            <input
              type="number"
              placeholder="0.0"
              value={toAmount}
              readOnly
              className="w-full text-2xl font-semibold bg-transparent border-none outline-none placeholder-gray-400"
            />
            {toToken && toAmount && (
              <p className="text-sm text-gray-500 mt-1">
                ≈ ${(parseFloat(toAmount) * toToken.price).toFixed(2)}
              </p>
            )}
          </div>
        </div>

        {/* Price Info */}
        {exchangeRate && fromToken && toToken && (
          <div className="bg-blue-50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Exchange Rate</span>
              <span className="font-medium">
                1 {fromToken.symbol} = {exchangeRate.toFixed(6)} {toToken.symbol}
              </span>
            </div>
            <PriceImpactIndicator impact={priceImpact} />
            {swapType === 'dutch_auction' && (
              <DutchAuctionTimer
                startPrice={exchangeRate * 1.2}
                endPrice={exchangeRate}
                duration={300} // 5 minutes
              />
            )}
          </div>
        )}

        {/* Slippage Settings */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Slippage tolerance</span>
          <div className="flex items-center space-x-1">
            {[0.1, 0.5, 1.0].map((value) => (
              <button
                key={value}
                onClick={() => setSlippage(value)}
                className={`px-2 py-1 rounded text-xs ${
                  slippage === value
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {value}%
              </button>
            ))}
          </div>
        </div>

        {/* Create Order Button */}
        <Button
          onClick={handleCreateOrder}
          disabled={!canCreateOrder}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50"
          size="lg"
        >
          {isLoading ? (
            'Creating Order...'
          ) : swapType === 'dutch_auction' ? (
            <>Start Dutch Auction</>
          ) : (
            <>Create Limit Order</>
          )}
        </Button>

        {/* Network & Contract Info */}
        <div className="text-xs text-gray-500 bg-gray-50 rounded p-2 space-y-2">
          <div className="flex items-center justify-between">
            <span>Network:</span>
            <span className={`font-medium ${
              isTestnet ? 'text-blue-600' : 
              isMainnet ? 'text-purple-600' : 
              'text-gray-600'
            }`}>
              {isTestnet ? 'Etherlink Testnet' : 
               isMainnet ? 'Etherlink Mainnet' : 
               'Unknown Network'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Smart Contract:</span>
            <span className={`font-medium ${
              isTestnet && resolverAddress ? 'text-green-600' : 'text-orange-600'
            }`}>
              {isTestnet && resolverAddress ? '✅ Connected' : '⚠️ Not Available'}
            </span>
          </div>
          
                              {swapType === 'dutch_auction' ? (
                      <div className="flex items-start space-x-2">
                        <Clock className="h-3 w-3 mt-0.5 text-blue-500" />
                        <div>
                          <strong>Dutch Auction:</strong> Price starts high and decreases over 5 minutes until filled or expired.
                          {isTestnet && resolverAddress && (
                            <span className="text-green-600"> ✅ Real blockchain transaction on testnet</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start space-x-2">
                        <Zap className="h-3 w-3 mt-0.5 text-green-500" />
                        <div>
                          <strong>Limit Order:</strong> Order will be filled when market price matches your specified rate.
                          {isTestnet && resolverAddress && (
                            <span className="text-green-600"> ✅ Real blockchain transaction on testnet</span>
                          )}
                        </div>
                      </div>
                    )}
        </div>
      </CardContent>
    </Card>
  )
}
