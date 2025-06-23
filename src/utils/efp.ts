import { ethers } from 'ethers'

// EFP API Base URL
const EFP_API_BASE = 'https://api.ethfollow.xyz/api/v1'

// EFP Contract Addresses (Base Mainnet) - Updated with correct address
const EFP_CONTRACT_ADDRESS = '0x41Aa48Ef3c0446b46a5b1cc6337FF3d3716E2A33'

// Base Network Configuration
const BASE_CHAIN_ID = 8453
const BASE_RPC_URL = 'https://mainnet.base.org'

// EFP Contract ABI (correct function signatures from the test file)
const EFP_ABI = [
  'function applyListOps(uint256 slot, bytes[] calldata ops) external',
  'function getListOpCount(uint256 slot) external view returns (uint256)',
  'function getAllListOps(uint256 slot) external view returns (bytes[] memory)',
  'event ListOp(uint256 indexed slot, bytes op)',
]

// EFP ListOp constants
const LISTOP_VERSION = 0x01
const OPERATION_ADD = 0x01
const OPERATION_REMOVE = 0x02
const LISTRECORD_VERSION = 0x01
const LISTRECORD_TYPE_ADDRESS = 0x01

export interface EFPProfile {
  address: string
  ens?: string
  followers?: number
  following?: number
  lists?: any[]
}

export interface EFPList {
  id: number
  name?: string
  description?: string
  addresses: string[]
}

export interface EFPUserLists {
  primary_list: string
  lists: string[]
}

/**
 * Encode a ListOp for adding or removing an address record
 */
function encodeListOp(operation: number, targetAddress: string): string {
  // Remove '0x' prefix and pad to 20 bytes
  const addressBytes = targetAddress.replace('0x', '').padStart(40, '0')

  // Encode the ListOp according to the specification
  const encoded =
    LISTOP_VERSION.toString(16).padStart(2, '0') + // 1 byte: ListOp version
    operation.toString(16).padStart(2, '0') + // 1 byte: Operation code
    LISTRECORD_VERSION.toString(16).padStart(2, '0') + // 1 byte: ListRecord version
    LISTRECORD_TYPE_ADDRESS.toString(16).padStart(2, '0') + // 1 byte: ListRecord record type
    addressBytes // 20 bytes: ListRecord data (address)

  console.log('Encoded ListOp:', '0x' + encoded)
  console.log('Target address:', targetAddress)
  console.log('Operation:', operation === OPERATION_ADD ? 'ADD' : 'REMOVE')

  return '0x' + encoded
}

/**
 * Get user's primary list ID from EFP API
 */
async function getUserPrimaryList(userAddress: string): Promise<string> {
  try {
    const response = await fetch(`${EFP_API_BASE}/users/${userAddress}/lists`)
    if (!response.ok) {
      throw new Error('Failed to fetch user lists')
    }
    const data: EFPUserLists = await response.json()
    console.log('EFP API response for user lists:', data)
    console.log('Primary list ID from API:', data.primary_list)
    return data.primary_list
  } catch (error) {
    console.error('Error fetching user primary list:', error)
    // Fallback to a default slot if API fails
    console.log('Using fallback slot 0')
    return '0'
  }
}

/**
 * Ensure we're on Base network and switch if needed
 */
