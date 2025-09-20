"use client"

import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X } from 'lucide-react'

interface EmbeddedCheckoutProps {
    paymentToken: string
    planName: string
    planPrice: number
    onClose: () => void
    onSuccess?: () => void
    onError?: (error: string) => void
}

export function EmbeddedCheckout({
    paymentToken,
    planName,
    planPrice,
    onClose,
    onSuccess,
    onError
}: EmbeddedCheckoutProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null)

    useEffect(() => {
        // Listen for payment completion messages
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== 'https://accept.paymobsolutions.com') return

            const data = event.data
            if (data.type === 'payment_success') {
                onSuccess?.()
            } else if (data.type === 'payment_error') {
                onError?.(data.error || 'Payment failed')
            }
        }

        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [onSuccess, onError])

    const iframeUrl = `https://accept.paymobsolutions.com/api/acceptance/iframes/${process.env.NEXT_PUBLIC_PAYMOB_IFRAME_ID}?payment_token=${paymentToken}&primary_color=1f2937&language=en`

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] bg-background">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Complete Payment</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {planName} Plan - {planPrice} EGP
                        </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <iframe
                        ref={iframeRef}
                        src={iframeUrl}
                        className="w-full h-[600px] border-0 rounded-lg"
                        title="Payment Checkout"
                        allow="payment"
                        sandbox="allow-scripts allow-same-origin allow-forms"
                    />
                </CardContent>
            </Card>
        </div>
    )
}