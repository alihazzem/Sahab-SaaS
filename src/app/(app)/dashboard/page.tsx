"use client"

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { LogoutButton } from '@/components/ui/logout-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Video,
    ImageIcon,
    Loader2,
    Home,
    ChevronRight,
    Upload,
    BarChart3,
    FolderOpen,
    Plus,
    Sparkles,
} from 'lucide-react'
import { UsageAnalytics } from '@/components/dashboard/usage-analytics'
import { MediaLibrary } from '@/components/dashboard/media-library'
import { UploadModal } from '@/components/dashboard/upload-modal'
import { useToast } from '@/components/ui/toast'
import type { MediaItem, SubscriptionData } from '@/types'

export default function DashboardPage() {
    const router = useRouter()
    const [media, setMedia] = useState<MediaItem[]>([])
    const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
    const [loading, setLoading] = useState(true)
    const [mediaLoading, setMediaLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [uploadModalOpen, setUploadModalOpen] = useState(false)
    const [uploadType, setUploadType] = useState<'video' | 'image'>('video')

    const { success, error } = useToast()

    const loadData = useCallback(async (retryCount = 0) => {
        setLoading(true)
        try {
            const [mediaRes, subRes] = await Promise.all([
                fetch('/api/media/list', {
                    headers: {
                        'Cache-Control': 'no-cache',
                    }
                }).then(async res => {
                    if (!res.ok) {
                        if (res.status === 401) {
                            console.error('Media API: Unauthorized - status 401')
                            // Retry once after a short delay in case of auth timing issue
                            if (retryCount < 1) {
                                console.log('Retrying media API call...')
                                await new Promise(resolve => setTimeout(resolve, 500))
                                return { success: false, error: 'Retry' }
                            }
                            console.error('Media API: Still unauthorized after retry - redirecting to sign-in')
                            router.push('/auth/sign-in')
                            return { success: false, error: 'Unauthorized' }
                        }
                        const errorText = await res.text()
                        console.error('Media API HTTP Error:', res.status, errorText)
                        return { success: false, error: errorText }
                    }
                    return res.json()
                }),
                fetch('/api/subscription/status', {
                    headers: {
                        'Cache-Control': 'no-cache',
                    }
                }).then(async res => {
                    if (!res.ok) {
                        if (res.status === 401) {
                            console.error('Subscription API: Unauthorized - status 401')
                            // Retry once after a short delay in case of auth timing issue
                            if (retryCount < 1) {
                                console.log('Retrying subscription API call...')
                                await new Promise(resolve => setTimeout(resolve, 500))
                                return { success: false, error: 'Retry' }
                            }
                            console.error('Subscription API: Still unauthorized after retry - redirecting to sign-in')
                            router.push('/auth/sign-in')
                            return { success: false, error: 'Unauthorized' }
                        }
                        const errorText = await res.text()
                        console.error('Subscription API HTTP Error:', res.status, errorText)
                        return { success: false, error: errorText }
                    }
                    return res.json()
                })
            ])

            // If either API returned a retry error, retry the whole process
            if (mediaRes.error === 'Retry' || subRes.error === 'Retry') {
                return loadData(retryCount + 1)
            }

            console.log('Media response:', mediaRes)
            console.log('Subscription response:', subRes)

            // Don't continue if we got unauthorized responses
            if (mediaRes.error === 'Unauthorized' || subRes.error === 'Unauthorized') {
                return
            }

            if (mediaRes.success) {
                setMedia(mediaRes.data?.data || [])
                console.log('Media set:', mediaRes.data?.data || [])
            } else {
                console.error('Media API error:', mediaRes.error || mediaRes)
            }

            if (subRes.success) {
                setSubscription(subRes.subscription)
                console.log('Subscription set:', subRes.subscription)
            } else {
                console.error('Subscription API error:', subRes.error || subRes)
            }

            // Only show error if both APIs failed (and not due to auth issues)
            if (!mediaRes.success && !subRes.success &&
                mediaRes.error !== 'Unauthorized' && subRes.error !== 'Unauthorized') {
                error(
                    'Failed to load dashboard',
                    'There was an error loading your dashboard data. Please refresh the page.'
                )
            }
        } catch (err) {
            console.error('Failed to load dashboard data:', err)
            error(
                'Failed to load dashboard',
                'There was an error loading your dashboard data. Please refresh the page.'
            )
        } finally {
            setLoading(false)
        }
    }, [router, error]);

    useEffect(() => {
        console.log('Component mounted, loading data...')
        loadData()
    }, [loadData])

    const refreshMediaLibrary = async () => {
        setMediaLoading(true)
        try {
            const mediaRes = await fetch('/api/media/list').then(res => res.json())
            if (mediaRes.success) setMedia(mediaRes.data?.data || [])
        } catch (err) {
            console.error('Failed to refresh media:', err)
            error(
                'Failed to refresh media',
                'There was an error refreshing your media library.'
            )
        } finally {
            setMediaLoading(false)
        }
    }

    const handleVideoUpload = () => {
        setUploadType('video')
        setUploadModalOpen(true)
    }

    const handleImageUpload = () => {
        setUploadType('image')
        setUploadModalOpen(true)
    }

    const handleUpload = async (file: File, title: string, description?: string) => {
        setUploading(true)

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('title', title)
            if (description) formData.append('description', description)

            const endpoint = uploadType === 'video' ? '/api/media/upload/video' : '/api/media/upload/image'

            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData,
            })

            const result = await response.json()

            if (result.success) {
                success('Upload successful!', `Your ${uploadType} has been uploaded successfully.`)
                if (result.data) {
                    setMedia(prev => [result.data, ...prev])

                    // Update subscription state if provided
                    if (result.subscription) {
                        setSubscription(result.subscription)
                    }
                }
                setUploadModalOpen(false)
            } else {
                error('Upload failed', result.error || 'There was an error uploading your file.')
            }
        } catch (err) {
            console.error('Upload error:', err)
            error('Upload failed', 'There was an error uploading your file. Please try again.')
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch('/api/media/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            })

            const result = await response.json()

            if (result.success) {
                success('Deleted successfully', 'Media file has been deleted.')
                setMedia(prev => prev.filter(item => item.id !== id))

                // Update subscription state if provided
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
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
            {/* Header Section */}
            <div className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 py-4 sm:py-6">
                    {/* Top Header with Profile/Logout */}
                    <div className="flex items-center justify-between mb-4">
                        {/* Breadcrumb */}
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Home className="h-4 w-4" />
                            <ChevronRight className="h-4 w-4" />
                            <span className="text-foreground font-medium">Dashboard</span>
                        </div>

                        {/* Profile & Logout */}
                        <div className="flex items-center gap-3">
                            <LogoutButton />
                        </div>
                    </div>

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
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-6 sm:py-8">
                {loading ? (
                    <div className="flex items-center justify-center py-12 sm:py-16">
                        <div className="text-center max-w-md px-4">
                            <div className="relative mb-6">
                                <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin mx-auto text-primary" />
                                <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse"></div>
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold mb-2">Setting up your dashboard...</h3>
                            <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                                We&apos;re loading your media files and usage statistics
                            </p>
                            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                                <Sparkles className="h-3 w-3" />
                                <span>This usually takes just a moment</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 sm:space-y-8">
                        {/* Quick Actions Section */}
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
                                                    <CardTitle className="text-base sm:text-lg truncate">Upload Video</CardTitle>
                                                    <p className="text-xs text-muted-foreground mt-1 truncate">
                                                        MP4, MOV, AVI supported
                                                    </p>
                                                </div>
                                            </div>
                                            <Plus className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="space-y-2">
                                            <div className="text-xs sm:text-sm text-muted-foreground">
                                                • Automatic thumbnail generation
                                            </div>
                                            <div className="text-xs sm:text-sm text-muted-foreground">
                                                • Video compression & optimization
                                            </div>
                                            <div className="text-xs sm:text-sm text-muted-foreground">
                                                • Multiple format support
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-border/50">
                                            <span className="text-xs text-muted-foreground">
                                                Click to upload or drag & drop
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
                                                    <CardTitle className="text-base sm:text-lg truncate">Upload Image</CardTitle>
                                                    <p className="text-xs text-muted-foreground mt-1 truncate">
                                                        JPG, PNG, WebP supported
                                                    </p>
                                                </div>
                                            </div>
                                            <Plus className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="space-y-2">
                                            <div className="text-xs sm:text-sm text-muted-foreground">
                                                • Automatic image optimization
                                            </div>
                                            <div className="text-xs sm:text-sm text-muted-foreground">
                                                • Smart resize & compression
                                            </div>
                                            <div className="text-xs sm:text-sm text-muted-foreground">
                                                • Multiple format conversion
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-border/50">
                                            <span className="text-xs text-muted-foreground">
                                                Click to upload or drag & drop
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        {/* Usage Analytics */}
                        {subscription && (
                            <section>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5 text-primary" />
                                        <h2 className="text-lg sm:text-xl font-semibold">Usage Analytics</h2>
                                        <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                                            Real-time
                                        </Badge>
                                    </div>
                                </div>
                                <UsageAnalytics subscription={subscription} />
                            </section>
                        )}

                        {/* Media Library */}
                        <section>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-6">
                                <div className="flex items-center gap-2">
                                    <FolderOpen className="h-5 w-5 text-primary" />
                                    <h2 className="text-lg sm:text-xl font-semibold">Media Library</h2>
                                </div>
                                <Badge variant="outline" className="text-xs self-start sm:self-auto">
                                    {media.length} {media.length === 1 ? 'file' : 'files'}
                                </Badge>
                            </div>
                            <MediaLibrary
                                media={media}
                                loading={mediaLoading}
                                onRefresh={refreshMediaLibrary}
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
                onUpload={handleUpload}
                uploading={uploading}
                type={uploadType}
            />
        </div>
    )
}