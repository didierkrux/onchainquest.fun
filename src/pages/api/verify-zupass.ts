import { NextApiRequest, NextApiResponse } from 'next';
import { deserializeProofResult } from 'utils/zupass-serialize';
import { getTicketProofRequest } from 'utils/zupass';
import { gpcVerify } from '@pcd/gpc';
import path from 'path';
// @ts-ignore ffjavascript does not have types
import { getCurveFromName } from 'ffjavascript';

const GPC_ARTIFACTS_PATH = path.join(process.cwd(), 'public/artifacts');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { serializedProofResult } = req.body;

    if (!serializedProofResult) {
      return res.status(400).json({ error: 'Missing serializedProofResult' });
    }

    const { boundConfig, revealedClaims, proof } = deserializeProofResult(
      serializedProofResult
    );

    const request = getTicketProofRequest().getProofRequest();

    // Multi-threaded verification seems to be broken in NextJS, so we need to
    // initialize the curve in single-threaded mode.
    // @ts-ignore
    if (!globalThis.curve_bn128) {
      // @ts-ignore
      globalThis.curve_bn128 = getCurveFromName('bn128', { singleThread: true });
    }

    const verificationResult = await gpcVerify(
      proof,
      {
        ...request.proofConfig,
        circuitIdentifier: boundConfig.circuitIdentifier,
      },
      revealedClaims,
      GPC_ARTIFACTS_PATH
    );

    if (verificationResult === true) {
      // Proof is valid - you can add additional logic here
      // such as storing the verification in a database, issuing rewards, etc.
      return res.status(200).json({
        verified: true,
        message: 'Proof verified successfully',
        revealedData: {
          attendeeName: revealedClaims.pods?.ticket?.entries?.attendeeName?.value?.toString(),
          attendeeEmail: revealedClaims.pods?.ticket?.entries?.attendeeEmail?.value?.toString(),
          eventId: revealedClaims.pods?.ticket?.entries?.eventId?.value?.toString(),
        }
      });
    } else {
      return res.status(200).json({
        verified: false,
        message: 'Proof verification failed'
      });
    }
  } catch (error) {
    console.error('Error verifying proof:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 
