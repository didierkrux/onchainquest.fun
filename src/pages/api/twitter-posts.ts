import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN

    if (!bearerToken) {
      throw new Error('Twitter Bearer Token is not set')
    }

    // const response = await fetch(
    //   'https://api.twitter.com/2/tweets/search/recent?query=%23new2web3&tweet.fields=id,author_id&max_results=20',
    //   {
    //     headers: {
    //       Authorization: `Bearer ${bearerToken}`,
    //     },
    //   }
    // )

    // if (!response.ok) {
    //   throw new Error(`HTTP error! status: ${response.status}`)
    // }

    // const data = await response.json()

    // console.log(data)
    // const twitterPosts = data?.data?.map((tweet: any) => `${tweet.author_id}/status/${tweet.id}`)

    // Placeholder for Twitter API integration
    const twitterPosts = [
      'OrnellaWeb3/status/1839314702385791462',
      'OrnellaWeb3/status/1839314705778880930',
      'didierkrux/status/1847266357735223673'
    ]

    res.status(200).json(twitterPosts)
  } catch (error) {
    console.error('Error fetching Twitter posts:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
