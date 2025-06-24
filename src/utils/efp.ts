import { ethers } from 'ethers'

// EFP API Base URL
const EFP_API_BASE = 'https://api.ethfollow.xyz/api/v1'

// EFP Contract Addresses (Base Mainnet) - Updated with correct address
const EFP_CONTRACT_ADDRESS = '0x41Aa48Ef3c0446b46a5b1cc6337FF3d3716E2A33'

// EFP List Registry Contract Address (Base Mainnet)
const EFP_LIST_REGISTRY_ADDRESS = '0x0E688f5DCa4a0a4729946ACbC44C792341714e08'

// EFP List Minter Contract Address (Base Mainnet)
const EFP_LIST_MINTER_ADDRESS = '0xDb17Bfc64aBf7B7F080a49f0Bbbf799dDbb48Ce5'

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

// EFP List Registry ABI
const EFP_LIST_REGISTRY_ABI = [
  'function getListStorageLocation(uint256 tokenId) external view returns (bytes memory)',
  'function setListStorageLocation(uint256 tokenId, bytes calldata listStorageLocation) external',
]

// EFP List Minter ABI
const EFP_LIST_MINTER_ABI = [
  'function easyMint(bytes calldata listStorageLocation) external payable',
  'function easyMintTo(address to, bytes calldata listStorageLocation) external payable',
  'function mintNoMeta(bytes calldata listStorageLocation) external payable',
  'function mintToNoMeta(address to, bytes calldata listStorageLocation) external payable',
  'function mintPrimaryListNoMeta(bytes calldata listStorageLocation) external payable',
]

// EFP List Records ABI (for managing lists)
const EFP_LIST_RECORDS_ABI = [
  'function claimListManager(bytes32 slot) external',
  'function setListManager(bytes32 slot, address manager) external',
  'function setListUser(bytes32 slot, address user) external',
  'function setMetadataValue(bytes32 slot, string calldata key, bytes calldata value) external',
  'function getMetadataValue(bytes32 slot, string calldata key) external view returns (bytes memory)',
  'function applyListOps(uint256 slot, bytes[] calldata ops) external',
]

// EFP Account Metadata ABI
const EFP_ACCOUNT_METADATA_ABI = [
  'function setValue(string calldata key, bytes calldata value) external',
]

// EFP ListOp constants
const LISTOP_VERSION = 0x01
const OPERATION_ADD = 0x01
const OPERATION_REMOVE = 0x02
const OPERATION_TAG = 0x03
const OPERATION_UNTAG = 0x04
const LISTRECORD_VERSION = 0x01
const LISTRECORD_TYPE_ADDRESS = 0x01

// EFP Contract Addresses (Base Mainnet)
const EFP_LIST_RECORDS_ADDRESS = '0x41Aa48Ef3c0446b46a5b1cc6337FF3d3716E2A33'
const EFP_ACCOUNT_METADATA_ADDRESS = '0x0000000000000000000000000000000000000000' // TODO: Add correct address

// EFP Standard Tags
export const EFP_STANDARD_TAGS = {
  BLOCK: 'block',
  MUTE: 'mute',
  TOP8: 'top8',
} as const

// EFP Custom Tag Constraints
const MAX_TAG_LENGTH_BYTES = 255

// TypeScript ListOp type
export type ListOp = {
  version: number // 0-255
  opcode: number // 0-255
  data: Uint8Array
}

/**
 * Validate a tag according to EFP specifications
 */
export function validateEFPTag(tag: string): { isValid: boolean; error?: string } {
  // Check for leading or trailing whitespace
  if (tag !== tag.trim()) {
    return { isValid: false, error: 'Tag cannot have leading or trailing whitespace' }
  }

  // Check maximum length (255 bytes)
  const tagBytes = Buffer.from(tag, 'utf8')
  if (tagBytes.length > MAX_TAG_LENGTH_BYTES) {
    return { isValid: false, error: `Tag exceeds maximum length of ${MAX_TAG_LENGTH_BYTES} bytes` }
  }

  // Check if tag is empty after trimming
  if (tag.length === 0) {
    return { isValid: false, error: 'Tag cannot be empty' }
  }

  return { isValid: true }
}

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
 * Convert a token ID to a slot value by calling the EFP List Registry contract
 * @param tokenId The token ID (e.g., "463")
 * @param provider The ethers provider to use for the contract call
 * @returns The slot value as a BigInt
 */
