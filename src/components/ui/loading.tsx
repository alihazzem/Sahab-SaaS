"use client"

import { Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
  fullScreen?: boolean
  className?: string
}

export function LoadingSpinner({
  size = 'md',
  message = 'Loading...',
  fullScreen = false,
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
          <p className={`${textSizeClasses[size]} text-muted-foreground`}>
            {message}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="flex flex-col items-center space-y-3">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
        <p className={`${textSizeClasses[size]} text-muted-foreground`}>
          {message}
        </p>
      </div>
    </div>
  )
}

export function LoadingCard({ message = 'Loading...', className = '' }: { message?: string, className?: string }) {
  return (
    <Card className={className}>
      <CardContent className="p-8">
        <LoadingSpinner message={message} />
      </CardContent>
    </Card>
  )
}

export function LoadingSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-muted rounded-lg h-4 w-full mb-2"></div>
      <div className="bg-muted rounded-lg h-4 w-3/4 mb-2"></div>
      <div className="bg-muted rounded-lg h-4 w-1/2"></div>
    </div>
  )
}

// Media item skeleton for media library
export function MediaItemSkeleton() {
  return (
    <div className="border border-border rounded-xl p-3 sm:p-4 lg:p-5 space-y-3 sm:space-y-4 animate-pulse bg-gradient-to-br from-card to-card/50">
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="bg-muted/80 rounded-lg h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 flex-shrink-0"></div>
        <div className="flex-1 space-y-1 sm:space-y-2 min-w-0">
          <div className="bg-muted/80 rounded h-3 sm:h-4 w-3/4"></div>
          <div className="flex flex-col xs:flex-row xs:items-center gap-1">
            <div className="bg-muted/60 rounded h-3 w-12 self-start"></div>
            <div className="bg-muted/60 rounded h-3 w-16"></div>
          </div>
        </div>
      </div>
      <div className="space-y-1 sm:space-y-2">
        <div className="bg-muted/60 rounded h-3 w-2/3"></div>
        <div className="bg-muted/60 rounded h-3 w-1/2"></div>
        <div className="bg-muted/60 rounded h-3 w-3/5"></div>
      </div>
      <div className="flex gap-1.5 sm:gap-2 pt-2">
        <div className="bg-muted/80 rounded h-6 sm:h-8 flex-1"></div>
        <div className="bg-muted/80 rounded h-6 sm:h-8 flex-1"></div>
      </div>
    </div>
  )
}

// Analytics skeleton for usage analytics
export function AnalyticsSkeleton() {
  return (
    <Card className="bg-gradient-to-br from-card to-card/50">
      <CardContent className="p-6 space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="bg-muted/80 rounded h-5 w-1/3"></div>
          <div className="bg-muted/60 rounded-lg h-8 w-8"></div>
        </div>
        <div className="bg-muted/80 rounded h-8 w-2/3"></div>
        <div className="space-y-3">
          <div className="flex justify-between">
            <div className="bg-muted/60 rounded h-3 w-20"></div>
            <div className="bg-muted/60 rounded h-3 w-12"></div>
          </div>
          <div className="bg-muted/80 rounded-full h-2 w-full"></div>
          <div className="bg-muted/60 rounded h-3 w-24"></div>
        </div>
      </CardContent>
    </Card>
  )
}