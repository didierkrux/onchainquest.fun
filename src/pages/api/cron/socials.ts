import { NextApiRequest, NextApiResponse } from 'next'

import db from 'utils/db'
import { eventId } from 'config/index'

const IG_USER_ID = '1049305'
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN

/**
 * Recursively extracts all values associated with the "code" keys from a given object.
 *
 * @param data - The object or array to traverse.
 * @returns An array containing all values of "code" keys.
 */
function extractCodeValues(data: any): any[] {
  const codes: any[] = [];

  // Helper function to perform recursion
  function traverse(current: any): void {
    if (current === null || current === undefined) {
      // If current is null or undefined, do nothing
      return;
    }

    if (Array.isArray(current)) {
      // If current is an array, iterate through its elements
      for (const element of current) {
        traverse(element);
      }
    } else if (typeof current === 'object') {
      // If current is an object, iterate through its key-value pairs
      for (const [key, value] of Object.entries(current)) {
        if (key === 'code') {
          codes.push(value);
        }
        // Recursively traverse the value
        traverse(value);
      }
    }
    // For primitive types (string, number, etc.), do nothing
  }

  traverse(data);
  // remove duplicates
  return Array.from(new Set(codes));
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  // https://graph.instagram.com/me?access_token=
  // https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-hashtag-search#reading
  // https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-hashtag/top-media#reading

  // const IG_USER_ID = '27293640893617009'
  // const response = await fetch(
  //   `https://graph.facebook.com/v21.0/ig_hashtag_search?user_id=${IG_USER_ID}&q=NewToWeb3&access_token=${INSTAGRAM_ACCESS_TOKEN}`
  // )

  // const { socials: isCronOn } = await db('events').where({ id: eventId }).select('socials').first()

  const { force = false } = req.query

  let { socials: { ig, twitter, isSocialCronActive } } = await db('events')
    .select('socials')
    .where('id', eventId)
    .first()

  console.log('isSocialCronActive', isSocialCronActive)

  if (!isSocialCronActive && !force) {
    res.status(200).json({ message: 'Cron is not enabled' })
    return
  }

  try {
    const headers = JSON.parse(process.env.INSTAGRAM_HEADERS || '{}')

    // console.log('headers', JSON.stringify(headers))

    // const ig_response = await fetch("https://www.instagram.com/api/v1/fbsearch/web/top_serp/?query=%23NewToWeb3", {
    const ig_response = await fetch("https://www.instagram.com/api/v1/tags/web_info/?tag_name=newtoweb3", {
      headers,
      "body": null,
      "method": "GET"
    });

    if (!ig_response.ok) {
      throw new Error('Failed to fetch data')
    }

    const ig_data = await ig_response.json()
    // console.log('ig_data', JSON.stringify(ig_data))

    const igIds: any[] = extractCodeValues(ig_data)
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
      'https://api.twitter.com/2/tweets/search/recent?query=%23NewToWeb3 -is:retweet&tweet.fields=id,author_id,edit_history_tweet_ids&expansions=author_id&max_results=20',
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

    const twitterPosts = twitter_data?.data?.map((tweet: any) => {
      const latestTweetId = tweet.edit_history_tweet_ids[tweet.edit_history_tweet_ids.length - 1]
      const author = twitter_data.includes.users.find((user: any) => user.id === tweet.author_id)
      return `${author.username}/status/${latestTweetId}`
    })
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