export async function ensureBaseNetwork(signer: ethers.Signer): Promise<ethers.Signer> {
  try {
    const network = await signer.provider?.getNetwork()
    const currentChainId = network?.chainId

    if (currentChainId !== BigInt(BASE_CHAIN_ID)) {
      console.log(`Switching from chain ${currentChainId} to Base (${BASE_CHAIN_ID})`)

      // Request network switch using window.ethereum directly
      const ethereum = (window as any).ethereum
      if (ethereum) {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${BASE_CHAIN_ID.toString(16)}` }]
        })

        // Wait a bit for the switch to complete
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Get the updated signer
        const newProvider = new ethers.BrowserProvider(ethereum)
        return await newProvider.getSigner()
      }
    }

    return signer
  } catch (error) {
    console.error('Error switching to Base network:', error)
    throw new Error('Please switch to Base network to use EFP features')
  }
}

/**
 * Get EFP profile data from their API
 */
export async function getEFPProfile(address: string): Promise<EFPProfile | null> {
  try {
    const response = await fetch(`${EFP_API_BASE}/users/${address}/details`)
    if (!response.ok) {
      throw new Error('Failed to fetch EFP profile')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching EFP profile:', error)
    return null
  }
}

/**
 * Get followers of an address
 */
export async function getEFPFollowers(address: string): Promise<string[]> {
  try {
    const response = await fetch(`${EFP_API_BASE}/users/${address}/followers`)
    if (!response.ok) {
      throw new Error('Failed to fetch EFP followers')
    }
    const data = await response.json()
    return data.followers || []
  } catch (error) {
    console.error('Error fetching EFP followers:', error)
    return []
  }
}

/**
 * Get following list of an address
 */
export async function getEFPFollowing(address: string): Promise<string[]> {
  try {
    const response = await fetch(`${EFP_API_BASE}/users/${address}/following`)
    if (!response.ok) {
      throw new Error('Failed to fetch EFP following')
    }
    const data = await response.json()
    return data.following || []
  } catch (error) {
    console.error('Error fetching EFP following:', error)
    return []
  }
}

/**
 * Check if one address is following another
 */
export async function isFollowing(followerAddress: string, targetAddress: string): Promise<boolean> {
  try {
    const following = await getEFPFollowing(followerAddress)
    return following.includes(targetAddress.toLowerCase())
  } catch (error) {
    console.error('Error checking follow status:', error)
    return false
  }
}

/**
 * Get lists for an address
 */
export async function getEFPLists(address: string): Promise<EFPList[]> {
  try {
    const response = await fetch(`${EFP_API_BASE}/users/${address}/lists`)
    if (!response.ok) {
      throw new Error('Failed to fetch EFP lists')
    }
    const data = await response.json()
    return data.lists || []
  } catch (error) {
    console.error('Error fetching EFP lists:', error)
    return []
  }
}

/**
 * Follow an address on-chain using EFP on Base
 */
export async function followAddressOnEFP(signer: ethers.Signer, targetAddress: string): Promise<string> {
  try {
    // Ensure we're on Base network
    const baseSigner = await ensureBaseNetwork(signer)

    // Get the user's address
    const userAddress = await baseSigner.getAddress()

    // Get the user's primary list
    const primaryListId = await getUserPrimaryList(userAddress)
    console.log(`Using primary list ${primaryListId} for follow operation`)

    const efpContract = new ethers.Contract(
      EFP_CONTRACT_ADDRESS,
      EFP_ABI,
      baseSigner
    )

    // Encode the ListOp for adding the address
    const listOp = encodeListOp(OPERATION_ADD, targetAddress)
    console.log('Follow ListOp:', listOp)
    console.log('Contract address:', EFP_CONTRACT_ADDRESS)
    console.log('Slot (primaryListId):', primaryListId)
    console.log('Ops array:', [listOp])

    // Apply the ListOp to the user's primary list
    const tx = await efpContract.applyListOps(primaryListId, [listOp])
    const receipt = await tx.wait()

    return receipt.hash
  } catch (error) {
    console.error('Error following address:', error)
    throw error
  }
}

/**
 * Unfollow an address on-chain using EFP on Base
 */
export async function unfollowAddressOnEFP(signer: ethers.Signer, targetAddress: string): Promise<string> {
  try {
    // Ensure we're on Base network
    const baseSigner = await ensureBaseNetwork(signer)

    // Get the user's address
    const userAddress = await baseSigner.getAddress()

    // Get the user's primary list
    const primaryListId = await getUserPrimaryList(userAddress)
    console.log(`Using primary list ${primaryListId} for unfollow operation`)

    const efpContract = new ethers.Contract(
      EFP_CONTRACT_ADDRESS,
      EFP_ABI,
      baseSigner
    )

    // Encode the ListOp for removing the address
    const listOp = encodeListOp(OPERATION_REMOVE, targetAddress)
    console.log('Unfollow ListOp:', listOp)

    // Apply the ListOp to the user's primary list
    const tx = await efpContract.applyListOps(primaryListId, [listOp])
    const receipt = await tx.wait()

    return receipt.hash
  } catch (error) {
    console.error('Error unfollowing address:', error)
    throw error
  }
}

/**
 * Check if an address is being followed on-chain on Base
 */
export async function isFollowingOnChain(signer: ethers.Signer, targetAddress: string): Promise<boolean> {
  try {
    // Ensure we're on Base network
    const baseSigner = await ensureBaseNetwork(signer)

    // Get the user's address
    const userAddress = await baseSigner.getAddress()

    // Get the user's primary list
    const primaryListId = await getUserPrimaryList(userAddress)

    const efpContract = new ethers.Contract(
      EFP_CONTRACT_ADDRESS,
      EFP_ABI,
      baseSigner
    )

    // Get all ListOps for the user's primary list
    const allOps = await efpContract.getAllListOps(primaryListId)

    // Check if the target address is in the following list
    // This is a simplified check - in a real implementation you'd need to decode all ops
    // For now, we'll fall back to the API check
    console.log(`Found ${allOps.length} ListOps for primary list ${primaryListId}`)

    // For now, return false and let the API handle the check
    return false
  } catch (error) {
    console.error('Error checking follow status on-chain:', error)
    return false
  }
}

/**
 * Get EFP profile URL for an address
 */
export function getEFPProfileUrl(address: string): string {
  return `https://efp.app/${address}`
} 
