import { NextApiRequest, NextApiResponse } from 'next'

import db from 'utils/db'
import { eventId } from 'config/index'

/*
,
  "igFilter": ["CdgeiXUOz6z", "CiJCgvZLyl2", "Ct2Hn9WyxM2", "CiLGI4HABSy", "Cr-7fy3on2z"],
  "twitterFilter": [""]
*/

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { socials: { ig, igFilter, twitter, twitterFilter } } = await db('events')
      .select('socials')
      .where('id', eventId)
      .first()

    console.log('ig', ig)
    console.log('igFilter', igFilter)
    console.log('twitter', twitter)
    console.log('twitterFilter', twitterFilter)

    const igExtraPosts = ['C9vR_LHAgYg', 'C6exyZSsKI0']
    const twitterExtraPosts = ['OrnellaWeb3/status/1839314702385791462']

    const igPosts = [...ig, ...igExtraPosts].filter((post) => !igFilter?.includes(post))
    const twitterPosts = [...twitter, ...twitterExtraPosts].filter((post) => !twitterFilter?.includes(post))

    res.status(200).json({ ig: igPosts, twitter: twitterPosts })
  } catch (error) {
    console.error('Error fetching hashtag ID:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
