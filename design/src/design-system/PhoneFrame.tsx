import type { ReactNode } from 'react'
import { cn } from './cn'

type PhoneFrameProps = {
  children: ReactNode
  className?: string
}

export function PhoneFrame({ children, className }: PhoneFrameProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-[390px] aspect-[390/844] bg-black rounded-[2.75rem] p-2 shadow-2xl',
        className,
      )}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[2.25rem] bg-slate-50">
        <div className="absolute top-0 inset-x-0 h-7 bg-black z-50 flex items-center justify-center pointer-events-none">
          <div className="h-5 w-32 rounded-full bg-black" />
        </div>
        <div className="h-full w-full overflow-y-auto pt-7">{children}</div>
      </div>
    </div>
  )
}
