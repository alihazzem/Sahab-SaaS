import { NextResponse } from 'next/server'
import type { ApiResponse, ApiError } from '@/types'

// Standardized success response
export function createSuccessResponse<T>(data?: T, message?: string): NextResponse<ApiResponse<T>> {
    return NextResponse.json({
        success: true,
        data,
        message,
    })
}

// Standardized error response
export function createErrorResponse(
    error: string | ApiError,
    status: number = 500,
    code?: string
): NextResponse<ApiResponse> {
    const errorMessage = typeof error === 'string' ? error : error.message
    const errorCode = typeof error === 'string' ? code : error.code

    return NextResponse.json({
        success: false,
        error: errorMessage,
        code: errorCode,
    }, { status })
}

// Common error responses
export const ApiErrors = {
    UNAUTHORIZED: (message = "Unauthorized access") =>
        createErrorResponse({ message, code: "UNAUTHORIZED" }, 401),

    BAD_REQUEST: (message = "Bad request") =>
        createErrorResponse({ message, code: "BAD_REQUEST" }, 400),

    NOT_FOUND: (message = "Resource not found") =>
        createErrorResponse({ message, code: "NOT_FOUND" }, 404),

    FORBIDDEN: (message = "Access forbidden") =>
        createErrorResponse({ message, code: "FORBIDDEN" }, 403),

    VALIDATION_ERROR: (message = "Validation failed") =>
        createErrorResponse({ message, code: "VALIDATION_ERROR" }, 422),

    FILE_TOO_LARGE: (maxSize: string) =>
        createErrorResponse({
            message: `File too large. Maximum size allowed: ${maxSize}`,
            code: "FILE_TOO_LARGE"
        }, 413),

    INVALID_FILE_TYPE: (allowedTypes: string[]) =>
        createErrorResponse({
            message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
            code: "INVALID_FILE_TYPE"
        }, 400),

    QUOTA_EXCEEDED: (quotaType: string, current: number, limit: number) =>
        createErrorResponse({
            message: `${quotaType} quota exceeded. Used ${current} of ${limit}.`,
            code: "QUOTA_EXCEEDED"
        }, 429),

    INTERNAL_ERROR: (message = "Internal server error") =>
        createErrorResponse({ message, code: "INTERNAL_ERROR" }, 500),

    UPLOAD_FAILED: (reason?: string) =>
        createErrorResponse({
            message: `Upload failed${reason ? `: ${reason}` : ''}`,
            code: "UPLOAD_FAILED"
        }, 500),
}

// File validation helpers
export function validateFileSize(file: File, maxSizeMB: number): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    return file.size <= maxSizeBytes
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.some(type => file.type.startsWith(type))
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Error logging helper
export function logError(context: string, error: Error | unknown, userId?: string): void {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined

    console.error(`[${context}] Error${userId ? ` for user ${userId}` : ''}:`, {
        message: errorMessage,
        stack: errorStack,
        userId,
        timestamp: new Date().toISOString(),
    })
}