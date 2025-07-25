/* eslint-disable no-console */
// /* eslint-disable @typescript-eslint/no-unused-vars */
// https://github.com/farcasterxyz/frames-v2-demo
// https://github.com/farcasterxyz/frames/tree/main/packages/frame-host
import { useState, useEffect, useRef } from 'react'
import type { FrameHost } from '@farcaster/frame-host'
import { wagmiConfig } from 'context/index'
import { useWalletAccount, useWalletClient } from 'hooks/useWallet'
import { Box, Text, Flex, Spinner } from '@chakra-ui/react'
import { isPrivyProvider, createPrivyProvider } from 'utils/wallet'
import { usePrivy, useWallets } from '@privy-io/react-auth'

const FRAME_ID = 'bankless-academy-frame'
const DEBUG = true
const LOADING_TIMEOUT_MS = 2000 // 2 seconds timeout for loading state

interface EthereumProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>
  on: (event: string, listener: any) => any
  removeListener: (event: string, listener: any) => any
}

interface FrameMessage {
  id: string
  type: 'APPLY' | 'GET'
  path: string[]
  argumentList?: any[]
}

interface FarcasterFrameProps {
  frameUrl?: string
  onClose?: () => void
}

// declare global {
//   interface Window {
//     ethereum: any
//   }
// }

const log = (...args: any[]) => {
  if (DEBUG) {
    console.log('[Frame]', ...args)
  }
}

const logMessage = (msg: FrameMessage) => {
  if (!DEBUG) return

  const logParts = [`Message Type: ${msg.type}`]
  if (msg.path?.length) {
    logParts.push(`Path: ${msg.path.join('.')}`)
  }
  if (msg.argumentList?.length) {
    logParts.push('Arguments:', JSON.stringify(msg.argumentList, null, 2))
  }
  log(...logParts)

  if (msg.type === 'APPLY') {
    switch (msg.path[0]) {
      case 'eip6963RequestProvider':
        log('Provider request received')
        break
      case 'ethProviderRequestV2': {
        const request = msg.argumentList?.[0]
        if (request?.value?.method) {
          log('ETH request:', request.value.method, request.value)
        }
        break
      }
      default:
        log('Unknown APPLY path:', msg.path[0])
    }
  } else if (msg.type === 'GET') {
    log('GET request for:', msg.path[0])
  }
}

// const createEthProvider = async () => {
//   try {
//     const frameSdk = await import('@farcaster/frame-sdk')
//     const sdk = frameSdk.default
//     if (!sdk?.wallet?.ethProvider) {
//       log('No ethereum provider found')
//       return null
//     }

//     log('Creating ethereum provider wrapper')
//     return sdk.wallet.ethProvider
//   } catch (error) {
//     console.error('Failed to load Frame SDK:', error)
//     return null
//   }
// }

