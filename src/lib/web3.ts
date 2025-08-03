import { mainnet, arbitrum, optimism, base } from 'wagmi/chains'

// Etherlink chain configurations
export const etherlinkTestnet = {
  id: 128123,
  name: 'Etherlink Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'XTZ',
    symbol: 'XTZ',
  },
  rpcUrls: {
    default: {
      http: ['https://node.ghostnet.etherlink.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Etherlink Explorer',
      url: 'https://testnet.explorer.etherlink.com',
    },
  },
} as const

export const etherlinkMainnet = {
  id: 42793,
  name: 'Etherlink',
  nativeCurrency: {
    decimals: 18,
    name: 'XTZ',
    symbol: 'XTZ',
  },
  rpcUrls: {
    default: {
      http: ['https://node.mainnet.etherlink.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Etherlink Explorer',
      url: 'https://explorer.etherlink.com',
    },
  },
} as const

// Token addresses for each supported chain
export const tokenAddresses = {
  [mainnet.id]: {
    USDC: '0xA0b86a33E6411b4B4F2a88F2Dd62f0C9C93a3a36',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  },
  [etherlinkTestnet.id]: {
    USDC: '0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9',
    USDT: '0xb8fB2E8738e60d9CDb53117aC5ac3B6d3313D4c2', // Deployed Mock USDT
    WETH: '0xfc24f770F94edBca6D6f885E12d4317320BcB401',
    WBTC: '0xbFc94CD2B1E55999Cfc7347a9313e88702B83d0F',
  },
  [arbitrum.id]: {
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    WBTC: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
  },
  [optimism.id]: {
    USDC: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    USDT: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    WETH: '0x4200000000000000000000000000000000000006',
    WBTC: '0x68f180fcCe6836688e9084f035309E29Bf0A2095',
  },
  [base.id]: {
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    WETH: '0x4200000000000000000000000000000000000006',
    USDT: '0x0000000000000000000000000000000000000000',
    WBTC: '0x0000000000000000000000000000000000000000',
  },
} as const

// Contract addresses
export const contractAddresses = {
  [etherlinkTestnet.id]: {
    PriceOracle: '0xaFf493AaA8989509dC82b11315d7E2d08b1B4F9F',
    BridgeAdapter: '0xfcd72FD2C49a91a6aC94935a221E23E246DE2723',
    EtherlinkFusionResolver: '0x0e48a6439Ed91398DeEF51171CA505B5950F89F4',
    EtherlinkFusionFactory: '0x3A6d7F2911776A985B0A09e33e8FB6dd93d74430',
    CrossChainRouter: '0x3115Ff33a21a5F99f8eeAC6E52e2d3e3Bc49dC87',
  },
} as const 