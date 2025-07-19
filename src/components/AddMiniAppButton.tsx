import { Button, useToast } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useMiniAppContext } from './MiniAppSDK'
import { Star } from '@phosphor-icons/react'

export default function AddMiniAppButton() {
  const { t } = useTranslation()
  const { isMiniApp, sdk } = useMiniAppContext()
  const toast = useToast()

  const handleAddMiniApp = async () => {
    try {
      await sdk.actions.addMiniApp()
      toast({
        title: t('Mini App Added'),
        description: t('You can now access this app from your Farcaster client'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Failed to add Mini App:', error)
      toast({
        title: t('Error'),
        description: t('Failed to add Mini App. Please try again.'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  // Only show the button if we're in a Mini App context
  if (!isMiniApp) {
    return null
  }

  return (
    <Button
      leftIcon={<Star size={20} />}
      onClick={handleAddMiniApp}
      colorScheme="blue"
      variant="outline"
      size="sm"
    >
      {t('Add to Farcaster')}
    </Button>
  )
} 
