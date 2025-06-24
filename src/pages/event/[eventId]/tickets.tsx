import {
  Box,
  Button,
  Card,
  CardBody,
  Heading,
  Text,
  useToast,
  useMediaQuery,
  SimpleGrid,
  Badge,
  Flex,
  Spinner,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/router'
import { useAccount } from 'wagmi'
import { adminWallets } from 'config'
import { CopySimple, Download, QrCode } from '@phosphor-icons/react'

interface Ticket {
  id: number
  code: string
  event_id: number
  is_used: boolean
  used_at: string | null
  created_at: string
  user_id: number | null
}

export default function TicketsPage() {
  const { t } = useTranslation()
  const { address } = useAccount()
  const router = useRouter()
  const { eventId } = router.query
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({})
  const toast = useToast()
  const [isMobile] = useMediaQuery('(max-width: 1024px)')

  const isAdmin = address && adminWallets.includes(address.toLowerCase())

  const fetchTickets = async () => {
    if (!eventId) return

    try {
      const response = await fetch(`/api/tickets?eventId=${eventId}`)
      if (response.ok) {
        const data = await response.json()
        setTickets(data.tickets || [])
      } else {
        console.error('Failed to fetch tickets')
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateQRCode = async (ticketCode: string) => {
    try {
      const url = `${window.location.origin}/api/ticket/${ticketCode}?eventId=${eventId}`
      const qrDataURL = await QRCode.toDataURL(url, {
        type: 'image/png',
        color: { dark: '#000000', light: '#FFFFFF' },
        width: 200,
        margin: 2,
      })
      setQrCodes((prev) => ({ ...prev, [ticketCode]: qrDataURL }))
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  const downloadQRCode = async (ticketCode: string, qrDataURL: string) => {
    try {
      const link = document.createElement('a')
      link.download = `ticket-${ticketCode}.png`
      link.href = qrDataURL
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading QR code:', error)
    }
  }

  const copyTicketCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({
      title: t('Copied'),
      description: `Ticket code ${code} copied to clipboard`,
      status: 'success',
      duration: 2000,
      isClosable: true,
      position: isMobile ? 'top' : 'bottom-right',
    })
  }

  useEffect(() => {
    fetchTickets()
  }, [eventId])

  useEffect(() => {
    // Generate QR codes for all tickets
    tickets.forEach((ticket) => {
      if (!qrCodes[ticket.code]) {
        generateQRCode(ticket.code)
      }
    })
  }, [tickets])

  if (!isAdmin) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" p={8}>
        <Heading>Access Denied</Heading>
        <Text mt={4}>Only admins can view tickets.</Text>
      </Box>
    )
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="50vh">
        <Spinner size="xl" />
      </Box>
    )
  }

  return (
    <Box display="flex" flexDirection="column" alignItems="center" p={4}>
      <Heading as="h1" mb={6}>
        Event Tickets - {eventId}
      </Heading>

      <Text mb={4} color="gray.600">
        Total Tickets: {tickets.length} | Used: {tickets.filter((t) => t.is_used).length} |
        Available: {tickets.filter((t) => !t.is_used).length}
      </Text>

      <SimpleGrid columns={[1, 2, 3]} spacing={6} w="100%" maxW="1200px">
        {tickets.map((ticket) => (
          <Card key={ticket.id} variant={ticket.is_used ? 'outline' : 'elevated'}>
            <CardBody>
              <Flex direction="column" align="center" gap={3}>
                {/* Ticket Status Badge */}
                <Badge
                  colorScheme={ticket.is_used ? 'red' : 'green'}
                  variant="subtle"
                  fontSize="sm"
                >
                  {ticket.is_used ? 'Used' : 'Available'}
                </Badge>

                {/* Ticket Code */}
                <Box textAlign="center">
                  <Text fontSize="2xl" fontWeight="bold" fontFamily="mono">
                    {ticket.code}
                  </Text>
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<CopySimple />}
                    onClick={() => copyTicketCode(ticket.code)}
                  >
                    Copy
                  </Button>
                </Box>

                {/* QR Code */}
                {qrCodes[ticket.code] && (
                  <Box textAlign="center">
                    <img
                      src={qrCodes[ticket.code]}
                      alt={`QR Code for ${ticket.code}`}
                      style={{
                        width: '150px',
                        height: '150px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                      }}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Download />}
                      onClick={() => downloadQRCode(ticket.code, qrCodes[ticket.code])}
                      mt={2}
                    >
                      Download
                    </Button>
                  </Box>
                )}

                {/* Ticket Info */}
                <Box textAlign="center" fontSize="sm" color="gray.600">
                  <Text>Created: {new Date(ticket.created_at).toLocaleDateString()}</Text>
                  {ticket.is_used && ticket.used_at && (
                    <Text>Used: {new Date(ticket.used_at).toLocaleDateString()}</Text>
                  )}
                </Box>
              </Flex>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>

      {tickets.length === 0 && (
        <Box textAlign="center" mt={8}>
          <Text fontSize="lg" color="gray.500">
            No tickets found for this event.
          </Text>
          <Text fontSize="sm" color="gray.400" mt={2}>
            Generate tickets from the admin panel first.
          </Text>
        </Box>
      )}
    </Box>
  )
}
