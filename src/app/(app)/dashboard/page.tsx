"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Video,
    ImageIcon,
    Loader2,
    Upload,
    BarChart3,
    FolderOpen,
    Plus,
    Sparkles,
} from 'lucide-react'
import { UsageAnalytics } from '@/components/dashboard/usage-analytics'
import { MediaLibrary } from '@/components/dashboard/media-library'
import { UploadModal } from '@/components/dashboard/upload-modal'
import { UploadProgressTracker } from '@/components/dashboard/upload-progress-tracker'
import { UploadStatusIndicator } from '@/components/dashboard/upload-status-indicator'
import { useBackgroundUpload } from '@/hooks/useBackgroundUpload'
import { useToast } from '@/components/ui/toast'
import type { MediaItem, SubscriptionData } from '@/types'

export default function DashboardPage() {
    const [media, setMedia] = useState<MediaItem[]>([])
    const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
    const [loading, setLoading] = useState(true)
    const [mediaLoading, setMediaLoading] = useState(false)
    const [uploadModalOpen, setUploadModalOpen] = useState(false)
    const [uploadType, setUploadType] = useState<'video' | 'image'>('video')
    const [isUploadTrackerMinimized, setIsUploadTrackerMinimized] = useState(false)

    const { success, error } = useToast()
    const errorRef = useRef(error)

    // Update ref when error function changes
    useEffect(() => {
        errorRef.current = error
    }, [error])

    // Background upload system
    const {
        tasks: uploadTasks,
        startUpload,
        removeTask,
        clearCompleted
    } = useBackgroundUpload(
        (result) => {
            if (result && typeof result === 'object' && 'data' in result) {
                const uploadResult = result as { data: MediaItem, subscription?: SubscriptionData }
                if (uploadResult.data) {
                    setMedia(prev => [uploadResult.data, ...prev])
                }
                if (uploadResult.subscription) {
                    setSubscription(uploadResult.subscription)
                }
            }
        },
        (errorMessage) => {
            error('Upload failed', errorMessage)
        }
    )

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const [mediaRes, subRes] = await Promise.all([
                fetch('/api/media/list').then(res => res.json()),
                fetch('/api/subscription/status').then(res => res.json())
            ])

            if (mediaRes.success) {
                setMedia(mediaRes.data || [])
            } else {
                console.error('Media API error:', mediaRes.error)
            }

            if (subRes.success) {
                setSubscription(subRes.subscription)
            } else {
                console.error('Subscription API error:', subRes.error)
            }

            // Only show error if both APIs fail
            if (!mediaRes.success && !subRes.success) {
                errorRef.current('Failed to load data', 'Please refresh the page')
            }
        } catch (err) {
            console.error('Data loading error:', err)
            // Using a ref to avoid dependency issues
            errorRef.current('Failed to load data', 'Please refresh the page')
        } finally {
            setLoading(false)
        }
    }, []) // Empty dependency array to prevent infinite loop

    useEffect(() => {
        loadData()
    }, [loadData])

    const handleVideoUpload = () => {
        setUploadType('video')
        setUploadModalOpen(true)
    }

    const handleImageUpload = () => {
        setUploadType('image')
        setUploadModalOpen(true)
    }

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`/api/media/delete/${id}`, {
                method: 'DELETE',
            })
            const result = await response.json()

            if (result.success) {
                setMedia(prev => prev.filter(item => item.id !== id))
                success('Deleted successfully', 'Media file has been deleted.')

                if (result.subscription) {
                    setSubscription(result.subscription)
                }
            } else {
                error('Delete failed', result.error || 'Failed to delete the media file.')
            }
        } catch (err) {
            console.error('Delete error:', err)
            error('Delete failed', 'There was an error deleting the file. Please try again.')
        }
    }

    return (
        <div className="p-4 lg:p-6 space-y-6">
            {/* Main Header */}
            <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0 gap-4 lg:gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Welcome back
                        </h1>
                        <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
                    </div>
                    <p className="text-muted-foreground text-base sm:text-lg">
                        Manage your media files and track your usage
                    </p>

                    {/* Quick Stats */}
                    {!loading && subscription && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pt-2">
                            <div className="flex items-center gap-2">
                                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                    {media.length} {media.length === 1 ? 'file' : 'files'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                    {subscription.plan.name} Plan
                                </span>
                                <Badge variant={subscription.plan.name === 'Free' ? 'secondary' : 'default'} className="text-xs">
                                    {subscription.plan.name === 'Free' ? 'Starter' : 'Pro'}
                                </Badge>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                    <UploadStatusIndicator
                        activeUploads={uploadTasks.filter(task => task.status === 'uploading').length}
                    />
                    <Button
                        onClick={handleVideoUpload}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer w-full sm:w-auto"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Upload Video
                    </Button>
                    <Button
                        onClick={handleImageUpload}
                        variant="outline"
                        className="border-border hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer w-full sm:w-auto"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Upload Image
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="space-y-6">
                {loading ? (
                    <div className="flex items-center justify-center py-12 sm:py-16">
                        <div className="text-center max-w-md px-4">
                            <div className="relative mb-6">
                                <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin mx-auto text-primary" />
                                <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse"></div>
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold mb-2">Setting up your dashboard...</h3>
                            <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                                We are loading your media files and usage statistics
                            </p>
                            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                                <Sparkles className="h-3 w-3" />
                                <span>This usually takes just a moment</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 sm:space-y-8">
                        {/* Usage Analytics */}
                        {subscription && (
                            <section>
                                <div className="flex items-center gap-2 mb-6">
                                    <BarChart3 className="h-5 w-5 text-primary" />
                                    <h2 className="text-lg sm:text-xl font-semibold">Usage & Plan Analytics</h2>
                                    <Badge variant="secondary" className="text-xs">
                                        {subscription.plan.name} Plan
                                    </Badge>
                                </div>
                                <UsageAnalytics subscription={subscription} />
                            </section>
                        )}

                        {/* Upload Progress */}
                        {uploadTasks.length > 0 && (
                            <UploadProgressTracker
                                tasks={uploadTasks}
                                isMinimized={isUploadTrackerMinimized}
                                onToggleMinimize={() => setIsUploadTrackerMinimized(!isUploadTrackerMinimized)}
                                onRemoveTask={removeTask}
                                onClearCompleted={clearCompleted}
                            />
                        )}

                        {/* Quick Upload Section */}
                        <section>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                <div className="flex items-center gap-2">
                                    <Upload className="h-5 w-5 text-primary" />
                                    <h2 className="text-lg sm:text-xl font-semibold">Quick Upload</h2>
                                    <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                                        Drag & Drop Ready
                                    </Badge>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                {/* Video Upload Card */}
                                <Card className="group border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300 cursor-pointer bg-gradient-to-br from-card to-card/50"
                                    onClick={handleVideoUpload}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3 min-w-0 flex-1">
                                                <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors flex-shrink-0">
                                                    <Video className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                                                </div>
                                                <div className="min-w-0">
                                                    <CardTitle className="text-base sm:text-lg truncate">Video Upload</CardTitle>
                                                    <p className="text-xs text-muted-foreground mt-1 truncate">
                                                        MP4, MOV, AVI files supported
                                                    </p>
                                                </div>
                                            </div>
                                            <Plus className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="space-y-2">
                                            <div className="text-xs sm:text-sm text-muted-foreground">
                                                Drag & drop support
                                            </div>
                                            <div className="text-xs sm:text-sm text-muted-foreground">
                                                Auto-optimization
                                            </div>
                                            <div className="text-xs sm:text-sm text-muted-foreground">
                                                Multiple formats
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-border/50">
                                            <span className="text-xs text-blue-600 font-medium">
                                                Click to upload
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Image Upload Card */}
                                <Card className="group border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300 cursor-pointer bg-gradient-to-br from-card to-card/50"
                                    onClick={handleImageUpload}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3 min-w-0 flex-1">
                                                <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors flex-shrink-0">
                                                    <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                                                </div>
                                                <div className="min-w-0">
                                                    <CardTitle className="text-base sm:text-lg truncate">Image Upload</CardTitle>
                                                    <p className="text-xs text-muted-foreground mt-1 truncate">
                                                        JPG, PNG, GIF files supported
                                                    </p>
                                                </div>
                                            </div>
                                            <Plus className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="space-y-2">
                                            <div className="text-xs sm:text-sm text-muted-foreground">
                                                High-quality compression
                                            </div>
                                            <div className="text-xs sm:text-sm text-muted-foreground">
                                                Instant preview
                                            </div>
                                            <div className="text-xs sm:text-sm text-muted-foreground">
                                                Multiple formats
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-border/50">
                                            <span className="text-xs text-green-600 font-medium">
                                                Click to upload
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        {/* Media Library Section */}
                        <section>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                <div className="flex items-center gap-2">
                                    <FolderOpen className="h-5 w-5 text-primary" />
                                    <h2 className="text-lg sm:text-xl font-semibold">Media Library</h2>
                                    <Badge variant="secondary" className="text-xs">
                                        {media.length} {media.length === 1 ? 'file' : 'files'}
                                    </Badge>
                                </div>
                                <Button
                                    onClick={() => {
                                        setMediaLoading(true)
                                        loadData().finally(() => setMediaLoading(false))
                                    }}
                                    variant="outline"
                                    size="sm"
                                    disabled={mediaLoading}
                                    className="w-full sm:w-auto"
                                >
                                    {mediaLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <Upload className="h-4 w-4 mr-2" />
                                    )}
                                    Refresh
                                </Button>
                            </div>

                            <MediaLibrary
                                media={media}
                                loading={mediaLoading}
                                onDelete={handleDelete}
                            />
                        </section>
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            <UploadModal
                isOpen={uploadModalOpen}
                onClose={() => setUploadModalOpen(false)}
                type={uploadType}
                onUpload={(file: File, title: string, description?: string) => startUpload(file, title, description, uploadType)}
                uploading={uploadTasks.some(task => task.status === 'uploading')}
            />
        </div>
    )
}
