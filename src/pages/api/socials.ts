import { NextApiRequest, NextApiResponse } from 'next'

import db from 'utils/db'

/*
,
  "igFilter": ["CdgeiXUOz6z", "CiJCgvZLyl2", "Ct2Hn9WyxM2", "CiLGI4HABSy", "Cr-7fy3on2z", "CjgP1aUgHpT", "C3p_9kGK5fk", "CmKsaUgjnnG", "CnRg8NaJDvq"],
  "twitterFilter": [""]
*/

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { eventId } = req.query

    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({ message: 'Event ID is required' })
    }

    const { socials: { ig, igFilter, twitter, twitterFilter } } = await db('events')
      .select('socials')
      .where('id', eventId)
      .first()

    console.log('ig', ig)
    console.log('igFilter', igFilter)
    console.log('twitter', twitter)
    console.log('twitterFilter', twitterFilter)

    // const igExtraPosts = ['C9vR_LHAgYg', 'C6exyZSsKI0']
    // const twitterExtraPosts = ['OrnellaWeb3/status/1839314702385791462']
    const igExtraPosts: string[] = []
    const twitterExtraPosts: string[] = []

    const igPosts = Array.from(new Set([...ig, ...igExtraPosts].filter((post) => !igFilter?.includes(post)))).slice(0, 8)
    const twitterPosts = Array.from(new Set([...twitter, ...twitterExtraPosts].filter((post) => !twitterFilter?.includes(post)))).slice(0, 8)

    res.status(200).json({ ig: igPosts, twitter: twitterPosts })
  } catch (error) {
    console.error('Error fetching hashtag ID:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
