import OpenAI from 'openai'

import { Event } from 'entities/data'
import { Profile } from 'entities/profile'
import { potionUrl } from 'config'

export function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function displayName(profile: Profile) {
  return profile.username ? `@${profile.username}` : shortAddress(profile.address)
}

export async function fetchPotionData(): Promise<Event> {
  // force all links in new tab
  const replaceLinks = (string: string) => string?.replaceAll('<a ', '<a target="_blank" ')

  try {
    const response = await fetch(potionUrl)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data: any = await response.json()

    const transformedData: Event = {
      agenda: data
        .filter((item: any) => item.fields.Type === 'Agenda')
        .map((item: any) => ({
          title: item.fields.Label,
          time: item.fields.Time,
          location: item.fields.Location,
        })),
      sponsors: data
        .filter((item: any) => item.fields.Type === 'Sponsor')
        .map((item: any) => ({
          name: item.fields.Label,
          description: replaceLinks(item.fields.Description),
          image: item.fields.Image || '',
          link: item.fields.Link || '',
        })),
      venue: data
        .filter((item: any) => item.fields.Type === 'Map')
        .map((item: any) => ({
          name: item.fields.Label,
          image: item.fields.Image || '',
        })),
      booths: data
        .filter((item: any) => item.fields.Type === 'Booth')
        .map((item: any) => ({
          name: item.fields.Label,
          description: replaceLinks(item.fields.Description),
        })),
      tasks: data
        .filter((item: any) => item.fields.Type === 'Task')
        .map((item: any, index: number) => ({
          id: index,
          name: item.fields.Label,
          points: item.fields.Points,
          description: replaceLinks(item.fields.Description),
          action: item.fields.Action,
          condition: item.fields.Condition,
        })),
      prizes: data
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
        max_tokens: 3000,
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
