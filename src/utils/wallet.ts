import { PROJECT_WALLET_TYPE } from 'config'
import { ethers } from 'ethers'

export interface HookError {
  message: string
  code?: string
  details?: any
  timestamp: number
}

export function getWalletProvider() {
  return PROJECT_WALLET_TYPE === 'privy' ? 'privy' : 'walletconnect'
}

export function createWalletError(message: string, code?: string, details?: any): HookError {
  return { 
    message, 
    code, 
    details,
    timestamp: Date.now() 
  }
}

export function isPrivyProvider() {
  return PROJECT_WALLET_TYPE === 'privy'
}

export function isWalletConnectProvider() {
  return PROJECT_WALLET_TYPE === 'walletconnect'
}

// Utility function to switch to Base network for any provider
export async function switchToBaseNetwork(privy?: any) {
  const BASE_CHAIN_ID = 8453

  if (isPrivyProvider() && privy) {
    try {
      // Use Privy's native chain switching
      await privy.switchChain(BASE_CHAIN_ID)
      console.log('Switched to Base network using Privy')
    } catch (error) {
      console.error('Error switching to Base network with Privy:', error)
      throw new Error('Failed to switch to Base network')
    }
  } else {
    // For WalletConnect, use window.ethereum
    try {
      const ethereum = (window as any).ethereum
      if (ethereum) {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${BASE_CHAIN_ID.toString(16)}` }]
        })
        console.log('Switched to Base network using WalletConnect')
      } else {
        throw new Error('No ethereum provider available')
      }
    } catch (error) {
      console.error('Error switching to Base network with WalletConnect:', error)
      throw new Error('Failed to switch to Base network')
    }
  }
}

// Create a proper ethers.js provider for Privy
export function createPrivyProvider(privy: any) {
  if (!privy || !privy.user?.wallet) {
    throw new Error('No Privy wallet available')
  }

  // Base network RPC URL
  const BASE_RPC_URL = 'https://mainnet.base.org'

  // Helper function to make RPC calls to Base network
  const makeRpcCall = async (method: string, params: any[] = []) => {
    try {
      const response = await fetch(BASE_RPC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method,
          params,
        }),
      })

      const data = await response.json()
      
      if (data.error) {
        throw new Error(`RPC Error: ${data.error.message}`)
      }
      
      return data.result
    } catch (error) {
      console.error(`RPC call failed for method ${method}:`, error)
      throw error
    }
  }

  // Create a custom provider that implements the necessary methods
  const provider = {
    // Required provider methods
    getSigner: async () => {
      return {
        getAddress: async () => privy.user.wallet.address,
        signMessage: async (message: string) => {
          return await privy.signMessage({ message })
        },
        signTransaction: async (transaction: any) => {
          // Privy doesn't expose signTransaction directly, so we'll throw an error
          throw new Error('signTransaction not supported with Privy')
        },
        connect: (provider: any) => provider,
        provider: provider,
        sendTransaction: async (transaction: any) => {
          const hash = await privy.sendTransaction({
            to: transaction.to,
            value: transaction.value?.toString() || '0x0',
            data: transaction.data || '0x',
          })
          return { hash }
        },
      }
    },
    
    // Provider interface methods
    request: async (args: { method: string; params?: any[] }) => {
      // Ensure we have a valid wallet before proceeding
      if (!privy.user?.wallet?.address) {
        throw new Error('No wallet address available')
      }

      switch (args.method) {
        case 'eth_accounts':
          return [privy.user.wallet.address]
        case 'eth_requestAccounts':
          // eth_requestAccounts is used to request wallet connection
          // Since we already have a connected wallet, just return the address
          return [privy.user.wallet.address]
        case 'eth_chainId':
          // Return Base network chain ID (8453) since EFP functions require it
          return '0x2105' // Base network chain ID in hex
        case 'eth_getBalance':
          // For balance requests, we can use Privy's methods or return 0
          return '0x0'
        case 'eth_sendTransaction':
          if (!args.params || !args.params[0]) {
            throw new Error('Transaction parameters required')
          }
          const tx = args.params[0] as any
          const hash = await privy.sendTransaction({
            to: tx.to,
            value: tx.value || '0x0',
            data: tx.data || '0x',
          })
          return hash
        case 'personal_sign':
        case 'eth_sign':
          console.log('Privy signature request:', args.method, args.params)
          if (!args.params || args.params.length < 2) {
            throw new Error('Message and address required for signing')
          }
          
          // personal_sign expects [message, address], eth_sign expects [address, message]
          let message: string
          if (args.method === 'personal_sign') {
            message = args.params[0] as string
          } else {
            // eth_sign - message is the second parameter
            message = args.params[1] as string
          }
          
          console.log('Signing message:', message)
          console.log('Message type:', typeof message)
          console.log('Message length:', message?.length)
          
          // Ensure message is properly formatted
          if (!message || typeof message !== 'string') {
            throw new Error('Invalid message format for signing')
          }
          console.log('Privy user state:', {
            authenticated: privy.authenticated,
            hasWallet: !!privy.user?.wallet,
            walletAddress: privy.user?.wallet?.address
          })
          const signatureResult = await privy.signMessage({ message })
          console.log('Signature result:', signatureResult)
          console.log('Signature type:', typeof signatureResult)
          
          // Privy returns an object with a signature property, but we need just the signature string
          const signature = typeof signatureResult === 'object' && signatureResult?.signature 
            ? signatureResult.signature 
            : signatureResult
          
          console.log('Extracted signature:', signature)
          return signature
        case 'eth_signTypedData_v4':
          console.log('Privy typed data signature request:', args.params)
          if (!args.params || args.params.length < 2) {
            throw new Error('Typed data and address required for signing')
          }
          const typedData = args.params[0] as string
          console.log('Signing typed data:', typedData)
          const typedSignatureResult = await privy.signMessage({ message: typedData })
          console.log('Typed signature result:', typedSignatureResult)
          
          // Privy returns an object with a signature property, but we need just the signature string
          const typedSignature = typeof typedSignatureResult === 'object' && typedSignatureResult?.signature 
            ? typedSignatureResult.signature 
            : typedSignatureResult
          
          console.log('Extracted typed signature:', typedSignature)
          return typedSignature
        case 'wallet_switchEthereumChain':
          // Use Privy's native chain switching
          if (!args.params || !args.params[0]) {
            throw new Error('Chain ID required for switching')
          }
          const chainId = args.params[0].chainId
          // Convert hex chain ID to number if needed
          const chainIdNumber = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId
          await privy.switchChain(chainIdNumber)
          return null
        case 'wallet_addEthereumChain':
          // Privy handles chain addition internally, so we'll just return success
          return null
        case 'eth_getBalance':
          // For balance requests, we can use Privy's methods or return 0
          return '0x0'
        case 'eth_blockNumber':
          // Return current block number
          try {
            return await makeRpcCall('eth_blockNumber', [])
          } catch (error) {
            console.error('Error getting block number:', error)
            return '0x0'
          }
        case 'eth_gasPrice':
          // Return current gas price
          try {
            return await makeRpcCall('eth_gasPrice', [])
          } catch (error) {
            console.error('Error getting gas price:', error)
            return '0x3b9aca00' // 1 gwei in hex
          }
        case 'eth_estimateGas':
          // Estimate gas for a transaction
          if (!args.params || !args.params[0]) {
            throw new Error('Transaction parameters required for gas estimation')
          }
          try {
            return await makeRpcCall('eth_estimateGas', [args.params[0]])
          } catch (error) {
            console.error('Error estimating gas:', error)
            return '0x5208' // 21000 gas (basic transfer) in hex
          }
        case 'wallet_getCapabilities':
          // Return wallet capabilities - what the wallet can do
          return {
            'eth_accounts': {
              required: true,
              optional: false
            },
            'eth_sendTransaction': {
              required: true,
              optional: false
            },
            'personal_sign': {
              required: true,
              optional: false
            },
            'eth_sign': {
              required: true,
              optional: false
            },
            'eth_signTypedData_v4': {
              required: true,
              optional: false
            },
            'wallet_switchEthereumChain': {
              required: true,
              optional: false
            },
            'wallet_addEthereumChain': {
              required: true,
              optional: false
            },
            'eth_requestAccounts': {
              required: true,
              optional: false
            },
            'eth_chainId': {
              required: true,
              optional: false
            },
            'eth_getBalance': {
              required: true,
              optional: false
            },
            'eth_blockNumber': {
              required: true,
              optional: false
            },
            'eth_gasPrice': {
              required: true,
              optional: false
            },
            'eth_estimateGas': {
              required: true,
              optional: false
            }
          }
        default:
          // For other RPC methods, we can either implement them or throw a more specific error
          console.warn(`RPC method ${args.method} not fully implemented for Privy`)
          throw new Error(`RPC method ${args.method} not implemented for Privy`)
      }
    },

    // Add missing provider methods that ethers.js expects
    getNetwork: async () => {
      return {
        chainId: BigInt(8453), // Base network
        name: 'Base',
      }
    },

    getBalance: async (address: string) => {
      try {
        const balance = await makeRpcCall('eth_getBalance', [address, 'latest'])
        return BigInt(balance)
      } catch (error) {
        console.error('Error getting balance:', error)
        return BigInt(0)
      }
    },

    getCode: async (address: string) => {
      try {
        return await makeRpcCall('eth_getCode', [address, 'latest'])
      } catch (error) {
        console.error('Error getting code:', error)
        return '0x'
      }
    },

    getStorageAt: async (address: string, position: string) => {
      try {
        return await makeRpcCall('eth_getStorageAt', [address, position, 'latest'])
      } catch (error) {
        console.error('Error getting storage:', error)
        return '0x'
      }
    },

    getTransactionCount: async (address: string) => {
      try {
        const count = await makeRpcCall('eth_getTransactionCount', [address, 'latest'])
        return BigInt(count)
      } catch (error) {
        console.error('Error getting transaction count:', error)
        return BigInt(0)
      }
    },

    getBlock: async (blockHashOrBlockTag: string | number) => {
      try {
        const block = await makeRpcCall('eth_getBlockByNumber', [
          typeof blockHashOrBlockTag === 'number' ? `0x${blockHashOrBlockTag.toString(16)}` : blockHashOrBlockTag,
          false
        ])
        return block
      } catch (error) {
        console.error('Error getting block:', error)
        // Return a minimal block structure
        return {
          hash: '0x',
          parentHash: '0x',
          number: 0,
          timestamp: 0,
          transactions: [],
        }
      }
    },

    getBlockNumber: async () => {
      try {
        const blockNumber = await makeRpcCall('eth_blockNumber', [])
        return BigInt(blockNumber)
      } catch (error) {
        console.error('Error getting block number:', error)
        return BigInt(0)
      }
    },

    getGasPrice: async () => {
      try {
        const gasPrice = await makeRpcCall('eth_gasPrice', [])
        return BigInt(gasPrice)
      } catch (error) {
        console.error('Error getting gas price:', error)
        return BigInt(1000000000) // 1 gwei fallback
      }
    },

    getFeeData: async () => {
      try {
        const [gasPrice, baseFeePerGas] = await Promise.all([
          makeRpcCall('eth_gasPrice', []),
          makeRpcCall('eth_getBlockByNumber', ['latest', false]).then(block => block?.baseFeePerGas || '0x0')
        ])
        
        return {
          gasPrice: BigInt(gasPrice),
          maxFeePerGas: BigInt(gasPrice) * BigInt(2), // 2x gas price
          maxPriorityFeePerGas: BigInt(1000000000), // 1 gwei
          lastBaseFeePerGas: BigInt(baseFeePerGas),
        }
      } catch (error) {
        console.error('Error getting fee data:', error)
        return {
          gasPrice: BigInt(1000000000), // 1 gwei
          maxFeePerGas: BigInt(2000000000), // 2 gwei
          maxPriorityFeePerGas: BigInt(1000000000), // 1 gwei
          lastBaseFeePerGas: BigInt(1000000000), // 1 gwei
        }
      }
    },

    estimateGas: async (transaction: any) => {
      try {
        const gasEstimate = await makeRpcCall('eth_estimateGas', [transaction])
        return BigInt(gasEstimate)
      } catch (error) {
        console.error('Error estimating gas:', error)
        return BigInt(21000) // Default gas limit
      }
    },

    call: async (transaction: any) => {
      try {
        console.log('Making contract call:', {
          to: transaction.to,
          data: transaction.data,
          from: transaction.from,
        })
        
        // Make actual RPC call to Base network
        const result = await makeRpcCall('eth_call', [transaction, 'latest'])
        
        console.log('Contract call result:', result)
        
        if (result === '0x') {
          console.warn('Contract call returned empty result (0x)')
        }
        
        return result
      } catch (error) {
        console.error('Error making contract call:', error)
        console.error('Transaction details:', transaction)
        throw error
      }
    },

    broadcastTransaction: async (signedTransaction: string) => {
      // For Privy, we don't broadcast directly, so throw an error
      throw new Error('broadcastTransaction not supported with Privy')
    },

    resolveName: async (name: string) => {
      // Return null for ENS resolution
      return null
    },

    lookupAddress: async (address: string) => {
      // Return null for reverse ENS lookup
      return null
    },
  }

  return provider
}


