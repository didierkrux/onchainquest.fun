import { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';
import SafeApiKit from '@safe-global/api-kit';
import Safe from '@safe-global/protocol-kit';
import { MetaTransactionData } from '@safe-global/safe-core-sdk-types';

import { DOMAIN_URL, adminWallets, eventId } from 'config';
import db from 'utils/db';
import { calculateScore } from 'utils/index';
import { getTasks } from 'utils/queries';
const RPC_URL = 'https://mainnet.base.org';

const OWNER_ADDRESS = process.env.OWNER_ADDRESS as string;
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;

const SAFE_ADDRESS = process.env.SAFE_ADDRESS as string;

const apiKit = new SafeApiKit({
  chainId: BigInt(8453), // Base Mainnet chainId
});

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
// const USDGLO_ADDRESS = '0x4F604735c1cF31399C6E711D5962b2B3E0225AD3';

export const maxDuration = 90 // 90 seconds

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({ message: 'Recipient address is required' });
    }

    // TODO: remove this after testing
    // if (!adminWallets.includes((address as string).toLowerCase())) {
    //   return res.status(400).json({ message: 'Address is not an admin' });
    // }

    const tasks = await getTasks(eventId)

    // check if user has already claimed tokens
    const profile = await fetch(`${DOMAIN_URL}/api/profile?address=${address}&taskId=2`)
    const profileData = await profile.json()
    console.log('profileData', profileData)
    const taskIdClaimTokens = Object.values(tasks).findIndex((task: any) => task.action === 'claim-tokens')
    const swapCompleted = profileData?.tasks?.[taskIdClaimTokens]?.isCompleted ?? false
    if (swapCompleted === true) {
      return res.status(400).json({ ...profileData, message: 'You have already claimed your tokens' });
    }
    const taskCondition = tasks[taskIdClaimTokens].condition
    console.log('taskCondition', taskCondition)
    const taskIdClaimPOAP = Object.values(tasks).findIndex((task: any) => task.condition === taskCondition)
    const badgeCompleted = profileData?.tasks?.[taskIdClaimPOAP]?.isCompleted ?? false
    // TEMP
    let receipt = null
    let safeTxHash = null
    // if (badgeCompleted === true) {
    //   receipt = { transactionHash: '0x9b285098404a71f1a09ec3e91582417d191fa372bf04a3416f1f5038abdbb20f' }
    if (badgeCompleted === false) {
      return res.status(400).json({ ...profileData, message: 'You have not claimed the POAP event yet (Task #3)' });
    } else {

    const addressToLower = (address as string).toLowerCase();

    const destination = addressToLower;
    const ethAmount = ethers.parseUnits('0.000555', 'ether').toString();
    const usdcAmount = ethers.parseUnits('2', 6).toString(); // USDC has 6 decimals
    // const usdgloAmount = ethers.parseUnits('1', 18).toString(); // USDGLO has 18 decimals

    const erc20Abi = ['function transfer(address to, uint256 amount) returns (bool)'];
    const usdcInterface = new ethers.Interface(erc20Abi);
      // const usdgloInterface = new ethers.Interface(erc20Abi);

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
      // {
      //   to: USDGLO_ADDRESS,
      //   data: usdgloInterface.encodeFunctionData('transfer', [destination, usdgloAmount]),
      //   value: '0',
      // },
    ];

    const protocolKitOwner = await Safe.init({
      provider: RPC_URL,
      signer: PRIVATE_KEY,
      safeAddress: SAFE_ADDRESS,
    });

    const safeTransaction = await protocolKitOwner.createTransaction({ transactions: safeTransactionData });

    // Deterministic hash based on transaction parameters
      safeTxHash = await protocolKitOwner.getTransactionHash(safeTransaction);

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

    // Test if transaction is valid before executing
    const isValidTransaction = await protocolKitOwner.isValidTransaction(safeTransaction);
    if (!isValidTransaction) {
      return res.status(400).json({ message: 'Transaction failed to be proposed. Contact support.' });
    }

    const executeTxResponse = await protocolKitOwner.executeTransaction(safeTransaction);
    // @ts-ignore
      receipt = await executeTxResponse.transactionResponse?.wait();
    }

    console.log('Transaction executed:');
    if (receipt && 'transactionHash' in receipt) {
      // update task as completed in profile
      const userTasks = profileData?.tasks
      const txLink = `https://basescan.org/tx/${receipt.transactionHash}`;
      console.log('txLink', txLink);
      const taskAction = 'claim-tokens'
      const taskId = Object.values(tasks).findIndex((task: any) => task.action === taskAction)
      userTasks[taskId.toString()] = { id: taskId, isCompleted: true, points: tasks[taskId].points, txLink }
      console.log('userTasks', userTasks)
      const score = calculateScore(userTasks, tasks)
      const profileToSave = { score, tasks: userTasks }
      const [profile] = await db('users')
        .update(profileToSave)
        .where('event_id', eventId)
        .whereILike('address', address)
        .returning('*')

      if (profile?.email) {
        profile.emailOK = true
        delete profile.email
      }

      return res.status(200).json({ ...profile, message: badgeCompleted ? 'Tokens sent successfully.' : 'Simulating transaction...', txLink })
    } else {
      console.log('Transaction hash not available');
      return res.status(200).json({
        message: 'Transaction proposed successfully, but execution details are not available',
        safeTxHash,
      });
    }
  } catch (error) {
    console.error('Error in transaction process:', error);
    return res.status(400).json({ message: 'An error occurred during the transaction process', error });
  }
}
