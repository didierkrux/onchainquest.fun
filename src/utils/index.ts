import OpenAI from 'openai'

import { Event } from 'entities/data'
import { Profile, Task, Tasks } from 'entities/profile'
import { eventId, potionUrl } from 'config'
import db from './db'

export function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function profileName(profile: Profile) {
  return profile.basename ? profile.basename : (profile.username ? `@${profile.username}` : shortAddress(profile.address))
}

export function profileAvatar(profile: Profile) {
  return profile.basename_avatar ? profile.basename_avatar : profile?.avatar || `https://ensdata.net/media/avatar/${profile.address}`
}

export function profileRole(profile: Profile) {
  return profile.role === 'mentor' ? '🧑‍🏫' : '🧑‍🎓'
}

export async function fetchPotionData(eventId: number): Promise<Event> {
  // force all links in new tab
  const replaceLinks = (string: string) => string?.replaceAll('<a ', '<a target="_blank" ').replaceAll('<a target="_blank" href="https://newtoweb3.io/profile"', '<a href="/profile"')

  try {
    const response = await fetch(potionUrl)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const allData: any = await response.json()
    console.log('allData', allData)

    const eventData: any = allData.filter((item: any) => item.fields.Event?.startsWith(`${eventId}.`))
    console.log('eventData', eventData)

    const transformedData: Event = {
      program: eventData
        .filter((item: any) => item.fields.Type === 'Program')
        .sort((a: any, b: any) => a.fields.Order - b.fields.Order)
        .map((item: any) => ({
          emoji: item.fields.Emoji,
          title: item.fields.Label,
          time: item.fields.Time,
          location: item.fields.Location,
          locationColor: item.fields['Location color'],
          highlight: item.fields.Highlight,
          format: item.fields.Format,
          people: item.fields.People,
        })),
      sponsors: eventData
        .filter((item: any) => item.fields.Type === 'Sponsor')
        .sort((a: any, b: any) => a.fields.Order - b.fields.Order)
        .map((item: any) => ({
          name: item.fields.Label,
          // description: replaceLinks(item.fields.Description),
          sponsorCategory: item.fields['Sponsor category'],
          image: item.fields.Image || '',
          link: item.fields.Link || '',
        })),
      venue: eventData
        .filter((item: any) => item.fields.Type === 'Venue')
        .sort((a: any, b: any) => a.fields.Order - b.fields.Order)
        .map((item: any) => ({
          name: item.fields.Label,
          image: item.fields.Image || '',
        })),
      booths: eventData
        .filter((item: any) => item.fields.Type === 'Booth')
        .sort((a: any, b: any) => a.fields.Order - b.fields.Order)
        .map((item: any) => ({
          name: item.fields.Label,
          description: replaceLinks(item.fields.Description),
        })),
      tasks: eventData
        .filter((item: any) => item.fields.Type === 'Task')
        .sort((a: any, b: any) => a.fields.Order - b.fields.Order)
        .map((item: any, index: number) => ({
          id: index,
          name: item.fields.Label,
          points: item.fields.Points,
          description: replaceLinks(item.fields.Description),
          image: item.fields.Image,
          action: item.fields.Action,
          condition: item.fields.Condition,
          lock: parseInt(item.fields.Lock),
          button: item.fields.Button,
        })),
      prizes: eventData
        .filter((item: any) => item.fields.Type === 'Prize')
        .map((item: any) => ({
          name: item.fields.Label,
          description: replaceLinks(item.fields.Description),
        })),
    }

    return transformedData
  } catch (error) {
    console.error('Error fetching data from Potion API:', error)
    throw error
  }
}

export async function translateData(data: Event, targetLang: string): Promise<Event> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  // Translate the following object to Thai except the following fields: 'time', 'image', 'link', 'action', 'condition'
  const fieldsToExclude = ['time', 'image', 'link', 'action', 'condition']

  async function translateObject(obj: any): Promise<any> {
    try {
      const stringifiedObj = JSON.stringify(obj)

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: `Translate the following object to ${targetLang} except the following fields: ${fieldsToExclude.join(', ')}, but keep the keys as they are.` },
          { role: 'user', content: stringifiedObj }
        ],
        max_tokens: 4096,
      })
      // check cost here: https://platform.openai.com/settings/organization/billing/overview

      const responseContent = response.choices[0].message.content?.trim()

      if (!responseContent) {
        throw new Error('Empty response from OpenAI API')
      }

      return JSON.parse(responseContent)
    } catch (error) {
      console.error('Error during translation:', error)
      throw error
    }
  }

  return await translateObject(data)
}

