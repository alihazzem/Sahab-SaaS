import CryptoJS from 'crypto-js';

// Additional type definitions for Paymob API
export interface PaymobMerchant {
    id: number;
    created_at: string;
    phones: string[];
    company_emails: string[];
    company_name: string;
    state: string;
    country: string;
    city: string;
    postal_code: string;
    street: string;
}

export interface PaymobOrderItem {
    name: string;
    amount_cents: number;
    description: string;
    quantity: number;
}

export interface PaymobSourceData {
    pan: string;
    type: string;
    tenure: string | null;
    sub_type: string;
}

// Paymob API Types
export interface PaymobAuthResponse {
    token: string;
}

export interface PaymobOrderRequest {
    amount_cents: number; // Amount in piastres (EGP * 100)
    currency: string; // "EGP"
    items: Array<{
        name: string;
        amount_cents: number;
        description: string;
        quantity: number;
    }>;
}

export interface PaymobOrderResponse {
    id: number;
    created_at: string;
    delivery_needed: boolean;
    merchant: PaymobMerchant;
    collector: null | Record<string, unknown>;
    amount_cents: number;
    shipping_data: null | Record<string, unknown>;
    currency: string;
    is_payment_locked: boolean;
    is_return: boolean;
    is_cancel: boolean;
    is_returned: boolean;
    is_canceled: boolean;
    merchant_order_id: string | null;
    wallet_notification: null | Record<string, unknown>;
    paid_amount_cents: number;
    notify_user_with_email: boolean;
    items: PaymobOrderItem[];
    order_url: string;
    commission_fees: number;
    delivery_fees_cents: number;
    delivery_vat_cents: number;
    payment_method: string;
    merchant_staff_tag: string | null;
    api_source: string;
    data: Record<string, unknown>;
}

export interface PaymobPaymentKeyRequest {
    amount_cents: number;
    currency: string;
    order_id: number;
    billing_data: {
        apartment: string;
        email: string;
        floor: string;
        first_name: string;
        street: string;
        building: string;
        phone_number: string;
        shipping_method: string;
        postal_code: string;
        city: string;
        country: string;
        last_name: string;
        state: string;
    };
    integration_id: number;
    lock_order_when_paid: boolean;
}

export interface PaymobPaymentKeyResponse {
    token: string;
}

export interface PaymobWebhookData {
    amount_cents: number;
    created_at: string;
    currency: string;
    error_occured: boolean;
    has_parent_transaction: boolean;
    id: number;
    integration_id: number;
    is_3d_secure: boolean;
    is_auth: boolean;
    is_capture: boolean;
    is_refunded: boolean;
    is_standalone_payment: boolean;
    is_voided: boolean;
    order: {
        id: number;
        created_at: string;
        delivery_needed: boolean;
        merchant: PaymobMerchant;
        collector: null | Record<string, unknown>;
        amount_cents: number;
        shipping_data: null | Record<string, unknown>;
        currency: string;
        is_payment_locked: boolean;
        is_return: boolean;
        is_cancel: boolean;
        is_returned: boolean;
        is_canceled: boolean;
        merchant_order_id: string | null;
        wallet_notification: null | Record<string, unknown>;
        paid_amount_cents: number;
        notify_user_with_email: boolean;
        items: PaymobOrderItem[];
        order_url: string;
        commission_fees: number;
        delivery_fees_cents: number;
        delivery_vat_cents: number;
        payment_method: string;
        merchant_staff_tag: string | null;
        api_source: string;
        data: Record<string, unknown>;
    };
    owner: number;
    pending: boolean;
    source_data: PaymobSourceData;
    success: boolean;
    terminal_id: string | null;
    transaction_processed_callback_responses: Record<string, unknown>[];
    type: string;
    updated_at: string;
    hmac: string;
}

// Environment variables validation
export const paymobConfig = {
    apiKey: process.env.PAYMOB_API_KEY!,
    integrationId: parseInt(process.env.PAYMOB_INTEGRATION_ID!),
    iframeId: parseInt(process.env.PAYMOB_IFRAME_ID!),
    hmacSecret: process.env.PAYMOB_HMAC_SECRET!,
    baseUrl: process.env.PAYMOB_BASE_URL || 'https://accept.paymobsolutions.com/api',
    currency: 'EGP',
    webhookUrl: process.env.NEXT_PUBLIC_APP_URL + '/api/payment/webhook',
};

// Validate Paymob configuration
export function validatePaymobConfig(): void {
    const requiredEnvVars = [
        'PAYMOB_API_KEY',
        'PAYMOB_INTEGRATION_ID',
        'PAYMOB_IFRAME_ID',
        'PAYMOB_HMAC_SECRET'
    ];

    const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);

    if (missing.length > 0) {
        throw new Error(`Missing required Paymob environment variables: ${missing.join(', ')}`);
    }
}

// Paymob API Client Class
export class PaymobClient {
    private authToken: string | null = null;
    private tokenExpiry: Date | null = null;

    constructor() {
        validatePaymobConfig();
    }

