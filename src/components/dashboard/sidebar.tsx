'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    CreditCard,
    Users,
    Menu,
    X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/app/(app)/layout'

const navigation = [
    {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        name: 'Subscriptions',
        href: '/subscription',
        icon: CreditCard,
    },
    {
        name: 'Admin Dashboard',
        href: '/admin',
        icon: Users,
    }
]

interface SidebarProps {
    className?: string
}

export function Sidebar({ className }: SidebarProps) {
    const { isOpen, toggle, close, isCollapsed } = useSidebar()
    const pathname = usePathname()

    return (
        <>
            {/* Mobile menu button */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={toggle}
                    className="bg-background/95 backdrop-blur"
                >
                    {isOpen ? (
                        <X className="h-4 w-4" />
                    ) : (
                        <Menu className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Mobile backdrop */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
                    onClick={close}
                />
            )}

            {/* Sidebar */}
            <div
                className={cn(
                    "fixed inset-y-0 left-0 z-50 bg-card border-r border-border transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
                    // Mobile behavior
                    isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
                    // Large screen behavior - use isCollapsed state
                    isCollapsed ? "lg:w-16" : "lg:w-64",
                    // Mobile always full width
                    "w-64",
                    className
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className={cn(
                        "flex items-center h-16 px-6 border-b border-border",
                        "lg:justify-center", // Center on desktop
                        "justify-between" // Space between on mobile (logo left, button right)
                    )}>
                        <div className="flex items-center justify-center transition-all duration-300">
                            <div className={cn(
                                "rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden transition-all duration-300",
                                // Use isCollapsed state instead of hover
                                isCollapsed ? "w-8 h-8" : "w-12 h-12"
                            )}>
                                <Image
                                    src="/logo.png"
                                    alt="Sahab Logo"
                                    width={isCollapsed ? 32 : 48}
                                    height={isCollapsed ? 32 : 48}
                                    className="object-contain transition-all duration-300"
                                />
                            </div>
                        </div>

                        {/* Close button for mobile */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={close}
                            className="lg:hidden"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Navigation */}
                    <nav className={cn(
                        "flex-1 py-6 space-y-2 px-2",
                    )}>
                        {navigation.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={close}
                                    className={cn(
                                        "flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-300",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground hover:bg-accent",
                                        isCollapsed && "lg:justify-center lg:space-x-0",
                                    )}
                                    title={isCollapsed ? item.name : undefined}
                                >
                                    <item.icon className="h-5 w-5 flex-shrink-0" />
                                    {/* Show text when not collapsed or on mobile */}
                                    {(!isCollapsed || isOpen) && (
                                        <div className="flex-1 min-w-0">
                                            <div className="truncate">{item.name}</div>
                                        </div>
                                    )}
                                </Link>
                            )
                        })}
                    </nav>
                </div>
            </div>
        </>
    )
}