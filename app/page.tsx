'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Loader from './components/Loader'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const authenticated = localStorage.getItem('authenticated')
    if (authenticated) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }, [router])

  return (
    <div className="bg-[#050505] min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none"></div>
      <Loader />
    </div>
  )
}
