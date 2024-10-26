import { NextApiRequest, NextApiResponse } from 'next'

import db from 'utils/db'
import { eventId } from 'config/index'

const IG_USER_ID = '1049305'
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  // https://graph.instagram.com/me?access_token=
  // https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-hashtag-search#reading
  // https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-hashtag/top-media#reading

  // const IG_USER_ID = '27293640893617009'
  // const response = await fetch(
  //   `https://graph.facebook.com/v21.0/ig_hashtag_search?user_id=${IG_USER_ID}&q=NewToWeb3&access_token=${INSTAGRAM_ACCESS_TOKEN}`
  // )

  // const { socials: isCronOn } = await db('events').where({ id: eventId }).select('socials').first()

  let { socials: { ig, twitter, isSocialCronActive } } = await db('events')
    .select('socials')
    .where('id', eventId)
    .first()

  console.log('isSocialCronActive', isSocialCronActive)

  if (!isSocialCronActive) {
    res.status(200).json({ message: 'Cron is not enabled' })
    return
  }

  try {


    const headers = JSON.parse(process.env.INSTAGRAM_HEADERS || '{}')

    // console.log(JSON.stringify(headers))

    const ig_response = await fetch("https://www.instagram.com/api/v1/fbsearch/web/top_serp/?query=%23NewToWeb3", {
      headers,
      "body": null,
      "method": "GET"
    });

    if (!ig_response.ok) {
      throw new Error('Failed to fetch data')
    }

    const ig_data = await ig_response.json()
    console.log('ig_data', JSON.stringify(ig_data))

    const igIds = ig_data.media_grid.sections.map((section: any) => section.layout_content.medias.map((media: any) => media.media.code)).flat()
    console.log('igIds', igIds)

    if (igIds?.length > 0 && JSON.stringify(ig) !== JSON.stringify(igIds)) {
      console.log('updating ig posts')
      ig = igIds
      await db.raw(
        `update "events" set "socials" = socials || ? where "id" = ?`,
        [{ ig, igLastUpdated: new Date().toISOString() }, eventId]
      )
    }

    const twitter_response = await fetch(
      'https://api.twitter.com/2/tweets/search/recent?query=%23NewToWeb3&tweet.fields=id,author_id&max_results=20',
      {
        headers: {
          Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
        },
      }
    )

    if (!twitter_response.ok) {
      throw new Error(`HTTP error! status: ${twitter_response.status}`)
    }

    const twitter_data = await twitter_response.json()
    console.log('twitter_data', twitter_data)

    const twitterPosts = twitter_data?.data?.map((tweet: any) => `${tweet.author_id}/status/${tweet.id}`)
    console.log('twitterPosts', twitterPosts)

    if (twitterPosts?.length > 0 && JSON.stringify(twitter) !== JSON.stringify(twitterPosts)) {
      twitter = twitterPosts
      console.log('updating twitter posts')
      await db.raw(
        `update "events" set "socials" = socials || ? where "id" = ?`,
        [{ twitter, twitterLastUpdated: new Date().toISOString() }, eventId]
      )
    }

    res.status(200).json({ ig, twitter })
  } catch (error) {
    console.error('Error fetching hashtag ID:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
