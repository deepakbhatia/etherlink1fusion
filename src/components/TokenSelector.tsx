import { useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Token } from '../hooks/useTokens'

interface TokenSelectorProps {
  tokens: Token[]
  selectedToken: Token | null
  onSelectToken: (token: Token) => void
}

export function TokenSelector({ tokens, selectedToken, onSelectToken }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTokens = tokens.filter(token =>
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelectToken = (token: Token) => {
    onSelectToken(token)
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setIsOpen(true)}
        className="h-auto p-0 hover:bg-transparent"
      >
        <div className="flex items-center space-x-2">
          {selectedToken ? (
            <>
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {selectedToken.symbol.slice(0, 2)}
                </span>
              </div>
              <span className="font-medium">{selectedToken.symbol}</span>
            </>
          ) : (
            <span className="text-gray-500">Select token</span>
          )}
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Select Token</DialogTitle>
          </DialogHeader>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Token List */}
          <div className="max-h-64 overflow-y-auto space-y-1">
            {filteredTokens.map((token) => (
              <button
                key={token.address}
                onClick={() => handleSelectToken(token)}
                className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {token.symbol.slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">{token.symbol}</div>
                  <div className="text-sm text-gray-500">{token.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">--</div>
                  <div className="text-xs text-gray-500">
                    ${token.price.toFixed(2)}
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          {filteredTokens.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No tokens found
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
