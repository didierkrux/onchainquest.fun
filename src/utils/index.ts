import { Event } from 'entities/data'
import { potionUrl } from 'config'
import OpenAI from 'openai'

export async function fetchPotionData(): Promise<Event> {
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
          description: item.fields.Description,
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
          description: item.fields.Description,
        })),
      tasks: data
        .filter((item: any) => item.fields.Type === 'Task')
        .map((item: any) => ({
          name: item.fields.Label,
          points: item.fields.Points,
          description: item.fields.Description,
          action: item.fields.Action,
          condition: item.fields.Condition,
        })),
      prizes: data
        .filter((item: any) => item.fields.Type === 'Prize')
        .map((item: any) => ({
          name: item.fields.Label,
          description: item.fields.Description,
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