export async function userHasPoap(address: string, eventId: string): Promise<boolean> {
  try {
    const response = await fetch("https://public.compass.poap.tech/v1/graphql", {
      "headers": {
        "content-type": "application/json; charset=utf-8",
      },
      "body": `{\"query\":\"\\n  query DropCollectorsCount(\\n    $dropswWhere: drops_bool_exp!\\n    $poapsWhere: poaps_bool_exp\\n    $distinct_on: [poaps_select_column!]\\n  ) {\\n    drops(where: $dropswWhere) {\\n      poaps_aggregate(distinct_on: $distinct_on, where: $poapsWhere) {\\n        aggregate {\\n          count\\n        }\\n      }\\n    }\\n  }\\n\",\"variables\":{\"dropswWhere\":{\"id\":{\"_eq\":${eventId}}},\"poapsWhere\":{\"collector_address\":{\"_in\":[\"${address?.toLowerCase()}\"]}},\"distinct_on\":[\"collector_address\"]}}`,
      "method": "POST"
    });

    if (!response.ok) {
      throw new Error(`Error fetching POAPs`);
    }

    const data = await response.json();
    const count = data.data.drops?.[0]?.poaps_aggregate?.aggregate?.count
    console.log('count', count)
    return count > 0
  } catch (error) {
    console.error('Error checking POAP ownership:', error);
    return false;
  }
}

export async function userHasNft(address: string, network: string, contract: string, tokenId: string): Promise<boolean> {
  try {
    let networkUrl = network
    if (network === 'base') networkUrl = 'base-mainnet'
    else throw new Error('Unknown network')

    const response = await fetch(`https://${networkUrl}.g.alchemy.com/nft/v3/${process.env.ALCHEMY_API_KEY}/getNFTsForOwner?owner=${address}&contractAddresses[]=${contract}&withMetadata=true`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error fetching NFT ownership');
    }

    const data = await response.json();
    console.log('data', data)
    const nfts = data.ownedNfts;
    return nfts.some((nft: any) => nft.tokenId === tokenId);
  } catch (error) {
    console.error('Error checking NFT ownership:', error);
    return false;
  }
}

export async function getMoments(eventId: string) {
  try {
    const query = `query MyQuery {
  moments(
    limit: 100
    where: {drop_id: {_eq: ${eventId}}}
    order_by: {created_on: desc}
  ) {
    id
    author
    description
    created_on
    drop_id
    media {
      mime_type
      gateways {
        type
        url
      }
    }
  }
}`
    const response = await fetch('https://public.compass.poap.tech/v1/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    })
    const data = await response.json()
    console.log('data', data)
    return data
  } catch (error) {
    console.error('Error fetching moments:', error)
    return []
  }
}

export async function userHasSwappedTokens(address: string, tokenAddress: string): Promise<boolean> {
  try {
    console.log('tokenAddress', tokenAddress);

    const oneInchBaseAddress = '0xe37e799d5077682fa0a244d46e5649f71457bd09';
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60; // 30 days ago in seconds

    const response = await fetch(`https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'alchemy_getAssetTransfers',
        params: [
          {
            fromAddress: address,
            toAddress: oneInchBaseAddress,
            category: ['erc20'],
            withMetadata: true,
            excludeZeroValue: true,
            maxCount: '0x3e8',
            fromBlock: '0x0',
            toBlock: 'latest',
            order: 'desc',
          },
        ],
      }),
    });

    const data = await response.json();
    console.log('Alchemy response:', data);

    if (data.result && data.result.transfers) {
      return data.result.transfers.some((transfer: any) => {
        console.log('transfer', transfer)
        const transferTimestamp = new Date(transfer?.metadata?.blockTimestamp).getTime() / 1000 || 0;
        const isTokenTransfer = transfer?.rawContract?.address?.toLowerCase() === tokenAddress?.toLowerCase();
        console.log('isTokenTransfer', isTokenTransfer);
        console.log('transferTimestamp', transferTimestamp);
        const isRecentTransfer = transferTimestamp >= thirtyDaysAgo;
        console.log('isRecentTransfer', isRecentTransfer);

        return isRecentTransfer && isTokenTransfer;
      });
    }

    return false
  } catch (error) {
    console.error('Error checking 1inch interaction:', error);
    return false;
  }
}

export const calculateScore = (tasks: Tasks, allTasks: Tasks) => {
  return Object.values(tasks).reduce((acc, task) => {
    if (task?.isCompleted) {
      return acc + (allTasks[task.id]?.points || 0)
    }
    return acc
  }, 0)
}

export async function verifyBalance(address: string, tokenAddress: string, minBalance: string): Promise<boolean> {
  const alchemyUrl = `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;

  try {
    const response = await fetch(alchemyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'alchemy_getTokenBalances',
        params: [address, [tokenAddress]],
        id: 1,
      }),
    });

    const data = await response.json();
    console.log('Alchemy response:', data);

    if (data.result && data.result.tokenBalances && data.result.tokenBalances.length > 0) {
      const balanceHex = data.result.tokenBalances[0].tokenBalance;
      const balance = parseInt(balanceHex, 16) / Math.pow(10, 18);
      console.log('Balance:', balance);
      return balance >= parseFloat(minBalance);
    }

    return false;
  } catch (error) {
    console.error('Error checking balance with Alchemy API:', error);
    return false;
  }
}
