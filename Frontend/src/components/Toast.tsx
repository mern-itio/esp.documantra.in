import React, { useEffect, useState } from 'react'

type ToastData = { message: string; type?: 'success' | 'error' | 'info' | 'warning'; cta?: { label: string; href: string } }

const bgByType: Record<string, string> = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  info: 'bg-blue-600',
  warning: 'bg-yellow-600'
}

const Toast: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<ToastData>({ message: '', type: 'info' })

  useEffect(() => {
    const handler = (e: any) => {
      const detail = (e as CustomEvent).detail as ToastData
      setData({ message: detail?.message || '', type: (detail?.type as any) || 'info' })
      setOpen(true)
      setTimeout(() => setOpen(false), 3500)
    }
    window.addEventListener('app:toast' as any, handler as any)
    return () => window.removeEventListener('app:toast' as any, handler as any)
  }, [])

  if (!open) return null
  const bg = bgByType[data.type || 'info'] || bgByType.info

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000]">
      <div className={`${bg} text-white px-4 py-3 rounded-lg shadow-lg max-w-[90vw] sm:max-w-lg text-sm flex items-center justify-between gap-4`}>
        <span>{data.message}</span>
        {data.cta && (
          <a href={data.cta.href} className="bg-[#F7F3EE]/15 hover:bg-[#F7F3EE]/25 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors" style={{textDecoration:'none'}}>
            {data.cta.label}
          </a>
        )}
      </div>
    </div>
  )
}

export default Toast


