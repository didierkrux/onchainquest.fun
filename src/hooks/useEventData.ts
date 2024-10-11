import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/router'
import { Event, EventData } from 'entities/data'

export function useEventData() {
  const { i18n } = useTranslation()
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [eventData, setEventData] = useState<EventData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/data')
        const data = await response.json()
        setEventData(data)
        setError(null)
      } catch (error) {
        console.error('Error fetching event data:', error)
        setError(error instanceof Error ? error : new Error('Unknown error occurred'))
      } finally {
        setIsLoading(false)
      }
    }

    if (router.isReady && !isLoading) {
      fetchData()
    }
  }, [router.asPath])

  useEffect(() => {
    if (i18n.language && eventData) {
      setEvent(i18n.language === 'en' ? eventData.data_en : eventData.data_tr)
    }
  }, [i18n.language, eventData])

  return { event, isLoading, error }
}
