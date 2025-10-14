"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Eye, Download, ImageIcon, Video, ExternalLink, Clock, Calendar } from 'lucide-react'

interface SharedMedia {
    id: string
    title: string | null
    description: string | null
    views: number
    media: {
        id: string
        title: string | null
        description: string | null
        type: string
        url: string
        width?: number | null
        height?: number | null
        duration?: number | null
        createdAt: string
    }
}

export default function SharedMediaPage() {
    const params = useParams()
    const token = params?.token as string

    const [sharedMedia, setSharedMedia] = useState<SharedMedia | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchSharedMedia = async () => {
            try {
                const response = await fetch(`/api/media/share/view/${token}`)
                const data = await response.json()

                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Failed to load shared media')
                }

                setSharedMedia(data.data)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load')
            } finally {
                setLoading(false)
            }
        }

        if (token) {
            fetchSharedMedia()
        }
    }, [token])

    const handleDownload = () => {
        if (sharedMedia?.media.url) {
            const link = document.createElement('a')
            link.href = sharedMedia.media.url
            link.download = sharedMedia.title || sharedMedia.media.title || 'download'
            link.click()
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
                <Card className="w-full max-w-md mx-4">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Loading shared media...</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-destructive">Link Unavailable</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center py-8">
                        <p className="text-sm text-muted-foreground mb-4">
                            This link may have expired, been disabled, or doesn&apos;t exist.
                        </p>
                        <Button variant="outline" onClick={() => window.location.href = '/'}>
                            Go to Homepage
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!sharedMedia) return null

    const { media } = sharedMedia

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
            {/* Header */}
            <div className="bg-card/50 backdrop-blur-sm border-b sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                {media.type === 'video' ? (
                                    <Video className="h-4 w-4 text-primary-foreground" />
                                ) : (
                                    <ImageIcon className="h-4 w-4 text-primary-foreground" />
                                )}
                            </div>
                            <div>
                                <h1 className="font-bold text-lg">Shared Media</h1>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Eye className="h-3 w-3" />
                                    <span>{sharedMedia.views} views</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownload}
                                className="cursor-pointer"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8 max-w-5xl">
                <Card className="overflow-hidden">
                    <CardHeader className="bg-muted/30">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <CardTitle className="text-2xl mb-2">
                                    {sharedMedia.title || media.title || 'Untitled'}
                                </CardTitle>
                                {(sharedMedia.description || media.description) && (
                                    <CardDescription className="text-base">
                                        {sharedMedia.description || media.description}
                                    </CardDescription>
                                )}
                            </div>
                            <Badge variant="secondary" className="capitalize flex-shrink-0">
                                {media.type}
                            </Badge>
                        </div>

                        {/* Media Info */}
                        <div className="flex flex-wrap gap-4 pt-4 text-sm text-muted-foreground">
                            {media.duration && (
                                <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    <span>{media.duration}s</span>
                                </div>
                            )}
                            {media.width && media.height && (
                                <div className="flex items-center gap-1">
                                    <ImageIcon className="h-4 w-4" />
                                    <span>{media.width} × {media.height}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(media.createdAt)}</span>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {/* Media Display */}
                        <div className="relative bg-black/5">
                            {media.type === 'video' ? (
                                <video
                                    controls
                                    className="w-full max-h-[70vh] mx-auto"
                                    src={media.url}
                                >
                                    <track kind="captions" />
                                    Your browser does not support the video tag.
                                </video>
                            ) : (
                                <div className="flex items-center justify-center p-8">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={media.url}
                                        alt={media.title || 'Shared image'}
                                        className="max-w-full max-h-[70vh] object-contain rounded-lg"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="p-6 bg-muted/30 border-t">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    className="flex-1 cursor-pointer"
                                    onClick={handleDownload}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download {media.type}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 cursor-pointer"
                                    onClick={() => window.open(media.url, '_blank')}
                                >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Open in New Tab
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer Info */}
                <div className="mt-6 text-center text-sm text-muted-foreground">
                    <p>Powered by Sahab</p>
                    <p className="mt-1">This is a shared media file. Create your own account to start sharing!</p>
                </div>
            </div>
        </div>
    )
}
