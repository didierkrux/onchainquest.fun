import {
  Box,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Text,
} from '@chakra-ui/react'
import { useState } from 'react'
import { Scanner } from '@yudiel/react-qr-scanner'

interface QRScannerProps {
  onScan?: (result: string) => void
  buttonLabel?: string
}

export const QRScanner = ({ onScan, buttonLabel }: QRScannerProps) => {
  const [cameraPermission, setCameraPermission] = useState<PermissionState | null>(null)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()

  const handleScan = (result: string) => {
    setScanResult(result)
    localStorage.setItem('qrCode', result)
    onScan?.(result)
  }

  const handleScanClick = async () => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const permissionStatus = await navigator.permissions.query({
          name: 'camera' as PermissionName,
        })
        setCameraPermission(permissionStatus.state)

        if (permissionStatus.state === 'denied') {
          alert('Camera permission is required. Please enable it in your browser settings.')
          return
        }

        if (permissionStatus.state === 'prompt') {
          // Request camera access explicitly
          const stream = await navigator.mediaDevices.getUserMedia({ video: true })
          // Stop the stream immediately since we just needed it for permission
          stream.getTracks().forEach((track) => track.stop())
          // Update permission state after explicit request
          const newPermissionStatus = await navigator.permissions.query({
            name: 'camera' as PermissionName,
          })
          setCameraPermission(newPermissionStatus.state)

          if (newPermissionStatus.state === 'denied') {
            alert('Camera access was denied. Please grant permission to use the camera.')
            return
          }
        }
      }
      onOpen()
    } catch (error) {
      console.error('Error accessing camera:', error)
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        setCameraPermission('denied')
        alert('Camera access was denied. Please grant permission to use the camera.')
      } else {
        alert('Failed to access camera. Please ensure you have granted camera permissions.')
      }
    }
  }

  const QRScannerModal = () => (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Scan QR Code</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {cameraPermission === 'denied' ? (
            <Text color="red.500" textAlign="center" py={4}>
              Camera access is required to scan QR codes. Please enable camera permissions in your
              browser settings.
            </Text>
          ) : (
            <Box
              position="relative"
              width="100%"
              margin="0 auto"
              border="2px solid"
              borderColor="purple.500"
              borderRadius="md"
              overflow="hidden"
            >
              <Scanner
                onScan={(detectedCodes: { rawValue: string }[]) => {
                  if (detectedCodes.length > 0) {
                    const result = detectedCodes[0].rawValue
                    handleScan(result)
                    onClose()
                  }
                }}
                onError={(error: unknown) => {
                  console.error('QR Scanner error:', error)
                }}
                constraints={{
                  facingMode: 'environment',
                }}
                styles={{
                  container: {
                    width: '100%',
                    height: '300px',
                  },
                  video: {
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  },
                }}
              />
            </Box>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  )

  return (
    <Box mt="10">
      <Button onClick={handleScanClick} isDisabled={cameraPermission === 'denied'}>
        {cameraPermission === 'denied' ? 'Camera Access Denied' : buttonLabel || 'Scan QR Code'}
      </Button>
      <QRScannerModal />
      {scanResult && (
        <Box mt={4} p={4} bg="gray.100" borderRadius="md">
          <Text fontWeight="bold">Last scanned QR code:</Text>
          <Text>{scanResult}</Text>
        </Box>
      )}
    </Box>
  )
}
