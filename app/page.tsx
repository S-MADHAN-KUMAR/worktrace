'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Loader from './components/Loader'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth/session')
      .then(response => response.json())
      .then(data => router.push(data.authenticated ? '/dashboard' : '/login'))
      .catch(() => router.push('/login'))
  }, [router])

  return (
    <main className="bg-black min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-modal-grid opacity-25 pointer-events-none" />
      <div className="relative z-10">
        <Loader label="Synchronizing session..." />
      </div>
    </main>
  )
}
