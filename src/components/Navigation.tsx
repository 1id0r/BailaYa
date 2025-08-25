'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Calendar, User, LogIn, Music } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import DarkModeToggle from '@/components/DarkModeToggle'

const Navigation = () => {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()

  const navItems = user
    ? [
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
          href: '/profile',
          authRequired: false,
        },
      ]
    : [
        {
          id: 'events',
          label: 'Events',
          icon: Calendar,
          href: '/events',
          authRequired: false,
        },
      ]

  const handleNavigation = (href: string, authRequired: boolean) => {
    if (authRequired && !user) {
      router.push('/auth/login')
      return
    }
    router.push(href)
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
      <nav className='fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50 md:hidden'>
        <div className='flex justify-around items-center py-2'>
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.href, item.authRequired)}
                className={`flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1 ${
                  active ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <Icon className='w-5 h-5 mb-1' />
                <span className='text-xs font-medium truncate'>{item.label}</span>
                {active && (
                  <div className='absolute -top-px left-1/2 transform -translate-x-1/2 w-1 h-1 bg-purple-600 rounded-full' />
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Desktop Navigation */}
      <nav className='hidden md:block fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-50'>
        <div className='max-w-7xl mx-auto px-4'>
          <div className='flex justify-between items-center h-16'>
            {/* Logo */}
            <div className='flex items-center cursor-pointer' onClick={() => router.push('/')}>
              <div className='w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center mr-3'>
                <Music className='w-5 h-5 text-white' />
              </div>
              <span className='text-xl font-bold text-gray-900 dark:text-gray-100'>BailaCheck</span>
            </div>

            {/* Desktop Nav Items */}
            <div className='flex items-center space-x-8'>
              {navItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.href, item.authRequired)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      active ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className='w-4 h-4' />
                    <span className='font-medium'>{item.label}</span>
                  </button>
                )
              })}

              {/* Dark Mode Toggle and Auth Actions */}
              <div className='flex items-center space-x-4 pl-4 border-l border-gray-200 dark:border-gray-700'>
                {user ? (
                  <div className='flex items-center space-x-3'>
                    <div className='flex items-center space-x-2'>
                      <div className='w-8 h-8 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center'>
                        <User className='w-4 h-4 text-purple-600 dark:text-purple-300' />
                      </div>
                      <span className='text-sm font-medium text-gray-700 dark:text-gray-300 max-w-32 truncate'>
                        {user.email?.split('@')[0] || 'User'}
                      </span>
                    </div>
                    <DarkModeToggle />
                  </div>
                ) : (
                  <>
                    <DarkModeToggle />
                    <button
                      onClick={() => router.push('/auth/login')}
                      className='flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors'
                    >
                      <LogIn className='w-4 h-4' />
                      <span className='font-medium'>Sign In</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer for desktop navigation only */}
      <div className='hidden md:block h-16' />
    </>
  )
}

export default Navigation
