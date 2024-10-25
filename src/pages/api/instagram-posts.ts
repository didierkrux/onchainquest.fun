import { NextApiRequest, NextApiResponse } from 'next'

const IG_USER_ID = '1049305'
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  // https://graph.instagram.com/me?access_token=
  // https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-hashtag-search#reading
  // https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-hashtag/top-media#reading

  // const IG_USER_ID = '27293640893617009'
  // const response = await fetch(
  //   `https://graph.facebook.com/v21.0/ig_hashtag_search?user_id=${IG_USER_ID}&q=newtoweb3&access_token=${INSTAGRAM_ACCESS_TOKEN}`
  // )

  try {


    // const headers = JSON.parse(process.env.INSTAGRAM_HEADERS || '{}')

    // // console.log(JSON.stringify(headers))

    // const response = await fetch("https://www.instagram.com/api/v1/fbsearch/web/top_serp/?query=%23newtoweb3", {
    //   headers,
    //   "body": null,
    //   "method": "GET"
    // });

    // if (!response.ok) {
    //   throw new Error('Failed to fetch data')
    // }

    // const data = await response.json()

    // // console.log(data)
    // const ig_ids = data.media_grid.sections[0].layout_content.medias.map((media: any) => media.media.code)

    const ig_ids = ["CnEc3pCNFP6", "CnEcu1htley"]

    res.status(200).json(ig_ids)
  } catch (error) {
    console.error('Error fetching hashtag ID:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
