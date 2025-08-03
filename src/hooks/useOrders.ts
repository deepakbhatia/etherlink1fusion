import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'

export interface Order {
  id: string
  hash: string
  maker: string
  makerAsset: string
  takerAsset: string
  makingAmount: string
  takingAmount: string
  filled: string
  status: 'active' | 'filled' | 'cancelled' | 'expired'
  createdAt: Date
  expiry: Date
  currentPrice: string
  type: 'limit' | 'dutch_auction'
  chainId: number
}

export function useOrders() {
  const { address } = useAccount()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  // Mock orders for demonstration
  const mockOrders: Order[] = [
    {
      id: '1',
      hash: '0xabc123...',
      maker: address || '0x1234567890123456789012345678901234567890',
      makerAsset: '0x0000000000000000000000000000000000000000', // XTZ
      takerAsset: '0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9', // USDC
      makingAmount: '100000000000000000000', // 100 XTZ
      takingAmount: '85000000', // 85 USDC
      filled: '25000000000000000000', // 25 XTZ filled
      status: 'active',
      createdAt: new Date(Date.now() - 300000), // 5 minutes ago
      expiry: new Date(Date.now() + 600000), // 10 minutes from now
      currentPrice: '0.82',
      type: 'dutch_auction',
      chainId: 128123
    },
    {
      id: '2',
      hash: '0xdef456...',
      maker: address || '0x1234567890123456789012345678901234567890',
      makerAsset: '0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9', // USDC
      takerAsset: '0xfc24f770F94edBca6D6f885E12d4317320BcB401', // WETH
      makingAmount: '3200000000', // 3200 USDC
      takingAmount: '1000000000000000000', // 1 WETH
      filled: '3200000000', // Fully filled
      status: 'filled',
      createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
      expiry: new Date(Date.now() - 600000), // 10 minutes ago
      currentPrice: '3200.00',
      type: 'limit',
      chainId: 128123
    },
    {
      id: '3',
      hash: '0x789ghi...',
      maker: address || '0x1234567890123456789012345678901234567890',
      makerAsset: '0xfc24f770F94edBca6D6f885E12d4317320BcB401', // WETH
      takerAsset: '0xbFc94CD2B1E55999Cfc7347a9313e88702B83d0F', // WBTC
      makingAmount: '1000000000000000000', // 1 WETH
      takingAmount: '7500000', // 0.075 WBTC
      filled: '0',
      status: 'active',
      createdAt: new Date(Date.now() - 600000), // 10 minutes ago
      expiry: new Date(Date.now() + 900000), // 15 minutes from now
      currentPrice: '0.0755',
      type: 'dutch_auction',
      chainId: 128123
    }
  ]

  useEffect(() => {
    // Simulate loading and use mock data
    const timer = setTimeout(() => {
      setOrders(mockOrders)
      setLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [address])

  const createOrder = async (orderData: Partial<Order>) => {
    // Mock order creation
    const newOrder: Order = {
      id: Date.now().toString(),
      hash: `0x${Math.random().toString(16).substr(2, 8)}...`,
      maker: address || '0x0',
      status: 'active',
      createdAt: new Date(),
      filled: '0',
      chainId: 128123,
      ...orderData
    } as Order

    setOrders(prev => [newOrder, ...prev])
    return newOrder
  }

  const cancelOrder = async (orderId: string) => {
    setOrders(prev => 
      prev.map(order => 
        order.id === orderId 
          ? { ...order, status: 'cancelled' as const }
          : order
      )
    )
  }

  const activeOrders = orders.filter(order => order.status === 'active')
  const completedOrders = orders.filter(order => order.status === 'filled')

  return {
    orders,
    activeOrders,
    completedOrders,
    loading,
    createOrder,
    cancelOrder
  }
}
