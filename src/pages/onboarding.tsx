import { Box, Card, CardBody, Heading, Text, Link, Button, Input } from '@chakra-ui/react'
import { useAppKit } from '@reown/appkit/react'
import { useAccount } from 'wagmi'
import { useTranslation } from 'react-i18next'
import React from 'react'

import { Event, Quest } from 'entities/data'

export default function Onboarding({ event }: { event: Event }) {
  const { t } = useTranslation()
  const { open } = useAppKit()
  const { address } = useAccount()

  console.log(address)

  const QUESTS: Quest[] = event.tasks || []

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