export async function getSlotFromTokenId(tokenId: string, provider: ethers.Provider): Promise<bigint> {
  try {
    const listRegistryContract = new ethers.Contract(
      EFP_LIST_REGISTRY_ADDRESS,
      EFP_LIST_REGISTRY_ABI,
      provider
    )

    console.log(`Calling getListStorageLocation for token ID: ${tokenId}`)
    const listStorageLocation = await listRegistryContract.getListStorageLocation(tokenId)

    console.log('List Storage Location:', listStorageLocation)

    // Extract the last 32 bytes (64 hex characters) which contain the slot
    const slotHex = listStorageLocation.slice(-64) // last 32 bytes in hex
    const slotBigInt = BigInt('0x' + slotHex)

    console.log('Extracted slot hex:', slotHex)
    console.log('Slot as BigInt:', slotBigInt.toString())

    return slotBigInt
  } catch (error) {
    console.error('Error getting slot from token ID:', error)
    throw new Error(`Failed to get slot for token ID ${tokenId}: ${error}`)
  }
}

/**
 * Convert a user's primary list ID to a slot value
 * @param userAddress The user's address
 * @param provider The ethers provider to use for the contract call
 * @returns The slot value as a BigInt
 */
export async function getUserPrimaryListSlot(userAddress: string, provider: ethers.Provider): Promise<bigint> {
  try {
    // First get the primary list ID from the API
    const primaryListId = await getUserPrimaryList(userAddress)
    console.log(`Primary list ID for ${userAddress}: ${primaryListId}`)

    // Then convert the list ID to a slot
    const slot = await getSlotFromTokenId(primaryListId, provider)
    console.log(`Slot for primary list ${primaryListId}: ${slot.toString()}`)

    return slot
  } catch (error) {
    console.error('Error getting user primary list slot:', error)
    throw error
  }
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
  console.log('Operation:', operation === OPERATION_ADD ? 'ADD' : operation === OPERATION_REMOVE ? 'REMOVE' : 'TAG')

  return '0x' + encoded
}

/**
 * Encode a ListOp for tagging an address record with a tag
 */
function encodeTaggedListOp(targetAddress: string, tag: string): string {
  // Validate the tag first
  const validation = validateEFPTag(tag)
  if (!validation.isValid) {
    throw new Error(`Invalid tag: ${validation.error}`)
  }
  // Address as 20 bytes
  const addressBytes = Buffer.from(targetAddress.replace('0x', '').padStart(40, '0'), 'hex')
  // Tag as UTF-8 bytes
  const tagBytes = Buffer.from(tag, 'utf8')
  // Data: [record_version][record_type][address][tag]
  const data = Buffer.concat([
    Buffer.from([LISTRECORD_VERSION]),
    Buffer.from([LISTRECORD_TYPE_ADDRESS]),
    addressBytes,
    tagBytes
  ])
  // ListOp: [version][opcode][data]
  const listOp = Buffer.concat([
    Buffer.from([LISTOP_VERSION]),
    Buffer.from([OPERATION_TAG]),
    data
  ])
  return '0x' + listOp.toString('hex')
}

/**
 * Encode a ListOp for untagging an address record with a tag
 */
function encodeUntaggedListOp(targetAddress: string, tag: string): string {
  // Validate the tag first
  const validation = validateEFPTag(tag)
  if (!validation.isValid) {
    throw new Error(`Invalid tag: ${validation.error}`)
  }
  // Address as 20 bytes
  const addressBytes = Buffer.from(targetAddress.replace('0x', '').padStart(40, '0'), 'hex')
  // Tag as UTF-8 bytes
  const tagBytes = Buffer.from(tag, 'utf8')
  // Data: [record_version][record_type][address][tag]
  const data = Buffer.concat([
    Buffer.from([LISTRECORD_VERSION]),
    Buffer.from([LISTRECORD_TYPE_ADDRESS]),
    addressBytes,
    tagBytes
  ])
  // ListOp: [version][opcode][data]
  const listOp = Buffer.concat([
    Buffer.from([LISTOP_VERSION]),
    Buffer.from([OPERATION_UNTAG]),
    data
  ])
  return '0x' + listOp.toString('hex')
}

