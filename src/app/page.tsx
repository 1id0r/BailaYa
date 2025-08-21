'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Music, Calendar, MapPin, Users } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/events')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-white mb-16">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Music className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            BailaCheck
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto">
            Discover, connect, and check-in to the hottest Latin dance events in your city
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            className="bg-white text-purple-600 font-semibold py-4 px-8 rounded-full text-lg hover:bg-white/90 transition-colors shadow-lg"
          >
            Get Started
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white text-center">
            <Calendar className="w-12 h-12 text-white mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Discover Events</h3>
            <p className="text-white/80">
              Find salsa, bachata, merengue, and other Latin dance events happening near you
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white text-center">
            <Users className="w-12 h-12 text-white mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Check-In</h3>
            <p className="text-white/80">
              Let others know you&apos;re going or interested in events with easy check-ins
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white text-center">
            <MapPin className="w-12 h-12 text-white mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Connect</h3>
            <p className="text-white/80">
              Build your Latin dance community and never miss an event again
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
