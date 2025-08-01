import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum, optimism, base } from '@reown/appkit/networks'
import { etherlinkTestnet, etherlinkMainnet } from './web3'

// 1. Get projectId from environment or use demo
export const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id'

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// 2. Set up Wagmi adapter
export const wagmiAdapter = new WagmiAdapter({
  networks: [mainnet, arbitrum, optimism, base, etherlinkTestnet, etherlinkMainnet],
  projectId,
  ssr: false
})
export const config = wagmiAdapter.wagmiConfig

