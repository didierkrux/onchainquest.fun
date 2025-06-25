import {
  Box,
  Text,
  Avatar,
  VStack,
  HStack,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  Card,
  CardBody,
  Heading,
  Link,
  Image,
  SimpleGrid,
  Button,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useFarcasterMessages } from 'hooks/useFarcasterMessages'
import { Card as CardComponent } from 'components/Card'
import { formatDistanceToNow } from 'date-fns'

interface FarcasterMessage {
  id: string
  text: string
  author: {
    username: string
    displayName: string
    pfp: string
    verified: boolean
  }
  timestamp: string
  reactions: any
  embeds: any[]
  images: string[]
  castUrl: string
}

interface FarcasterMessagesProps {
  eventId: string
}

// Helper function to get the best URL for an image
const getImageUrl = (imageUrl: string, embeds: any[]): string | null => {
  // First, check if the image URL matches any embed URL
  for (const embed of embeds) {
    // Skip embeds without URLs
    if (!embed.url) {
      continue
    }

    if (embed.url === imageUrl) {
      return embed.url
    }

    // Special handling for devconnect.org ticket URLs
    if (
      imageUrl.includes('devconnect.org/api/ticket/') &&
      embed.url.includes('devconnect.org/argentina/ticket/')
    ) {
      // Extract the ticket path from image URL
      const imagePath = imageUrl
        .replace('https://devconnect.org/api/ticket/', '')
        .replace('/social/', '/')
      const embedPath = embed.url.replace('https://devconnect.org/argentina/ticket/', '')

      if (imagePath === embedPath) {
        return embed.url
      }
    }

    // Check if image is from embed.images array
    if (embed.images && Array.isArray(embed.images)) {
      const matchingImage = embed.images.find((img: any) => img.url === imageUrl)
      if (matchingImage) {
        return embed.url
      }
    }
    // Check if image is from og_image
    if (embed.og_image === imageUrl) {
      return embed.url
    }
    // Check if image is from thumbnail_url
    if (embed.thumbnail_url === imageUrl) {
      return embed.url
    }
    // Check if image is from single image field
    if (embed.image === imageUrl) {
      return embed.url
    }
  }

  // If no matching embed found, return null (no link)
  return null
}

