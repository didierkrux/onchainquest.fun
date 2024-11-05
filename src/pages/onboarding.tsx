import {
  Box,
  Card,
  CardBody,
  Heading,
  Text,
  Button,
  useToast,
  Image,
  useMediaQuery,
  Badge,
  Divider,
  Link,
} from '@chakra-ui/react'
import { useAppKit } from '@reown/appkit/react'
import { useAccount } from 'wagmi'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import React from 'react'
import { useLocalStorage } from 'usehooks-ts'

import { Event, Quest } from 'entities/data'
import { Profile } from 'entities/profile'
import { CheckCircle, Star } from '@phosphor-icons/react/dist/ssr'
import { Trophy } from '@phosphor-icons/react/dist/ssr'

export default function Onboarding({ event }: { event: Event }) {
  const { t } = useTranslation()
  const { open } = useAppKit()
  const { address, isConnected } = useAccount()
  const [profile, setProfile] = useLocalStorage<Profile | null>('profile', null)
  const [lastAddress, setLastAddress] = useLocalStorage<string | null>('lastAddress', null)
  const [isLoading, setIsLoading] = useState<number | null>(null)
  const toast = useToast()
  const [isMobile] = useMediaQuery('(max-width: 1024px)')

  useEffect(() => {
    if (address) {
      if (address !== lastAddress) {
        setProfile(null) // Reset profile if address is different
        setLastAddress(address) // Store the new address
      }
      fetch(`/api/profile?address=${address}`)
        .then((res) => res.json())
        .then((data) => {
          setProfile(data)
        })
    }
  }, [address, lastAddress])

  const QUESTS: Quest[] = event.tasks || []

  const handleAction = (quest: Quest) => {
    const taskId = quest.id
    console.log('taskId', taskId)
    setIsLoading(taskId)
    fetch(
      quest.action === 'claim-tokens'
        ? `/api/claim?address=${address}`
        : `/api/profile?address=${address}&taskId=${taskId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: quest.id,
        }),
      }
    )
      .then((res) => res.json().then((data) => ({ status: res.status, data })))
      .then(({ status, data }) => {
        console.log('data', data)
        let feedbackType: 'success' | 'warning' | 'error' = 'error'
        if (status === 200) {
          feedbackType = 'success'
        } else if (status === 400) {
          feedbackType = 'warning'
        }

        toast({
          title:
            feedbackType === 'success'
              ? t('Success')
              : feedbackType === 'warning'
              ? t('Warning')
              : t('Error'),
          description: <>{data?.message}</>,
          status: feedbackType,
          duration: 10000,
          isClosable: true,
          position: isMobile ? 'top' : 'bottom-right',
        })

        if (status === 200 && data?.tasks) {
          setProfile(data)
        }
      })
      .catch((error) => {
        console.error('Error in transaction process:', error)
        toast({
          title: 'Error',
          description: error.message,
          status: 'error',
          duration: 10000,
          isClosable: true,
          position: isMobile ? 'top' : 'bottom-right',
        })
      })
      .finally(() => {
        setIsLoading(null)
      })
  }

  for (const quest of QUESTS) {
    if (profile?.tasks) {
      if (quest.action === 'claim-tokens') {
        const isCompleted = profile?.tasks?.[quest.id]?.isCompleted ?? false
        quest.actionField = !isCompleted ? (
          <Box>
            <Button
              onClick={() => handleAction(quest)}
              isLoading={isLoading === quest.id}
              loadingText={t('Claiming... (takes ~30 seconds)')}
            >
              {t('Claim')}
            </Button>
          </Box>
        ) : null
        const txLink = profile?.tasks?.[quest.id]?.txLink
        quest.completedField = txLink ? (
          <Box>
            <Link isExternal href={txLink}>
              {t('View claiming transaction on BaseScan')}
            </Link>
          </Box>
        ) : null
      }
      if (quest.action === 'claim-poap') {
        const isCompleted = profile?.tasks?.[quest.id]?.isCompleted ?? false
        quest.actionField = !isCompleted ? (
          <Box>
            <Button onClick={() => handleAction(quest)} isLoading={isLoading === quest.id}>
              {t('Verify')}
            </Button>
          </Box>
        ) : null
      }
      if (quest.action === 'click-link') {
        const lineLink = quest.condition?.split('\n')[0]
        const telegramLink = quest.condition?.split('\n')[1]
        const isCompleted = profile?.tasks?.[quest.id]?.isCompleted ?? false
        quest.actionField = !isCompleted ? (
          <Box display="flex" gap={4}>
            <Link isExternal href={lineLink}>
              <Button onClick={() => handleAction(quest)}>{t('Join Line')}</Button>
            </Link>
            <Link isExternal href={telegramLink}>
              <Button onClick={() => handleAction(quest)}>{t('Join Telegram')}</Button>
            </Link>
          </Box>
        ) : null
        quest.completedField = isCompleted ? (
          <Box display="flex" gap={4}>
            <Link isExternal href={lineLink}>
              <Button>{t('Join Line')}</Button>
            </Link>
            <Link isExternal href={telegramLink}>
              <Button>{t('Join Telegram')}</Button>
            </Link>
          </Box>
        ) : null
      }
      if (quest.action === 'own-basename') {
        const isCompleted = profile?.tasks?.[quest.id]?.isCompleted ?? false
        quest.actionField = !isCompleted ? (
          <Box>
            <Button onClick={() => handleAction(quest)} isLoading={isLoading === quest.id}>
              {t('Verify')}
            </Button>
          </Box>
        ) : null
        quest.completedField = profile?.basename ? (
          <Box display="flex" gap={1}>
            <Box>{t('Your Base domain: ')}</Box>
            <Link isExternal href={`https://www.base.org/name/${profile?.basename?.split('.')[0]}`}>
              <Text>{profile?.basename}</Text>
            </Link>
          </Box>
        ) : null
      }
      if (quest.action === 'mint-nft') {
        const isCompleted = profile?.tasks?.[quest.id]?.isCompleted ?? false
        quest.actionField = (
          <Box display="flex" gap={4}>
            <Link
              isExternal
              href={`zerion://browser?url=${encodeURIComponent(
                `https://zora.co/collect/${quest.condition}?referrer=0x767D1AF42CC93E15E72aFCF15477733C66e5460a`
              )}`}
            >
              <Button>{t('Mint NFT inside Zerion')}</Button>
            </Link>
            {!isCompleted && (
              <Button onClick={() => handleAction(quest)} isLoading={isLoading === quest.id}>
                {t('Verify')}
              </Button>
            )}
          </Box>
        )
        const nftLink = profile?.tasks?.[quest.id]?.nftLink
        quest.completedField = nftLink ? (
          <Box>
            <Link
              isExternal
              href={`https://opensea.io/assets/${profile?.tasks?.[quest.id]?.nftLink?.replace(
                ':',
                '/'
              )}`}
            >
              {t('View NFT on OpenSea')}
            </Link>
          </Box>
        ) : null
      }
      if (quest.action === 'swap-tokens') {
        const isCompleted = profile?.tasks?.[quest.id]?.isCompleted ?? false
        quest.actionField = (
          <Box display="flex" gap={4}>
            <Button
              onClick={() => {
                open({ view: 'Account' })
              }}
            >
              {t('Swap')}
            </Button>
            {!isCompleted && (
              <Button onClick={() => handleAction(quest)} isLoading={isLoading === quest.id}>
                {t('Verify')}
              </Button>
            )}
          </Box>
        )
      }
      if (quest.action === 'verify-balance') {
        const isCompleted = profile?.tasks?.[quest.id]?.isCompleted ?? false
        quest.actionField = !isCompleted ? (
          <Box>
            <Button onClick={() => handleAction(quest)} isLoading={isLoading === quest.id}>
              {t('Verify')}
            </Button>
          </Box>
        ) : null
      }
    }
  }

  return (
    <Box>
      <Box display={'flex'} w="100%" gap={4} justifyContent="space-between">
        <Heading as="h1">{t('Onboarding')}</Heading>
        {profile?.score && profile?.score > 0 && (
          <Box display="flex" justifyContent="flex-end">
            <Text display="flex" alignItems="end" fontSize="2xl" fontWeight="bold">
              <Box display="flex" alignItems="center" color="purple.300" ml={1}>
                <Box display="inline" mr={1}>
                  {profile?.score}
                </Box>
                <Star weight="fill" size={24} />
              </Box>
            </Text>
          </Box>
        )}
      </Box>
      {QUESTS.map((quest, index) => {
        const isCompleted = profile?.tasks?.[index.toString()]?.isCompleted ?? false
        return (
          <Card mt={4} key={index} bg={isCompleted ? 'green.50' : 'white'}>
            <CardBody display="flex" justifyContent="space-between" alignItems="center" gap={4}>
              <Box w="100%">
                <Box display="flex" gap={2} justifyContent="space-between" fontSize="18px">
                  <Box display="flex" alignItems="center" gap={2} color="grey" fontWeight="bold">
                    <Trophy color="#FF7614" size={24} /> Task #{index + 1}
                  </Box>
                  <Badge
                    size="xl"
                    borderRadius="md"
                    colorScheme="purple"
                    display="flex"
                    alignItems="center"
                    p="4px 8px"
                  >
                    <Star weight="fill" size={24} />
                    <Box ml={1} fontSize="14px">
                      {quest.points} {t('points')}
                    </Box>
                  </Badge>
                </Box>
                <Heading size="md" color="purple.500" fontSize="xl" mt={2}>
                  {quest.name}
                </Heading>
                <Box pt="2">
                  {quest.description?.split('\n').map((line, index) => (
                    <React.Fragment key={index}>
                      <span
                        onClick={() => {
                          // if (quest.action === 'click-link') {
                          //   handleAction(quest)
                          // }
                        }}
                        dangerouslySetInnerHTML={{ __html: line }}
                      />
                      <br />
                    </React.Fragment>
                  ))}
                  {quest.image && (
                    <Box display="flex" justifyContent="right">
                      <Image w="100px" h="auto" src={quest.image} alt={quest.name} m="2" />
                    </Box>
                  )}
                </Box>
                <Box>
                  {isConnected && (
                    <>
                      <Divider my={2} />
                      {quest?.actionField && (
                        <Box pt="2" display="flex" justifyContent="flex-end">
                          {quest?.actionField}
                        </Box>
                      )}
                      {quest.completedField && (
                        <Box pt="2" display="flex" justifyContent="flex-end">
                          {quest.completedField}
                        </Box>
                      )}
                      {isCompleted && (
                        <Box
                          display="flex"
                          alignItems="center"
                          gap={2}
                          color="green"
                          fontWeight="bold"
                          justifyContent="flex-end"
                          pt="2"
                        >
                          <CheckCircle size={24} />
                          <span>{t('Completed')}</span>
                        </Box>
                      )}
                    </>
                  )}
                </Box>
              </Box>
            </CardBody>
          </Card>
        )
      })}
    </Box>
  )
}