export default function MiniApp({ frameUrl = '', onClose }: FarcasterFrameProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const cleanupRef = useRef<(() => void) | null>(null)
  const { data: walletClient } = useWalletClient()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { address } = useWalletAccount()
  const privy = usePrivy()
  const { wallets, ready: walletsReady } = useWallets()

  // Debug logging
  console.log('MiniApp wallet state:', {
    address,
    hasWalletClient: !!walletClient,
    isPrivyProvider: isPrivyProvider(),
    privyReady: privy.ready,
    privyAuthenticated: privy.authenticated,
    walletsReady,
    walletsCount: wallets.length,
  })
  const frameHostRef = useRef<any>(null)
  const isTransactionInProgressRef = useRef(false)
  const lastTransactionErrorRef = useRef<Error | null>(null)

  useEffect(() => {
    if (!address || !frameUrl) return

    let isCurrentFrame = true
    log('Initializing frame host...')
    setIsLoading(true)

    // Set a timeout to force the loading state to end after 3 seconds
    timeoutRef.current = setTimeout(() => {
      if (isCurrentFrame) {
        log('Loading timeout reached, forcing initialization')
        setIsLoading(false)
        setIsInitialized(true)
      }
    }, LOADING_TIMEOUT_MS)

    const initFrame = async () => {
      if (!iframeRef.current) {
        log('No iframe ref found')
        return
      }

      // Cleanup previous frame host if it exists
      if (frameHostRef.current) {
        try {
          frameHostRef.current.cleanup?.()
        } catch (error) {
          log('Error cleaning up previous frame host:', error)
        }
        frameHostRef.current = null
      }

      const { exposeToIframe } = await import('@farcaster/frame-host')

      let client: any
      let provider: any
      try {
        // For Privy, ensure we use the correct wallet that matches the user's address
        if (isPrivyProvider() && privy.user?.wallet) {
          // Wait for wallets to be ready
          if (!walletsReady) {
            throw new Error('Wallets not ready yet')
          }

          // Find the wallet that matches the user's address
          const userWallet = wallets.find(
            (wallet) => wallet.address?.toLowerCase() === address?.toLowerCase()
          )

          if (userWallet) {
            console.log(
              'MiniApp using wallet:',
              userWallet.walletClientType,
              'with address:',
              userWallet.address
            )

            // For external wallets (injected or WalletConnect), use window.ethereum if available
            if (
              userWallet.walletClientType !== 'privy' &&
              userWallet.walletClientType !== 'embedded'
            ) {
              console.log('MiniApp using external wallet for transaction')
              // For external wallets, use window.ethereum if available
              if (typeof window !== 'undefined' && (window as any).ethereum) {
                client = (window as any).ethereum
              } else {
                // Fallback to Privy's embedded wallet
                client = createPrivyProvider(privy)
              }
            } else {
              console.log('MiniApp using Privy embedded wallet for transaction')
              // Use Privy's embedded wallet
              client = createPrivyProvider(privy)
            }
          } else {
            console.log('MiniApp no matching wallet found, using Privy embedded wallet')
            // Fallback to Privy's embedded wallet
            client = createPrivyProvider(privy)
          }
        } else if (walletClient) {
          // For WalletConnect, use the provided walletClient
          client = walletClient
        }

        if (client) {
          provider = {
            request: async (args: { method: string; params: any[] }) => {
              if (!isCurrentFrame) return null

              log('MiniApp provider request:', args.method, args.params)

              // Check if this is a transaction request
              if (args.method === 'eth_sendTransaction' || args.method === 'eth_signTransaction') {
                // If we have a previous rejection error, return it immediately
                if (lastTransactionErrorRef.current) {
                  const error = lastTransactionErrorRef.current
                  lastTransactionErrorRef.current = null
                  throw error
                }

                if (isTransactionInProgressRef.current) {
                  log('Transaction already in progress, ignoring request')
                  return null
                }

                isTransactionInProgressRef.current = true
                try {
                  const result = await client.request({ ...args, params: args.params || [] })
                  log('Transaction result:', result)
                  return result
                } catch (error: any) {
                  // Store the error if it's a user rejection
                  if (error?.code === 4001 || error?.message?.includes('User denied')) {
                    lastTransactionErrorRef.current = error
                  }
                  throw error
                } finally {
                  // Reset the transaction lock after a short delay
                  setTimeout(() => {
                    isTransactionInProgressRef.current = false
                  }, 1000)
                }
              }

              // Handle signature requests
              if (
                args.method === 'personal_sign' ||
                args.method === 'eth_sign' ||
                args.method === 'eth_signTypedData_v4'
              ) {
                log('Handling signature request:', args.method)
                try {
                  const result = await client.request({ ...args, params: args.params || [] })
                  log('Signature result:', result)
                  return result
                } catch (error: any) {
                  log('Signature error:', error)
                  throw error
                }
              }

              // Handle all other requests
              try {
                const result = await client.request({ ...args, params: args.params || [] })
                log('Other request result:', result)
                return result
              } catch (error: any) {
                log('Other request error:', error)
                throw error
              }
            },
            on: (_event: string, _listener: any) => {
              log('Provider event listener added:', _event)
              return provider
            },
            removeListener: (_event: string, _listener: any) => {
              log('Provider event listener removed:', _event)
              return provider
            },
          }
        }
      } catch (err: any) {
        if (!isCurrentFrame) return
        const errorMessage = err?.message || 'Failed to initialize wallet'
        log('Wallet initialization error:', errorMessage)
        setError(errorMessage)
      }

      if (!isCurrentFrame) return

      const handleMessage = (event: MessageEvent) => {
        if (!isCurrentFrame) return
        if (event.source === iframeRef.current?.contentWindow) {
          logMessage(event.data as FrameMessage)
        }
      }

      const announceProvider = (endpoint: any) => {
        if (!provider) {
          log('No provider available to announce')
          return
        }
        log('Announcing provider...')
        endpoint.emit({
          event: 'eip6963:announceProvider',
          info: {
            name: 'App wallet (parent page)',
            icon: '/favicon.ico',
            rdns: 'com.banklessacademy.frame',
            uuid: '1395b549-854c-48c4-96af-5a58012196e5',
          },
        })
        log('Provider announced')
      }

      window.addEventListener('message', handleMessage)

      const { endpoint, cleanup } = exposeToIframe({
        iframe: iframeRef.current,
        sdk: {
          ready: (options: any) => {
            if (!isCurrentFrame) return
            log('Frame ready called with options:', options)
            setIsInitialized(true)
            setIsLoading(false)
          },
          eip6963RequestProvider: () => {
            if (!isCurrentFrame || !provider) return
            log('Provider requested')
            if (endpoint) announceProvider(endpoint)
          },
          ethProviderRequestV2: async (request: any) => {
            if (!isCurrentFrame || !provider) {
              log('Provider not available for request:', request.value.method)
              return {
                error: {
                  code: -32603,
                  message: 'Wallet not available',
                },
              }
            }

            log('ETH request received:', request.value.method, request.value)
            if (!request?.value?.method) {
              log('Invalid request format:', request)
              return {
                error: {
                  code: -32602,
                  message: 'Invalid request format',
                },
              }
            }

            try {
              log('Calling provider.request with:', request.value.method, request.value.params)
              const response = await provider.request({
                method: request.value.method,
                params: request.value.params || [],
              })
              log('Provider request completed, response:', response)
              log('Response type:', typeof response)
              log('Response is promise:', response instanceof Promise)

              // Try both formats - the iframe might expect different response structures
              const result = { result: response }
              log('Returning result to iframe:', result)
              log('Result type:', typeof result)
              return result
            } catch (error: any) {
              log('Provider request failed:', error)
              const errorResult = {
                error: {
                  code: error?.code || -32603,
                  message: error?.message || 'Internal error',
                  data: error?.data,
                },
              }
              log('Returning error to iframe:', errorResult)
              return errorResult
            }
          },
        } as unknown as FrameHost,
        ethProvider: provider as any,
        frameOrigin: '*',
        debug: true,
      })

      frameHostRef.current = { endpoint, cleanup }

      cleanupRef.current = () => {
        isCurrentFrame = false
        window.removeEventListener('message', handleMessage)
        if (frameHostRef.current?.cleanup) {
          try {
            frameHostRef.current.cleanup()
          } catch (error) {
            log('Error during frame host cleanup:', error)
          }
        }
        frameHostRef.current = null
        setIsInitialized(false)
        setIsLoading(false)
        setError(null)
      }
    }

    initFrame()

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [address, frameUrl])

  const handleIframeLoad = () => {
    log('Iframe loaded')
  }

  return (
    <Box position="relative" width="424px" maxWidth="100vw" margin="0 auto">
      {!address ? (
        <Text>Please connect your wallet first</Text>
      ) : (
        <>
          {isLoading && (
            <Flex
              position="absolute"
              top="-100px"
              left="0"
              right="0"
              justify="center"
              align="center"
              height="100px"
            >
              <Spinner size="md" color="blue.500" />
            </Flex>
          )}
          {error && (
            <Text color="red.500" marginBottom="10px">
              {error}
            </Text>
          )}
          <iframe
            key={`${address}-${frameUrl}`}
            ref={iframeRef}
            id={FRAME_ID}
            src={frameUrl}
            height={695}
            width={424}
            style={{
              border: 'none',
              opacity: isInitialized ? 1 : 0.5,
              transition: 'opacity 0.3s ease',
              maxWidth: '100vw',
            }}
            allow="microphone; camera; clipboard-write 'src'"
            sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
            onLoad={handleIframeLoad}
          />
        </>
      )}
    </Box>
  )
}
