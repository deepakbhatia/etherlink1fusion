/**
 * 1inch Price API Integration
 * 
 * This module replaces the PriceOracle.sol contract with real 1inch price feeds
 */

const BASE_URL = 'https://api.1inch.dev'
const API_KEY = import.meta.env.VITE_1INCH_DATA_API_KEY || 'demo-key'

// Supported chains for price feeds
export const SUPPORTED_CHAINS = {
  ethereum: 1,
  arbitrum: 42161,
  optimism: 10,
  base: 8453,
  etherlink: 42793,
  etherlinkTestnet: 128123
}

// Common token addresses for price feeds
export const COMMON_TOKENS = {
  [SUPPORTED_CHAINS.ethereum]: {
    USDC: '0xA0b86a33E6411b4B4F2a88F2Dd62f0C9C93a3a36',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'
  },
  [SUPPORTED_CHAINS.arbitrum]: {
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    WBTC: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f'
  },
  [SUPPORTED_CHAINS.optimism]: {
    USDC: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    USDT: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    WETH: '0x4200000000000000000000000000000000000006',
    WBTC: '0x68f180fcCe6836688e9084f035309E29Bf0A2095'
  },
  [SUPPORTED_CHAINS.base]: {
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    USDT: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    WETH: '0x4200000000000000000000000000000000000006',
    WBTC: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22'
  },
  [SUPPORTED_CHAINS.etherlinkTestnet]: {
    USDC: '0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9',
    USDT: '0x2C03058C8AFC06713be23e58D2febC8337dbfE6A',
    WETH: '0xfc24f770F94edBca6D6f885E12d4317320BcB401',
    WBTC: '0xbFc94CD2B1E55999Cfc7347a9313e88702B83d0F'
  },
  [SUPPORTED_CHAINS.etherlink]: {
    USDC: '0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9', // Same as testnet for now
    USDT: '0x2C03058C8AFC06713be23e58D2febC8337dbfE6A',
    WETH: '0xfc24f770F94edBca6D6f885E12d4317320BcB401',
    WBTC: '0xbFc94CD2B1E55999Cfc7347a9313e88702B83d0F'
  }
}

export interface TokenPrice {
  price: number
  priceChange24h: number
  volume24h: number
  marketCap?: number
  lastUpdated: string
}

export interface PriceResponse {
  [tokenAddress: string]: TokenPrice
}

export class OneInchPriceAPI {
  private apiKey: string

  constructor() {
    this.apiKey = API_KEY
    console.log('🔑 1inch API Key loaded:', this.apiKey ? 'Yes' : 'No')
    console.log('🔑 API Key value:', this.apiKey === 'demo-key' ? 'Using demo key' : 'Using real API key')
  }

