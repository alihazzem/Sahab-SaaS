export interface CloudinaryEagerResult {
    bytes?: number;
    url?: string;
    secure_url?: string;
    public_id?: string;
    format?: string;
    width?: number;
    height?: number;
    [key: string]: unknown;
}

export interface CloudinaryUploadResult {
    asset_id?: string;
    public_id: string;
    bytes?: number;
    secure_url?: string;
    format?: string;
    duration?: number;
    eager?: CloudinaryEagerResult[];
    [key: string]: unknown;
}

export interface CloudinaryEagerTransformation {
    width?: number;
    height?: number;
    crop?: "limit" | "scale" | "fit" | "fill";
    format?: string;
    quality?: string | number;
    [key: string]: string | number | undefined;
}

export interface UploadOptions {
    folder: string;
    resourceType?: "image" | "video" | "raw";
    eager?: CloudinaryEagerTransformation[];
    eager_async?: boolean;
}

export interface MediaItem {
    id: string
    type: 'video' | 'image'
    title: string
    url: string
    publicId: string
    createdAt: string
    originalSize: number
    width?: number
    height?: number
    duration?: number
}

export interface MediaLibraryProps {
    media: MediaItem[]
    onRefresh?: () => void
    onDelete?: (id: string) => void
}

export interface SubscriptionData {
    plan: {
        name: string
        storageLimit: number
        transformationsLimit: number
        priceEGP: number
    }
    usage: {
        storageUsed: number
        transformationsUsed: number
        uploadsCount: number
        storageRemaining: number
        transformationsRemaining: number
    }
}

export interface UsageAnalyticsProps {
    subscription: SubscriptionData | null
}

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: number
}

// Toast Types
export type ToastType = "success" | "error" | "warning" | "info"

export interface Toast {
    id: string
    type: ToastType
    title: string
    description?: string
    duration?: number
}

interface ToastContextType {
    toasts: Toast[]
    addToast: (toast: Omit<Toast, "id">) => void
    removeToast: (id: string) => void
}

// api error response types
export interface ApiResponse<T = unknown> {
    success: boolean
    data?: T
    error?: string
    message?: string
    code?: string
}

export interface ApiError {
    message: string
    code?: string
    details?: Record<string, unknown>
}


export type PlanType = 'FREE' | 'PRO' | 'ENTERPRISE'

export interface ClientUsageValidation {
    isValid: boolean
    error?: string
    warning?: string
}

export interface StorageInfo {
    current: number
    limit: number
    available: number
}

export interface PlanLimits {
    maxFileSize: number // in bytes
    storage: number // in bytes
}

// Enhanced Usage Analytics Types
export interface UsageStatus {
    used: number
    limit: number
    remaining: number
    percentage: number
    status: 'good' | 'moderate' | 'warning' | 'critical'
}

export interface HistoricalUsageData {
    month: number
    year: number
    monthName: string
    storageUsed: number
    transformationsUsed: number
    uploadsCount: number
}

export interface UsageGrowth {
    storage: number
    transformations: number
    uploads: number
}

export interface FileTypeBreakdown {
    type: string
    count: number
    size: number // in MB
    percentage: number
}

export interface DailyActivity {
    date: string
    uploads: number
    storage: number // in MB
}

export interface UsageAnalytics {
    historical: HistoricalUsageData[]
    growth: UsageGrowth
    fileTypes: FileTypeBreakdown[]
    dailyActivity: DailyActivity[]
    summary: {
        totalMonths: number
        totalStorageUsed: number
        totalTransformations: number
        totalUploads: number
        averageMonthlyStorage: number
        planLimits: {
            storage: number
            transformations: number
            planName: string
        } | null
    }
}

export interface CurrentUsage {
    current: {
        month: number
        year: number
        storage: UsageStatus
        transformations: UsageStatus
        uploads: {
            count: number
        }
    }
    plan: {
        id: string
        name: string
        price: number
        limits: {
            storage: number
            transformations: number
            maxUploadSize: number
            teamMembers: number
        }
    }
    subscription: {
        status: string
        startDate?: string
        endDate?: string
        isActive: boolean
    }
}