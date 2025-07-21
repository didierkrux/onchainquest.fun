import { Box, Button, Text, VStack, useToast } from '@chakra-ui/react'
import { useLocalStorage } from 'usehooks-ts'
import { useRouter } from 'next/router'

export default function PrivyPage() {
  const router = useRouter()
  const toast = useToast()
  const [privyEnabled, setPrivyEnabled] = useLocalStorage<boolean>('privy-enabled', false)

  const handleTogglePrivy = () => {
    const newValue = !privyEnabled
    setPrivyEnabled(newValue)
    
    toast({
      title: `Privy ${newValue ? 'Enabled' : 'Disabled'}`,
      description: `Privy functionality has been ${newValue ? 'enabled' : 'disabled'}.`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  return (
    <Box display="flex" flexDirection="column" alignItems="center" p={8}>
      <VStack spacing={6} maxW="md" w="full">
        <Text fontSize="2xl" fontWeight="bold" textAlign="center">
          Privy Configuration
        </Text>
        
        <Text fontSize="md" textAlign="center" color="gray.600">
          Toggle Privy functionality on or off. This setting is saved in your browser&apos;s localStorage.
        </Text>
        
        <Button
          size="lg"
          colorScheme={privyEnabled ? 'green' : 'red'}
          onClick={handleTogglePrivy}
          w="full"
        >
          {privyEnabled ? 'Disable' : 'Enable'} Privy
        </Button>
        
        <Box
          p={4}
          bg={privyEnabled ? 'green.50' : 'red.50'}
          border="1px solid"
          borderColor={privyEnabled ? 'green.200' : 'red.200'}
          borderRadius="md"
          w="full"
        >
          <Text
            fontSize="sm"
            color={privyEnabled ? 'green.700' : 'red.700'}
            textAlign="center"
          >
            Current Status: <strong>{privyEnabled ? 'ENABLED' : 'DISABLED'}</strong>
          </Text>
        </Box>
        
        <Button
          variant="outline"
          onClick={() => router.back()}
          w="full"
        >
          Go Back
        </Button>
      </VStack>
    </Box>
  )
}
