'use client'

import { useState, useEffect } from 'react'

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const response = await fetch('/api/announcements')
        if (!response.ok) throw new Error('Failed to fetch announcements')
        const data = await response.json()
        setAnnouncements(data.announcements)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncements()
  }, [])

  return { announcements, loading, error }
}
