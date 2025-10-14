"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Video,
    ImageIcon,
    Download,
    ExternalLink,
    Search,
    Filter,
    Upload,
    Loader2,
    Grid3X3,
    List,
    Eye,
    Calendar,
    Sparkles,
    FolderOpen,
    Trash2,
    Share2,
    CheckSquare,
    Square
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { MediaItemSkeleton } from '@/components/ui/loading'
import { useToast } from '@/components/ui/toast'
import { ShareDialog } from './share-dialog'
import type { MediaLibraryProps } from '@/types'

export function MediaLibrary({ media, onRefresh, loading = false }: MediaLibraryProps & { loading?: boolean }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState<'all' | 'video' | 'image'>('all')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
    const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null)

    // Batch operations & sharing state
    const [selectionMode, setSelectionMode] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [batchDeleting, setBatchDeleting] = useState(false)
    const [batchDownloading, setBatchDownloading] = useState(false)
    const [shareDialogOpen, setShareDialogOpen] = useState(false)
    const [shareMediaId, setShareMediaId] = useState<string | null>(null)
    const [shareMediaTitle, setShareMediaTitle] = useState<string>('')
    const [shareMediaType, setShareMediaType] = useState<'video' | 'image'>('video')

    const { success, error: showError } = useToast()

    // Ensure media is always an array
    const mediaArray = Array.isArray(media) ? media : []

    const filteredMedia = mediaArray.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesFilter = filterType === 'all' || item.type === filterType
        return matchesSearch && matchesFilter
    })

    const formatFileSize = (bytes: number) => {
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const handleDownload = (url: string, title: string) => {
        const link = document.createElement('a')
        link.href = url
        link.download = title
        link.click()
    }

    const handleView = (url: string) => {
        window.open(url, '_blank')
    }

    const handleDelete = async (id: string, title: string) => {
        setDeletingIds(prev => new Set(prev).add(id))

        try {
            const response = await fetch(`/api/media/delete?id=${id}`, {
                method: 'DELETE',
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete media')
            }

            // Show success message
            success('Media deleted', `"${title}" has been deleted successfully`)

            // Refresh the media list after successful deletion
            if (onRefresh) {
                onRefresh()
            }
        } catch (error) {
            console.error('Delete error:', error)
            showError('Delete failed', error instanceof Error ? error.message : 'Failed to delete media file')
        } finally {
            setDeletingIds(prev => {
                const newSet = new Set(prev)
                newSet.delete(id)
                return newSet
            })
        }
    }

    const initiateDelete = (id: string, title: string) => {
        setConfirmDelete({ id, title })
    }

    const cancelDelete = () => {
        setConfirmDelete(null)
    }

    const confirmDeleteAction = () => {
        if (confirmDelete) {
            handleDelete(confirmDelete.id, confirmDelete.title)
            setConfirmDelete(null)
        }
    }

    // Batch operations handlers
    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev)
            if (newSet.has(id)) {
                newSet.delete(id)
            } else {
                newSet.add(id)
            }
            return newSet
        })
    }

    const selectAll = () => {
        setSelectedIds(new Set(filteredMedia.map(m => m.id)))
    }

    const clearSelection = () => {
        setSelectedIds(new Set())
        setSelectionMode(false)
    }

    const handleBatchDelete = async () => {
        if (selectedIds.size === 0) return

        setBatchDeleting(true)
        try {
            const response = await fetch('/api/media/batch-delete', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: Array.from(selectedIds) })
            })

            const data = await response.json()

            if (data.success) {
                success('Batch delete complete', `${data.data.deleted} items deleted successfully`)
                clearSelection()
                onRefresh?.()
            } else {
                throw new Error(data.error || 'Failed to delete items')
            }
        } catch (error) {
            showError('Batch delete failed', error instanceof Error ? error.message : 'Unknown error')
        } finally {
            setBatchDeleting(false)
        }
    }

    const handleBatchDownload = async () => {
        if (selectedIds.size === 0) return

        setBatchDownloading(true)
        try {
            const response = await fetch('/api/media/batch-download', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: Array.from(selectedIds) })
            })

            const data = await response.json()

            if (data.success) {
                // Download each item with staggered delays to avoid browser blocking
                data.data.items.forEach((item: { url: string; title: string; type: string }, index: number) => {
                    setTimeout(() => {
                        const link = document.createElement('a')
                        link.href = item.url
                        // Add file extension if not present
                        const extension = item.type === 'video' ? '.mp4' : '.jpg'
                        const filename = item.title.includes('.') ? item.title : `${item.title}${extension}`
                        link.download = filename
                        link.target = '_blank'
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                    }, index * 500) // Stagger downloads by 500ms to avoid browser blocking
                })
                success('Downloads started', `Downloading ${data.data.count} items. Please allow multiple downloads in your browser if prompted.`)
            } else {
                throw new Error(data.error || 'Failed to prepare downloads')
            }
        } catch (error) {
            showError('Batch download failed', error instanceof Error ? error.message : 'Unknown error')
        } finally {
            setBatchDownloading(false)
        }
    }

    // Share handler
    const handleShare = (id: string, title: string, type: 'video' | 'image') => {
        setShareMediaId(id)
        setShareMediaTitle(title)
        setShareMediaType(type)
        setShareDialogOpen(true)
    }

    if (mediaArray.length === 0 && !loading) {
        return (
            <Card className="border-dashed border-2 border-border hover:border-primary/50 transition-colors">
                <CardHeader className="text-center pb-2">
                    <CardTitle className="flex items-center justify-center gap-2">
                        <FolderOpen className="h-5 w-5" />
                        Media Library
                    </CardTitle>
                    <CardDescription>
                        Your uploaded files will appear here
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center px-4">
                        <div className="relative mb-6">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full flex items-center justify-center">
                                <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-primary rounded-full flex items-center justify-center">
                                <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary-foreground" />
                            </div>
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold mb-2">No media files yet</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm text-sm sm:text-base">
                            Start building your media library by uploading your first video or image.
                            All your files will be optimized automatically.
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <Card className="overflow-hidden bg-gradient-to-br from-card to-card/50">
                <CardHeader className="bg-muted/30 py-5 px-4 sm:px-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <FolderOpen className="h-5 w-5 text-primary flex-shrink-0" />
                                <span className="truncate">Media Library</span>
                                {!loading && (
                                    <Badge variant="outline" className="text-xs flex-shrink-0">
                                        {filteredMedia.length} of {mediaArray.length} files
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription className="mt-1 text-sm">
                                {loading ? 'Loading your media files...' : 'Manage and organize your uploaded content'}
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {/* View Toggle */}
                            <div className="flex items-center bg-muted rounded-lg p-1">
                                <Button
                                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('grid')}
                                    className="h-8 w-8 p-0 cursor-pointer"
                                >
                                    <Grid3X3 className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('list')}
                                    className="h-8 w-8 p-0 cursor-pointer"
                                >
                                    <List className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Selection Mode Toggle */}
                            {!loading && mediaArray.length > 0 && (
                                <Button
                                    variant={selectionMode ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => {
                                        if (selectionMode) {
                                            clearSelection()
                                        } else {
                                            setSelectionMode(true)
                                        }
                                    }}
                                    className="cursor-pointer"
                                >
                                    {selectionMode ? (
                                        <>
                                            <CheckSquare className="h-4 w-4 mr-2" />
                                            Cancel
                                        </>
                                    ) : (
                                        <>
                                            <Square className="h-4 w-4 mr-2" />
                                            <span className="hidden sm:inline">Select</span>
                                        </>
                                    )}
                                </Button>
                            )}

                            {/* Refresh Button */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onRefresh}
                                disabled={loading}
                                className="cursor-pointer hover:bg-primary/10"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Upload className="h-4 w-4 mr-2" />
                                )}
                                {loading ? 'Loading...' : 'Refresh'}
                            </Button>
                        </div>
                    </div>

                    {/* Search and Filter Controls */}
                    {!loading && (
                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search files by name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 bg-background/50"
                                />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant={filterType === 'all' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilterType('all')}
                                    className="cursor-pointer text-xs sm:text-sm"
                                >
                                    All Files
                                </Button>
                                <Button
                                    variant={filterType === 'video' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilterType('video')}
                                    className="cursor-pointer text-xs sm:text-sm"
                                >
                                    <Video className="h-3 w-3 mr-1" />
                                    <span className="hidden xs:inline">Videos</span>
                                    <span className="xs:hidden">Video</span>
                                </Button>
                                <Button
                                    variant={filterType === 'image' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilterType('image')}
                                    className="cursor-pointer text-xs sm:text-sm"
                                >
                                    <ImageIcon className="h-3 w-3 mr-1" />
                                    <span className="hidden xs:inline">Images</span>
                                    <span className="xs:hidden">Image</span>
                                </Button>
                            </div>
                        </div>
                    )}
                </CardHeader>

                {/* Batch Action Bar */}
                {selectedIds.size > 0 && (
                    <div className="bg-primary text-primary-foreground px-4 sm:px-6 py-3 border-b">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="font-medium">{selectedIds.size} selected</span>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={selectAll}
                                    className="cursor-pointer"
                                    disabled={selectedIds.size === filteredMedia.length}
                                >
                                    Select All ({filteredMedia.length})
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={clearSelection}
                                    className="cursor-pointer"
                                >
                                    Clear
                                </Button>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleBatchDownload}
                                    disabled={batchDownloading}
                                    className="cursor-pointer"
                                >
                                    {batchDownloading ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Download className="h-4 w-4 mr-2" />
                                    )}
                                    Download
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleBatchDelete}
                                    disabled={batchDeleting}
                                    className="cursor-pointer"
                                >
                                    {batchDeleting ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4 mr-2" />
                                    )}
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                <CardContent className="p-4 sm:p-6">
                    {loading ? (
                        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <MediaItemSkeleton key={index} />
                            ))}
                        </div>
                    ) : (
                        <>
                            {filteredMedia.length > 0 ? (
                                <div className={viewMode === 'grid' ? 'grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' : 'space-y-3'}>
                                    {filteredMedia.map((item) => (
                                        <div
                                            key={item.id}
                                            className={`group relative border border-border rounded-xl p-3 sm:p-4 lg:p-5 hover:bg-accent/30 hover:border-primary/30 hover:shadow-lg transition-all duration-300 ${viewMode === 'list' ? 'flex flex-col gap-3' : ''
                                                } ${selectedIds.has(item.id) ? 'ring-2 ring-primary bg-accent/50' : ''}`}
                                        >
                                            {/* Selection Checkbox */}
                                            {selectionMode && (
                                                <div className="absolute top-2 left-2 z-10">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(item.id)}
                                                        onChange={() => toggleSelection(item.id)}
                                                        className="w-5 h-5 cursor-pointer accent-primary"
                                                    />
                                                </div>
                                            )}

                                            {/* File header */}
                                            <div className={`flex items-start justify-between ${viewMode === 'list' ? 'flex-1' : 'mb-3'}`}>
                                                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                                                    <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${item.type === 'video' ? 'bg-blue-500/10' : 'bg-green-500/10'}`}>
                                                        {item.type === 'video' ? (
                                                            <Video className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-500" />
                                                        ) : (
                                                            <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-500" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="font-semibold truncate text-xs sm:text-sm group-hover:text-primary transition-colors" title={item.title || 'Untitled'}>
                                                            {item.title || 'Untitled'}
                                                        </h4>
                                                        <div className="flex flex-col xs:flex-row xs:items-center gap-1 mt-1">
                                                            <Badge variant="secondary" className="text-xs self-start">
                                                                {item.type}
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground">
                                                                {formatFileSize(item.originalSize)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {viewMode === 'grid' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleView(item.url)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex-shrink-0 hidden sm:flex"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>

                                            {/* File details */}
                                            {viewMode === 'grid' && (
                                                <div className="space-y-1 sm:space-y-2 text-xs text-muted-foreground mb-3 sm:mb-4">
                                                    {item.type === 'video' && item.duration && (
                                                        <div className="flex items-center gap-1">
                                                            <Video className="h-3 w-3 flex-shrink-0" />
                                                            <span className="truncate">Duration: {item.duration}s</span>
                                                        </div>
                                                    )}
                                                    {item.width && item.height && (
                                                        <div className="flex items-center gap-1">
                                                            <ImageIcon className="h-3 w-3 flex-shrink-0" />
                                                            <span className="truncate">{item.width} × {item.height}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3 flex-shrink-0" />
                                                        <span className="truncate">{formatDate(item.createdAt)}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Actions */}
                                            {!selectionMode && (
                                                <div className={`flex flex-wrap gap-1.5 sm:gap-2 ${viewMode === 'list' ? 'ml-auto' : ''}`}>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleView(item.url)}
                                                        className="cursor-pointer hover:bg-primary/10 hover:border-primary/30 text-xs px-2 py-1 h-auto min-w-0 flex-shrink-0"
                                                    >
                                                        <ExternalLink className="h-3 w-3 mr-1 flex-shrink-0" />
                                                        <span className="hidden sm:inline">View</span>
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDownload(item.url, item.title || 'download')}
                                                        className="cursor-pointer hover:bg-primary/10 hover:border-primary/30 text-xs px-2 py-1 h-auto min-w-0 flex-shrink-0"
                                                    >
                                                        <Download className="h-3 w-3 mr-1 flex-shrink-0" />
                                                        <span className="hidden sm:inline">Download</span>
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleShare(item.id, item.title || 'Untitled', item.type as 'video' | 'image')}
                                                        className="cursor-pointer hover:bg-primary/10 hover:border-primary/30 text-xs px-2 py-1 h-auto min-w-0 flex-shrink-0"
                                                    >
                                                        <Share2 className="h-3 w-3 mr-1 flex-shrink-0" />
                                                        <span className="hidden sm:inline">Share</span>
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => initiateDelete(item.id, item.title || 'Untitled')}
                                                        disabled={deletingIds.has(item.id)}
                                                        className="cursor-pointer hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive text-xs px-2 py-1 h-auto min-w-0 flex-shrink-0"
                                                    >
                                                        {deletingIds.has(item.id) ? (
                                                            <Loader2 className="h-3 w-3 mr-1 animate-spin flex-shrink-0" />
                                                        ) : (
                                                            <Trash2 className="h-3 w-3 mr-1 flex-shrink-0" />
                                                        )}
                                                        <span className="hidden sm:inline">{deletingIds.has(item.id) ? 'Deleting...' : 'Delete'}</span>
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                /* Empty state when no files match filters */
                                <div className="text-center py-8 sm:py-12 px-4">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Filter className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-base sm:text-lg font-medium mb-2">No files found</h3>
                                    <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                                        Try adjusting your search terms or filters
                                    </p>
                                    <Button variant="outline" onClick={() => {
                                        setSearchTerm('')
                                        setFilterType('all')
                                    }} className="cursor-pointer">
                                        Clear Filters
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        onClick={cancelDelete}
                    />

                    {/* Dialog */}
                    <div className="relative bg-card border border-border rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-destructive/10 rounded-lg">
                                <Trash2 className="h-5 w-5 text-destructive" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">Delete Media File</h3>
                                <p className="text-sm text-muted-foreground">This action cannot be undone</p>
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-6">
                            Are you sure you want to delete <strong>&quot;{confirmDelete?.title}&quot;</strong>?
                            This will permanently remove the file from your media library.
                        </p>

                        <div className="flex gap-3 justify-end">
                            <Button
                                variant="outline"
                                onClick={cancelDelete}
                                className="cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={confirmDeleteAction}
                                className="cursor-pointer"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Share Dialog */}
            {shareDialogOpen && shareMediaId && (
                <ShareDialog
                    mediaId={shareMediaId}
                    mediaTitle={shareMediaTitle}
                    mediaType={shareMediaType}
                    onClose={() => {
                        setShareDialogOpen(false)
                        setShareMediaId(null)
                        setShareMediaTitle('')
                    }}
                />
            )}
        </>
    )
}