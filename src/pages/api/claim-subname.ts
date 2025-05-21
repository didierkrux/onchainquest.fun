import { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';
import { namehash } from 'viem';

import { DOMAIN_URL } from 'config';
import db from 'utils/db';
import { calculateScore } from 'utils/index';
import { getTasks } from 'utils/queries';

const RPC_URL = process.env.ALCHEMY_API_KEY
  ? `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
  : 'https://mainnet.base.org';

const PRIVATE_KEY = process.env.PRIVATE_KEY as string;

// L2Resolver contract address
const L2_RESOLVER_ADDRESS = '0xe42cfac25e82e3b77fefc740a934e11f03957c17';

// Parent node for newtoweb3.eth
const PARENT_NODE = namehash('newtoweb3.eth');

export const maxDuration = 90 // 90 seconds

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { address, eventId, subname } = req.query;

    if (!address || !subname) {
      return res.status(400).json({ message: 'Recipient address and subname are required' });
    }

    const tasks = await getTasks(parseInt(eventId as string))
    // console.log('tasks', tasks)

    // check if user has already claimed subname (Task #2 = force POAP validation)
    const profile = await fetch(`${DOMAIN_URL}/api/profile?address=${address}&taskId=2&eventId=${eventId}`)
    const profileData = await profile.json()
    // console.log('profileData', profileData)
    const taskIdClaimSubname = Object.values(tasks).findIndex((task: any) => task.action === 'claim-subname')
    const subnameClaimed = profileData?.tasks?.[taskIdClaimSubname]?.isCompleted ?? false
    if (subnameClaimed === true) {
      return res.status(400).json({ ...profileData, message: 'You have already claimed your subname' });
    }
    const taskCondition = tasks[taskIdClaimSubname].condition
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

    try {
      // Create provider and signer
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const signer = new ethers.Wallet(PRIVATE_KEY, provider);

      // Create contract instance
      const resolverContract = new ethers.Contract(L2_RESOLVER_ADDRESS, [
        'function createSubnode(bytes32 node, string calldata label, address owner, bytes[] calldata data) external returns (bytes32)',
        'function setAddr(bytes32 node, address addr) external',
        'function setAddr(bytes32 node, uint256 coinType, bytes calldata addr) external',
        'function setText(bytes32 node, string calldata key, string calldata value) external'
      ], signer);

      // Calculate subnode namehash
      const subnodeNamehash = namehash(`${subname}.newtoweb3.eth`);

      // Prepare resolver calls
      const data = [
        // setAddr for ETH address
        resolverContract.interface.encodeFunctionData('setAddr(bytes32,address)', [
          subnodeNamehash,
          destination
        ]),
        // setAddr for Base chain (coinType 8453)
        resolverContract.interface.encodeFunctionData('setAddr(bytes32,uint256,bytes)', [
          subnodeNamehash,
          8453,
          ethers.zeroPadValue(destination, 32)
        ]),
        // setText for avatar
        resolverContract.interface.encodeFunctionData('setText', [
          subnodeNamehash,
          'avatar',
          `https://newtoweb3.io/api/avatar/${subname}`
        ])
      ];

      // Log transaction details
      console.log('Transaction details:', {
        to: L2_RESOLVER_ADDRESS,
        parentNode: PARENT_NODE,
        subname,
        owner: destination,
        data,
        subnodeNamehash
      });

      // Comment out actual transaction for now
      /*
      // Send transaction
      const tx = await resolverContract.createSubnode(
        PARENT_NODE,
        subname,
        destination,
        data
      );

      console.log('Transaction sent:', tx.hash);

      // Send immediate response with transaction hash
      const txLink = `https://basescan.org/tx/${tx.hash}`;

      if (txLink) {
        try {
          // update task as completed in profile
          const userTasks = profileData?.tasks;
          const taskAction = 'claim-subname';
          const taskId = Object.values(tasks).findIndex((task: any) => task.action === taskAction);
          userTasks[taskId.toString()] = { id: taskId, isCompleted: true, points: tasks[taskId].points, txLink };
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
      */

      // Return success response with transaction details
      return res.status(200).json({
        message: 'Transaction details logged successfully.',
        details: {
          to: L2_RESOLVER_ADDRESS,
          parentNode: PARENT_NODE,
          subname,
          owner: destination,
          subnodeNamehash
        }
      });

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
