'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
}

interface ToastContextValue {
  toast: (type: ToastType, title: string, message?: string) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const ICONS = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />,
  error:   <XCircle      className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />,
  info:    <Info         className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />,
}

const CLASSES = {
  success: 'bg-white border-emerald-200 text-emerald-900',
  error:   'bg-white border-red-200 text-red-900',
  info:    'bg-white border-blue-200 text-blue-900',
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [leaving, setLeaving] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  const remove = useCallback(() => {
    setLeaving(true)
    setTimeout(() => onRemove(toast.id), 250)
  }, [toast.id, onRemove])

  useEffect(() => {
    timerRef.current = setTimeout(remove, 4000)
    return () => clearTimeout(timerRef.current)
  }, [remove])

  return (
    <div
      className={`
        flex items-start gap-3 rounded-2xl px-4 py-3.5 shadow-lg border text-sm
        pointer-events-auto w-full max-w-sm
        ${CLASSES[toast.type]}
        ${leaving ? 'animate-slide-out-right' : 'animate-slide-in-right'}
      `}
    >
      {ICONS[toast.type]}
      <div className="flex-1 min-w-0">
        <p className="font-semibold">{toast.title}</p>
        {toast.message && (
          <p className="text-xs opacity-75 mt-0.5 leading-relaxed">{toast.message}</p>
        )}
      </div>
      <button
        onClick={remove}
        className="text-current opacity-40 hover:opacity-70 transition-opacity flex-shrink-0 mt-0.5"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev.slice(-4), { id, type, title, message }])
  }, [])

  const value: ToastContextValue = {
    toast: addToast,
    success: (t, m) => addToast('success', t, m),
    error:   (t, m) => addToast('error', t, m),
    info:    (t, m) => addToast('info', t, m),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-[9999] flex flex-col-reverse gap-2 pointer-events-none"
      >
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
