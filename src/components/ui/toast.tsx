"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ToastType, ToastContextType, Toast } from "@/types"

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

// Toast Provider
export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = React.useState<Toast[]>([])

    const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
        const id = Math.random().toString(36).substring(2, 9)
        const newToast = { ...toast, id }

        setToasts((prev) => [...prev, newToast])

        // Auto remove after duration
        const duration = toast.duration || 5000
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id))
        }, duration)
    }, [])

    const removeToast = React.useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, [])

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    )
}

// Toast Container
function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
            ))}
        </div>
    )
}

// Individual Toast Item
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
    const getToastStyles = (type: ToastType) => {
        switch (type) {
            case "success":
                return "bg-green-50 border-green-200 text-green-800 dark:bg-green-950/20 dark:border-green-800 dark:text-green-200"
            case "error":
                return "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-800 dark:text-red-200"
            case "warning":
                return "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950/20 dark:border-yellow-800 dark:text-yellow-200"
            case "info":
                return "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-200"
            default:
                return "bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-950/20 dark:border-gray-800 dark:text-gray-200"
        }
    }

    return (
        <div
            className={cn(
                "min-w-80 max-w-md p-4 rounded-lg border shadow-lg animate-in slide-in-from-right-full",
                getToastStyles(toast.type)
            )}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="font-medium">{toast.title}</div>
                    {toast.description && (
                        <div className="text-sm opacity-90 mt-1">{toast.description}</div>
                    )}
                </div>
                <button
                    onClick={onRemove}
                    className="ml-4 opacity-70 hover:opacity-100 transition-opacity"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}

// Hook to use toast
export function useToast() {
    const context = React.useContext(ToastContext)
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider")
    }

    const showToast = React.useCallback((type: ToastType, title: string, description?: string, duration?: number) => {
        context.addToast({ type, title, description, duration })
    }, [context])

    const success = React.useCallback((title: string, description?: string, duration?: number) =>
        showToast("success", title, description, duration), [showToast])
    
    const error = React.useCallback((title: string, description?: string, duration?: number) =>
        showToast("error", title, description, duration), [showToast])
    
    const warning = React.useCallback((title: string, description?: string, duration?: number) =>
        showToast("warning", title, description, duration), [showToast])
    
    const info = React.useCallback((title: string, description?: string, duration?: number) =>
        showToast("info", title, description, duration), [showToast])

    return React.useMemo(() => ({
        ...context,
        success,
        error,
        warning,
        info,
    }), [context, success, error, warning, info])
}