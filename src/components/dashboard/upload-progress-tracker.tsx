"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAnimatedProgress } from '@/hooks/useAnimatedProgress'
import {
    Minimize2,
    Maximize2,
    X,
    CheckCircle,
    AlertCircle,
    Upload,
    Video,
    ImageIcon,
    Loader2
} from 'lucide-react'
import { formatFileSize } from '@/lib/client-usage'

// Component for individual task items to handle animated progress
function TaskItem({ task, getProgressStatus }: {
    task: UploadTask,
    getProgressStatus: (progress: number, type: 'video' | 'image') => string
}) {
    const animatedProgress = useAnimatedProgress({ targetProgress: task.progress })

    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
                {task.type === 'video' ? (
                    <Video className="h-3 w-3 text-blue-500" />
                ) : (
                    <ImageIcon className="h-3 w-3 text-green-500" />
                )}
                <span className="truncate flex-1">{task.title}</span>
                <span className="text-muted-foreground">
                    {animatedProgress}%
                </span>
            </div>
            <div className="text-xs text-primary font-medium truncate">
                {getProgressStatus(animatedProgress, task.type)}
            </div>
            <Progress value={animatedProgress} className="h-1" />
        </div>
    )
}

// Component for detailed task items in expanded view
function DetailedTaskItem({ task, getProgressStatus, getElapsedTime, formatFileSize }: {
    task: UploadTask,
    getProgressStatus: (progress: number, type: 'video' | 'image') => string,
    getElapsedTime: (startTime: Date) => string,
    formatFileSize: (size: number) => string
}) {
    const animatedProgress = useAnimatedProgress({ targetProgress: task.progress })

    return (
        <div className="space-y-2 p-3 border border-border rounded-lg">
            <div className="flex items-center gap-2">
                {task.type === 'video' ? (
                    <Video className="h-4 w-4 text-blue-500" />
                ) : (
                    <ImageIcon className="h-4 w-4 text-green-500" />
                )}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                        {formatFileSize(task.file.size)} • {getElapsedTime(task.startTime)}
                    </p>
                    <p className="text-xs text-primary font-medium">
                        {getProgressStatus(animatedProgress, task.type)}
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    <span className="text-xs font-medium">{animatedProgress}%</span>
                </div>
            </div>
            <Progress value={animatedProgress} className="h-2 transition-all duration-300" />
        </div>
    )
}

export interface UploadTask {
    id: string
    file: File
    title: string
    description?: string
    type: 'video' | 'image'
    status: 'uploading' | 'completed' | 'error'
    progress: number
    error?: string
    startTime: Date
}

interface UploadProgressTrackerProps {
    tasks: UploadTask[]
    isMinimized: boolean
    onToggleMinimize: () => void
    onRemoveTask: (taskId: string) => void
    onClearCompleted: () => void
}

export function UploadProgressTracker({
    tasks,
    isMinimized,
    onToggleMinimize,
    onRemoveTask,
    onClearCompleted
}: UploadProgressTrackerProps) {
    const [isVisible, setIsVisible] = useState(false)

    // Show tracker when there are active uploads
    useEffect(() => {
        const hasActiveTasks = tasks.length > 0
        setIsVisible(hasActiveTasks)
    }, [tasks])

    if (!isVisible) return null

    const activeTasks = tasks.filter(task => task.status === 'uploading')
    const completedTasks = tasks.filter(task => task.status === 'completed')
    const errorTasks = tasks.filter(task => task.status === 'error')

    const getElapsedTime = (startTime: Date) => {
        const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000)
        if (elapsed < 60) return `${elapsed}s`
        const minutes = Math.floor(elapsed / 60)
        const seconds = elapsed % 60
        return `${minutes}m ${seconds}s`
    }

    const getProgressStatus = (progress: number, type: 'video' | 'image') => {
        if (progress <= 10) return 'Preparing upload...'
        if (progress <= 60) return 'Uploading to server...'
        if (progress <= 70) return 'Processing...'
        if (progress <= 85) return type === 'video' ? 'Optimizing video...' : 'Optimizing image...'
        if (progress <= 95) return 'Finalizing...'
        return 'Completing...'
    }

    if (isMinimized) {
        return (
            <div className="fixed bottom-4 right-4 z-40">
                <Card className="w-80 shadow-lg border-border bg-background/95 backdrop-blur">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Upload className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">
                                    Uploads ({activeTasks.length} active)
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onToggleMinimize}
                                    className="h-6 w-6 p-0"
                                >
                                    <Maximize2 className="h-3 w-3" />
                                </Button>
                                {activeTasks.length === 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsVisible(false)}
                                        className="h-6 w-6 p-0"
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Active Uploads Summary */}
                        {activeTasks.length > 0 && (
                            <div className="space-y-2">
                                {activeTasks.slice(0, 2).map(task => (
                                    <TaskItem
                                        key={task.id}
                                        task={task}
                                        getProgressStatus={getProgressStatus}
                                    />
                                ))}
                                {activeTasks.length > 2 && (
                                    <p className="text-xs text-muted-foreground">
                                        +{activeTasks.length - 2} more uploads
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Completed/Error Summary */}
                        {activeTasks.length === 0 && (
                            <div className="flex items-center justify-between text-xs">
                                {completedTasks.length > 0 && (
                                    <div className="flex items-center gap-1 text-green-600">
                                        <CheckCircle className="h-3 w-3" />
                                        <span>{completedTasks.length} completed</span>
                                    </div>
                                )}
                                {errorTasks.length > 0 && (
                                    <div className="flex items-center gap-1 text-red-600">
                                        <AlertCircle className="h-3 w-3" />
                                        <span>{errorTasks.length} failed</span>
                                    </div>
                                )}
                                {completedTasks.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={onClearCompleted}
                                        className="h-5 text-xs px-2"
                                    >
                                        Clear
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="fixed bottom-4 right-4 z-40">
            <Card className="w-96 max-h-96 shadow-lg border-border bg-background/95 backdrop-blur">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Upload className="h-5 w-5 text-primary" />
                            <h3 className="text-base font-semibold">Upload Progress</h3>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onToggleMinimize}
                                className="h-6 w-6 p-0"
                            >
                                <Minimize2 className="h-3 w-3" />
                            </Button>
                            {activeTasks.length === 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsVisible(false)}
                                    className="h-6 w-6 p-0"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4 max-h-80 overflow-y-auto">
                        {/* Active Uploads */}
                        {activeTasks.map(task => (
                            <DetailedTaskItem
                                key={task.id}
                                task={task}
                                getProgressStatus={getProgressStatus}
                                getElapsedTime={getElapsedTime}
                                formatFileSize={formatFileSize}
                            />
                        ))}

                        {/* Completed Uploads */}
                        {completedTasks.map(task => (
                            <div key={task.id} className="space-y-2 p-3 border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{task.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatFileSize(task.file.size)} • Completed
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onRemoveTask(task.id)}
                                        className="h-6 w-6 p-0"
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {/* Error Uploads */}
                        {errorTasks.map(task => (
                            <div key={task.id} className="space-y-2 p-3 border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-red-600" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{task.title}</p>
                                        <p className="text-xs text-red-600 truncate">
                                            {task.error || 'Upload failed'}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onRemoveTask(task.id)}
                                        className="h-6 w-6 p-0"
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    {(completedTasks.length > 0 || errorTasks.length > 0) && activeTasks.length === 0 && (
                        <div className="mt-4 pt-4 border-t border-border">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onClearCompleted}
                                className="w-full"
                            >
                                Clear All Completed
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}