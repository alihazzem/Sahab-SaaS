// Checkout customization configuration for Paymob
export const checkoutCustomization = {
    // Brand Colors (convert OKLCH to hex for Paymob)
    colors: {
        primary: '#1f2937',       // Dark gray from your theme
        secondary: '#374151',     // Lighter gray
        accent: '#3b82f6',        // Blue accent
        success: '#059669',       // Green
        error: '#dc2626',         // Red
    },

    // Layout Options
    layout: {
        hideAmount: false,        // Show/hide amount display
        hideCurrency: false,      // Show/hide currency
        language: 'en' as const,  // 'en' or 'ar'
        direction: 'ltr' as const // 'ltr' or 'rtl'
    },

    // Redirect URLs
    redirects: {
        success: '/subscription?payment=success',
        failure: '/subscription?payment=failed',
        cancel: '/subscription?payment=cancelled'
    },

    // Custom CSS (if using embedded iframe)
    customCSS: `
        .payment-form {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #0f172a;
            color: #f8fafc;
        }
        
        .payment-button {
            background: #1f2937;
            border-radius: 8px;
            padding: 12px 24px;
            font-weight: 600;
        }
        
        .payment-input {
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 6px;
            color: #f8fafc;
        }
        
        .payment-input:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }
    `
};

// Helper function to get customized payment URL
export function getCustomizedPaymentUrl(paymentToken: string, options?: {
    theme?: 'light' | 'dark';
    language?: 'en' | 'ar';
    hideAmount?: boolean;
    redirectUrl?: string;
}) {
    const config = checkoutCustomization;
    const theme = options?.theme || 'dark';

    return {
        primaryColor: theme === 'dark' ? config.colors.primary : '#ffffff',
        language: options?.language || config.layout.language,
        hideAmount: options?.hideAmount || config.layout.hideAmount,
        redirectUrl: options?.redirectUrl ||
            `${process.env.NEXT_PUBLIC_APP_URL}${config.redirects.success}`
    };
}