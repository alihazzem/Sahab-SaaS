"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import {
    Share2,
    Copy,
    CheckCircle2,
    ExternalLink,
    Loader2,
    Clock,
    Eye
} from 'lucide-react'

interface ShareDialogProps {
    mediaId: string
    mediaTitle: string
    mediaType: 'video' | 'image'
    onClose: () => void
}

export function ShareDialog({ mediaId, mediaTitle, mediaType, onClose }: ShareDialogProps) {
    const [loading, setLoading] = useState(false)
    const [shareUrl, setShareUrl] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [title, setTitle] = useState(mediaTitle)
    const [description, setDescription] = useState('')
    const [expiresInDays, setExpiresInDays] = useState<number>(0) // 0 = never expires

    const { success, error: showError } = useToast()

    const handleCreateShareLink = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/media/share/create', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mediaId,
                    title: title || mediaTitle,
                    description: description || undefined,
                    expiresInDays: expiresInDays > 0 ? expiresInDays : undefined
                })
            })

            const data = await response.json()

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to create share link')
            }

            setShareUrl(data.data.shareUrl)
            success('Share link created', 'Your link is ready to share!')
        } catch (error) {
            showError('Failed to create link', error instanceof Error ? error.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }

    const handleCopyLink = async () => {
        if (shareUrl) {
            try {
                await navigator.clipboard.writeText(shareUrl)
                setCopied(true)
                success('Copied!', 'Share link copied to clipboard')
                setTimeout(() => setCopied(false), 2000)
            } catch {
                showError('Failed to copy', 'Please copy manually')
            }
        }
    }

    const handleOpenLink = () => {
        if (shareUrl) {
            window.open(shareUrl, '_blank')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative bg-card border border-border rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b p-6 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Share2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-lg">Share Media</h3>
                            <p className="text-sm text-muted-foreground">Create a public link to share this {mediaType}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {!shareUrl ? (
                        <>
                            {/* Customize Share Link */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title</Label>
                                    <Input
                                        id="title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Enter a title..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description (Optional)</Label>
                                    <textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Add a description..."
                                        rows={3}
                                        className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="expires">Link Expiration</Label>
                                    <select
                                        id="expires"
                                        value={expiresInDays}
                                        onChange={(e) => setExpiresInDays(Number(e.target.value))}
                                        className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value={0}>Never expires</option>
                                        <option value={1}>1 day</option>
                                        <option value={7}>7 days</option>
                                        <option value={30}>30 days</option>
                                        <option value={90}>90 days</option>
                                    </select>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {expiresInDays === 0 ? 'Link will never expire' : `Link will expire in ${expiresInDays} days`}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    className="flex-1 cursor-pointer"
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreateShareLink}
                                    className="flex-1 cursor-pointer"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Share2 className="h-4 w-4 mr-2" />
                                            Create Link
                                        </>
                                    )}
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Share Link Created */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-green-600 dark:text-green-400">Link created successfully!</p>
                                        <p className="text-xs text-muted-foreground">Share this link with anyone</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Share Link</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={shareUrl}
                                            readOnly
                                            className="flex-1 font-mono text-xs"
                                        />
                                        <Button
                                            onClick={handleCopyLink}
                                            variant="outline"
                                            size="sm"
                                            className="cursor-pointer flex-shrink-0"
                                        >
                                            {copied ? (
                                                <>
                                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                                    Copied
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="h-4 w-4 mr-1" />
                                                    Copy
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex gap-2 text-xs text-muted-foreground">
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                        <Eye className="h-3 w-3" />
                                        0 views
                                    </Badge>
                                    {expiresInDays > 0 && (
                                        <Badge variant="secondary" className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            Expires in {expiresInDays} days
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={handleOpenLink}
                                    className="flex-1 cursor-pointer"
                                >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Open Link
                                </Button>
                                <Button
                                    onClick={onClose}
                                    className="flex-1 cursor-pointer"
                                >
                                    Done
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