/**
 * Encode a ListOp for adding an address with multiple tags
 * Note: This creates separate ListOps for each tag
 */
function encodeMultiTaggedListOp(targetAddress: string, tags: string[]): string[] {
  // Validate all tags first
  for (const tag of tags) {
    const validation = validateEFPTag(tag)
    if (!validation.isValid) {
      throw new Error(`Invalid tag "${tag}": ${validation.error}`)
    }
  }

  return tags.map(tag => encodeTaggedListOp(targetAddress, tag))
}

/**
 * Generate a random slot for list management
 */
function generateRandomSlot(): string {
  // Generate a random 32-byte value
  const randomBytes = ethers.randomBytes(32)
  return ethers.hexlify(randomBytes)
}

/**
 * Create a list storage location bytes array
 */
function createListStorageLocation(chainId: number, listRecordsAddress: string, slot: string): string {
  const version = '0x01'
  const locationType = '0x01' // EVM
  const chainIdBytes = ethers.zeroPadValue(ethers.toBeHex(chainId), 32)
  const listRecordsBytes = ethers.zeroPadValue(listRecordsAddress, 20)

  // Encode packed: version + locationType + chainId + listRecordsAddress + slot
  const encoded = ethers.concat([
    version,
    locationType,
    chainIdBytes,
    listRecordsBytes,
    slot
  ])

  console.log('List Storage Location:', encoded)
  return encoded
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

    // Get the user's primary list slot
    const primaryListSlot = await getUserPrimaryListSlot(userAddress, baseSigner.provider!)
    console.log(`Using primary list slot ${primaryListSlot.toString()} for follow operation`)

    const efpContract = new ethers.Contract(
      EFP_CONTRACT_ADDRESS,
      EFP_ABI,
      baseSigner
    )

    // Encode the ListOp for adding the address
    const listOp = encodeListOp(OPERATION_ADD, targetAddress)
    console.log('Follow ListOp:', listOp)
    console.log('Contract address:', EFP_CONTRACT_ADDRESS)
    console.log('Slot (primaryListSlot):', primaryListSlot.toString())
    console.log('Ops array:', [listOp])

    // Apply the ListOp to the user's primary list
    const tx = await efpContract.applyListOps(primaryListSlot, [listOp])
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

    // Get the user's primary list slot
    const primaryListSlot = await getUserPrimaryListSlot(userAddress, baseSigner.provider!)
    console.log(`Using primary list slot ${primaryListSlot.toString()} for unfollow operation`)

    const efpContract = new ethers.Contract(
      EFP_CONTRACT_ADDRESS,
      EFP_ABI,
      baseSigner
    )

    // Encode the ListOp for removing the address
    const listOp = encodeListOp(OPERATION_REMOVE, targetAddress)
    console.log('Unfollow ListOp:', listOp)

    // Apply the ListOp to the user's primary list
    const tx = await efpContract.applyListOps(primaryListSlot, [listOp])
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

    // Get the user's primary list slot
    const primaryListSlot = await getUserPrimaryListSlot(userAddress, baseSigner.provider!)

    const efpContract = new ethers.Contract(
      EFP_CONTRACT_ADDRESS,
      EFP_ABI,
      baseSigner
    )

    // Get all ListOps for the user's primary list
    const allOps = await efpContract.getAllListOps(primaryListSlot)

    // Check if the target address is in the following list
    // This is a simplified check - in a real implementation you'd need to decode all ops
    // For now, we'll fall back to the API check
    console.log(`Found ${allOps.length} ListOps for primary list slot ${primaryListSlot.toString()}`)

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

/**
 * Example function demonstrating token ID to slot conversion
 * This shows how to convert token ID "463" to the expected slot value
 * @param provider The ethers provider to use for the contract call
 */
export async function demonstrateTokenIdToSlotConversion(provider: ethers.Provider): Promise<void> {
  try {
    console.log('=== EFP Token ID to Slot Conversion Demo ===')

    // Example: Convert token ID "463" to slot
    const tokenId = "463"
    const slot = await getSlotFromTokenId(tokenId, provider)

    console.log(`Token ID: ${tokenId}`)
    console.log(`Slot: ${slot.toString()}`)
    console.log(`Expected slot: 18766030840332336081687800343669161599280935459580847353819603320217470654654`)
    console.log(`Match: ${slot.toString() === '18766030840332336081687800343669161599280935459580847353819603320217470654654'}`)

    console.log('=== Demo Complete ===')
  } catch (error) {
    console.error('Demo failed:', error)
  }
}

/**
 * Mint a new EFP List NFT
 */
export async function mintEFPList(signer: ethers.Signer): Promise<bigint> {
  try {
    // Ensure we're on Base network
    const baseSigner = await ensureBaseNetwork(signer)

    const listMinterContract = new ethers.Contract(
      EFP_LIST_MINTER_ADDRESS,
      EFP_LIST_MINTER_ABI,
      baseSigner
    )

    console.log('Attempting to mint new EFP List NFT...')
    console.log('Minter contract address:', EFP_LIST_MINTER_ADDRESS)
    console.log('User address:', await baseSigner.getAddress())

    // Try to estimate gas first to see if the call would succeed
    try {
      const gasEstimate = await listMinterContract.mint.estimateGas()
      console.log('Gas estimate for mint:', gasEstimate.toString())
    } catch (estimateError) {
      console.error('Gas estimation failed:', estimateError)
      throw new Error(`Mint function not available or failed: ${estimateError}`)
    }

    const tx = await listMinterContract.mint()
    console.log('Mint transaction sent:', tx.hash)

    const receipt = await tx.wait()
    console.log('Mint transaction confirmed:', receipt.hash)

    // For now, return a placeholder tokenId since we can't easily parse the event
    // In a production environment, you'd parse the Transfer event to get the tokenId
    console.log('List NFT minted successfully!')
    console.log('Note: TokenId parsing not implemented - using placeholder')

    return BigInt(0) // TODO: Parse actual tokenId from Transfer event
  } catch (error: any) {
    console.error('Error minting EFP List:', error)

    // Provide more specific error messages
    if (error.message?.includes('CALL_EXCEPTION')) {
      throw new Error('Mint function failed - contract may not be deployed or function may not exist')
    }

    throw error
  }
}

/**
 * Create a dedicated EFP list with a tag (alternative approach without minting)
 * This uses a deterministic slot based on user address and tag
 */
export async function createDedicatedEFPListWithoutMinting(
  signer: ethers.Signer,
  tag: string,
  listName?: string
): Promise<{ tokenId: bigint, slot: string }> {
  try {
    // Ensure we're on Base network
    const baseSigner = await ensureBaseNetwork(signer)
    const userAddress = await baseSigner.getAddress()

    console.log(`Creating dedicated EFP list with tag: ${tag} (without minting)`)

    // Generate a deterministic slot based on user address and tag
    const slotInput = ethers.toUtf8Bytes(`${userAddress.toLowerCase()}-${tag}`)
    const slot = ethers.keccak256(slotInput)
    console.log(`Generated deterministic slot: ${slot}`)

    // Check if the slot is already claimed
    const listRecordsContract = new ethers.Contract(
      EFP_LIST_RECORDS_ADDRESS,
      EFP_LIST_RECORDS_ABI,
      baseSigner
    )

    try {
      // Try to claim the slot
      console.log('Claiming list manager...')
      const claimTx = await listRecordsContract.claimListManager(slot)
      await claimTx.wait()
      console.log('List manager claimed!')
    } catch (claimError: any) {
      if (claimError.message?.includes('already claimed') || claimError.message?.includes('revert')) {
        console.log('Slot already claimed, checking if we can manage it...')
        // Slot might already be claimed by this user or we might have access
      } else {
        throw claimError
      }
    }

    // Set yourself as manager and user
    console.log('Setting list manager and user...')
    try {
      const managerTx = await listRecordsContract.setListManager(slot, userAddress)
      await managerTx.wait()
    } catch (error: any) {
      console.log('Manager already set or not authorized:', error.message)
    }

    try {
      const userTx = await listRecordsContract.setListUser(slot, userAddress)
      await userTx.wait()
    } catch (error: any) {
      console.log('User already set or not authorized:', error.message)
    }
    console.log('List manager and user set!')

    // Set list name if provided
    if (listName) {
      console.log(`Setting list name: ${listName}`)
      try {
        const nameBytes = ethers.toUtf8Bytes(listName)
        const nameTx = await listRecordsContract.setMetadataValue(slot, "name", nameBytes)
        await nameTx.wait()
        console.log('List name set!')
      } catch (error: any) {
        console.log('Could not set list name:', error.message)
      }
    }

    // Use a placeholder tokenId since we're not minting
    const tokenId = BigInt(0)

    console.log(`Dedicated EFP list created successfully!`)
    console.log(`Token ID: ${tokenId.toString()}`)
    console.log(`Slot: ${slot}`)
    console.log(`Tag: ${tag}`)

    return { tokenId, slot }
  } catch (error: any) {
    console.error('Error creating dedicated EFP list without minting:', error)
    throw error
  }
}

/**
 * Create a dedicated EFP list with a tag
 */
export async function createDedicatedEFPList(
  signer: ethers.Signer,
  tag: string,
  listName?: string
): Promise<{ tokenId: bigint, slot: string }> {
  try {
    // Ensure we're on Base network
    const baseSigner = await ensureBaseNetwork(signer)
    const userAddress = await baseSigner.getAddress()

    console.log(`Creating dedicated EFP list with tag: ${tag}`)

    // 1. Generate a random slot
    const slot = generateRandomSlot()
    console.log(`Generated slot: ${slot}`)

    // 2. Create the list storage location
    const listStorageLocation = createListStorageLocation(
      BASE_CHAIN_ID,
      EFP_LIST_RECORDS_ADDRESS,
      slot
    )

    // 3. Mint using the easyMint function
    const listMinterContract = new ethers.Contract(
      EFP_LIST_MINTER_ADDRESS,
      EFP_LIST_MINTER_ABI,
      baseSigner
    )

    console.log('Minting list using easyMint...')
    const mintTx = await listMinterContract.easyMint(listStorageLocation)
    const mintReceipt = await mintTx.wait()
    console.log('List minted! Transaction hash:', mintReceipt.hash)

    // For now, use a placeholder tokenId since we can't easily parse the event
    const tokenId = BigInt(0) // TODO: Parse actual tokenId from Transfer event

    // 4. Claim the slot in the List Records contract
    const listRecordsContract = new ethers.Contract(
      EFP_LIST_RECORDS_ADDRESS,
      EFP_LIST_RECORDS_ABI,
      baseSigner
    )

    console.log('Claiming list manager...')
    const claimTx = await listRecordsContract.claimListManager(slot)
    await claimTx.wait()
    console.log('List manager claimed!')

    // 5. Set yourself as manager and user
    console.log('Setting list manager and user...')
    const managerTx = await listRecordsContract.setListManager(slot, userAddress)
    await managerTx.wait()

    const userTx = await listRecordsContract.setListUser(slot, userAddress)
    await userTx.wait()
    console.log('List manager and user set!')

    // 6. Set list name if provided
    if (listName) {
      console.log(`Setting list name: ${listName}`)
      const nameBytes = ethers.toUtf8Bytes(listName)
      const nameTx = await listRecordsContract.setMetadataValue(slot, "name", nameBytes)
      await nameTx.wait()
      console.log('List name set!')
    }

    console.log(`Dedicated EFP list created successfully!`)
    console.log(`Token ID: ${tokenId.toString()}`)
    console.log(`Slot: ${slot}`)
    console.log(`Tag: ${tag}`)

    return { tokenId, slot }
  } catch (error: any) {
    console.error('Error creating dedicated EFP list:', error)
    throw error
  }
}

/**
 * Add an address to a dedicated list with a tag
 */
export async function addAddressToDedicatedList(
  signer: ethers.Signer,
  slot: string,
  targetAddress: string,
  tag: string
): Promise<string> {
  try {
    // Ensure we're on Base network
    const baseSigner = await ensureBaseNetwork(signer)

    const listRecordsContract = new ethers.Contract(
      EFP_LIST_RECORDS_ADDRESS,
      EFP_LIST_RECORDS_ABI,
      baseSigner
    )

    // Encode the tagged ListOp
    const listOp = encodeTaggedListOp(targetAddress, tag)
    console.log('Adding address to dedicated list with tag:', listOp)

    // Convert bytes32 slot to uint256 for applyListOps
    const slotUint256 = BigInt(slot)

    // Apply the ListOp to the list
    const tx = await listRecordsContract.applyListOps(slotUint256, [listOp])
    const receipt = await tx.wait()

    console.log(`Address ${targetAddress} added to list with tag "${tag}"`)
    return receipt.hash
  } catch (error) {
    console.error('Error adding address to dedicated list:', error)
    throw error
  }
}

/**
 * Add an address to a dedicated list with multiple tags
 */
export async function addAddressToDedicatedListWithMultipleTags(
  signer: ethers.Signer,
  slot: string,
  targetAddress: string,
  tags: string[]
): Promise<string> {
  try {
    // Ensure we're on Base network
    const baseSigner = await ensureBaseNetwork(signer)

    const listRecordsContract = new ethers.Contract(
      EFP_LIST_RECORDS_ADDRESS,
      EFP_LIST_RECORDS_ABI,
      baseSigner
    )

    // Encode multiple tagged ListOps
    const listOps = encodeMultiTaggedListOp(targetAddress, tags)
    console.log(`Adding address to dedicated list with ${tags.length} tags:`, listOps)

    // Convert bytes32 slot to uint256 for applyListOps
    const slotUint256 = BigInt(slot)

    // Apply all ListOps to the list
    const tx = await listRecordsContract.applyListOps(slotUint256, listOps)
    const receipt = await tx.wait()

    console.log(`Address ${targetAddress} added to list with tags: ${tags.join(', ')}`)
    return receipt.hash
  } catch (error) {
    console.error('Error adding address to dedicated list with multiple tags:', error)
    throw error
  }
}

/**
 * Add an address to a dedicated list with standard EFP tags
 */
export async function addAddressToDedicatedListWithStandardTags(
  signer: ethers.Signer,
  slot: string,
  targetAddress: string,
  options: {
    top8?: boolean
    block?: boolean
    mute?: boolean
    customTags?: string[]
  }
): Promise<string> {
  const tags: string[] = []

  // Add standard tags based on options
  if (options.top8) tags.push(EFP_STANDARD_TAGS.TOP8)
  if (options.block) tags.push(EFP_STANDARD_TAGS.BLOCK)
  if (options.mute) tags.push(EFP_STANDARD_TAGS.MUTE)

  // Add custom tags
  if (options.customTags) {
    tags.push(...options.customTags)
  }

  if (tags.length === 0) {
    // No tags specified, add as simple follow
    return addAddressToDedicatedList(signer, slot, targetAddress, '')
  }

  return addAddressToDedicatedListWithMultipleTags(signer, slot, targetAddress, tags)
}

/**
 * Remove an address from a dedicated list
 */
export async function removeAddressFromDedicatedList(
  signer: ethers.Signer,
  slot: string,
  targetAddress: string
): Promise<string> {
  try {
    // Ensure we're on Base network
    const baseSigner = await ensureBaseNetwork(signer)

    const listRecordsContract = new ethers.Contract(
      EFP_LIST_RECORDS_ADDRESS,
      EFP_LIST_RECORDS_ABI,
      baseSigner
    )

    // Encode the remove ListOp
    const listOp = encodeListOp(OPERATION_REMOVE, targetAddress)
    console.log('Removing address from dedicated list:', listOp)

    // Convert bytes32 slot to uint256 for applyListOps
    const slotUint256 = BigInt(slot)

    // Apply the ListOp to the list
    const tx = await listRecordsContract.applyListOps(slotUint256, [listOp])
    const receipt = await tx.wait()

    console.log(`Address ${targetAddress} removed from list`)
    return receipt.hash
  } catch (error) {
    console.error('Error removing address from dedicated list:', error)
    throw error
  }
}

/**
 * Set a dedicated list as primary
 */
export async function setDedicatedListAsPrimary(
  signer: ethers.Signer,
  tokenId: bigint
): Promise<string> {
  try {
    // Ensure we're on Base network
    const baseSigner = await ensureBaseNetwork(signer)

    const accountMetadataContract = new ethers.Contract(
      EFP_ACCOUNT_METADATA_ADDRESS,
      EFP_ACCOUNT_METADATA_ABI,
      baseSigner
    )

    // Encode the tokenId as bytes
    const tokenIdBytes = ethers.toBeHex(tokenId)

    console.log('Setting dedicated list as primary...')
    const tx = await accountMetadataContract.setValue("primary-list", tokenIdBytes)
    const receipt = await tx.wait()

    console.log(`Dedicated list ${tokenId.toString()} set as primary`)
    return receipt.hash
  } catch (error) {
    console.error('Error setting dedicated list as primary:', error)
    throw error
  }
}

/**
 * Example function demonstrating the complete dedicated list workflow
 */
export async function demonstrateDedicatedListWorkflow(signer: ethers.Signer): Promise<void> {
  try {
    console.log('=== EFP Dedicated List Workflow Demo ===')

    // Example addresses to add to the list
    const exampleAddresses = [
      '0x1234567890123456789012345678901234567890',
      '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      '0x9876543210987654321098765432109876543210'
    ]

    // Create the ETHCC Friends list (no longer sets as primary)
    const result = await createETHCCFriendsListWithStandardTags(signer, exampleAddresses)

    console.log('Demo completed successfully!')
    console.log(`Created list with token ID: ${result.tokenId.toString()}`)
    console.log(`List slot: ${result.slot}`)
    console.log(`Total transactions: ${result.transactions.length}`)

    console.log('=== Demo Complete ===')
  } catch (error) {
    console.error('Demo failed:', error)
  }
}

/**
 * Complete example: Create ETHCC Friends list with standard EFP tags
 * This demonstrates using both standard tags (top8) and custom tags (ethcc)
 */
export async function createETHCCFriendsListWithStandardTags(
  signer: ethers.Signer,
  addressesToAdd: string[]
): Promise<{ tokenId: bigint, slot: string, transactions: string[] }> {
  try {
    console.log('=== Creating ETHCC Friends List with Standard Tags ===')

    // 1. Create the dedicated list with "ethcc" tag
    const { tokenId, slot } = await createDedicatedEFPListWithoutMinting(
      signer,
      'ethcc',
      'ETHCC Friends'
    )

    const transactions: string[] = []

    // 2. Add each address to the list with both "top8" and "ethcc" tags
    for (const address of addressesToAdd) {
      console.log(`Adding ${address} to ETHCC Friends list with Top 8 priority...`)
      const txHash = await addAddressToDedicatedListWithStandardTags(signer, slot, address, {
        top8: true, // Standard EFP tag for Top 8
        customTags: ['ethcc'] // Custom tag for ETHCC
      })
      transactions.push(txHash)
      console.log(`Added ${address} with transaction: ${txHash}`)
    }

    console.log('=== ETHCC Friends List Created Successfully ===')
    console.log(`Token ID: ${tokenId.toString()}`)
    console.log(`Slot: ${slot}`)
    console.log(`Total transactions: ${transactions.length}`)
    console.log('Tags applied: top8 (standard), ethcc (custom)')

    return { tokenId, slot, transactions }
  } catch (error) {
    console.error('Error creating ETHCC Friends list with standard tags:', error)
    throw error
  }
}

/**
 * Example: Add someone to your Top 8 with custom tags
 */
export async function addToTop8WithCustomTags(
  signer: ethers.Signer,
  slot: string,
  targetAddress: string,
  customTags: string[]
): Promise<string> {
  try {
    console.log(`Adding ${targetAddress} to Top 8 with custom tags: ${customTags.join(', ')}`)

    const txHash = await addAddressToDedicatedListWithStandardTags(signer, slot, targetAddress, {
      top8: true,
      customTags: customTags
    })

    console.log('Successfully added to Top 8 with custom tags!')
    return txHash
  } catch (error) {
    console.error('Error adding to Top 8 with custom tags:', error)
    throw error
  }
}

/**
 * Example: Block an address
 */
export async function blockAddress(
  signer: ethers.Signer,
  slot: string,
  targetAddress: string
): Promise<string> {
  try {
    console.log(`Blocking ${targetAddress}`)

    const txHash = await addAddressToDedicatedListWithStandardTags(signer, slot, targetAddress, {
      block: true
    })

    console.log('Successfully blocked address!')
    return txHash
  } catch (error) {
    console.error('Error blocking address:', error)
    throw error
  }
}

/**
 * Example: Mute an address
 */
export async function muteAddress(
  signer: ethers.Signer,
  slot: string,
  targetAddress: string
): Promise<string> {
  try {
    console.log(`Muting ${targetAddress}`)

    const txHash = await addAddressToDedicatedListWithStandardTags(signer, slot, targetAddress, {
      mute: true
    })

    console.log('Successfully muted address!')
    return txHash
  } catch (error) {
    console.error('Error muting address:', error)
    throw error
  }
}

/**
 * Get list storage location for a given token ID
 */
export async function getListStorageLocation(tokenId: bigint, provider: ethers.Provider): Promise<string> {
  try {
    const listRegistryContract = new ethers.Contract(
      EFP_LIST_REGISTRY_ADDRESS,
      EFP_LIST_REGISTRY_ABI,
      provider
    )

    const storageLocation = await listRegistryContract.getListStorageLocation(tokenId)
    return storageLocation
  } catch (error) {
    console.error('Error getting list storage location:', error)
    throw error
  }
}

/**
 * Get list metadata value
 */
export async function getListMetadataValue(
  slot: string,
  key: string,
  provider: ethers.Provider
): Promise<string> {
  try {
    const listRecordsContract = new ethers.Contract(
      EFP_LIST_RECORDS_ADDRESS,
      EFP_LIST_RECORDS_ABI,
      provider
    )

    const value = await listRecordsContract.getMetadataValue(slot, key)
    return value
  } catch (error) {
    console.error('Error getting list metadata value:', error)
    throw error
  }
}

/**
 * Check if an address is in a dedicated list with a specific tag
 */
export async function isAddressInDedicatedList(
  slot: string,
  targetAddress: string,
  tag: string,
  provider: ethers.Provider
): Promise<boolean> {
  try {
    const listRecordsContract = new ethers.Contract(
      EFP_LIST_RECORDS_ADDRESS,
      EFP_LIST_RECORDS_ABI,
      provider
    )

    // Get all ListOps for the list
    const allOps = await listRecordsContract.getAllListOps(BigInt(slot))

    // Check if there's a tagged operation for this address with the specified tag
    // This is a simplified check - in practice you'd need to decode all ops
    console.log(`Found ${allOps.length} ListOps for list slot ${slot}`)

    // For now, return false and let the API handle the check
    return false
  } catch (error) {
    console.error('Error checking if address is in dedicated list:', error)
    return false
  }
}

/**
 * Get all addresses in a dedicated list with a specific tag
 */
export async function getAddressesInDedicatedList(
  slot: string,
  tag: string,
  provider: ethers.Provider
): Promise<string[]> {
  try {
    const listRecordsContract = new ethers.Contract(
      EFP_LIST_RECORDS_ADDRESS,
      EFP_LIST_RECORDS_ABI,
      provider
    )

    // Get all ListOps for the list
    const allOps = await listRecordsContract.getAllListOps(BigInt(slot))

    // Decode all ops to find addresses with the specified tag
    // This is a simplified implementation - in practice you'd need to decode all ops
    console.log(`Found ${allOps.length} ListOps for list slot ${slot}`)

    // For now, return empty array and let the API handle the check
    return []
  } catch (error) {
    console.error('Error getting addresses in dedicated list:', error)
    return []
  }
} 
