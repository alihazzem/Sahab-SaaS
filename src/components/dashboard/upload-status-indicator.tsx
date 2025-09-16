"use client"

import { Upload, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface UploadStatusIndicatorProps {
    activeUploads: number
    className?: string
}

export function UploadStatusIndicator({ activeUploads, className = "" }: UploadStatusIndicatorProps) {
    if (activeUploads === 0) return null

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className="flex items-center gap-1">
                <div className="relative">
                    <Upload className="h-4 w-4 text-primary" />
                    <Loader2 className="h-3 w-3 animate-spin text-primary absolute -top-0.5 -right-0.5" />
                </div>
                <Badge variant="outline" className="text-xs">
                    {activeUploads} uploading
                </Badge>
            </div>
        </div>
    )
}