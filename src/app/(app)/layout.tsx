'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { LogoutButton } from '@/components/ui/logout-button'
import { Button } from '@/components/ui/button'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

// Create context for sidebar state
interface SidebarContextType {
    isOpen: boolean
    isCollapsed: boolean
    toggle: () => void
    toggleCollapse: () => void
    open: () => void
    close: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

// Hook to use sidebar context
export function useSidebar() {
    const context = useContext(SidebarContext)
    if (context === undefined) {
        throw new Error('useSidebar must be used within a SidebarProvider')
    }
    return context
}

// Provider component
function SidebarProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false) // Mobile menu state
    const [isCollapsed, setIsCollapsed] = useState(false) // Desktop collapse state

    // Load saved state from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('sidebar-collapsed')
            if (saved !== null) {
                setIsCollapsed(JSON.parse(saved))
            }
        } catch (error) {
            console.error('Error loading sidebar state:', error)
        }
    }, [])

    // Save state to localStorage
    useEffect(() => {
        try {
            localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed))
        } catch (error) {
            console.error('Error saving sidebar state:', error)
        }
    }, [isCollapsed])

    const toggle = () => setIsOpen(prev => !prev)
    const toggleCollapse = () => setIsCollapsed(prev => !prev)
    const open = () => setIsOpen(true)
    const close = () => setIsOpen(false)

    return (
        <SidebarContext.Provider value={{ isOpen, isCollapsed, toggle, toggleCollapse, open, close }}>
            {children}
        </SidebarContext.Provider>
    )
}

// Main layout content component
function AppLayoutContent({ children }: { children: ReactNode }) {
    const { toggleCollapse, isCollapsed } = useSidebar()

    return (
        <div className="min-h-screen bg-background">
            <div className="flex h-screen">
                {/* Sidebar */}
                <Sidebar />

                {/* Main content */}
                <div className="flex-1 flex flex-col lg:ml-0">
                    {/* Top bar */}
                    <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <div className="flex items-center justify-between h-full px-4 lg:px-6">
                            {/* Left side - Desktop sidebar toggle */}
                            <div className="flex items-center space-x-4">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={toggleCollapse}
                                    className="hidden lg:flex"
                                    title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                                >
                                    {isCollapsed ? (
                                        <PanelLeftOpen className="h-4 w-4" />
                                    ) : (
                                        <PanelLeftClose className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>

                            {/* Right side - Logout */}
                            <div className="flex items-center space-x-4">
                                <LogoutButton />
                            </div>
                        </div>
                    </header>

                    {/* Page content */}
                    <main className="flex-1 overflow-auto">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    )
}

interface LayoutProps {
    children: ReactNode
}

export default function AppLayout({ children }: LayoutProps) {
    return (
        <SidebarProvider>
            <AppLayoutContent>
                {children}
            </AppLayoutContent>
        </SidebarProvider>
    )
}