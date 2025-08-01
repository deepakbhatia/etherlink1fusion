import { useState } from 'react'
import { ArrowRight, ArrowLeftRight, ExternalLink, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { TokenSelector } from './TokenSelector'
import { useTokens } from '../hooks/useTokens'
import toast from 'react-hot-toast'

interface BridgeTransaction {
  id: string
  fromChain: string
  toChain: string
  token: string
  amount: string
  status: 'pending' | 'confirmed' | 'failed'
  txHash: string
  timestamp: Date
}

export function CrossChainBridge() {
  const { tokens } = useTokens()
  const [fromChain, setFromChain] = useState('ethereum')
  const [toChain, setToChain] = useState('etherlink')
  const [selectedToken, setSelectedToken] = useState(null)
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // Mock bridge transactions
  const [transactions] = useState<BridgeTransaction[]>([
    {
      id: '1',
      fromChain: 'Ethereum',
      toChain: 'Etherlink',
      token: 'USDC',
      amount: '1000',
      status: 'confirmed',
      txHash: '0xabc123...',
      timestamp: new Date(Date.now() - 300000)
    },
    {
      id: '2',
      fromChain: 'Arbitrum',
      toChain: 'Etherlink',
      token: 'WETH',
      amount: '0.5',
      status: 'pending',
      txHash: '0xdef456...',
      timestamp: new Date(Date.now() - 120000)
    }
  ])

  const chains = [
    { id: 'ethereum', name: 'Ethereum', color: 'bg-gray-600' },
    { id: 'arbitrum', name: 'Arbitrum', color: 'bg-blue-600' },
    { id: 'optimism', name: 'Optimism', color: 'bg-red-500' },
    { id: 'base', name: 'Base', color: 'bg-blue-400' },
    { id: 'etherlink', name: 'Etherlink', color: 'bg-blue-500' }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleSwapChains = () => {
    const temp = fromChain
    setFromChain(toChain)
    setToChain(temp)
  }

  const handleBridge = async () => {
    if (!selectedToken || !amount) {
      toast.error('Please select token and amount')
      return
    }

    setIsLoading(true)
    try {
      // Simulate bridge transaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success('Bridge transaction initiated!')
      setAmount('')
    } catch (error) {
      toast.error('Bridge transaction failed')
    } finally {
      setIsLoading(false)
    }
  }

  const ChainSelector = ({ value, onChange, label }: { value: string, onChange: (value: string) => void, label: string }) => {
    const selectedChain = chains.find(chain => chain.id === value)
    
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
          >
            {chains.map(chain => (
              <option key={chain.id} value={chain.id}>{chain.name}</option>
            ))}
          </select>
          {selectedChain && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 pointer-events-none">
              <div className={`w-3 h-3 rounded-full ${selectedChain.color}`} />
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Cross-Chain Bridge</h2>
        <p className="text-gray-600">Transfer tokens between different blockchain networks</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bridge Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ArrowLeftRight className="h-5 w-5" />
              <span>Bridge Tokens</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Chain Selection */}
            <div className="grid grid-cols-2 gap-4">
              <ChainSelector
                value={fromChain}
                onChange={setFromChain}
                label="From"
              />
              <ChainSelector
                value={toChain}
                onChange={setToChain}
                label="To"
              />
            </div>

            {/* Swap Chains Button */}
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSwapChains}
                className="rounded-full p-2 border-2 border-gray-200 bg-white hover:bg-gray-50"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Token Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Token</label>
              <div className="bg-gray-50 rounded-lg p-4">
                <TokenSelector
                  tokens={tokens}
                  selectedToken={selectedToken}
                  onSelectToken={setSelectedToken}
                />
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Amount</label>
              <div className="bg-gray-50 rounded-lg p-4">
                <input
                  type="number"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-2xl font-semibold bg-transparent border-none outline-none placeholder-gray-400"
                />
                {selectedToken && amount && (
                  <p className="text-sm text-gray-500 mt-1">
                    ≈ ${(parseFloat(amount) * selectedToken.price).toFixed(2)}
                  </p>
                )}
              </div>
            </div>

            {/* Bridge Info */}
            <div className="bg-blue-50 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Bridge Fee</span>
                <span className="font-medium">0.1%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estimated Time</span>
                <span className="font-medium">5-10 minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Powered by</span>
                <span className="font-medium">LayerZero</span>
              </div>
            </div>

            {/* Bridge Button */}
            <Button
              onClick={handleBridge}
              disabled={!selectedToken || !amount || isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              size="lg"
            >
              {isLoading ? 'Bridging...' : 'Bridge Tokens'}
            </Button>
          </CardContent>
        </Card>

        {/* Bridge Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.map(tx => (
                <div key={tx.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(tx.status)}
                      <Badge className={getStatusColor(tx.status)}>
                        {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`https://layerzeroscan.com/${tx.txHash}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">
                      {tx.fromChain} → {tx.toChain}
                    </span>
                    <span className="font-medium">
                      {tx.amount} {tx.token}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {tx.timestamp.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
            
            {transactions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <ArrowLeftRight className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p>No bridge transactions yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bridge Network Status */}
      <Card>
        <CardHeader>
          <CardTitle>Network Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {chains.map(chain => (
              <div key={chain.id} className="text-center">
                <div className={`w-12 h-12 rounded-full ${chain.color} mx-auto mb-2 flex items-center justify-center`}>
                  <span className="text-white font-bold text-sm">
                    {chain.name.slice(0, 2)}
                  </span>
                </div>
                <p className="text-sm font-medium">{chain.name}</p>
                <Badge variant="outline" className="mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                  Online
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
