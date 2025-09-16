"use client"

import { useState, useCallback } from 'react'
import type { UploadTask } from '@/components/dashboard/upload-progress-tracker'

interface UseBackgroundUploadReturn {
    tasks: UploadTask[]
    startUpload: (file: File, title: string, description: string | undefined, type: 'video' | 'image') => Promise<void>
    updateProgress: (taskId: string, progress: number) => void
    completeUpload: (taskId: string, result?: unknown) => void
    failUpload: (taskId: string, error: string) => void
    removeTask: (taskId: string) => void
    clearCompleted: () => void
}

export function useBackgroundUpload(
    onUploadComplete?: (result: unknown) => void,
    onUploadError?: (error: string) => void
): UseBackgroundUploadReturn {
    const [tasks, setTasks] = useState<UploadTask[]>([])

    const generateTaskId = () => `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const startUpload = useCallback(async (
        file: File,
        title: string,
        description: string | undefined,
        type: 'video' | 'image'
    ): Promise<void> => {
        const taskId = generateTaskId()

        const newTask: UploadTask = {
            id: taskId,
            file,
            title,
            description,
            type,
            status: 'uploading',
            progress: 0,
            startTime: new Date()
        }

        setTasks(prev => [...prev, newTask])

        // Start with a small progress to show immediate feedback
        setTimeout(() => {
            setTasks(prev => prev.map(task =>
                task.id === taskId ? { ...task, progress: 5 } : task
            ))
        }, 100)

        try {
            // Create FormData
            const formData = new FormData()
            formData.append('file', file)
            formData.append('title', title)
            if (description) formData.append('description', description)

            const endpoint = type === 'video' ? '/api/media/upload/video' : '/api/media/upload/image'

            // Create XMLHttpRequest for progress tracking
            const xhr = new XMLHttpRequest()

            return new Promise((resolve, reject) => {
                // Track upload progress
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        // Network upload progress (5-60% range)
                        const uploadPercent = (event.loaded / event.total) * 100
                        const networkProgress = Math.min(60, Math.max(5, Math.round(5 + (uploadPercent * 0.55))))

                        setTasks(prev => prev.map(task =>
                            task.id === taskId ? { ...task, progress: networkProgress } : task
                        ))
                    }
                }

                // Track response progress (for when server receives the file)
                xhr.onreadystatechange = () => {
                    if (xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
                        // Server received file, starting processing
                        setTasks(prev => prev.map(task =>
                            task.id === taskId ? { ...task, progress: 65 } : task
                        ))
                    } else if (xhr.readyState === XMLHttpRequest.LOADING) {
                        // Server is processing
                        setTasks(prev => prev.map(task =>
                            task.id === taskId ? { ...task, progress: 75 } : task
                        ))
                    }
                }

                // Handle completion
                xhr.onload = () => {
                    try {
                        // Set progress to 85% when server processing completes
                        setTasks(prev => prev.map(task =>
                            task.id === taskId ? { ...task, progress: 85 } : task
                        ))

                        const result = JSON.parse(xhr.responseText)

                        if (xhr.status >= 200 && xhr.status < 300 && result.success) {
                            // Simulate final processing steps with realistic timing
                            const processingDelay = type === 'video' ? 800 : 400

                            setTimeout(() => {
                                setTasks(prev => prev.map(task =>
                                    task.id === taskId ? { ...task, progress: 95 } : task
                                ))

                                setTimeout(() => {
                                    setTasks(prev => prev.map(task =>
                                        task.id === taskId ? { ...task, status: 'completed', progress: 100 } : task
                                    ))
                                    onUploadComplete?.(result)
                                }, 300)
                            }, processingDelay)
                            resolve(result)
                        } else {
                            const errorMessage = result.error || 'Upload failed'
                            setTasks(prev => prev.map(task =>
                                task.id === taskId ? { ...task, status: 'error', error: errorMessage } : task
                            ))
                            onUploadError?.(errorMessage)
                            reject(new Error(errorMessage))
                        }
                    } catch (error) {
                        const errorMessage = 'Failed to parse server response'
                        setTasks(prev => prev.map(task =>
                            task.id === taskId ? { ...task, status: 'error', error: errorMessage } : task
                        ))
                        onUploadError?.(errorMessage)
                        reject(error)
                    }
                }

                // Handle errors
                xhr.onerror = () => {
                    const errorMessage = 'Network error during upload'
                    setTasks(prev => prev.map(task =>
                        task.id === taskId ? { ...task, status: 'error', error: errorMessage } : task
                    ))
                    onUploadError?.(errorMessage)
                    reject(new Error(errorMessage))
                }

                // Handle abort
                xhr.onabort = () => {
                    setTasks(prev => prev.filter(task => task.id !== taskId))
                    reject(new Error('Upload cancelled'))
                }

                // Start the upload
                xhr.open('POST', endpoint)
                xhr.send(formData)
            })
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            setTasks(prev => prev.map(task =>
                task.id === taskId ? { ...task, status: 'error', error: errorMessage } : task
            ))
            onUploadError?.(errorMessage)
            throw error
        }
    }, [onUploadComplete, onUploadError])

    const updateProgress = useCallback((taskId: string, progress: number) => {
        setTasks(prev => prev.map(task =>
            task.id === taskId ? { ...task, progress } : task
        ))
    }, [])

    const completeUpload = useCallback((taskId: string, result?: unknown) => {
        setTasks(prev => prev.map(task =>
            task.id === taskId ? { ...task, status: 'completed', progress: 100 } : task
        ))
        onUploadComplete?.(result)
    }, [onUploadComplete])

    const failUpload = useCallback((taskId: string, error: string) => {
        setTasks(prev => prev.map(task =>
            task.id === taskId ? { ...task, status: 'error', error } : task
        ))
        onUploadError?.(error)
    }, [onUploadError])

    const removeTask = useCallback((taskId: string) => {
        setTasks(prev => prev.filter(task => task.id !== taskId))
    }, [])

    const clearCompleted = useCallback(() => {
        setTasks(prev => prev.filter(task => task.status === 'uploading'))
    }, [])

    return {
        tasks,
        startUpload,
        updateProgress,
        completeUpload,
        failUpload,
        removeTask,
        clearCompleted
    }
}