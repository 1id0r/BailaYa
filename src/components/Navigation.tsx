'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Calendar, User, LogIn, Music, Sparkles, LogOut, Settings, ChevronDown, Search, SlidersHorizontal } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import DarkModeToggle from '@/components/DarkModeToggle'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'

const Navigation = () => {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, signOut } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const isEventsPage = pathname === '/events'
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [showFilters, setShowFilters] = useState(searchParams.get('filters') === 'true')

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  // Update URL search params when search term changes
  const updateSearchParam = (key: string, value: string) => {
    if (!isEventsPage) return
    
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/events?${params.toString()}`)
  }

  // Handle search term changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    updateSearchParam('search', value)
  }

  // Handle filter toggle
  const handleFilterToggle = () => {
    const newShowFilters = !showFilters
    setShowFilters(newShowFilters)
    updateSearchParam('filters', newShowFilters ? 'true' : '')
  }

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
      {/* Modern Mobile Bottom Navigation */}
      <nav className='fixed bottom-2 left-4 right-4 md:hidden z-50'>
        <div className='glass rounded-2xl px-2 py-3 shadow-xl'>
          <div className='flex justify-around items-center'>
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.href, item.authRequired)}
                  className={`
                    relative
                    flex 
                    flex-col 
                    items-center 
                    justify-center 
                    py-2 
                    px-4 
                    min-w-0 
                    flex-1 
                    rounded-xl
                    transition-all 
                    duration-300
                    transform
                    active:scale-95
                    ${active 
                      ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950' 
                      : 'text-foreground-muted hover:text-foreground hover:bg-background-tertiary'
                    }
                  `}
                >
                  <div className={`
                    transition-transform 
                    duration-300 
                    ${active ? 'scale-110' : 'scale-100'}
                  `}>
                    <Icon className='w-5 h-5 mb-1' />
                  </div>
                  <span className='text-xs font-medium truncate'>{item.label}</span>
                  
                  {/* Active indicator with glow effect */}
                  {active && (
                    <>
                      <div className='absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-primary-600 rounded-full animate-pulse' />
                      <div className='absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-primary-600 rounded-full blur-sm opacity-60' />
                    </>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Ultra-modern Desktop Navigation */}
      <nav className='hidden md:block fixed top-0 left-0 right-0 z-50'>
        <div className='backdrop-blur-2xl bg-background/80 border-b border-border/50 shadow-lg'>
          <div className='max-w-7xl mx-auto px-6'>
            <div className={`flex items-center ${isEventsPage ? 'h-24' : 'h-20'} ${isEventsPage ? 'py-4' : ''}`}>
              {/* Modern Logo with gradient and animation */}
              <div 
                className='flex items-center cursor-pointer group'
                onClick={() => router.push('/')}
              >
                <div className='relative'>
                  <div className='w-10 h-10 bg-gradient-to-r from-primary-600 via-secondary-600 to-primary-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3'>
                    {isEventsPage ? <Sparkles className='w-6 h-6 text-white' /> : <Music className='w-6 h-6 text-white' />}
                  </div>
                  <div className='absolute inset-0 bg-gradient-to-r from-primary-600 via-secondary-600 to-primary-600 rounded-2xl opacity-50 blur-md group-hover:blur-lg transition-all duration-300' />
                </div>
                <div className='flex flex-col'>
                  <span className='text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent'>
                    {isEventsPage ? 'Dance Events' : 'BailaCheck'}
                  </span>
                  <span className='text-xs text-foreground-muted font-medium'>
                    {isEventsPage ? 'Discover amazing Latin dance events' : 'Latin Dance Events'}
                  </span>
                </div>
              </div>

              {/* Events Page: Search and Filter in Middle */}
              {isEventsPage ? (
                <div className='flex-1 flex justify-center px-8'>
                  <div className='flex gap-3 max-w-md w-full'>
                    <Input
                      placeholder="Search events, venues..."
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      leftIcon={<Search className="w-4 h-4" />}
                      variant="filled"
                      className="flex-1"
                    />
                    <Button
                      onClick={handleFilterToggle}
                      variant={showFilters ? 'primary' : 'outline'}
                      leftIcon={<SlidersHorizontal className="w-4 h-4" />}
                      className="px-4"
                    >
                      Filters
                    </Button>
                  </div>
                </div>
              ) : (
                /* Regular Navigation Items */
                <div className='flex-1 flex justify-center'>
                  <div className='flex items-center space-x-2'>
                    {navItems.map((item) => {
                      const Icon = item.icon
                      const active = isActive(item.href)

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavigation(item.href, item.authRequired)}
                          className={`
                            relative
                            flex 
                            items-center 
                            space-x-3 
                            px-6 
                            py-3 
                            rounded-2xl 
                            transition-all 
                            duration-300
                            transform
                            hover:scale-105
                            active:scale-95
                            ${active 
                              ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg shadow-primary-500/25' 
                              : 'text-foreground hover:bg-background-tertiary hover:shadow-md'
                            }
                          `}
                        >
                          <Icon className='w-5 h-5' />
                          <span className='font-medium text-sm'>{item.label}</span>
                          
                          {/* Active glow effect */}
                          {active && (
                            <div className='absolute inset-0 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl opacity-30 blur-md -z-10' />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Modern Divider */}
              <div className='w-px h-8 bg-border mx-4' />

              {/* User Section */}
              <div className='flex items-center space-x-4'>
                {user ? (
                  <div className='flex items-center space-x-4'>
                    {/* User Dropdown Menu */}
                    <div className='relative' ref={menuRef}>
                      <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className='flex items-center space-x-3 px-4 py-2 bg-background-tertiary rounded-2xl hover:bg-background-secondary transition-all duration-200'
                      >
                        <div className='relative'>
                          <div className='w-8 h-8 bg-gradient-to-r from-primary-100 to-secondary-100 dark:from-primary-900 dark:to-secondary-900 rounded-xl flex items-center justify-center'>
                            <User className='w-4 h-4 text-primary-600 dark:text-primary-400' />
                          </div>
                          <div className='absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success-500 rounded-full border-2 border-background-elevated' />
                        </div>
                        <div className='flex flex-col'>
                          <span className='text-sm font-medium text-foreground'>
                            {user.email?.split('@')[0] || 'User'}
                          </span>
                          <span className='text-xs text-foreground-tertiary'>
                            Online
                          </span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-foreground-muted transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Dropdown Menu */}
                      {showUserMenu && (
                        <Card className='absolute right-0 top-full mt-2 w-56 bg-background-elevated border border-border shadow-2xl z-50'>
                          <div className='p-2 space-y-1'>
                            <button
                              onClick={() => {
                                setShowUserMenu(false)
                                router.push('/profile')
                              }}
                              className='flex items-center space-x-3 w-full px-3 py-2 rounded-xl text-foreground hover:bg-background-secondary transition-all duration-200'
                            >
                              <Settings className='w-4 h-4 text-foreground-muted' />
                              <span className='font-medium text-sm'>Settings</span>
                            </button>
                            <div className='h-px bg-border my-1' />
                            <button
                              onClick={() => {
                                setShowUserMenu(false)
                                signOut()
                              }}
                              className='flex items-center space-x-3 w-full px-3 py-2 rounded-xl text-destructive-600 dark:text-destructive-400 hover:bg-destructive-50 dark:hover:bg-destructive-950 transition-all duration-200'
                            >
                              <LogOut className='w-4 h-4' />
                              <span className='font-medium text-sm'>Sign Out</span>
                            </button>
                          </div>
                        </Card>
                      )}
                    </div>
                    <DarkModeToggle />
                  </div>
                ) : (
                  <div className='flex items-center space-x-4'>
                    <DarkModeToggle />
                    <Button
                      onClick={() => router.push('/auth/login')}
                      leftIcon={<LogIn className='w-4 h-4' />}
                      rightIcon={<Sparkles className='w-4 h-4' />}
                      className='font-semibold'
                      size='md'
                    >
                      Sign In
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Modern spacer for desktop navigation */}
      <div className={`hidden md:block ${isEventsPage ? 'h-24' : 'h-20'}`} />
      
      {/* Mobile spacer for bottom navigation */}
      <div className='md:hidden h-0' />
    </>
  )
}

export default Navigation
