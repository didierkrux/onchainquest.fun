import { Box, Heading, Text, Link } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import { InstagramEmbed, XEmbed } from 'react-social-media-embed'
import { useLocalStorage } from 'usehooks-ts'

import { Event } from 'entities/data'

interface IGMedia {
  code: string
  media_url: string
}

export default function Social({ event }: { event: Event }) {
  const { t } = useTranslation()
  const [instagramPosts, setInstagramPosts] = useLocalStorage<string[]>('instagramPosts', [])
  const [twitterPosts, setTwitterPosts] = useLocalStorage<string[]>('twitterPosts', [])

  useEffect(() => {
    const fetchSocials = async () => {
      try {
        const response = await fetch('/api/socials')
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        const data = await response.json()
        setInstagramPosts(data.ig)
        setTwitterPosts(data.twitter)
      } catch (error) {
        console.error('Error fetching Instagram posts:', error)
      }
    }

    fetchSocials()
  }, [setInstagramPosts, setTwitterPosts])

  return (
    <Box>
      <Heading as="h1">Instagram</Heading>
      <Box>
        <Text>
          <Link href="https://www.instagram.com/explore/tags/newtoweb3/" isExternal>
            {t('View all #NewToWeb3 posts in Instagram')}
          </Link>
        </Text>
        <Box
          display="grid"
          gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))"
          gap={4}
          mt={4}
        >
          {instagramPosts.length > 0 ? (
            instagramPosts.map((post, index) => (
              <Box key={index}>
                <InstagramEmbed url={`https://www.instagram.com/p/${post}`} width="100%" />
              </Box>
            ))
          ) : (
            <Text>No posts found</Text>
          )}
        </Box>
      </Box>
      <Heading as="h1" mt={4}>
        Twitter / X
      </Heading>
      <Box>
        <Text>
          <Link href="https://x.com/hashtag/NewToWeb3?src=hashtag_click&f=live" isExternal>
            {t('View all #NewToWeb3 posts in Twitter / X')}
          </Link>
        </Text>
        <Box
          display="grid"
          gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))"
          gap={4}
          mt={4}
        >
          {twitterPosts.length > 0 ? (
            twitterPosts.map((post, index) => (
              <Box key={index}>
                <XEmbed
                  url={`https://x.com/i/${post}`}
                  width="100%"
                  twitterTweetEmbedProps={{
                    tweetId: post.split('/')[2],
                    options: { conversation: 'none' },
                  }}
                />
              </Box>
            ))
          ) : (
            <Text>No posts found</Text>
          )}
        </Box>
      </Box>
    </Box>
  )
}
