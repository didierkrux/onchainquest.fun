import { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';
import SafeApiKit from '@safe-global/api-kit';
import Safe from '@safe-global/protocol-kit';
import { MetaTransactionData } from '@safe-global/safe-core-sdk-types';
import { DOMAIN_URL, adminWallets, eventId } from 'config';
import db from 'utils/db';

const RPC_URL = 'https://mainnet.base.org';

const OWNER_ADDRESS = process.env.OWNER_ADDRESS as string;
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;

const SAFE_ADDRESS = process.env.SAFE_ADDRESS as string;

const apiKit = new SafeApiKit({
  chainId: BigInt(8453), // Base Mainnet chainId
});

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const USDGLO_ADDRESS = '0x4F604735c1cF31399C6E711D5962b2B3E0225AD3';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({ message: 'Recipient address is required' });
    }

    // TODO: remove this after testing
    if (!adminWallets.includes((address as string).toLowerCase())) {
      return res.status(400).json({ message: 'Address is not an admin' });
    }

    // check if user has already claimed tokens
    const profile = await fetch(`${DOMAIN_URL}/api/profile?address=${address}&taskId=2`)
    const profileData = await profile.json()
    console.log('profileData', profileData)
    // HACK: hardcode taskId 5 for now (claim tokens)
    const swapCompleted = profileData?.tasks?.[5]?.isCompleted ?? false
    if (swapCompleted === true) {
      return res.status(400).json({ ...profileData, message: 'You have already claimed your tokens' });
    }
    // HACK: hardcode taskId 2 for now (claim POAP event)
    const badgeCompleted = profileData?.tasks?.[2]?.isCompleted ?? false
    if (badgeCompleted === false) {
      return res.status(400).json({ ...profileData, message: 'You have not claimed the POAP event yet' });
    }

    const addressToLower = (address as string).toLowerCase();

    const destination = addressToLower;
    const ethAmount = ethers.parseUnits('0.0001', 'ether').toString();
    const usdcAmount = ethers.parseUnits('1', 6).toString(); // USDC has 6 decimals
    const usdgloAmount = ethers.parseUnits('1', 18).toString(); // USDGLO has 18 decimals

    const erc20Abi = ['function transfer(address to, uint256 amount) returns (bool)'];
    const usdcInterface = new ethers.Interface(erc20Abi);
    const usdgloInterface = new ethers.Interface(erc20Abi);

    const safeTransactionData: MetaTransactionData[] = [
      {
        to: destination,
        data: '0x',
        value: ethAmount,
      },
      {
        to: USDC_ADDRESS,
        data: usdcInterface.encodeFunctionData('transfer', [destination, usdcAmount]),
        value: '0',
      },
      {
        to: USDGLO_ADDRESS,
        data: usdgloInterface.encodeFunctionData('transfer', [destination, usdgloAmount]),
        value: '0',
      },
    ];

    const protocolKitOwner = await Safe.init({
      provider: RPC_URL,
      signer: PRIVATE_KEY,
      safeAddress: SAFE_ADDRESS,
    });

    const safeTransaction = await protocolKitOwner.createTransaction({ transactions: safeTransactionData });

    // Deterministic hash based on transaction parameters
    const safeTxHash = await protocolKitOwner.getTransactionHash(safeTransaction);

    // Sign transaction to verify that the transaction is coming from owner 1
    const senderSignature = await protocolKitOwner.signHash(safeTxHash);

    await apiKit.proposeTransaction({
      safeAddress: SAFE_ADDRESS,
      safeTransactionData: safeTransaction.data,
      safeTxHash,
      senderAddress: OWNER_ADDRESS,
      senderSignature: senderSignature.data,
    });

    console.log('Transaction proposed:');
    console.log(`https://app.safe.global/transactions/queue?safe=base:${SAFE_ADDRESS}`);

    const executeTxResponse = await protocolKitOwner.executeTransaction(safeTransaction);
    // @ts-ignore
    const receipt = await executeTxResponse.transactionResponse?.wait();

    console.log('Transaction executed:');
    if (receipt && 'transactionHash' in receipt) {
      // update task as completed in profile
      const userTasks = profileData?.tasks
      // HACK: hardcode the points + taskId for now
      userTasks[5] = { isCompleted: true, points: 5 }
      console.log('userTasks', userTasks)
      const score = Object.values(userTasks).reduce((acc, task: any) => acc + task?.points, 0)
      const profileToSave = { score, tasks: userTasks }
      const [profile] = await db('users')
        .update(profileToSave)
        .where('event_id', eventId)
        .whereILike('address', address)
        .returning('*')
      const txHash = `https://basescan.org/tx/${receipt.transactionHash}`;
      console.log('txHash', txHash);
      return res.status(200).json({ profile, message: 'Tokens sent successfully.', safeTxHash, txHash })
    } else {
      console.log('Transaction hash not available');
      return res.status(200).json({
        message: 'Transaction proposed successfully, but execution details are not available',
        safeTxHash,
      });
    }
  } catch (error) {
    console.error('Error in transaction process:', error);
    return res.status(500).json({ message: 'An error occurred during the transaction process', error: error });
  }
}
