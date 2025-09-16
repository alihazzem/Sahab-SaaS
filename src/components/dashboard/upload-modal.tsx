"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Video, ImageIcon, X, Loader2, AlertTriangle, Info } from 'lucide-react'

interface UploadModalProps {
    isOpen: boolean
    onClose: () => void
    type: 'video' | 'image'
    onUpload: (file: File, title: string, description?: string) => Promise<void>
    uploading: boolean
    transformationsRemaining?: number
    transformationsLimit?: number
}

export function UploadModal({
    isOpen,
    onClose,
    type,
    onUpload,
    uploading,
    transformationsRemaining = 999,
}: UploadModalProps) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            // Auto-fill title with filename (without extension)
            const nameWithoutExt = file.name.split('.').slice(0, -1).join('.')
            setTitle(nameWithoutExt)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedFile || !title.trim()) return

        try {
            await onUpload(selectedFile, title.trim(), description.trim() || undefined)
            handleClose()
        } catch (error) {
            console.error('Upload error:', error)
        }
    }

    const handleClose = () => {
        setTitle('')
        setDescription('')
        setSelectedFile(null)
        onClose()
    }

    if (!isOpen) return null

    const Icon = type === 'video' ? Video : ImageIcon
    const acceptTypes = type === 'video' ? 'video/*' : 'image/*'

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Icon className="h-6 w-6 text-primary" />
                            <div>
                                <CardTitle>Upload {type === 'video' ? 'Video' : 'Image'}</CardTitle>
                                <CardDescription>
                                    Add a title and description for your {type}
                                </CardDescription>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClose}
                            disabled={uploading}
                            className="cursor-pointer"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>

                {/* Transformation Status for Videos */}
                {type === 'video' && (
                    <div className="px-6 pb-4">
                        {transformationsRemaining < 3 ? (
                            <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                                <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                    <p className="font-medium text-orange-800 dark:text-orange-200">Raw Upload Only</p>
                                    <p className="text-orange-700 dark:text-orange-300">
                                        No transformations left. Video will be uploaded without processing.
                                    </p>
                                </div>
                            </div>
                        ) : transformationsRemaining < 10 ? (
                            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                    <p className="font-medium text-yellow-800 dark:text-yellow-200">Low on Transformations</p>
                                    <p className="text-yellow-700 dark:text-yellow-300">
                                        {Math.floor(transformationsRemaining / 3)} videos left with processing. Consider upgrading.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <Info className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                    <p className="font-medium text-green-800 dark:text-green-200">Processing Available</p>
                                    <p className="text-green-700 dark:text-green-300">
                                        Video will be processed in multiple resolutions (1080p, 720p, 480p).
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* File Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="file">Select {type}</Label>
                            <Input
                                id="file"
                                type="file"
                                accept={acceptTypes}
                                onChange={handleFileSelect}
                                disabled={uploading}
                                required
                            />
                            {selectedFile && (
                                <p className="text-sm text-muted-foreground">
                                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                </p>
                            )}
                        </div>

                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title">Title *</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter a title for your media"
                                disabled={uploading}
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Description (optional)</Label>
                            <Input
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Add a description..."
                                disabled={uploading}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={uploading}
                                className="flex-1 cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={!selectedFile || !title.trim() || uploading}
                                className="flex-1 cursor-pointer"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    `Upload ${type === 'video' ? 'Video' : 'Image'}`
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}