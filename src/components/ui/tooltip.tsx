"use client"

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface TooltipProps {
    content: string
    children: React.ReactNode
    position?: 'top' | 'bottom' | 'left' | 'right'
    className?: string
}

export function Tooltip({ content, children, position = 'top', className }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false)

    const positionClasses = {
        top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
    }

    const arrowClasses = {
        top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-foreground',
        bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-foreground',
        left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-foreground',
        right: 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-foreground',
    }

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div className={cn(
                    'absolute z-50 px-2 py-1 text-xs text-primary-foreground bg-foreground rounded shadow-lg whitespace-nowrap',
                    positionClasses[position],
                    className
                )}>
                    {content}
                    <div className={cn('absolute w-0 h-0 border-4', arrowClasses[position])} />
                </div>
            )}
        </div>
    )
}