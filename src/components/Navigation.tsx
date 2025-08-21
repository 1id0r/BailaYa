'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Calendar, User, LogIn, Home, Music, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const Navigation = () => {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      href: '/',
      authRequired: false,
    },
    {
      id: 'events',
      label: 'Events',
      icon: Calendar,
      href: '/events',
      authRequired: false,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      href: user ? '/profile' : '/auth/login',
      authRequired: false, // Will redirect to login if not authenticated
    },
  ]

  const handleNavigation = (href: string, authRequired: boolean) => {
    if (authRequired && !user) {
      router.push('/auth/login')
      return
    }
    router.push(href)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.href, item.authRequired)}
                className={`flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1 ${
                  active
                    ? 'text-purple-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium truncate">{item.label}</span>
                {active && (
                  <div className="absolute -top-px left-1/2 transform -translate-x-1/2 w-1 h-1 bg-purple-600 rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Desktop Navigation */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div 
              className="flex items-center cursor-pointer"
              onClick={() => router.push('/')}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                <Music className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">BailaCheck</span>
            </div>

            {/* Desktop Nav Items */}
            <div className="flex items-center space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.href, item.authRequired)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      active
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                )
              })}

              {/* Auth Actions */}
              <div className="flex items-center space-x-4 pl-4 border-l border-gray-200">
                {user ? (
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 max-w-32 truncate">
                        {user.email}
                      </span>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Sign Out"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-medium">Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => router.push('/auth/login')}
                    className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    <span className="font-medium">Sign In</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer for desktop navigation */}
      <div className="hidden md:block h-16" />
      {/* Spacer for mobile navigation */}
      <div className="md:hidden h-16" />
    </>
  )
}

export default Navigation