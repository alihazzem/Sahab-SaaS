"use client"

import { LogoutButton } from '@/components/ui/logout-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Upload, Video, ImageIcon, BarChart3 } from 'lucide-react'

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header with logout */}
            <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                            <Badge variant="secondary" className="bg-primary/10 text-primary">
                                Free Plan
                            </Badge>
                        </div>
                        <LogoutButton />
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="container mx-auto px-4 py-8">
                <div className="grid gap-6">
                    {/* Welcome section */}
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-foreground">Welcome back!</h2>
                        <p className="text-muted-foreground">
                            Manage your media files and track your usage from your dashboard.
                        </p>
                    </div>

                    {/* Stats cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
                                <Video className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">0</div>
                                <p className="text-xs text-muted-foreground">No videos uploaded yet</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Images</CardTitle>
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">0</div>
                                <p className="text-xs text-muted-foreground">No images uploaded yet</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">0 MB</div>
                                <p className="text-xs text-muted-foreground">of 1 GB available</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Transformations</CardTitle>
                                <Upload className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">0</div>
                                <p className="text-xs text-muted-foreground">of 1,000 available</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                            <CardDescription>
                                Get started by uploading your first media files
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="flex items-center space-x-4 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                                    <Video className="h-8 w-8 text-primary" />
                                    <div>
                                        <h3 className="font-medium">Upload Video</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Upload and process your video files
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-4 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                                    <ImageIcon className="h-8 w-8 text-primary" />
                                    <div>
                                        <h3 className="font-medium">Upload Image</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Upload and optimize your images
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Media library placeholder */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Media Library</CardTitle>
                            <CardDescription>
                                Your uploaded files will appear here
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2">No media files yet</h3>
                                <p className="text-muted-foreground mb-4">
                                    Start by uploading your first video or image
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}