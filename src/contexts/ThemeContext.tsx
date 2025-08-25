'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  // Initialize theme after mount
  useEffect(() => {
    setMounted(true)
    
    // Check saved theme first, then system preference
    const savedTheme = localStorage.getItem('theme') as Theme | null
    
    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const systemTheme = prefersDark ? 'dark' : 'light'
      setTheme(systemTheme)
    }
  }, [])

  // Apply theme changes to DOM
  useEffect(() => {
    if (!mounted) return
    
    const root = document.documentElement
    const body = document.body
    
    console.log('🎨 Applying theme:', theme)
    console.log('📋 Root classes before:', root.className)
    
    // Remove any existing theme classes first
    root.classList.remove('light', 'dark')
    body.classList.remove('light', 'dark')
    
    // Apply new theme
    root.classList.add(theme)
    body.classList.add(theme)
    root.setAttribute('data-theme', theme)
    
    // Set color scheme
    root.style.colorScheme = theme
    body.style.colorScheme = theme
    
    // Update CSS variables
    if (theme === 'dark') {
      root.style.setProperty('--background', '#0a0a0a')
      root.style.setProperty('--foreground', '#ededed')
    } else {
      root.style.setProperty('--background', '#ffffff')
      root.style.setProperty('--foreground', '#171717')
    }
    
    localStorage.setItem('theme', theme)
    
    console.log('✅ Theme applied:', theme)
    console.log('📋 Root classes after:', root.className)
    console.log('🎯 Body classes:', body.className)
    console.log('🎨 CSS variables:', {
      background: getComputedStyle(root).getPropertyValue('--background'),
      foreground: getComputedStyle(root).getPropertyValue('--foreground')
    })
    
    // Force style recalculation
    requestAnimationFrame(() => {
      body.style.transition = 'none'
      void body.offsetHeight // Trigger reflow
      body.style.transition = ''
    })
  }, [theme, mounted])

  const toggleTheme = () => {
    console.log('toggleTheme called, current:', theme)
    const newTheme = theme === 'light' ? 'dark' : 'light'
    console.log('Switching to:', newTheme)
    setTheme(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}