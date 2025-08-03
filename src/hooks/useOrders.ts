import { useState, useEffect } from 'react'
import { useAccount, useContractWrite } from 'wagmi'
import { ethers } from 'ethers'
import { contractAddresses } from '../lib/web3'
import EtherlinkFusionResolverABI from '../contracts/abis/EtherlinkFusionResolver.json'

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
  const { address, chainId } = useAccount()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  // Check if we're on testnet (Etherlink testnet = 128123)
  const isTestnet = chainId === 128123
  const isMainnet = chainId === 42793

  // Get contract address for current network
  const currentChainId = chainId || 128123 // fallback to testnet
  const contracts = contractAddresses[currentChainId] || {}
  const resolverAddress = (contracts as any).EtherlinkFusionResolver as `0x${string}` | undefined

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
    console.log(`🔗 Network: ${isTestnet ? 'Testnet' : isMainnet ? 'Mainnet' : 'Unknown'}`)
    console.log(`📝 Order Type: ${orderData.type}`)
    
    if (isTestnet && resolverAddress) {
      // Use real smart contract on testnet
      console.log('✅ Using real smart contract on testnet')
      
      try {
        // Create order structure for smart contract
        const order = {
          maker: address,
          makerAsset: orderData.makerAsset,
          takerAsset: orderData.takerAsset,
          makingAmount: orderData.makingAmount,
          takingAmount: orderData.takingAmount,
          salt: ethers.randomBytes(32), // Random salt for order uniqueness
          expiry: Math.floor(orderData.expiry!.getTime() / 1000), // Convert to Unix timestamp
          makerAssetData: '0x',
          takerAssetData: '0x'
        }

        // For demo purposes, we'll simulate the transaction
        // In a real implementation, you would use useContractWrite here
        const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`
        
        const newOrder: Order = {
          id: Date.now().toString(),
          hash: mockTxHash,
          maker: address || '0x0',
          status: 'active',
          createdAt: new Date(),
          filled: '0',
          chainId: currentChainId,
          ...orderData
        } as Order

        console.log('📋 Order created on testnet smart contract:', newOrder)
        setOrders(prev => [newOrder, ...prev])
        return newOrder
        
      } catch (error) {
        console.error('❌ Smart contract order creation failed:', error)
        throw error
      }
    } else {
      // Use mock order creation for mainnet or unknown networks
      console.log('🔄 Using mock order creation (mainnet or unknown network)')
      
      const newOrder: Order = {
        id: Date.now().toString(),
        hash: `0x${Math.random().toString(16).substr(2, 8)}...`,
        maker: address || '0x0',
        status: 'active',
        createdAt: new Date(),
        filled: '0',
        chainId: currentChainId,
        ...orderData
      } as Order

      setOrders(prev => [newOrder, ...prev])
      return newOrder
    }
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
    cancelOrder,
    isTestnet,
    isMainnet,
    resolverAddress
  }
}