export const FarcasterMessages = ({ eventId }: FarcasterMessagesProps) => {
  const { t } = useTranslation()
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useFarcasterMessages(eventId)

  if (eventId !== '3') {
    return null
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={8}>
        <Spinner size="lg" color="purple.500" />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        {t('Failed to load Farcaster messages')}
      </Alert>
    )
  }

  // Flatten all pages of messages
  const allMessages = data?.pages?.flatMap((page: any) => page.messages) || []

  if (!allMessages.length) {
    return (
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        {t('No messages found in DevConnect channel')}
      </Alert>
    )
  }

  return (
    <Box>
      <Heading as="h2" size="lg" mb={4} textAlign="center">
        {t('DevConnect Channel')}
      </Heading>
      <Text fontSize="sm" color="gray.600" textAlign="center" mb={6}>
        {t('Latest messages from the official DevConnect channel on Farcaster')}
      </Text>

      <VStack spacing={4} align="stretch" maxW="618px" mx="auto">
        {allMessages.map((message: FarcasterMessage) => {
          return (
            <Link
              key={message.id}
              href={message.castUrl}
              isExternal
              _hover={{ textDecoration: 'none' }}
            >
              <CardComponent
                maxW="618px"
                cursor="pointer"
                _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                transition="all 0.2s"
                bg="white"
              >
                <CardBody p={4}>
                  <HStack spacing={3} align="start">
                    <Avatar size="sm" src={message.author.pfp} name={message.author.displayName} />
                    <Box flex="1" maxW="calc(100vw - 110px)">
                      <HStack spacing={2} mb={2} overflow="hidden">
                        <Text fontWeight="bold" fontSize="sm">
                          {message.author.displayName}
                        </Text>
                        <Text color="gray.500" fontSize="xs">
                          @{message.author.username}
                        </Text>
                        {message.author.verified && (
                          <Badge colorScheme="blue" size="sm">
                            ✓
                          </Badge>
                        )}
                        <Text color="gray.400" fontSize="xs" ml="auto">
                          {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                        </Text>
                      </HStack>

                      <Text fontSize="sm" mb={3} whiteSpace="pre-wrap">
                        {message.text}
                      </Text>

                      {/* Display images if available */}
                      {message.images && message.images.length > 0 && (
                        <Box mt={3}>
                          {message.images.length === 1 ? (
                            // Single image - no grid
                            <Box
                              borderRadius="md"
                              overflow="hidden"
                              border="1px solid"
                              borderColor="gray.200"
                            >
                              {(() => {
                                const linkUrl = getImageUrl(message.images[0], message.embeds)
                                const ImageComponent = (
                                  <Image
                                    src={message.images[0]}
                                    alt="Image"
                                    maxW="536px"
                                    w="100%"
                                    h="auto"
                                    objectFit="contain"
                                    onError={(e) => {
                                      console.error(`Failed to load image: ${message.images[0]}`)
                                      e.currentTarget.style.display = 'none'
                                    }}
                                    fallback={
                                      <Box
                                        bg="gray.100"
                                        height="120px"
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                      >
                                        <Text fontSize="xs" color="gray.500">
                                          Image
                                        </Text>
                                      </Box>
                                    }
                                  />
                                )

                                return linkUrl ? (
                                  <Link
                                    href={linkUrl}
                                    isExternal
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {ImageComponent}
                                  </Link>
                                ) : (
                                  ImageComponent
                                )
                              })()}
                            </Box>
                          ) : (
                            // Multiple images - use grid
                            <SimpleGrid columns={[1, 2, 3]} spacing={2}>
                              {message.images.slice(0, 6).map((imageUrl: string, index: number) => (
                                <Box
                                  key={index}
                                  borderRadius="md"
                                  overflow="hidden"
                                  border="1px solid"
                                  borderColor="gray.200"
                                >
                                  {(() => {
                                    const linkUrl = getImageUrl(imageUrl, message.embeds)
                                    const ImageComponent = (
                                      <Image
                                        src={imageUrl}
                                        alt={`Image ${index + 1}`}
                                        maxW="536px"
                                        w="100%"
                                        h="auto"
                                        objectFit="contain"
                                        onError={(e) => {
                                          console.error(`Failed to load image: ${imageUrl}`)
                                          e.currentTarget.style.display = 'none'
                                        }}
                                        fallback={
                                          <Box
                                            bg="gray.100"
                                            height="120px"
                                            display="flex"
                                            alignItems="center"
                                            justifyContent="center"
                                          >
                                            <Text fontSize="xs" color="gray.500">
                                              Image
                                            </Text>
                                          </Box>
                                        }
                                      />
                                    )

                                    return linkUrl ? (
                                      <Link
                                        href={linkUrl}
                                        isExternal
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {ImageComponent}
                                      </Link>
                                    ) : (
                                      ImageComponent
                                    )
                                  })()}
                                </Box>
                              ))}
                            </SimpleGrid>
                          )}
                        </Box>
                      )}

                      {message.reactions && Object.keys(message.reactions).length > 0 && (
                        <Text fontSize="xs" color="gray.500" mt={3}>
                          {Object.entries(message.reactions)
                            .filter(
                              ([key, value]) =>
                                key.endsWith('_count') && typeof value === 'number' && value > 0
                            )
                            .map(([key, count]) => {
                              const type = key.replace('_count', '')
                              return `${count} ${type}`
                            })
                            .join(' · ')}
                        </Text>
                      )}
                    </Box>
                  </HStack>
                </CardBody>
              </CardComponent>
            </Link>
          )
        })}

        {/* Load More Button */}
        {hasNextPage && (
          <Box display="flex" justifyContent="center" mt={6}>
            <Button
              onClick={() => fetchNextPage()}
              isLoading={isFetchingNextPage}
              loadingText={t('Loading more...')}
              colorScheme="purple"
              variant="outline"
              size="lg"
            >
              {isFetchingNextPage ? t('Loading more...') : t('Load More')}
            </Button>
          </Box>
        )}
      </VStack>
    </Box>
  )
}
