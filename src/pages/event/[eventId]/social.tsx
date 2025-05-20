import { Box, Heading, Text, Link } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import { InstagramEmbed, XEmbed } from 'react-social-media-embed'
import { useLocalStorage } from 'usehooks-ts'
import { useRouter } from 'next/router'

import { Event } from 'entities/data'

interface IGMedia {
  code: string
  media_url: string
}

export default function SocialPage({ event }: { event: Event }) {
  const { t } = useTranslation()
  const router = useRouter()
  const { eventId } = router.query
  const [instagramPosts, setInstagramPosts] = useLocalStorage<string[]>(
    `instagramPosts-${eventId}`,
    []
  )
  const [twitterPosts, setTwitterPosts] = useLocalStorage<string[]>(`twitterPosts-${eventId}`, [])

  useEffect(() => {
    const fetchSocials = async () => {
      if (!eventId) return

      try {
        const response = await fetch(`/api/socials?eventId=${eventId}`)
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
  }, [eventId, setInstagramPosts, setTwitterPosts])

  return (
    <Box>
      {/* {eventId === '1' && (
        <>
          <Heading as="h1">Event recap</Heading>
          <Box py={4} display="flex" justifyContent="center">
            <InstagramEmbed url={`https://www.instagram.com/p/DHKBb4_TrIk`} width="600px" />
          </Box>
        </>
      )} */}
      {instagramPosts.length > 0 && (
        <>
          <Heading as="h1">Instagram</Heading>
          <Box>
            <Text mt={2}>
              <Link href="https://www.instagram.com/explore/tags/newtoweb3/" isExternal>
                {t('View all #NewToWeb3 posts on Instagram')}
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
        </>
      )}
      {twitterPosts.length > 0 && (
        <>
          <Heading as="h1" mt={4}>
            Twitter
          </Heading>
          <Box>
            <Text mt={2}>
              <Link href="https://x.com/hashtag/NewToWeb3?src=hashtag_click&f=live" isExternal>
                {t('View all #NewToWeb3 posts on Twitter')}
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
        </>
      )}
    </Box>
  )
}
