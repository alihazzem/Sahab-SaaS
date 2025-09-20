import { useAuth } from '@clerk/nextjs'

export function useApiClient() {
    const { getToken } = useAuth()

    const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
        try {
            // Get the session token from Clerk
            const token = await getToken()

            if (!token) {
                throw new Error('Authentication required')
            }

            // Add the Authorization header
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers,
            }

            const response = await fetch(url, {
                ...options,
                headers,
            })

            // Handle authentication errors
            if (response.status === 401) {
                throw new Error('Authentication expired. Please refresh the page.')
            }

            return response
        } catch (error) {
            console.error('API request failed:', error)
            throw error
        }
    }

    return { authenticatedFetch }
}

/**
 * Simple authenticated API client (non-hook version)
 * Use this for non-React contexts or when you already have the token
 */
export const createAuthenticatedClient = (token: string) => {
    const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers,
        }

        const response = await fetch(url, {
            ...options,
            headers,
        })

        if (response.status === 401) {
            throw new Error('Authentication expired. Please refresh the page.')
        }

        return response
    }

    return { authenticatedFetch }
}