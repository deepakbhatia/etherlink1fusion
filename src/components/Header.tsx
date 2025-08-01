import { useState } from 'react'
import { useAccount, useDisconnect, useChainId } from 'wagmi'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu'
import { 
  Wallet, 
  ChevronDown, 
  Copy, 
  ExternalLink, 
  LogOut,
  Settings
} from 'lucide-react'
import { etherlinkTestnet, etherlinkMainnet } from '../lib/web3'
import toast from 'react-hot-toast'

interface HeaderProps {
  onOpenWallet: () => void
}

export function Header({ onOpenWallet }: HeaderProps) {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  
  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case etherlinkTestnet.id:
        return 'Etherlink Testnet'
      case etherlinkMainnet.id:
        return 'Etherlink Mainnet'
      case 1:
        return 'Ethereum'
      case 42161:
        return 'Arbitrum'
      case 10:
        return 'Optimism'
      case 8453:
        return 'Base'
      default:
        return 'Unknown Network'
    }
  }

  const getNetworkColor = (chainId: number) => {
    switch (chainId) {
      case etherlinkTestnet.id:
      case etherlinkMainnet.id:
        return 'bg-blue-500'
      case 1:
        return 'bg-gray-600'
      case 42161:
        return 'bg-blue-600'
      case 10:
        return 'bg-red-500'
      case 8453:
        return 'bg-blue-400'
      default:
        return 'bg-gray-400'
    }
  }

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      toast.success('Address copied to clipboard')
    }
  }

  const openExplorer = () => {
    if (address && chainId === etherlinkTestnet.id) {
      window.open(`https://testnet.explorer.etherlink.com/address/${address}`, '_blank')
    } else if (address && chainId === etherlinkMainnet.id) {
      window.open(`https://explorer.etherlink.com/address/${address}`, '_blank')
    }
  }

  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">EF</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Etherlink Fusion+</h1>
              <p className="text-xs text-gray-500">Cross-chain DeFi Protocol</p>
            </div>
          </div>

          {/* Network & Wallet */}
          <div className="flex items-center space-x-3">
            {/* Network Badge */}
            {isConnected && (
              <Badge variant="outline" className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${getNetworkColor(chainId)}`} />
                <span className="text-xs">{getNetworkName(chainId)}</span>
              </Badge>
            )}

            {/* Wallet Connection */}
            {isConnected ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <Wallet className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={copyAddress}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Address
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={openExplorer}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on Explorer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onOpenWallet}>
                    <Settings className="h-4 w-4 mr-2" />
                    Wallet Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => disconnect()}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={onOpenWallet} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
