import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/router'
import { useLocalStorage } from 'usehooks-ts'

import { Config, Event, EventData } from 'entities/data'
import { eventId as defaultEventId } from 'config'

export function useEventData() {
  const { i18n } = useTranslation()
  const router = useRouter()
  const eventId = router.query.eventId as string
  const [event, setEvent] = useLocalStorage<Event | null>(`event-${eventId}`, null)
  const [eventData, setEventData] = useState<EventData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async (eventId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/event?id=${eventId}`)
      const data = await response.json()
      console.log('data', data)
      setEventData(data)
      setError(null)
    } catch (error) {
      console.error('Error fetching event data:', error)
      setError(error instanceof Error ? error : new Error('Unknown error occurred'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (router.isReady) {
      const currentEventId = router.query.eventId as string
      if (currentEventId) {
        fetchData(currentEventId)
      }
    }

    // Handle redirects
    if (router.route === '/404') {
      console.log('404 detected: /event/defaultEventId')
      router.push(`/event/${defaultEventId}`)
    }
    if (router.route === '/') {
      console.log('redirecting to /event/defaultEventId')
      router.push(`/event/${defaultEventId}`)
    }
  }, [router.isReady, router.query.eventId, router.route, fetchData])

  useEffect(() => {
    if (i18n.language && eventData && eventData?.data_en) {
      const newEvent = i18n.language?.startsWith('en')
        ? { ...eventData.data_en, config: eventData.config }
        : { ...eventData.data_tr, config: eventData.config }

      setEvent(newEvent)
    }
  }, [i18n.language, eventData, setEvent])

  return { event, isLoading, error }
}

