'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

const DarkModeToggle = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="
        relative 
        flex 
        items-center 
        justify-center 
        w-10 
        h-10 
        rounded-xl 
        bg-background-tertiary 
        hover:bg-background-elevated 
        text-foreground 
        transition-all 
        duration-300 
        hover:scale-110 
        active:scale-95
        shadow-md
        hover:shadow-lg
        border
        border-border
        group
      "
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="relative w-5 h-5">
        <Sun className={`
          absolute 
          inset-0 
          transition-all 
          duration-300 
          ${theme === 'light' 
            ? 'opacity-100 rotate-0 scale-100' 
            : 'opacity-0 rotate-90 scale-0'
          }
        `} />
        <Moon className={`
          absolute 
          inset-0 
          transition-all 
          duration-300 
          ${theme === 'dark' 
            ? 'opacity-100 rotate-0 scale-100' 
            : 'opacity-0 -rotate-90 scale-0'
          }
        `} />
      </div>
      
      {/* Subtle glow effect */}
      <div className="
        absolute 
        inset-0 
        rounded-xl 
        bg-primary-500/20 
        opacity-0 
        group-hover:opacity-100 
        transition-opacity 
        duration-300 
        blur-sm
      " />
    </button>
  )
}

export default DarkModeToggle