"use client"

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Video, ImageIcon, X, Loader2, AlertTriangle, Info, Upload, FileIcon, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
    validateFileSize,
    validateStorageCapacity,
    fetchStorageInfo,
    fetchUserPlan,
    formatFileSize,
} from '@/lib/client-usage'
import type { StorageInfo } from '@/types'

interface FileWithMetadata {
    file: File
    id: string
    title: string
    description: string
    status: 'pending' | 'uploading' | 'success' | 'error'
    progress: number
    error?: string
}

interface BulkUploadModalProps {
    isOpen: boolean
    onClose: () => void
    type: 'video' | 'image'
    onUpload: (file: File, title: string, description?: string) => Promise<void>
    transformationsRemaining?: number
}

export function BulkUploadModal({
    isOpen,
    onClose,
    type,
    onUpload,
    transformationsRemaining = 999,
}: BulkUploadModalProps) {
    const [files, setFiles] = useState<FileWithMetadata[]>([])
    const [userPlan, setUserPlan] = useState<string>('FREE')
    const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null)
    const [validationError, setValidationError] = useState<string>('')
    const [loadingQuota, setLoadingQuota] = useState(false)

    // Load user quota information when modal opens
    useEffect(() => {
        if (isOpen) {
            loadQuotaInfo()
        } else {
            // Reset state when modal closes
            setFiles([])
            setValidationError('')
        }
    }, [isOpen])

    const loadQuotaInfo = async () => {
        setLoadingQuota(true)
        try {
            const [plan, storage] = await Promise.all([
                fetchUserPlan(),
                fetchStorageInfo()
            ])
            setUserPlan(plan)
            setStorageInfo(storage)
        } catch (error) {
            console.error('Failed to load quota info:', error)
        } finally {
            setLoadingQuota(false)
        }
    }

    const validateFile = useCallback((file: File) => {
        if (loadingQuota) {
            return { isValid: true }
        }

        // Check file size against plan limits
        const sizeValidation = validateFileSize(file, userPlan)
        if (!sizeValidation.isValid) {
            return sizeValidation
        }

        // Check storage capacity
        if (storageInfo) {
            const storageValidation = validateStorageCapacity(file.size, storageInfo)
            if (!storageValidation.isValid) {
                return storageValidation
            }
        }

        return { isValid: true }
    }, [userPlan, loadingQuota, storageInfo])

    const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || [])

        if (selectedFiles.length === 0) return

        // Validate all files
        const invalidFiles = selectedFiles.filter(file => !validateFile(file).isValid)

        if (invalidFiles.length > 0) {
            const validation = validateFile(invalidFiles[0])
            setValidationError(validation.error || 'Some files are invalid')
            return
        }

        setValidationError('')

        // Create metadata for each file
        const newFiles: FileWithMetadata[] = selectedFiles.map((file, index) => ({
            file,
            id: `${Date.now()}-${index}`,
            title: file.name.split('.').slice(0, -1).join('.'),
            description: '',
            status: 'pending',
            progress: 0
        }))

        setFiles(prev => [...prev, ...newFiles])

        // Reset the input
        e.target.value = ''
    }

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id))
    }

    const updateFileTitle = (id: string, title: string) => {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, title } : f))
    }

    const updateFileDescription = (id: string, description: string) => {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, description } : f))
    }

    const startBackgroundUploads = () => {
        if (files.length === 0) return

        // Start all uploads in the background
        files.forEach((fileData) => {
            if (fileData.status === 'pending') {
                // Queue each file for background upload
                onUpload(
                    fileData.file,
                    fileData.title.trim() || fileData.file.name,
                    fileData.description.trim() || undefined
                ).catch((error) => {
                    console.error('Background upload failed:', error)
                })
            }
        })

        // Close modal immediately after queuing uploads
        onClose()
    }

    const handleClose = () => {
        onClose()
    }

    if (!isOpen) return null

    const Icon = type === 'video' ? Video : ImageIcon
    const acceptTypes = type === 'video' ? 'video/*' : 'image/*'

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col">
                <CardHeader className="pb-4 border-b flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Icon className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    Bulk Upload {type === 'video' ? 'Videos' : 'Images'}
                                    <Badge variant="secondary" className="text-xs font-normal">
                                        Background Upload
                                    </Badge>
                                </CardTitle>
                                <CardDescription>
                                    Select files and upload will continue in background
                                </CardDescription>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClose}
                            className="cursor-pointer"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Stats */}
                    {files.length > 0 && (
                        <div className="flex items-center gap-2 pt-4">
                            <Badge variant="outline" className="gap-1">
                                <FileIcon className="h-3 w-3" />
                                {files.length} file{files.length !== 1 ? 's' : ''} ready
                            </Badge>
                        </div>
                    )}
                </CardHeader>

                {/* Transformation Status for Videos */}
                {type === 'video' && (
                    <div className="px-6 py-4 border-b flex-shrink-0">
                        {transformationsRemaining < 3 ? (
                            <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                                <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                    <p className="font-medium text-orange-800 dark:text-orange-200">Raw Upload Only</p>
                                    <p className="text-orange-700 dark:text-orange-300">
                                        No transformations left. Videos will be uploaded without processing.
                                    </p>
                                </div>
                            </div>
                        ) : transformationsRemaining < 10 ? (
                            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                    <p className="font-medium text-yellow-800 dark:text-yellow-200">Low on Transformations</p>
                                    <p className="text-yellow-700 dark:text-yellow-300">
                                        {Math.floor(transformationsRemaining / 3)} videos left with processing.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <Info className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                    <p className="font-medium text-green-800 dark:text-green-200">Processing Available</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Validation Error */}
                    {validationError && (
                        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                                <p className="font-medium text-red-800 dark:text-red-200">Upload Error</p>
                                <p className="text-red-700 dark:text-red-300">{validationError}</p>
                            </div>
                        </div>
                    )}

                    {/* File Selection */}
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium mb-1">Select files to upload</p>
                        <p className="text-xs text-muted-foreground mb-4">
                            Choose multiple {type === 'video' ? 'videos' : 'images'} at once
                        </p>
                        <Input
                            type="file"
                            accept={acceptTypes}
                            multiple
                            onChange={handleFilesSelect}
                            disabled={loadingQuota}
                            className='cursor-pointer'
                        />
                    </div>

                    {/* Files List */}
                    {files.length > 0 && (
                        <div className="space-y-2">
                            {files.map((fileData) => (
                                <Card key={fileData.id} className="hover:border-primary/30 transition-colors">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3">
                                            {/* File Icon */}
                                            <div className="mt-1">
                                                <FileIcon className="h-5 w-5 text-muted-foreground" />
                                            </div>

                                            {/* File Info */}
                                            <div className="flex-1 min-w-0 space-y-2">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{fileData.file.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatFileSize(fileData.file.size)}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeFile(fileData.id)}
                                                        className="cursor-pointer h-8 w-8 p-0"
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>

                                                {/* Editable fields */}
                                                <div className="space-y-2">
                                                    <Input
                                                        value={fileData.title}
                                                        onChange={(e) => updateFileTitle(fileData.id, e.target.value)}
                                                        placeholder="Title (optional, uses filename if empty)"
                                                        className="h-8 text-sm"
                                                    />
                                                    <Input
                                                        value={fileData.description}
                                                        onChange={(e) => updateFileDescription(fileData.id, e.target.value)}
                                                        placeholder="Description (optional)"
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {files.length === 0 && !validationError && (
                        <div className="text-center py-8 text-muted-foreground">
                            <p className="text-sm">No files selected yet</p>
                            <p className="text-xs mt-1">Select files using the button above</p>
                        </div>
                    )}
                </CardContent>

                {/* Actions */}
                <div className="p-6 border-t flex gap-3 flex-shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        className="flex-1 cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={startBackgroundUploads}
                        disabled={files.length === 0 || loadingQuota}
                        className="flex-1 cursor-pointer bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    >
                        {loadingQuota ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Checking quota...
                            </>
                        ) : (
                            <>
                                <Upload className="h-4 w-4 mr-2" />
                                Start Upload ({files.length} file{files.length !== 1 ? 's' : ''})
                            </>
                        )}
                    </Button>
                </div>
            </Card>
        </div>
    )
}
