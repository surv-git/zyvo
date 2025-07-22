"use client"

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react"

const DEFAULT_THEME = "default"
const THEME_STORAGE_KEY = "admin-theme"

type ThemeContextType = {
  activeTheme: string
  setActiveTheme: (theme: string) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Helper function to get theme from localStorage
const getStoredTheme = (): string => {
  if (typeof window === "undefined") return DEFAULT_THEME
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

// Helper function to store theme in localStorage
const storeTheme = (theme: string): void => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Ignore localStorage errors
  }
}

export function ActiveThemeProvider({
  children,
  initialTheme,
}: {
  children: ReactNode
  initialTheme?: string
}) {
  const [activeTheme, setActiveThemeState] = useState<string>(
    () => initialTheme || DEFAULT_THEME
  )
  const [mounted, setMounted] = useState(false)

  // Custom setter that also persists to localStorage
  const setActiveTheme = (theme: string) => {
    setActiveThemeState(theme)
    storeTheme(theme)
  }

  // Load theme from localStorage on mount
  useEffect(() => {
    setMounted(true)
    const storedTheme = getStoredTheme()
    if (storedTheme !== activeTheme) {
      setActiveThemeState(storedTheme)
    }
  }, [])

  // Apply theme classes to body
  useEffect(() => {
    Array.from(document.body.classList)
      .filter((className) => className.startsWith("theme-"))
      .forEach((className) => {
        document.body.classList.remove(className)
      })
    document.body.classList.add(`theme-${activeTheme}`)
    if (activeTheme.endsWith("-scaled")) {
      document.body.classList.add("theme-scaled")
    }
  }, [activeTheme])

  return (
    <ThemeContext.Provider value={{ activeTheme, setActiveTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useThemeConfig() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useThemeConfig must be used within an ActiveThemeProvider")
  }
  return context
}