    // Authenticate with Paymob API
    async authenticate(): Promise<string> {
        // Check if we have a valid token
        if (this.authToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
            return this.authToken;
        }

        try {
            const response = await fetch(`${paymobConfig.baseUrl}/auth/tokens`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    api_key: paymobConfig.apiKey,
                }),
            });

            if (!response.ok) {
                throw new Error(`Paymob auth failed: ${response.status} ${response.statusText}`);
            }

            const data: PaymobAuthResponse = await response.json();
            this.authToken = data.token;
            this.tokenExpiry = new Date(Date.now() + 50 * 60 * 1000);

            return this.authToken;
        } catch (error) {
            console.error('Paymob authentication error:', error);
            throw new Error('Failed to authenticate with Paymob');
        }
    }

    // Create an order in Paymob
    async createOrder(orderData: PaymobOrderRequest): Promise<PaymobOrderResponse> {
        const authToken = await this.authenticate();

        try {
            const response = await fetch(`${paymobConfig.baseUrl}/ecommerce/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    auth_token: authToken,
                    delivery_needed: false,
                    ...orderData,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Paymob order creation failed: ${response.status} ${errorText}`);
            }

            const order: PaymobOrderResponse = await response.json();
            return order;
        } catch (error) {
            console.error('Paymob order creation error:', error);
            throw new Error('Failed to create order in Paymob');
        }
    }

    // Generate payment key for checkout
    async createPaymentKey(paymentData: PaymobPaymentKeyRequest): Promise<string> {
        const authToken = await this.authenticate();

        try {
            const response = await fetch(`${paymobConfig.baseUrl}/acceptance/payment_keys`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    auth_token: authToken,
                    ...paymentData,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Paymob payment key creation failed: ${response.status} ${errorText}`);
            }

            const data: PaymobPaymentKeyResponse = await response.json();
            return data.token;
        } catch (error) {
            console.error('Paymob payment key creation error:', error);
            throw new Error('Failed to create payment key in Paymob');
        }
    }

    // Generate payment URL for iframe with customization options
    generatePaymentUrl(paymentToken: string, customization?: {
        primaryColor?: string;
        hideAmount?: boolean;
        hideCurrency?: boolean;
        language?: 'en' | 'ar';
        redirectUrl?: string;
    }): string {
        let url = `https://accept.paymobsolutions.com/api/acceptance/iframes/${paymobConfig.iframeId}?payment_token=${paymentToken}`;

        if (customization) {
            const params = new URLSearchParams();

            if (customization.primaryColor) {
                params.append('primary_color', customization.primaryColor.replace('#', ''));
            }
            if (customization.hideAmount) {
                params.append('hide_amount', 'true');
            }
            if (customization.hideCurrency) {
                params.append('hide_currency', 'true');
            }
            if (customization.language) {
                params.append('language', customization.language);
            }
            if (customization.redirectUrl) {
                params.append('redirect_url', customization.redirectUrl);
            }

            if (params.toString()) {
                url += '&' + params.toString();
            }
        }

        return url;
    }

    // Verify webhook HMAC signature
    verifyWebhookSignature(requestBody: string, providedHmac: string): boolean {
        const calculatedHmac = CryptoJS.HmacSHA512(requestBody, paymobConfig.hmacSecret).toString();
        return calculatedHmac === providedHmac;
    }

    // Process webhook data for our application
    processWebhookData(webhookData: PaymobWebhookData) {
        return {
            transactionId: webhookData.id,
            orderId: webhookData.order.id,
            merchantOrderId: webhookData.order.merchant_order_id,
            amountCents: webhookData.amount_cents,
            amountEGP: webhookData.amount_cents / 100,
            currency: webhookData.currency,
            success: webhookData.success && !webhookData.error_occured,
            pending: webhookData.pending,
            integrationId: webhookData.integration_id,
            createdAt: new Date(webhookData.created_at),
            updatedAt: new Date(webhookData.updated_at),
        };
    }
}

// Utility functions for subscription payments

export class PaymobSubscriptionHelper {
    private client: PaymobClient;

    constructor() {
        this.client = new PaymobClient();
    }

    // Create a subscription payment session
    async createSubscriptionPayment(
        planId: string,
        planName: string,
        amountEGP: number,
        userEmail: string,
        userFirstName: string,
        userLastName: string,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _userId: string
    ) {
        const amountCents = Math.round(amountEGP * 100);

        // Create order
        const order = await this.client.createOrder({
            amount_cents: amountCents,
            currency: paymobConfig.currency,
            items: [
                {
                    name: `${planName} Subscription - Sahab SaaS`,
                    amount_cents: amountCents,
                    description: `Monthly subscription to ${planName} plan`,
                    quantity: 1,
                },
            ],
        });

        // Create payment key
        const paymentToken = await this.client.createPaymentKey({
            amount_cents: amountCents,
            currency: paymobConfig.currency,
            order_id: order.id,
            billing_data: {
                apartment: 'NA',
                email: userEmail,
                floor: 'NA',
                first_name: userFirstName,
                street: 'NA',
                building: 'NA',
                phone_number: 'NA',
                shipping_method: 'NA',
                postal_code: 'NA',
                city: 'Cairo',
                country: 'Egypt',
                last_name: userLastName,
                state: 'Cairo',
            },
            integration_id: paymobConfig.integrationId,
            lock_order_when_paid: true,
        });

        // Generate standard payment URL
        const paymentUrl = this.client.generatePaymentUrl(paymentToken);

        return {
            orderId: order.id,
            paymentToken,
            paymentUrl,
            amountCents,
            amountEGP,
        };
    }
}

export const paymobClient = new PaymobClient();
export const paymobSubscriptionHelper = new PaymobSubscriptionHelper();