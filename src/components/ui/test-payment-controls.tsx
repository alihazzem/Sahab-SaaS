"use client"

import { useState } from "react"
import { useApiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
import { CheckCircle, XCircle, Clock } from "lucide-react"

interface TestPaymentControlsProps {
    payments: Array<{
        id: string
        amount: number
        status: string
        planName: string
        createdAt: string
        providerTxnId: string
    }>
    onPaymentUpdated: () => void
}

export function TestPaymentControls({ payments, onPaymentUpdated }: TestPaymentControlsProps) {
    const { success: showSuccess, error: showError } = useToast()
    const { authenticatedFetch } = useApiClient()
    const [processing, setProcessing] = useState<string | null>(null)

    // Show test controls when Paymob is in test mode (regardless of NODE_ENV)
    const isTestMode = process.env.NEXT_PUBLIC_PAYMOB_MODE !== 'production'

    if (!isTestMode) {
        return null
    }

    const pendingPayments = payments.filter(p => p.status === 'PENDING')

    const completeTestPayment = async (orderId: string, isSuccess: boolean) => {
        setProcessing(orderId)
        try {
            const response = await authenticatedFetch('/api/payment/test-complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, success: isSuccess })
            })

            const data = await response.json()

            if (data.success) {
                if (isSuccess) {
                    showSuccess("Payment completed successfully!", "Subscription has been activated")
                } else {
                    showSuccess("Payment marked as failed", "Test payment failure simulated")
                }
                onPaymentUpdated()
            } else {
                showError("Test completion failed", data.error || 'Unknown error')
            }
        } catch (error) {
            console.error('Test payment error:', error)
            showError("Error", 'Failed to complete test payment. Please refresh the page.')
        } finally {
            setProcessing(null)
        }
    }

    if (pendingPayments.length === 0) {
        return null
    }

    return (
        <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                    <Clock className="w-5 h-5" />
                    Test Mode: Complete Pending Payments
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    You have pending test payments. In test mode, you can manually complete them:
                </p>

                {pendingPayments.map((payment) => (
                    <div key={payment.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h4 className="font-medium">{payment.planName} Plan</h4>
                                <p className="text-sm text-muted-foreground">
                                    {payment.amount / 100} EGP • Order: {payment.providerTxnId}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {new Date(payment.createdAt).toLocaleString()}
                                </p>
                            </div>
                            <Badge variant="secondary">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                            </Badge>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                onClick={() => completeTestPayment(payment.providerTxnId, true)}
                                disabled={processing === payment.providerTxnId}
                                className="bg-emerald-700/70 hover:bg-emerald-600/80 text-emerald-100 border border-emerald-600/30 hover:border-emerald-500/50 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                {processing === payment.providerTxnId ? 'Processing...' : 'Mark Success'}
                            </Button>

                            <Button
                                size="sm"
                                onClick={() => completeTestPayment(payment.providerTxnId, false)}
                                disabled={processing === payment.providerTxnId}
                                className="bg-rose-950/60 hover:bg-rose-900/70 text-rose-200 border border-rose-800/30 hover:border-rose-700/50 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <XCircle className="w-4 h-4 mr-1" />
                                {processing === payment.providerTxnId ? 'Processing...' : 'Mark Failed'}
                            </Button>
                        </div>
                    </div>
                ))}

                <div className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded">
                    <strong>Note:</strong> This is for testing only. In production, payments are automatically
                    processed via Paymob webhooks.
                </div>
            </CardContent>
        </Card>
    )
}