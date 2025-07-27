import { useState } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import './App.css'

function App() {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState('')

  const handleOpenWallet = () => {
    // Check if MetaMask is installed
    if (typeof window.ethereum !== 'undefined') {
      // Request account access
      window.ethereum.request({ method: 'eth_requestAccounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            setAddress(accounts[0])
            setIsConnected(true)
            toast.success('Wallet connected!')
          }
        })
        .catch((error: any) => {
          console.error('User rejected the request:', error)
          toast.error('Failed to connect wallet')
        })
    } else {
      toast.error('Please install MetaMask!')
    }
  }

  const disconnectWallet = () => {
    setAddress('')
    setIsConnected(false)
    toast.success('Wallet disconnected!')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Etherlink Fusion+</h1>
        <p className="text-gray-600 mb-8">Cross-chain DeFi Protocol</p>
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
          {!isConnected ? (
            <>
              <p className="text-sm text-gray-500 mb-4">Connect your wallet to start trading</p>
              <button 
                onClick={handleOpenWallet}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                Connect Wallet
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">Wallet Connected!</p>
              <p className="text-xs text-gray-400 mb-4 break-all">{address}</p>
              <button 
                onClick={disconnectWallet}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
              >
                Disconnect
              </button>
            </>
          )}
        </div>
      </div>
      
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#333',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
          },
        }}
      />
    </div>
  )
}

export default App
