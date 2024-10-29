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
import { getMoments } from 'utils/index'

const Moments = ({ eventId }: { eventId: string }) => {
  const [moments, setMoments] = useState<any[]>([])
  useEffect(() => {
    const fetchMoments = async () => {
      const momentsData = await getMoments(eventId)
      setMoments(momentsData.data.moments)
    }
    fetchMoments()
  }, [eventId])

  if (!moments.length) return null
  return (
    <Box display="flex" flexWrap="wrap" gap={4} justifyContent="center">
      {moments.map((moment) => {
        if (moment.media.length > 0) {
          return <Image key={moment.id} src={moment.media[0].gateways[0].url} />
        }
      })}
    </Box>
  )
}

export default function Onboarding({ event }: { event: Event }) {
  const { t } = useTranslation()
  const { open } = useAppKit()
  const { address, isConnected } = useAccount()
  const [profile, setProfile] = useLocalStorage<Profile | null>('profile', null)
  const [isLoading, setIsLoading] = useState<number | null>(null)
  const toast = useToast()
  const [isMobile] = useMediaQuery('(max-width: 1024px)')

  useEffect(() => {
    if (address) {
      fetch(`/api/profile?address=${address}`)
        .then((res) => res.json())
        .then((data) => {
          setProfile(data)
        })
    }
  }, [address])

  const QUESTS: Quest[] = event.tasks || []

  const handleAction = (quest: Quest) => {
    const taskId = quest.id
    console.log('taskId', taskId)
    setIsLoading(taskId)
    fetch(
      taskId === 5
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
      .then((res) => res.json())
      .then((data) => {
        console.log('data', data)
        if (data?.message) {
          const feedbackType = data?.txLink ? 'success' : 'error'
          toast({
            title: feedbackType === 'success' ? 'Success' : 'Error',
            description: (
              <>
                {data?.message}
                {data?.txLink && (
                  <Box color="white !important">
                    <a href={data?.txLink} target="_blank">
                      {t('View claiming transaction on BaseScan')}
                    </a>
                  </Box>
                )}
              </>
            ),
            status: feedbackType,
            duration: 10000,
            isClosable: true,
            position: isMobile ? 'top' : 'bottom-right',
          })
          if (data?.tasks) {
            setProfile(data)
          }
        } else {
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
    // if (quest.action === 'secret-word') {
    //   quest.actionField = (
    //     <Box display="flex" gap={4}>
    //       <Input placeholder="Enter the secret word" />
    //       <Button
    //         onClick={() => {
    //           alert('TODO: Verifying...')
    //         }}
    //         isLoading={isLoading === quest.id}
    //       >
    //         Verify
    //       </Button>
    //     </Box>
    //   )
    // }
    if (quest.action === 'claim-tokens') {
      quest.actionField = (
        <Box>
          <Button
            onClick={() => handleAction(quest)}
            isLoading={isLoading === quest.id}
            loadingText={t('Claiming... (takes ~30 seconds)')}
          >
            {t('Claim')}
          </Button>
        </Box>
      )
      if (profile?.tasks?.[quest.id]?.txLink) {
        quest.completedField = (
          <Box>
            <a href={profile?.tasks?.[quest.id]?.txLink} target="_blank">
              {t('View claiming transaction on BaseScan')}
            </a>
          </Box>
        )
      }
    }
    if (quest.action === 'claim-poap' || quest.action === 'own-basename') {
      quest.actionField = (
        <Box>
          <Button onClick={() => handleAction(quest)} isLoading={isLoading === quest.id}>
            {t('Verify')}
          </Button>
        </Box>
      )
    }
    if (quest.action === 'own-basename') {
      if (profile?.basename) {
        quest.completedField = (
          <Box display="flex" gap={1}>
            <Box>{t('Your Base domain: ')}</Box>
            <a
              href={`https://www.base.org/name/${profile?.basename?.split('.')[0]}`}
              target="_blank"
            >
              <Text>{profile?.basename}</Text>
            </a>
          </Box>
        )
      }
    }
    if (quest.action === 'swap-tokens') {
      quest.actionField =
        profile?.tasks?.[5]?.isCompleted ?? false ? (
          <Box display="flex" gap={4}>
            <Button
              onClick={() => {
                open({ view: 'Account' })
              }}
            >
              {t('Swap')}
            </Button>
            {!profile?.tasks?.[6]?.isCompleted && (
              <Button onClick={() => handleAction(quest)} isLoading={isLoading === quest.id}>
                {t('Verify')}
              </Button>
            )}
          </Box>
        ) : (
          <Box>
            <Text textAlign="left">
              {t('🔒 Requirements: Claim your free tokens (task 6) before swapping')}
            </Text>
          </Box>
        )
    }
    // if (quest.action === 'poap-picture' && quest.condition) {
    //   quest.actionField = (
    //     <Box display="flex" gap={4}>
    //       <a target="_blank" href={`https://moments.poap.xyz/upload?drop=${quest.condition}`}>
    //         <Button>{t('Upload a picture')}</Button>
    //       </a>
    //       <Button
    //         onClick={() => {
    //           // setModalUrl(`https://moments.poap.xyz/drops/${quest.condition}`)
    //           if (quest.condition) {
    //             setOpenModal(quest.condition)
    //           }
    //         }}
    //       >
    //         {t('View gallery')}
    //       </Button>
    //     </Box>
    //   )
    // }
    // if (quest.action === 'attest') {
    //   quest.actionField = (
    //     <Box display="flex" gap={4}>
    //       <Button
    //         onClick={() => {
    //           alert(`TODO: show QR code and attest me`)
    //         }}
    //       >
    //         Attest Me
    //       </Button>
    //       <Button
    //         onClick={() => {
    //           alert(`TODO: enter someone's username and attest them`)
    //         }}
    //         ml={4}
    //       >
    //         Attest Someone
    //       </Button>
    //     </Box>
    //   )
    // }
  }

  return (
    <Box>
      <Box display={'flex'} w="100%" gap={4} justifyContent="space-between">
        <Heading as="h1">{t('Onboarding tasks')}</Heading>
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
        const isCompleted = !!profile?.tasks?.[index.toString()]?.isCompleted
        return (
          <Card mt={4} key={index} bg={isCompleted ? 'green.50' : 'white'}>
            <CardBody display="flex" justifyContent="space-between" alignItems="center" gap={4}>
              <Box w="100%">
                <Box display="flex" gap={2} justifyContent="space-between" fontSize="18px">
                  <Box display="flex" alignItems="center" gap={2} color="grey" fontWeight="bold">
                    <Trophy color="orange" size={24} /> Task #{index + 1}
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
                          if (quest.action === 'click-link') {
                            handleAction(quest)
                          }
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
                <Divider my={2} />
                {((quest?.actionField && !isCompleted) || quest.action === 'swap-tokens') &&
                  isConnected && (
                    <Box pt="2" textAlign="right">
                      {quest?.actionField}
                    </Box>
                  )}
                {quest.completedField && <Box pt="2">{quest.completedField}</Box>}
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
              </Box>
            </CardBody>
          </Card>
        )
      })}
      {/* <Modal isOpen={!!openModal} onClose={() => setOpenModal(null)} size="full">
        <ModalContent>
          <ModalCloseButton color="black" />
          <ModalHeader>{t('POAP Gallery')}</ModalHeader>
          <ModalBody w="100vw" h="100vh" p={0}>
            {openModal && <Moments eventId={openModal} />}
          </ModalBody>
        </ModalContent>
      </Modal> */}
    </Box>
  )
}
