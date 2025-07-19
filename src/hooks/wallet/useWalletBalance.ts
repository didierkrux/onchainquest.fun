import { useState, useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useQuery } from '@tanstack/react-query'
import { isPrivyProvider, createWalletError, type HookError } from 'utils/wallet'

// Fetch balance for Privy wallets
async function fetchPrivyBalance(address: `0x${string}`): Promise<bigint> {
  const response = await fetch(`https://mainnet.base.org`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_getBalance',
      params: [address, 'latest'],
      id: 1,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch balance')
  }

  const data = await response.json()
  if (data.error) {
    throw new Error(data.error.message)
  }

  return BigInt(data.result)
}

export function useWalletBalance(address?: `0x${string}`) {
  const privy = usePrivy()
  const [error, setError] = useState<HookError | null>(null)

  // Always call hooks, but conditionally enable the query
  const { data, isLoading, error: queryError } = useQuery({
    queryKey: ['balance', address],
    queryFn: () => fetchPrivyBalance(address!),
    enabled: !!address && privy.ready && privy.authenticated && isPrivyProvider(),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider stale after 10 seconds
  })

  // Convert query error to HookError format
  useEffect(() => {
    if (queryError) {
      setError(createWalletError(
        queryError.message || 'Failed to fetch balance',
        'BALANCE_FETCH_ERROR',
        queryError
      ))
    } else {
      setError(null)
    }
  }, [queryError])

  if (isPrivyProvider()) {
    return {
      data: data ? { 
        value: data, 
        formatted: `${Number(data) / Number(10n**18n)} ETH` 
      } : undefined,
      isLoading,
      error,
    }
  }

  // For WalletConnect, return default values
  // You should use useBalance from wagmi directly in WalletConnect mode
  return {
    data: undefined,
    isLoading: false,
    error: null,
  }
} 
