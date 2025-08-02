import { useContractRead } from 'wagmi'
import { contractAddresses } from '../lib/web3'
import PriceOracleABI from '../contracts/abis/PriceOracle.json'

export function usePriceOracle(tokenAddress: string) {
  const chainId = 128123 // Etherlink testnet
  const contracts = contractAddresses[chainId] || {}
  const priceOracleAddress = (contracts as any).PriceOracle as `0x${string}` | undefined

  const { data: priceData, isLoading, error } = useContractRead({
    address: priceOracleAddress!,
    abi: PriceOracleABI,
    functionName: 'getPrice',
    args: [tokenAddress as `0x${string}`]
  })

  if (priceData && Array.isArray(priceData) && priceData.length >= 2) {
    const [price, decimals] = priceData
    return {
      price: Number(price) / Math.pow(10, Number(decimals)),
      decimals: Number(decimals),
      isLoading,
      error
    }
  }

  return {
    price: null,
    decimals: null,
    isLoading,
    error
  }
}

export function usePriceOracleExchangeRate(srcToken: string, dstToken: string) {
  const chainId = 128123 // Etherlink testnet
  const contracts = contractAddresses[chainId] || {}
  const priceOracleAddress = (contracts as any).PriceOracle as `0x${string}` | undefined

  const { data: rateData, isLoading, error } = useContractRead({
    address: priceOracleAddress!,
    abi: PriceOracleABI,
    functionName: 'getExchangeRate',
    args: [srcToken as `0x${string}`, dstToken as `0x${string}`]
  })

  if (rateData && Array.isArray(rateData) && rateData.length >= 2) {
    const [rate, decimals] = rateData
    return {
      rate: Number(rate) / Math.pow(10, Number(decimals)),
      decimals: Number(decimals),
      isLoading,
      error
    }
  }

  return {
    rate: null,
    decimals: null,
    isLoading,
    error
  }
} 