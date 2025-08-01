import { useState } from 'react'
import { Clock, CheckCircle, XCircle, Timer, ExternalLink, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { useOrders } from '../hooks/useOrders'
import { useTokens } from '../hooks/useTokens'
import toast from 'react-hot-toast'

export function OrderManagement() {
  const { orders, activeOrders, completedOrders, loading, cancelOrder } = useOrders()
  const { getTokenByAddress } = useTokens()

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
                onClick={() => window.open(`https://testnet.explorer.etherlink.com/tx/${order.hash}`, '_blank')}
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
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Management</h2>
        <p className="text-gray-600">Monitor and manage your trading orders</p>
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
          <div>
            {orders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
