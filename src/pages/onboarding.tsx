import { Box, Card, CardBody, Heading, Text, Link, Button, Input } from '@chakra-ui/react'
import { useAppKit } from '@reown/appkit/react'
import { useAccount } from 'wagmi'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import data_en from 'translation/en/data.json'
import data_th from 'translation/th/data.json'
import React from 'react'

export default function Onboarding() {
  const { t, i18n } = useTranslation()
  const { open } = useAppKit()
  const { address } = useAccount()

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  interface Quest {
    name: string
    points: number
    description: string
    action: string
    condition?: string
    actionField?: React.ReactNode // Add this line
  }

  const data = mounted ? (i18n.language === 'en' ? data_en : data_th) : { tasks: [] }
  const QUESTS: Quest[] = data.tasks || []

  for (const quest of QUESTS) {
    if (quest.action === 'secret-word') {
      quest.actionField = (
        <Box display="flex" gap={4}>
          <Input placeholder="Enter the secret word" />
          <Button
            onClick={() => {
              alert('TODO: Verifying...')
            }}
          >
            Verify
          </Button>
        </Box>
      )
    }
    if (quest.action === 'claim-tokens') {
      quest.actionField = (
        <Box>
          <Button
            onClick={() => {
              alert('TODO: Claiming...')
            }}
          >
            Claim
          </Button>
        </Box>
      )
    }
    if (quest.action === 'swap') {
      quest.actionField = (
        <Box>
          <Button
            onClick={() => {
              open({ view: 'Account' })
            }}
          >
            Swap
          </Button>
        </Box>
      )
    }
    if (quest.action === 'attest') {
      quest.actionField = (
        <Box display="flex" gap={4}>
          <Button
            onClick={() => {
              alert(`TODO: show QR code and attest me`)
            }}
          >
            Attest Me
          </Button>
          <Button
            onClick={() => {
              alert(`TODO: enter someone's username and attest them`)
            }}
            ml={4}
          >
            Attest Someone
          </Button>
        </Box>
      )
    }
  }

  return (
    <Box>
      <Heading as="h1">{t('Onboarding tasks')}</Heading>
      {QUESTS.map((quest, index) => (
        <Card mt={4} key={index}>
          <CardBody display="flex" justifyContent="space-between" alignItems="center" gap={4}>
            <Box>
              <Heading size="md">
                {index + 1}. {quest.name}
              </Heading>
              <Text pt="2">Points: {quest.points} ⭐️</Text>
              <Box pt="2">
                <Box fontWeight="bold" fontSize="lg">
                  👉 {t('Instructions')}:
                </Box>
                {quest.description?.split('\n').map((line, index) => (
                  <React.Fragment key={index}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              </Box>
              {quest?.actionField && (
                <Box pt="2">
                  <Box fontWeight="bold" fontSize="lg" mb="2">
                    👉 {t('Action')}:
                  </Box>
                  {quest?.actionField}
                </Box>
              )}
            </Box>
            <Box>{/* {quest.isCompleted ? '✅' : '❌'} */}✅</Box>
          </CardBody>
        </Card>
      ))}
    </Box>
  )
}
