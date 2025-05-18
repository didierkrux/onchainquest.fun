import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { eventId } from 'config'

export default function Index() {
  const router = useRouter()

  useEffect(() => {
    router.replace(`/event/${eventId}`)
  }, [router])

  return null
}
