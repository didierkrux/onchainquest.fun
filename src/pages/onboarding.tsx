import {
  Box,
  Card,
  CardBody,
  Heading,
  Text,
  Button,
  Modal,
  useToast,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Image,
} from '@chakra-ui/react'
import { useAppKit } from '@reown/appkit/react'
import { useAccount } from 'wagmi'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import React from 'react'
import { useLocalStorage } from 'usehooks-ts'

import { Event, Quest } from 'entities/data'
import { Profile } from 'entities/profile'
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
  const { address } = useAccount()
  const [profile, setProfile] = useLocalStorage<Profile | null>('profile', null)
  const [isLoading, setIsLoading] = useState<number | null>(null)
  const [openModal, setOpenModal] = useState<string | null>(null)
  const toast = useToast()
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
          const feedbackType = data?.txHash ? 'success' : 'error'
          toast({
            title: feedbackType === 'success' ? 'Success' : 'Error',
            description: `${data?.message}${
              data?.txHash
                ? `\nTransaction hash: <a href="${data?.txHash}" target="_blank">View on Basescan</a>`
                : ''
            }`,
            status: feedbackType,
            duration: 5000,
            isClosable: true,
          })
          if (data?.tasks) {
            setProfile(data)
          }
        } else {
          setProfile(data)
        }
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
            loadingText="Claiming... (takes ~30 seconds, please wait for confirmation)"
          >
            Claim
          </Button>
        </Box>
      )
    }
    if (quest.action === 'claim-poap') {
      quest.actionField = (
        <Box>
          <Button onClick={() => handleAction(quest)} isLoading={isLoading === quest.id}>
            Verify
          </Button>
        </Box>
      )
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
              Swap
            </Button>
            {!profile?.tasks?.[6]?.isCompleted && (
              <Button onClick={() => handleAction(quest)} isLoading={isLoading === quest.id}>
                Verify
              </Button>
            )}
          </Box>
        ) : (
          <Box>
            <Text>Claim your tokens (taksk 6) to swap</Text>
          </Box>
        )
    }
    if (quest.action === 'poap-picture' && quest.condition) {
      quest.actionField = (
        <Box display="flex" gap={4}>
          <a target="_blank" href={`https://moments.poap.xyz/upload?drop=${quest.condition}`}>
            <Button>Upload a picture</Button>
          </a>
          <Button
            onClick={() => {
              // setModalUrl(`https://moments.poap.xyz/drops/${quest.condition}`)
              if (quest.condition) {
                setOpenModal(quest.condition)
              }
            }}
          >
            View gallery
          </Button>
        </Box>
      )
    }
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
      <Heading as="h1">{t('Onboarding tasks')}</Heading>
      {QUESTS.map((quest, index) => {
        const isCompleted = !!profile?.tasks?.[index.toString()]?.isCompleted
        return (
          <Card mt={4} key={index} variant={isCompleted ? 'outline' : 'filled'}>
            <CardBody display="flex" justifyContent="space-between" alignItems="center" gap={4}>
              <Box>
                <Heading size="md">
                  {index + 1}. {quest.name}
                </Heading>
                <Text pt="2">
                  {t('Points')}: {quest.points} ⭐️
                </Text>
                <Box pt="2">
                  <Box fontWeight="bold" fontSize="lg">
                    👉 {t('Instructions')}:
                  </Box>
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
                </Box>
                {((quest?.actionField && !isCompleted) || index === 6) && (
                  <Box pt="2">
                    <Box fontWeight="bold" fontSize="lg" mb="2">
                      👉 {t('Action')}:
                    </Box>
                    {quest?.actionField}
                  </Box>
                )}
              </Box>
              <Box>{isCompleted ? '✅' : '❌'}</Box>
            </CardBody>
          </Card>
        )
      })}
      <Modal isOpen={!!openModal} onClose={() => setOpenModal(null)} size="full">
        <ModalContent>
          <ModalCloseButton color="black" />
          <ModalHeader>POAP Gallery</ModalHeader>
          <ModalBody w="100vw" h="100vh" p={0}>
            {openModal && <Moments eventId={openModal} />}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
}
