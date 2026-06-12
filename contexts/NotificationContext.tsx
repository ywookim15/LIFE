'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export interface Notification {
  id: string
  text: string
  type: 'success' | 'error' | 'warning' | 'info'
}

interface NotificationContextType {
  notifications: Notification[]
  notify: (text: string, type?: Notification['type']) => void
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  notify: () => {},
})

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const notify = useCallback((text: string, type: Notification['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2)
    const note: Notification = { id, text, type }
    setNotifications(prev => [...prev, note])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 3500)
  }, [])

  return (
    <NotificationContext.Provider value={{ notifications, notify }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  return useContext(NotificationContext)
}
