import { useState } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import { Web3Provider } from './providers/Web3Provider'
import { Header } from './components/Header'
import { NavigationTabs } from './components/NavigationTabs'
import './App.css'

function AppContent() {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <Header onOpenWallet={handleOpenWallet} />
      
      <main className="container mx-auto px-4 py-8">
        <NavigationTabs />
      </main>
      
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

function App() {
  return (
    <Web3Provider>
      <AppContent />
    </Web3Provider>
  )
}

export default App
