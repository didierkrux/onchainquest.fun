import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Custom404() {
  const router = useRouter()

  useEffect(() => {
    // Log the 404 error
    console.error(`404 - Page not found: ${router.asPath}`)
    router.push('/')
  }, [router])

  return null
}
