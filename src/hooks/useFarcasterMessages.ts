import { useState, useEffect } from 'react'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'

interface FarcasterMessage {
  id: string
  text: string
  author: {
    username: string
    displayName: string
    pfp: string
    verified: boolean
  }
  timestamp: string
  reactions: any
  embeds: any[]
  images: string[]
}

interface FarcasterChannel {
  id: string
  name: string
  description: string
}

interface FarcasterResponse {
  messages: FarcasterMessage[]
  channel: FarcasterChannel
  nextCursor?: string
}

const fetchFarcasterMessages = async (eventId: string, cursor?: string): Promise<FarcasterResponse> => {
  const url = cursor
    ? `/api/farcaster-messages?eventId=${eventId}&cursor=${cursor}`
    : `/api/farcaster-messages?eventId=${eventId}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch Farcaster messages')
  }
  return response.json()
}

export const useFarcasterMessages = (eventId: string) => {
  return useInfiniteQuery<FarcasterResponse, Error, any, string[], string | undefined>({
    queryKey: ['farcaster-messages', eventId],
    queryFn: ({ pageParam }) => fetchFarcasterMessages(eventId, pageParam),
    enabled: eventId === '3', // Only fetch for event ID 3
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    refetchInterval: 300000, // Refetch every 5 minutes
    staleTime: 10000, // Consider data stale after 10 seconds
  })
} 
