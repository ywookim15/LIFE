'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export interface FontOption {
  id: string
  label: string
  family: string
  googleParam?: string
}

export const FONT_OPTIONS: FontOption[] = [
  { id: 'inter',          label: 'Inter (Default)',      family: "'Inter', sans-serif" },
  { id: 'space-grotesk',  label: 'Space Grotesk',        family: "'Space Grotesk', sans-serif",    googleParam: 'Space+Grotesk:wght@300;400;500;600' },
  { id: 'outfit',         label: 'Outfit',               family: "'Outfit', sans-serif",            googleParam: 'Outfit:wght@300;400;500;600' },
  { id: 'sora',           label: 'Sora',                 family: "'Sora', sans-serif",              googleParam: 'Sora:wght@300;400;500;600' },
  { id: 'dm-sans',        label: 'DM Sans',              family: "'DM Sans', sans-serif",           googleParam: 'DM+Sans:wght@300;400;500;600' },
  { id: 'plus-jakarta',   label: 'Plus Jakarta Sans',    family: "'Plus Jakarta Sans', sans-serif", googleParam: 'Plus+Jakarta+Sans:wght@300;400;500;600' },
  { id: 'nunito',         label: 'Nunito',               family: "'Nunito', sans-serif",            googleParam: 'Nunito:wght@300;400;500;600' },
  { id: 'barlow',         label: 'Barlow',               family: "'Barlow', sans-serif",            googleParam: 'Barlow:wght@300;400;500;600' },
  { id: 'ibm-plex-sans',  label: 'IBM Plex Sans',        family: "'IBM Plex Sans', sans-serif",     googleParam: 'IBM+Plex+Sans:wght@300;400;500;600' },
  { id: 'roboto-mono',    label: 'Roboto Mono',          family: "'Roboto Mono', monospace",        googleParam: 'Roboto+Mono:wght@300;400;500;600' },
]

interface ThemeContextValue {
  isDark: boolean
  toggleTheme: () => void
  fontId: string
  setFont: (id: string) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: true,
  toggleTheme: () => {},
  fontId: 'inter',
  setFont: () => {},
})

function loadGoogleFont(param: string) {
  const id = `gfont-${param.split(':')[0]}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${param}&display=swap`
  document.head.appendChild(link)
}

function applyFont(fontId: string) {
  const opt = FONT_OPTIONS.find(f => f.id === fontId) ?? FONT_OPTIONS[0]
  if (opt.googleParam) loadGoogleFont(opt.googleParam)
  document.documentElement.style.setProperty('--font-body', opt.family)
  document.body.style.fontFamily = opt.family
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(true)
  const [fontId, setFontId] = useState('inter')

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme')
    if (storedTheme === 'light') setIsDark(false)

    const storedFont = localStorage.getItem('font') ?? 'inter'
    setFontId(storedFont)
    applyFont(storedFont)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const toggleTheme = () => setIsDark(v => !v)

  const setFont = (id: string) => {
    setFontId(id)
    localStorage.setItem('font', id)
    applyFont(id)
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, fontId, setFont }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