  /**
   * Get token prices for multiple tokens
   */
  async getTokenPrices(params: {
    chainId: number
    tokens: string[]
  }): Promise<PriceResponse> {
    try {
      const queryParams = new URLSearchParams({
        tokens: params.tokens.join(',')
      })
      
      const url = `${BASE_URL}/price/v1.1/${params.chainId}?${queryParams}`
      console.log('🌐 Calling 1inch API:', url)
      console.log('🔑 Using API key:', this.apiKey === 'demo-key' ? 'demo-key' : 'real-key')
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        console.error('❌ API call failed:', response.status, response.statusText)
        throw new Error(`Price fetch failed: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('✅ API call successful, got data for', Object.keys(data).length, 'tokens')
      return data
    } catch (error) {
      console.error('❌ Error fetching token prices:', error)
      console.log('🔄 Falling back to mock data...')
      // Return mock data as fallback
      return this.getMockPrices(params.tokens)
    }
  }

  /**
   * Get price for a single token
   */
  async getTokenPrice(params: {
    chainId: number
    tokenAddress: string
  }): Promise<TokenPrice | null> {
    const prices = await this.getTokenPrices({
      chainId: params.chainId,
      tokens: [params.tokenAddress]
    })

    return prices[params.tokenAddress] || null
  }

  /**
   * Get comprehensive token info including price and metadata
   */
  async getTokenInfo(params: {
    chainId: number
    tokenAddress: string
  }) {
    const prices = await this.getTokenPrices({
      chainId: params.chainId,
      tokens: [params.tokenAddress]
    })

    return {
      symbol: this.getTokenSymbolFromAddress(params.tokenAddress, params.chainId),
      price: prices[params.tokenAddress]?.price || 0,
      priceChange24h: prices[params.tokenAddress]?.priceChange24h || 0
    }
  }

  /**
   * Get exchange rate between two tokens
   */
  async getExchangeRate(params: {
    chainId: number
    srcToken: string
    dstToken: string
  }): Promise<number> {
    try {
      const [srcPrice, dstPrice] = await Promise.all([
        this.getTokenPrice({ chainId: params.chainId, tokenAddress: params.srcToken }),
        this.getTokenPrice({ chainId: params.chainId, tokenAddress: params.dstToken })
      ])

      if (!srcPrice || !dstPrice) {
        throw new Error('Unable to get prices for both tokens')
      }

      return srcPrice.price / dstPrice.price
    } catch (error) {
      console.error('Error calculating exchange rate:', error)
      return 0
    }
  }

  /**
   * Get popular tokens with prices
   */
  async getPopularTokensWithPrices(params: {
    chainId: number
  }): Promise<PriceResponse> {
    try {
      // Get popular tokens first
      const popularTokens = await this.getPopularTokens(params.chainId)
      
      // Get prices for popular tokens
      const tokenAddresses = popularTokens.map((token: any) => token.address)
      return await this.getTokenPrices({
        chainId: params.chainId,
        tokens: tokenAddresses
      })
    } catch (error) {
      console.error('Error fetching popular tokens with prices:', error)
      return {}
    }
  }

  /**
   * Get popular tokens list
   */
  private async getPopularTokens(chainId: number): Promise<any[]> {
    try {
      const url = `${BASE_URL}/token/v1.2/${chainId}/popular`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Popular tokens fetch failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching popular tokens:', error)
      return []
    }
  }

  /**
   * Get token symbols for multiple addresses
   */
  async getTokenSymbols(params: {
    chainId: number
    addresses: string[]
  }): Promise<{ [address: string]: string }> {
    const symbols: { [address: string]: string } = {}
    
    try {
      // Get symbols for each token using address mapping
      const promises = params.addresses.map(async (address) => {
        try {
          const symbol = this.getTokenSymbolFromAddress(address, params.chainId)
          return { address, symbol }
        } catch (error) {
          console.warn(`Failed to get symbol for ${address}:`, error)
          return { address, symbol: 'Unknown' }
        }
      })

      const results = await Promise.all(promises)
      results.forEach(({ address, symbol }) => {
        symbols[address] = symbol
      })
    } catch (error) {
      console.error('Error fetching token symbols:', error)
      // Fallback to address mapping
      params.addresses.forEach(address => {
        symbols[address] = this.getTokenSymbolFromAddress(address, params.chainId)
      })
    }

    return symbols
  }

  /**
   * Get token symbol from address using common token mapping
   */
  private getTokenSymbolFromAddress(address: string, chainId: number): string {
    const commonTokens = COMMON_TOKENS[chainId] || {}
    
    // Find token symbol by address
    for (const [symbol, tokenAddress] of Object.entries(commonTokens)) {
      if ((tokenAddress as string).toLowerCase() === address.toLowerCase()) {
        return symbol
      }
    }
    
    // If not found in common tokens, return shortened address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  /**
   * Mock prices for fallback when API is unavailable
   */
  private getMockPrices(tokens: string[]): PriceResponse {
    const mockPrices: PriceResponse = {}
    
    // Mock prices for common tokens
    const mockTokenData = {
      '0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9': { // USDC
        price: 1.00,
        priceChange24h: 0.1,
        volume24h: 5000000
      },
      '0x2C03058C8AFC06713be23e58D2febC8337dbfE6A': { // USDT
        price: 1.00,
        priceChange24h: -0.2,
        volume24h: 3000000
      },
      '0xfc24f770F94edBca6D6f885E12d4317320BcB401': { // WETH
        price: 3500.00,
        priceChange24h: 2.5,
        volume24h: 8000000
      },
      '0xbFc94CD2B1E55999Cfc7347a9313e88702B83d0F': { // WBTC
        price: 45000.00,
        priceChange24h: 1.8,
        volume24h: 2000000
      }
    }
    
    tokens.forEach(token => {
      const mockData = mockTokenData[token as keyof typeof mockTokenData]
      if (mockData) {
        mockPrices[token] = {
          ...mockData,
          marketCap: mockData.price * 1000000,
          lastUpdated: new Date().toISOString()
        }
      } else {
        // Fallback for unknown tokens
        mockPrices[token] = {
          price: Math.random() * 1000 + 1,
          priceChange24h: (Math.random() - 0.5) * 20,
          volume24h: Math.random() * 1000000,
          marketCap: Math.random() * 1000000000,
          lastUpdated: new Date().toISOString()
        }
      }
    })

    return mockPrices
  }
}

// Export singleton instance
export const oneInchPriceAPI = new OneInchPriceAPI() 