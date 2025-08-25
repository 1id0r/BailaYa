'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

const DarkModeToggle = () => {
  const { theme, toggleTheme } = useTheme()

  console.log('🔄 DarkModeToggle rendering, theme:', theme)

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => {
          console.log('🖱️ Toggle clicked, switching from:', theme)
          toggleTheme()
        }}
        className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        title={`Current: ${theme} mode - Click to switch`}
      >
        {theme === 'light' ? (
          <Moon className="w-4 h-4" />
        ) : (
          <Sun className="w-4 h-4" />
        )}
      </button>
      <span className="text-xs bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 px-2 py-0.5 rounded text-center min-w-[40px]">
        {theme.toUpperCase()}
      </span>
    </div>
  )
}

export default DarkModeToggle