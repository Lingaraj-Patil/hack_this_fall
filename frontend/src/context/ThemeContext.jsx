import React, { createContext, useState, useEffect } from 'react'

export const ThemeContext = createContext({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {}
})

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('theme') || 'dark' } catch (e) { return 'dark' }
  })

  useEffect(() => {
    try { localStorage.setItem('theme', theme) } catch (e) {}
    if (theme === 'light') document.documentElement.classList.add('theme-light')
    else document.documentElement.classList.remove('theme-light')
  }, [theme])

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export default ThemeProvider
