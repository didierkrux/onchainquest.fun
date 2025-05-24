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
import { useAccount, useBalance, useSendTransaction } from 'wagmi'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import React from 'react'
import { useLocalStorage } from 'usehooks-ts'
import { Trophy, CheckCircle, Star, Lock } from '@phosphor-icons/react/dist/ssr'
import { useRouter } from 'next/router'
import { parseEther } from 'viem'
import { useSignMessage } from 'wagmi'

import { Event, Quest } from 'entities/data'
import { Profile } from 'entities/profile'
import { ENS_DOMAIN } from 'config'
import { switchChain } from '@wagmi/core'
import { wagmiAdapter } from 'context'

export default function Onboarding({ event }: { event: Event }) {
  const { t } = useTranslation()
  const { open } = useAppKit()
  const { address, isConnected, chainId } = useAccount()
  const { sendTransaction } = useSendTransaction()
  const router = useRouter()
  const { eventId } = router.query
  const [profile, setProfile] = useLocalStorage<Profile | null>(`profile-${eventId}`, null)
  const [lastAddress, setLastAddress] = useLocalStorage<string | null>(`lastAddress`, null)
  const [isLoading, setIsLoading] = useState<number | null>(null)
  const toast = useToast()
  const [isMobile] = useMediaQuery('(max-width: 1024px)')
  const [subnameInput, setSubnameInput] = useState('')
  const { signMessageAsync } = useSignMessage()

  useEffect(() => {
    if (address) {
      if (address !== lastAddress) {
        setProfile(null) // Reset profile if address is different
        setLastAddress(address) // Store the new address
      }
      fetch(`/api/profile?address=${address}&eventId=${event.config?.eventId}`)
        .then((res) => res.json())
        .then((data) => {
          setProfile(data)
        })
    }
  }, [address, lastAddress])

  const QUESTS: Quest[] = event.tasks || []

  const handleAction = async (quest: Quest) => {
    const taskId = quest.id
    console.log('taskId', taskId)
    setIsLoading(taskId)

    try {
      if (quest.action === 'claim-subname') {
        if (!subnameInput) {
          toast({
            title: t('Error'),
            description: t('Please enter a subname'),
            status: 'error',
            duration: 5000,
            isClosable: true,
            position: isMobile ? 'top' : 'bottom-right',
          })
          setIsLoading(null)
          return
        }

        // Create message to sign
        const message = `Claim subname ${subnameInput}.${ENS_DOMAIN} for address ${address}`

        // Get signature
        const signature = await signMessageAsync({ message })

        // Call API with signature
        const response = await fetch(
          `/api/claim-subname?address=${address}&eventId=${event.config?.eventId}&subname=${subnameInput}&signature=${signature}`
        )
        const data = await response.json()

        let feedbackType: 'success' | 'warning' | 'error' = 'error'
        if (response.status === 200) {
          feedbackType = 'success'
        } else if (response.status === 400) {
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

        if (response.status === 200 && data?.tasks) {
          setProfile(data)
        }
        setIsLoading(null)
        return
      }

      // Handle other actions
      fetch(
        quest.action === 'claim-tokens'
          ? `/api/claim-tokens?address=${address}&eventId=${event.config?.eventId}`
          : `/api/profile?address=${address}&taskId=${taskId}&eventId=${event.config?.eventId}`,
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
            title: t('Error'),
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
    } catch (error) {
      console.error('Error in transaction process:', error)
      toast({
        title: t('Error'),
        description: error instanceof Error ? error.message : 'Failed to process request',
        status: 'error',
        duration: 10000,
        isClosable: true,
        position: isMobile ? 'top' : 'bottom-right',
      })
      setIsLoading(null)
    }
  }

  const handleSendTokens = async () => {
    try {
      // get current chain id
      console.log('chainId', chainId)
      // change the chain id to base mainnet
      if (chainId !== 8453) {
        await switchChain(wagmiAdapter.wagmiConfig, { chainId: 8453 })
      }
      const hash = await sendTransaction({
        to: '0x767D1AF42CC93E15E72aFCF15477733C66e5460a',
        value: parseEther('0.00001'),
      })
      console.log('Transaction hash:', hash)
    } catch (error: any) {
      console.error('Error sending transaction:', error)
      // Handle user rejection specifically
      if (error?.code === 4001) {
        toast({
          title: t('Transaction Cancelled'),
          description: t('You rejected the transaction in your wallet.'),
          status: 'warning',
          duration: 5000,
          isClosable: true,
          position: isMobile ? 'top' : 'bottom-right',
        })
      } else {
        toast({
          title: t('Error'),
          description: error?.message || t('Failed to send transaction'),
          status: 'error',
          duration: 10000,
          isClosable: true,
          position: isMobile ? 'top' : 'bottom-right',
        })
      }
    }
  }

  for (const quest of QUESTS) {
    if (profile?.tasks) {
      if (quest.action === 'claim-tokens') {
        const isLocked = quest.lock
          ? !profile?.tasks?.[quest.lock - 1]?.isCompleted ?? false
          : false
        const isCompleted = profile?.tasks?.[quest.id]?.isCompleted ?? false
        quest.actionField = (
          <Box display="flex" gap={4}>
            {quest.lock && isLocked ? (
              <Box display="flex" alignItems="center" gap={2}>
                {t('Complete task #{{taskNumber}} first to unlock this.', {
                  taskNumber: quest.lock,
                })}
                <Lock size={28} color="gray" />
              </Box>
            ) : !isCompleted ? (
              <Box>
                <Button
                  onClick={() => handleAction(quest)}
                  isLoading={isLoading === quest.id}
                  loadingText={t('Claiming... (takes ~30 seconds)')}
                >
                  {t('Claim')}
                </Button>
              </Box>
            ) : null}
          </Box>
        )
        const txLink = profile?.tasks?.[quest.id]?.txLink
        quest.completedField = txLink ? (
          <Box>
            <Link isExternal href={txLink}>
              {t('View claiming transaction on BaseScan')}
            </Link>
          </Box>
        ) : null
      }
      if (quest.action === 'send-tokens') {
        const isLocked = quest.lock
          ? !profile?.tasks?.[quest.lock - 1]?.isCompleted ?? false
          : false
        const isCompleted = profile?.tasks?.[quest.id]?.isCompleted ?? false
        quest.actionField = (
          <Box display="flex" gap={4}>
            {quest.lock && isLocked ? (
              <Box display="flex" alignItems="center" gap={2}>
                {t('Complete task #{{taskNumber}} first to unlock this.', {
                  taskNumber: quest.lock,
                })}
                <Lock size={28} color="gray" />
              </Box>
            ) : !isCompleted ? (
              <Box display="flex" gap={4}>
                <Button
                  onClick={handleSendTokens}
                  loadingText={t('Sending... (takes ~30 seconds)')}
                >
                  {t('Send')}
                </Button>
                <Button onClick={() => handleAction(quest)} isLoading={isLoading === quest.id}>
                  {t('Verify')}
                </Button>
              </Box>
            ) : null}
          </Box>
        )
        const txLink = profile?.tasks?.[quest.id]?.txLink
        quest.completedField = txLink ? (
          <Box>
            <Link isExternal href={txLink}>
              {t('View sending transaction on BaseScan')}
            </Link>
          </Box>
        ) : null
      }
      if (quest.action === 'claim-poap') {
        const isLocked = quest.lock
          ? !profile?.tasks?.[quest.lock - 1]?.isCompleted ?? false
          : false
        const isCompleted = profile?.tasks?.[quest.id]?.isCompleted ?? false
        quest.actionField = (
          <Box display="flex" gap={4}>
            {quest.lock && isLocked ? (
              <Box display="flex" alignItems="center" gap={2}>
                {t('Complete task #{{taskNumber}} first to unlock this.', {
                  taskNumber: quest.lock,
                })}
                <Lock size={28} color="gray" />
              </Box>
            ) : !isCompleted ? (
              <Box>
                <Button onClick={() => handleAction(quest)} isLoading={isLoading === quest.id}>
                  {t('Verify')}
                </Button>
              </Box>
            ) : null}
          </Box>
        )
      }
      if (quest.action === 'click-link') {
        const links = quest.condition?.split('\n')
        const isCompleted = profile?.tasks?.[quest.id]?.isCompleted ?? false
        const buttons = quest.button?.split('\n')
        const Links = links?.map((link, index) => {
          return (
            <Link isExternal href={link}>
              <Button onClick={() => handleAction(quest)}>{buttons?.[index]}</Button>
            </Link>
          )
        })
        quest.actionField = !isCompleted ? (
          <Box display="flex" gap={4}>
            {Links}
          </Box>
        ) : null
        quest.completedField = isCompleted ? (
          <Box display="flex" gap={4}>
            {Links}
          </Box>
        ) : null
      }
      if (quest.action === 'own-basename') {
        const isCompleted = profile?.tasks?.[quest.id]?.isCompleted ?? false
        const baseLink = quest.condition
        quest.actionField = !isCompleted ? (
          <Box display="flex" gap={4}>
            <Link isExternal href={`https://newtoweb3.io/deeplink?url=${baseLink as string}`}>
              <Button>{t('Open Base inside Zerion')}</Button>
            </Link>
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
              href={`https://newtoweb3.io/deeplink?url=https://zora.co/collect/${quest.condition}?referrer=0x767D1AF42CC93E15E72aFCF15477733C66e5460a`}
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
        const isLocked = quest.lock
          ? !profile?.tasks?.[quest.lock - 1]?.isCompleted ?? false
          : false
        const isCompleted = profile?.tasks?.[quest.id]?.isCompleted ?? false
        quest.actionField = (
          <Box display="flex" gap={4}>
            {quest.lock && isLocked ? (
              <Box display="flex" alignItems="center" gap={2}>
                {t('Complete task #{{taskNumber}} first to unlock this.', {
                  taskNumber: quest.lock,
                })}
                <Lock size={28} color="gray" />
              </Box>
            ) : (
              <>
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
              </>
            )}
          </Box>
        )
      }

      if (quest.action === 'verify-balance') {
        const isCompleted = profile?.tasks?.[quest.id]?.isCompleted ?? false
        quest.actionField = !isCompleted ? (
          <Box display="flex" gap={4}>
            <Link isExternal href="https://newtoweb3.io/deeplink?url=https://yodl.me">
              <Button>{t('Open yodl inside Zerion')}</Button>
            </Link>
            <Button onClick={() => handleAction(quest)} isLoading={isLoading === quest.id}>
              {t('Verify')}
            </Button>
          </Box>
        ) : null
      }
      if (quest.action === 'claim-subname') {
        const isLocked = quest.lock
          ? !profile?.tasks?.[quest.lock - 1]?.isCompleted ?? false
          : false
        const isCompleted = profile?.tasks?.[quest.id]?.isCompleted ?? false
        quest.actionField = (
          <Box display="flex" gap={4} alignItems="center">
            {quest.lock && isLocked ? (
              <Box display="flex" alignItems="center" gap={2}>
                {t('Complete task #{{taskNumber}} first to unlock this.', {
                  taskNumber: quest.lock,
                })}
                <Lock size={28} color="gray" />
              </Box>
            ) : !isCompleted ? (
              <>
                <Box paddingRight={4}>
                  <input
                    type="text"
                    value={subnameInput}
                    onChange={(e) => setSubnameInput(e.target.value)}
                    placeholder={t('subname')}
                    style={{
                      padding: '2px',
                      borderRadius: '4px',
                      border: '1px solid #E2E8F0',
                      width: '120px',
                      textAlign: 'end',
                    }}
                  />
                  .{ENS_DOMAIN}
                </Box>
                <Button
                  onClick={() => {
                    if (!subnameInput) {
                      toast({
                        title: t('Error'),
                        description: t('Please enter a subname'),
                        status: 'error',
                        duration: 5000,
                        isClosable: true,
                        position: isMobile ? 'top' : 'bottom-right',
                      })
                      return
                    }
                    handleAction(quest)
                  }}
                  isLoading={isLoading === quest.id}
                >
                  {t('Claim')}
                </Button>
              </>
            ) : null}
          </Box>
        )
        const txLink = profile?.tasks?.[quest.id]?.txLink
        quest.completedField = (
          <Box display="flex" flexDirection="column" gap={2}>
            {profile?.subname && (
              <Box display="flex" gap={1}>
                <Box>{t('Your subname: ')}</Box>
                <Link isExternal href={`https://app.ens.domains/${profile?.subname}.${ENS_DOMAIN}`}>
                  <Text>
                    {profile?.subname}.{ENS_DOMAIN}
                  </Text>
                </Link>
              </Box>
            )}
            {txLink && (
              <Box display="flex" gap={1}>
                <Link isExternal href={txLink}>
                  {t('View minting transaction on BaseScan')}
                </Link>
              </Box>
            )}
          </Box>
        )
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
        const isLocked = quest.lock
          ? !profile?.tasks?.[quest.lock - 1]?.isCompleted ?? false
          : false
        return (
          <Card
            mt={4}
            key={index}
            bg={isConnected && isLocked ? 'gray.300' : isCompleted ? 'green.50' : 'white'}
          >
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
                      <Image h="100px" w="auto" src={quest.image} alt={quest.name} m="2" />
                    </Box>
                  )}
                </Box>
                <Box>
                  {isConnected ? (
                    <>
                      {(quest?.actionField || quest?.completedField || isCompleted) && (
                        <Divider my={2} />
                      )}
                      {quest?.actionField && (
                        <Box pt="2" display="flex" justifyContent="flex-end">
                          {quest?.actionField}
                        </Box>
                      )}
                      {quest?.completedField && (
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
                  ) : quest.action === 'connect-wallet' ? (
                    <Box pt="2" display="flex" justifyContent="flex-end" gap={4}>
                      <a href="https://link.zerion.io/a11o6IN0jqb" target="_blank">
                        <Button>{t('Install Wallet')}</Button>
                      </a>
                      <Button
                        onClick={() => {
                          open({ view: 'Connect' })
                        }}
                      >
                        {t('Connect Wallet')}
                      </Button>
                    </Box>
                  ) : null}
                </Box>
              </Box>
            </CardBody>
          </Card>
        )
      })}
    </Box>
  )
}
