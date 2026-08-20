import { useEffect, useState } from 'react'

const STORAGE_KEY = 'docdaiweb-theme'

const getInitialTheme = () => {
  if (typeof window === 'undefined') {
    return false
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored) {
    return stored === 'dark'
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

const useDarkMode = () => {
  const [isDark, setIsDark] = useState(getInitialTheme)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light')
  }, [isDark])

  const toggleDarkMode = () => setIsDark((previous) => !previous)

  return { isDark, toggleDarkMode }
}

export default useDarkMode
