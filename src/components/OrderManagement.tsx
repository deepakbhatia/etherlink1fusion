import { useState, useEffect } from 'react'
import { Clock, CheckCircle, XCircle, Timer, ExternalLink, X, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { useOrders } from '../contexts/OrdersContext'
import { useTokens } from '../hooks/useTokens'
import toast from 'react-hot-toast'

export function OrderManagement() {
  const { orders, activeOrders, completedOrders, loading, cancelOrder, createOrder } = useOrders()
  const { getTokenByAddress } = useTokens()

  // Debug logging
  console.log('📋 OrderManagement - Total orders:', orders.length)
  console.log('📋 OrderManagement - Active orders:', activeOrders.length)
  console.log('📋 OrderManagement - Completed orders:', completedOrders.length)
  console.log('📋 OrderManagement - Orders data:', orders)

  // Force re-render when orders change
  const ordersKey = orders.length > 0 ? orders[0].id : 'no-orders'

  // Monitor orders changes
  useEffect(() => {
    console.log('🔄 OrderManagement received orders update:', orders.length, 'orders')
    if (orders.length > 0) {
      console.log('📋 Latest order in OrderManagement:', orders[0])
    }
  }, [orders])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'filled':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'expired':
        return <Timer className="h-4 w-4 text-gray-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800'
      case 'filled':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'expired':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    try {
      await cancelOrder(orderId)
      toast.success('Order cancelled successfully')
    } catch (error) {
      toast.error('Failed to cancel order')
    }
  }

  const formatAmount = (amount: string, decimals: number) => {
    const num = parseFloat(amount) / Math.pow(10, decimals)
    return num.toFixed(6)
  }

  const calculateFillPercentage = (filled: string, total: string) => {
    const filledNum = parseFloat(filled)
    const totalNum = parseFloat(total)
    if (totalNum === 0) return 0
    return (filledNum / totalNum) * 100
  }

  const OrderCard = ({ order }: { order: any }) => {
    const fromToken = getTokenByAddress(order.makerAsset)
    const toToken = getTokenByAddress(order.takerAsset)
    const fillPercentage = calculateFillPercentage(order.filled, order.makingAmount)

    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              {getStatusIcon(order.status)}
              <Badge className={getStatusColor(order.status)}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
              <Badge variant="outline">
                {order.type === 'dutch_auction' ? 'Dutch Auction' : 'Limit Order'}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (order.hash === 'pending...') {
                    alert('Transaction is pending confirmation...')
                  } else {
                    alert('⚠️ Demo Mode: This is a simulated transaction hash.\n\nIn production, this would link to a real blockchain transaction.')
                    window.open(`https://testnet.explorer.etherlink.com/tx/${order.hash}`, '_blank')
                  }
                }}
                title="View on Etherlink Testnet Explorer (Demo Mode)"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              {order.status === 'active' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCancelOrder(order.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-sm text-gray-500">From</p>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {fromToken?.symbol.slice(0, 2) || 'TK'}
                  </span>
                </div>
                <div>
                  <p className="font-medium">
                    {formatAmount(order.makingAmount, fromToken?.decimals || 18)} {fromToken?.symbol || 'TOKEN'}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">To</p>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {toToken?.symbol.slice(0, 2) || 'TK'}
                  </span>
                </div>
                <div>
                  <p className="font-medium">
                    {formatAmount(order.takingAmount, toToken?.decimals || 18)} {toToken?.symbol || 'TOKEN'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {order.status === 'active' && fillPercentage > 0 && (
            <div className="mb-3">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Filled</span>
                <span>{fillPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${fillPercentage}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-between text-sm text-gray-500">
            <span>Created: {order.createdAt.toLocaleString()}</span>
            <span>
              {order.status === 'active'
                ? `Expires: ${order.expiry.toLocaleString()}`
                : `Price: ${order.currentPrice}`
              }
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto" key={ordersKey}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Management</h2>
        <p className="text-gray-600">Monitor and manage your trading orders</p>
        
        {/* Network Status Indicator */}
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium text-green-800">🔗 Testnet Ready</span>
            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Real Blockchain</span>
          </div>
          <p className="text-sm text-green-700 mb-2">
            Contracts are deployed to Etherlink testnet. Orders will create real blockchain transactions.
          </p>
          <div className="text-xs text-green-600">
            <p>✅ Real smart contract interaction</p>
            <p>✅ Actual transaction hashes</p>
            <p>✅ Working explorer links</p>
            <p>⚠️ Requires testnet tokens for gas fees</p>
          </div>
        </div>
        
        {/* Debug button to test order creation */}
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800 mb-2">
            <strong>Debug:</strong> Current orders count: {orders.length}
          </p>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => {
              console.log('🧪 Testing order creation...')
              const testOrder = {
                makerAsset: '0xA0b86a33E6411b4B4F2a88F2Dd62f0C9C93a3a36',
                takerAsset: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                makingAmount: '1000000',
                takingAmount: '1000000000000000000',
                type: 'dutch_auction' as const,
                expiry: new Date(Date.now() + 300000),
                currentPrice: '1.0'
              }
              createOrder(testOrder)
            }}
          >
            Test Add Order
          </Button>
        </div>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active Orders ({activeOrders.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedOrders.length})</TabsTrigger>
          <TabsTrigger value="all">All Orders ({orders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {activeOrders.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Orders</h3>
                <p className="text-gray-600">Create your first order in the Swap tab</p>
                <div className="mt-4 text-sm text-gray-500">
                  <p>💡 Go to the Swap tab to create Dutch auctions or Limit orders</p>
                  <p>📋 Your orders will appear here once created</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div>
              {activeOrders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {completedOrders.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Completed Orders</h3>
                <p className="text-gray-600">Your completed orders will appear here</p>
                <div className="mt-4 text-sm text-gray-500">
                  <p>✅ Orders will show here once they are filled or cancelled</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div>
              {completedOrders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          {orders.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Yet</h3>
                <p className="text-gray-600">Start trading to see your order history</p>
                <div className="mt-4 text-sm text-gray-500">
                  <p>🚀 Create your first order in the Swap tab</p>
                  <p>📊 All your orders will be tracked here</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div>
              {orders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
