import { Box, Text, VStack, Heading, Badge, Button } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useMiniAppContext } from './MiniAppSDK'
import { Rocket, Star, Bell } from '@phosphor-icons/react'

export default function MiniAppFeatures() {
  const { t } = useTranslation()
  const { isMiniApp, sdk } = useMiniAppContext()

  // Only show if we're in a Mini App context
  if (!isMiniApp) {
    return null
  }

  const handleComposeCast = async () => {
    try {
      await sdk.actions.composeCast({
        text: `Just completed a quest on ${process.env.NEXT_PUBLIC_EVENT_NAME || 'Onchain Quest'}! 🎉 #Web3 #Farcaster`
      })
    } catch (error) {
      console.error('Failed to compose cast:', error)
    }
  }

  const handleViewProfile = async () => {
    try {
      // This would open the user's profile in the Farcaster client
      // You would need the user's FID for this to work
      console.log('View profile action triggered')
    } catch (error) {
      console.error('Failed to view profile:', error)
    }
  }

  return (
    <Box
      bg="purple.50"
      border="1px solid"
      borderColor="purple.200"
      borderRadius="lg"
      p={4}
      mb={4}
    >
      <VStack spacing={3} align="stretch">
        <Box display="flex" alignItems="center" gap={2}>
          <Rocket size={20} color="#805AD5" />
          <Heading size="sm" color="purple.600">
            {t('Farcaster Mini App')}
          </Heading>
          <Badge colorScheme="purple" variant="subtle">
            {t('Active')}
          </Badge>
        </Box>
        
        <Text fontSize="sm" color="gray.600">
          {t('You\'re using the enhanced Mini App experience with Farcaster integration!')}
        </Text>

        <Box display="flex" gap={2} flexWrap="wrap">
          <Button
            size="sm"
            leftIcon={<Star size={16} />}
            colorScheme="purple"
            variant="outline"
            onClick={handleComposeCast}
          >
            {t('Share Quest')}
          </Button>
          
          <Button
            size="sm"
            leftIcon={<Bell size={16} />}
            colorScheme="blue"
            variant="outline"
            onClick={handleViewProfile}
          >
            {t('View Profile')}
          </Button>
        </Box>

        <Box fontSize="xs" color="gray.500">
          <Text>✨ {t('Get notifications for quest completions')}</Text>
          <Text>🎯 {t('Share your progress with the community')}</Text>
          <Text>🏆 {t('Track your leaderboard position')}</Text>
        </Box>
      </VStack>
    </Box>
  )
} 
