import { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';
import { namehash, verifyMessage } from 'viem';

import { DOMAIN_URL } from 'config';
import db from 'utils/db';
import { calculateScore } from 'utils/index';
import { eventId as currentEventId, ENS_DOMAIN } from 'config'

const RPC_URL = process.env.ALCHEMY_API_KEY
  ? `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
  : 'https://mainnet.base.org';

const PRIVATE_KEY = process.env.PRIVATE_KEY as string;

// L2Resolver contract address
const L2_RESOLVER_ADDRESS = '0xe42cfac25e82e3b77fefc740a934e11f03957c17';

// Parent node for newtoweb3.eth
const PARENT_NODE = namehash(ENS_DOMAIN);

const RESERVED_SUBNAMES = [
  'ornella',
  'didier',
  'dj',
  'd',
]

export const maxDuration = 90 // 90 seconds

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { address, eventId, subname, signature } = req.query;

    if (!address || !subname || !signature || !eventId) {
      return res.status(400).json({ message: 'Recipient address, subname, and signature are required' });
    }

    const subnameToLower = (subname as string)?.toLowerCase()?.replace(/[^a-zA-Z0-9]/g, '')

    if (parseInt(eventId as string) !== currentEventId) {
      return res.status(400).json({ message: 'Event task is not available' });
    }

    // Verify the signature
    const message = `Claim subname ${subname}.${ENS_DOMAIN} for address ${address}`
    const isValid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    })

    if (!isValid) {
      return res.status(403).json({ message: 'Invalid signature' })
    }

    // check if subname is already taken
    const subnameTaken = await db('users').where('subname', subnameToLower).first()
    if (subnameTaken || RESERVED_SUBNAMES.includes(subnameToLower)) {
      return res.status(400).json({ message: 'Subname already taken' })
    }

    // Get task definitions from database (similar to profile.ts)
    const { data_en: { tasks: taskDefinitions } } = await db('events')
      .where('id', parseInt(eventId as string))
      .first()
      .select('data_en')

    // TODO: check if user has already claimed subname for another event
    const profile = await fetch(`${DOMAIN_URL}/api/profile?address=${address}&taskId=2&eventId=${eventId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const profileData = await profile.json()
    // console.log('profileData', profileData)
    const taskIdClaimSubname = Object.values(taskDefinitions).findIndex((task: any) => task.action === 'claim-subname')
    const subnameClaimed = profileData?.tasks?.[taskIdClaimSubname]?.isCompleted ?? false
    if (subnameClaimed === true) {
      return res.status(400).json({ ...profileData, message: 'You have already claimed your subname' });
    }

    // Check quest.lock logic for claim-subname task
    const claimSubnameTask = taskDefinitions[taskIdClaimSubname];
    if (claimSubnameTask?.lock) {
      if (claimSubnameTask.lock === 'ticket') {
        // For ticket locks, check if user has an associated ticket
        const associatedTickets = await db('tickets')
          .select('code', 'is_used', 'used_at', 'attestation_tx_link')
          .where('event_id', eventId)
          .where('user_id', profileData.id)

        if (!associatedTickets || associatedTickets.length === 0) {
          return res.status(400).json({
            ...profileData,
            message: 'Associate your event ticket in your profile to unlock this'
          });
        }
      } else if (typeof claimSubnameTask.lock === 'number') {
        // For numeric locks, check if the previous task is completed
        const lockTaskId = claimSubnameTask.lock - 1; // Convert to 0-based index
        const lockTaskCompleted = profileData?.tasks?.[lockTaskId]?.isCompleted ?? false;

        if (!lockTaskCompleted) {
          return res.status(400).json({
            ...profileData,
            message: `Complete task #${claimSubnameTask.lock} first to unlock this.`
          });
        }
      }
    }

    const taskCondition = taskDefinitions[taskIdClaimSubname].condition
    // console.log('taskCondition', taskCondition)

    // Parse the condition - can be "ticket" or a POAP ID like "190776"
    // For claim-subname, we need to find the task that validates the condition
    let taskIdClaimPOAP: number;

    if (taskCondition === 'ticket') {
      // If condition is "ticket", ignore it
    } else {
      // If condition is a POAP ID, find the task with that POAP ID
      taskIdClaimPOAP = Object.values(taskDefinitions).findIndex((task: any) => task.condition === taskCondition);
      const poapCompleted = profileData?.tasks?.[taskIdClaimPOAP]?.isCompleted ?? false
      if (poapCompleted === false) {
        return res.status(400).json({ ...profileData, message: `You have not claimed the POAP event yet (Task #${taskIdClaimPOAP + 1})` });
      }
    }

    // console.log('taskIdClaimPOAP', taskIdClaimPOAP)
    // console.log('poapCompleted', poapCompleted)


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
      const subnodeNamehash = namehash(`${subnameToLower}.${ENS_DOMAIN}`);

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
          destination
        ]),
        // setText for avatar
        resolverContract.interface.encodeFunctionData('setText', [
          subnodeNamehash,
          'avatar',
          // TODO: add support for eventId in the avatar url
          `https://newtoweb3.io/api/avatar/${subnameToLower}`
        ])
      ];

      // Log transaction details
      console.log('Transaction details:', {
        to: L2_RESOLVER_ADDRESS,
        parentNode: PARENT_NODE,
        subname: subnameToLower,
        owner: destination,
        data,
        subnodeNamehash
      });

      // Send transaction
      const tx = await resolverContract.createSubnode(
        PARENT_NODE,
        subnameToLower,
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
          const taskId = Object.values(taskDefinitions).findIndex((task: any) => task.action === taskAction);
          userTasks[taskId.toString()] = { id: taskId, isCompleted: true, points: taskDefinitions[taskId].points, txLink };
          const score = calculateScore(userTasks, taskDefinitions)
          const profileToSave = { score, tasks: userTasks, subname: subnameToLower }
          const [profile] = await db('users')
            .update(profileToSave)
            .where('event_id', eventId)
            .whereILike('address', address)
            .returning('*')

          if (profile?.email) {
            profile.emailOK = true
            delete profile.email
          }

          // Fetch associated tickets for this user
          const associatedTickets = await db('tickets')
            .select('code', 'is_used', 'used_at', 'attestation_tx_link')
            .where('event_id', eventId)
            .where('user_id', profile.id)

          // Return immediately with transaction hash
          return res.status(200).json({
            ...profile,
            associatedTickets,
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

      // Return success response with transaction details
      return res.status(200).json({
        message: 'Transaction details logged successfully.',
        details: {
          to: L2_RESOLVER_ADDRESS,
          parentNode: PARENT_NODE,
          subname: subnameToLower,
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
