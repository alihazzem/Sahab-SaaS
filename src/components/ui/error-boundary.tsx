"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error?: Error
    errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error
        }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('ErrorBoundary caught an error:', error, errorInfo)
        this.setState({
            error,
            errorInfo,
        })

        // Log to external service if needed
        // logErrorToService(error, errorInfo)
    }

    handleReset = (): void => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined })
    }

    handleReload = (): void => {
        window.location.reload()
    }

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div className="min-h-screen bg-background flex items-center justify-center p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader className="text-center">
                            <div className="flex justify-center mb-4">
                                <AlertTriangle className="h-12 w-12 text-destructive" />
                            </div>
                            <CardTitle className="text-destructive">Something went wrong</CardTitle>
                            <CardDescription>
                                An unexpected error occurred. Don&apos;t worry, your data is safe.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <div className="p-3 bg-muted rounded-lg">
                                    <p className="text-sm font-mono text-muted-foreground">
                                        {this.state.error.message}
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-col gap-2">
                                <Button onClick={this.handleReset} className="w-full">
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Try Again
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={this.handleReload}
                                    className="w-full"
                                >
                                    Reload Page
                                </Button>
                            </div>

                            <div className="text-center">
                                <p className="text-sm text-muted-foreground">
                                    If this problem persists, please{' '}
                                    <a
                                        href="mailto:support@example.com"
                                        className="text-primary hover:underline"
                                    >
                                        contact support
                                    </a>
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )
        }

        return this.props.children
    }
}

// Hook version for functional components
export function useErrorHandler() {
    return (error: Error, errorInfo?: ErrorInfo) => {
        console.error('Error caught by useErrorHandler:', error, errorInfo)
        // Could integrate with toast system here
        throw error // Re-throw to be caught by ErrorBoundary
    }
}