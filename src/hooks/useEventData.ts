import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/router'
import { useLocalStorage } from 'usehooks-ts'

import { Config, Event, EventData } from 'entities/data'

export function useEventData() {
  const { i18n } = useTranslation()
  const router = useRouter()
  const [event, setEvent] = useLocalStorage<Event | null>('event', null)
  const [eventData, setEventData] = useState<EventData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = async (eventId: string) => {
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
  }

  useEffect(() => {
    if (router.isReady) {
      const eventId = router.query.eventId as string
      if (eventId) {
        fetchData(eventId)
      }
    }
    if (router.route === '/404') {
      console.log('404 detected: redirecting to /')
      router.push('/')
    }
  }, [router.isReady, router.query.eventId])

  useEffect(() => {
    if (router.isReady && (router.route === '/' || router.route === '/onboarding')) {
      const eventId = router.query.eventId as string
      if (eventId) {
        fetchData(eventId)
      }
    }
  }, [router.isReady, router.route, router.query.eventId])

  useEffect(() => {
    if (i18n.language && eventData && eventData?.data_en) {
      setEvent(
        i18n.language?.startsWith('en')
          ? { ...eventData.data_en, config: eventData.config }
          : { ...eventData.data_tr, config: eventData.config }
      )
    }
  }, [i18n.language, eventData, setEvent])

  return { event, isLoading, error }
}
