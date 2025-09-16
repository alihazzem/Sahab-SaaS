// Plan limits configuration
export const PLAN_LIMITS = {
    FREE: {
        storageLimit: 500, // MB
        maxUploadSize: 5, // MB
        transformationsLimit: 50,
    },
    PRO: {
        storageLimit: 10000, // 10GB in MB
        maxUploadSize: 100, // MB
        transformationsLimit: 5000,
    },
    ENTERPRISE: {
        storageLimit: 100000, // 100GB in MB
        maxUploadSize: 1000, // 1GB in MB
        transformationsLimit: 50000,
    },
} as const

export type PlanType = keyof typeof PLAN_LIMITS

export type PlanLimits = typeof PLAN_LIMITS[PlanType]