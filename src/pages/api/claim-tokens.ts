import { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';
// import SafeApiKit from '@safe-global/api-kit';
// import Safe from '@safe-global/protocol-kit';
// import { MetaTransactionData, OperationType } from '@safe-global/types-kit';

import { DOMAIN_URL, adminWallets } from 'config';
import db from 'utils/db';
import { calculateScore } from 'utils/index';
import { getTasks } from 'utils/queries';

const RPC_URL = process.env.ALCHEMY_API_KEY
  ? `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
  : 'https://mainnet.base.org';

const OWNER_ADDRESS = process.env.OWNER_ADDRESS as string;
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;

// const SAFE_ADDRESS = process.env.SAFE_ADDRESS as string;

// const apiKit = new SafeApiKit({
//   chainId: BigInt(8453), // Base Mainnet chainId
// });

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
// const USDGLO_ADDRESS = '0x4F604735c1cF31399C6E711D5962b2B3E0225AD3';

export const maxDuration = 90 // 90 seconds

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { address, eventId } = req.query;

    if (!address) {
      return res.status(400).json({ message: 'Recipient address is required' });
    }

    const tasks = await getTasks(parseInt(eventId as string))
    // console.log('tasks', tasks)

    // check if user has already claimed tokens (Task #2 = force POAP validation)
    const profile = await fetch(`${DOMAIN_URL}/api/profile?address=${address}&taskId=2&eventId=${eventId}`)
    const profileData = await profile.json()
    // console.log('profileData', profileData)
    const taskIdClaimTokens = Object.values(tasks).findIndex((task: any) => task.action === 'claim-tokens')
    const swapCompleted = profileData?.tasks?.[taskIdClaimTokens]?.isCompleted ?? false
    if (swapCompleted === true) {
      return res.status(400).json({ ...profileData, message: 'You have already claimed your tokens' });
    }
    const taskCondition = tasks[taskIdClaimTokens].condition
    // console.log('taskCondition', taskCondition)
    const taskIdClaimPOAP = Object.values(tasks).findIndex((task: any) => task.condition === taskCondition)
    // console.log('taskIdClaimPOAP', taskIdClaimPOAP)
    const badgeCompleted = profileData?.tasks?.[taskIdClaimPOAP]?.isCompleted ?? false
    // console.log('badgeCompleted', badgeCompleted)

    if (badgeCompleted === false) {
      return res.status(400).json({ ...profileData, message: `You have not claimed the POAP event yet (Task #${taskIdClaimPOAP + 1})` });
    }

    const addressToLower = (address as string).toLowerCase();
    const destination = addressToLower;
    const ethAmount = ethers.parseUnits('0.0001', 'ether').toString();

    try {
      // Create provider and signer
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const signer = new ethers.Wallet(PRIVATE_KEY, provider);

      // Send transaction
      const tx = await signer.sendTransaction({
        to: destination,
        value: ethAmount
      });

      console.log('Transaction sent:', tx.hash);

      // Send immediate response with transaction hash
      const txLink = `https://basescan.org/tx/${tx.hash}`;

      if (txLink) {
        try {
      // update task as completed in profile
          const userTasks = profileData?.tasks;
          const taskAction = 'claim-tokens';
          const taskId = Object.values(tasks).findIndex((task: any) => task.action === taskAction);
          console.log('taskIdClaimTokens', taskId)
          userTasks[taskId.toString()] = { id: taskId, isCompleted: true, points: tasks[taskId].points, txLink };
          const score = calculateScore(userTasks, tasks)
          const profileToSave = { score, tasks: userTasks }
          console.log('profileToSave', profileToSave)
          const [profile] = await db('users')
            .update(profileToSave)
              .where('event_id', eventId)
              .whereILike('address', address)
              .returning('*')

          if (profile?.email) {
            profile.emailOK = true
            delete profile.email
          }
          // Return immediately with transaction hash
          return res.status(200).json({
            ...profile,
            message: 'Transaction sent successfully.',
            txLink,
            transactionHash: tx.hash
          });
        } catch (error) {
          console.error('Error updating profile after transaction:', error);
        }
      } else {
        return res.status(400).json({ message: 'Transaction failed' });
      }

    } catch (error: any) {
      console.error('Transaction error:', error);
      return res.status(400).json({
        message: 'Failed to process transaction',
        error: error.message
      });
    }
  } catch (error) {
    console.error('Error in transaction process:', error);
    return res.status(400).json({ message: 'An error occurred during the transaction process', error });
  }
}
