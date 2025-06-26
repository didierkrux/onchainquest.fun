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
  Link,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/router'
import { useAccount } from 'wagmi'
import { adminWallets } from 'config'
import { CopySimple, Download, QrCode } from '@phosphor-icons/react'

// Print layout constants
const PRINT_QR_SIZE = 60
const PRINT_CODE_FONT_SIZE = 12

// Helper function to format ticket code with spaces
const formatTicketCode = (code: string) => {
  return code.replace(/(.{2})/g, '$1 ').trim()
}

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
      const url = `https://onchainquest.fun/api/ticket/${ticketCode}?eventId=${eventId}&install=true`
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
    <>
      <style jsx global>{`
        @media print {
          /* Hide all elements except QR codes and codes */
          .no-print {
            display: none !important;
          }

          /* Hide all background elements, menu, and page elements */
          body * {
            background: transparent !important;
            color: black !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }

          /* Hide specific elements that might not be caught by no-print */
          nav,
          header,
          footer,
          aside,
          .menu,
          .navbar,
          .sidebar {
            display: none !important;
          }

          /* Remove all padding and margins from body */
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          /* Print-specific styles */
          .print-only {
            display: block !important;
          }

          /* Ensure QR codes are visible and properly sized for print */
          .qr-code-print {
            width: ${PRINT_QR_SIZE}px !important;
            height: ${PRINT_QR_SIZE}px !important;
            display: block !important;
            margin: 0 auto !important;
            page-break-inside: avoid !important;
          }

          /* Format ticket codes for print */
          .ticket-code-print {
            text-align: center !important;
            font-size: ${PRINT_CODE_FONT_SIZE}px !important;
            font-weight: bold !important;
            font-family: monospace !important;
            margin-top: 0px !important;
            page-break-inside: avoid !important;
          }

          /* Ticket number identifier */
          .ticket-number-print {
            position: absolute !important;
            left: 10px !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
            font-size: ${PRINT_CODE_FONT_SIZE}px !important;
            font-weight: bold !important;
            color: black !important;
          }

          /* Ensure proper page breaks and add border line */
          .ticket-item-print {
            page-break-inside: avoid !important;
            margin-bottom: 5px !important;
            padding-bottom: 5px !important;
            border-bottom: 1px solid #ccc !important;
            position: relative !important;
          }

          /* Remove border from last item */
          .ticket-item-print:last-child {
            border-bottom: none !important;
          }
        }

        @media screen {
          .print-only {
            display: none !important;
          }
        }
      `}</style>

      <Box display="flex" flexDirection="column" alignItems="center" p={4}>
        <Heading as="h1" mb={6} className="no-print">
          Event Tickets - {eventId}
        </Heading>

        <Text mb={4} color="gray.600" className="no-print">
          Total Tickets: {tickets.length} | Used: {tickets.filter((t) => t.is_used).length} |
          Available: {tickets.filter((t) => !t.is_used).length}
        </Text>

        <SimpleGrid columns={[1, 2, 3]} spacing={6} w="100%" maxW="1200px" className="no-print">
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
                      {formatTicketCode(ticket.code)}
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
                      <Link href={`/api/ticket/${ticket.code}?eventId=${eventId}&install=true`}>
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
                      </Link>
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
          <Box textAlign="center" mt={8} className="no-print">
            <Text fontSize="lg" color="gray.500">
              No tickets found for this event.
            </Text>
            <Text fontSize="sm" color="gray.400" mt={2}>
              Generate tickets from the admin panel first.
            </Text>
          </Box>
        )}

        {/* Print-only section */}
        <Box className="print-only" w="100%">
          {tickets.map((ticket, index) => (
            <Box key={ticket.id} className="ticket-item-print">
              <Text className="ticket-number-print">{index + 1}</Text>
              {qrCodes[ticket.code] && (
                <img
                  src={qrCodes[ticket.code]}
                  alt={`QR Code for ${ticket.code}`}
                  className="qr-code-print"
                />
              )}
              <Text className="ticket-code-print">{formatTicketCode(ticket.code)}</Text>
            </Box>
          ))}
        </Box>
      </Box>
    </>
  )
}
