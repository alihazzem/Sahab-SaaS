/**
 * Format bytes to human-readable format (MB, GB, TB)
 * @param bytes - Storage size in bytes
 */
export const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 MB'
    const k = 1024
    const sizes = ['MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

/**
 * Format storage limit from megabytes to human-readable format
 * Handles common plan values that should display as exact GB
 * @param megabytes - Storage limit in megabytes
 */
export const formatStorageLimit = (megabytes: number): string => {
    if (megabytes === 0) return '0 MB'
    if (megabytes < 1024) return `${megabytes} MB`

    // Handle common plan values that should display as exact GB
    if (megabytes === 10000) return '10 GB'  // Pro plan
    if (megabytes === 100000) return '100 GB' // Enterprise plan

    const gb = megabytes / 1024
    return `${Math.round(gb)} GB`
}

/**
 * Format storage remaining with special handling for plan limits
 * Shows exact GB values when storage is virtually unused
 * @param remainingMB - Storage remaining in megabytes
 * @param planLimitMB - Plan storage limit in megabytes
 */
export const formatStorageRemaining = (remainingMB: number, planLimitMB: number): string => {
    // For Pro plan (10GB = 10,000MB), if remaining is close to the full limit, show as exact GB
    if (planLimitMB === 10000) {
        // If remaining is more than 99% of the plan limit, show full amount
        if (remainingMB >= 9900) return '10 GB'
    }

    // For Enterprise plan (100GB = 100,000MB)
    if (planLimitMB === 100000) {
        // If remaining is more than 99% of the plan limit, show full amount
        if (remainingMB >= 99000) return '100 GB'
    }

    // Convert MB to bytes for formatBytes function
    const remainingBytes = remainingMB * 1024 * 1024
    return formatBytes(remainingBytes)
}

/**
 * Calculate usage percentage with bounds checking
 * @param used - Amount used
 * @param limit - Total limit
 */
export const getUsagePercentage = (used: number, limit: number): number => {
    return limit > 0 ? Math.min((used / limit) * 100, 100) : 0
}

/**
 * Format storage display from megabytes with precise formatting
 * Used for storage values that are already in MB (from database)
 * @param megabytes - Storage amount in megabytes
 */
export const formatStorageDisplay = (megabytes: number): string => {
    if (megabytes === 0) return '0 MB'
    if (megabytes < 1024) {
        return megabytes === Math.floor(megabytes) ?
            `${megabytes} MB` :
            `${megabytes.toFixed(1)} MB`
    }

    const gb = megabytes / 1024

    // Handle common plan values that should display as exact GB
    if (megabytes === 10000) return '10 GB'  // Pro plan
    if (megabytes === 100000) return '100 GB' // Enterprise plan

    // For values very close to exact GB (within 1% of common plan sizes)
    if (Math.abs(megabytes - 10000) < 100) return '10 GB'  // Pro plan usage close to limit
    if (Math.abs(megabytes - 100000) < 1000) return '100 GB' // Enterprise plan usage close to limit

    return gb === Math.floor(gb) ?
        `${gb} GB` :
        `${gb.toFixed(2)} GB`
}