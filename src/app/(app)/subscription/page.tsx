"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from 'next/navigation'
import { useApiClient } from "@/lib/api-client"
import { formatStorageDisplay, formatStorageLimit, formatStorageRemaining, getUsagePercentage } from "@/utils/storage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/toast"
import { TestPaymentControls } from "@/components/ui/test-payment-controls"
import {
    Crown,
    Calendar,
    TrendingUp,
    CreditCard,
    CheckCircle,
    AlertTriangle,
    ArrowRight,
    Download,
    HandCoins,
    Home,
    ChevronRight,
    BarChart3,
    Settings
} from "lucide-react"

interface Plan {
    id: string
    name: string
    price: number
    priceEGP: number
    storageLimit: number
    maxUploadSize: number
    transformationsLimit: number
    teamMembers: number
    supportLevel: string
}

interface Usage {
    storageUsed: number
    transformationsUsed: number
    uploadsCount: number
    storageRemaining: number
    transformationsRemaining: number
}

interface Subscription {
    plan: Plan
    status: string
    startDate: string
    endDate: string
    usage: Usage
}

interface Payment {
    id: string
    amount: number
    currency: string
    status: string
    planName: string
    createdAt: string
    providerTxnId: string
}

export default function SubscriptionPage() {
    const router = useRouter()
    const { success, error: showError } = useToast()
    const { authenticatedFetch } = useApiClient()
    const [subscription, setSubscription] = useState<Subscription | null>(null)
    const [payments, setPayments] = useState<Payment[]>([])
    const [plans, setPlans] = useState<Plan[]>([])
    const [loading, setLoading] = useState(true)
    const [upgrading, setUpgrading] = useState<string | null>(null)

    const fetchSubscriptionData = useCallback(async () => {
        try {
            const response = await authenticatedFetch('/api/subscription/status')
            const data = await response.json()
            if (data.success) {
                setSubscription(data.subscription)
            }
        } catch (error) {
            console.error('Error fetching subscription:', error)
            showError("Error", 'Failed to fetch subscription data. Please refresh the page.')
        }
    }, [authenticatedFetch, showError])

    const fetchPlans = useCallback(async () => {
        try {
            const response = await fetch('/api/plans') // Public endpoint, no auth needed
            const data = await response.json()
            if (data.success) {
                setPlans(data.plans)
            }
        } catch (error) {
            console.error('Error fetching plans:', error)
        }
    }, [])

    const fetchPaymentHistory = useCallback(async () => {
        try {
            const response = await authenticatedFetch('/api/payment/history')
            const data = await response.json()
            if (data.success) {
                setPayments(data.payments)
            }
        } catch (error) {
            console.error('Error fetching payment history:', error)
            showError("Error", 'Failed to fetch payment history. Please refresh the page.')
        } finally {
            setLoading(false)
        }
    }, [authenticatedFetch, showError])

    useEffect(() => {
        fetchSubscriptionData()
        fetchPlans()
        fetchPaymentHistory()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Empty dependency array - functions are stable due to useCallback

    const handleUpgrade = async (planId: string) => {
        setUpgrading(planId)
        try {
            const response = await authenticatedFetch('/api/payment/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId })
            })

            const data = await response.json()

            if (data.success && data.data?.paymentUrl) {
                // Redirect to Paymob payment page
                success("Redirecting to payment page", "Please complete your payment to upgrade your plan")
                window.location.href = data.data.paymentUrl
            } else {
                console.error('Payment response error:', data)
                showError("Payment Failed", data.error || 'Payment initiation failed. Please try again.')
            }
        } catch (error) {
            console.error('Error initiating payment:', error)
            showError("Payment Error", 'An error occurred. Please try again.')
        } finally {
            setUpgrading(null)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 bg-muted rounded w-1/4"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-64 bg-muted rounded-lg"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
            {/* Header Section */}
            <div className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 py-4 sm:py-6">
                    {/* Top Header with Breadcrumb */}
                    <div className="flex items-center justify-start mb-4">
                        {/* Breadcrumb */}
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <HandCoins className="h-4 w-4" />
                            <ChevronRight className="h-4 w-4" />
                            <span className="text-foreground font-medium">Subscription</span>
                        </div>
                    </div>

                    {/* Main Header */}
                    <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0 gap-4 lg:gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                    Subscription Management
                                </h1>
                                <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
                            </div>
                            <p className="text-muted-foreground text-base sm:text-lg">
                                Manage your plan, monitor usage, and view billing history
                            </p>

                            {/* Quick Stats */}
                            {!loading && subscription && (
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pt-2">
                                    <div className="flex items-center gap-2">
                                        <Crown className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">
                                            {subscription.plan.name} Plan
                                        </span>
                                        <Badge variant={subscription.plan.name === 'Free' ? 'secondary' : 'default'} className="text-xs">
                                            {subscription.plan.name === 'Free' ? 'Starter' : 'Pro'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">
                                            Status: {subscription.status}
                                        </span>
                                        <Badge variant={subscription.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs">
                                            {subscription.status || 'Free'}
                                        </Badge>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                            <Button
                                onClick={() => router.push('/dashboard')}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer w-full sm:w-auto"
                            >
                                <Home className="h-4 w-4 mr-2" />
                                Back to Dashboard
                            </Button>
                            <Button
                                onClick={() => window.location.reload()}
                                variant="outline"
                                className="border-border hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer w-full sm:w-auto"
                            >
                                <ArrowRight className="h-4 w-4 mr-2" />
                                Refresh Data
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-6 sm:py-8">
                <div className="space-y-6 sm:space-y-8">

                    {/* Current Plan Overview */}
                    {subscription && (
                        <Card className="border-2 border-primary/20">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Crown className="w-6 h-6 text-primary" />
                                        <div>
                                            <CardTitle className="text-xl">Current Plan: {subscription.plan.name}</CardTitle>
                                            <CardDescription>
                                                {subscription.plan.priceEGP > 0
                                                    ? `${subscription.plan.priceEGP} EGP/month`
                                                    : 'Free forever'
                                                }
                                            </CardDescription>
                                        </div>
                                    </div>
                                    {subscription.status === 'ACTIVE' && subscription.plan.name !== 'Free' && (
                                        <div className="text-right text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                Renews: {formatDate(subscription.endDate)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Usage Analytics */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Storage Usage */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Storage</span>
                                            <span className="text-sm text-muted-foreground">
                                                {formatStorageDisplay(subscription.usage.storageUsed)} / {formatStorageLimit(subscription.plan.storageLimit)}
                                            </span>
                                        </div>
                                        <Progress
                                            value={getUsagePercentage(subscription.usage.storageUsed, subscription.plan.storageLimit)}
                                            className="h-2"
                                        />
                                        <div className="text-xs text-muted-foreground">
                                            {formatStorageRemaining(subscription.usage.storageRemaining, subscription.plan.storageLimit)} remaining
                                        </div>
                                    </div>

                                    {/* Transformations Usage */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Transformations</span>
                                            <span className="text-sm text-muted-foreground">
                                                {subscription.usage.transformationsUsed.toLocaleString()} / {subscription.plan.transformationsLimit.toLocaleString()}
                                            </span>
                                        </div>
                                        <Progress
                                            value={getUsagePercentage(subscription.usage.transformationsUsed, subscription.plan.transformationsLimit)}
                                            className="h-2"
                                        />
                                        <div className="text-xs text-muted-foreground">
                                            {subscription.usage.transformationsRemaining.toLocaleString()} remaining
                                        </div>
                                    </div>

                                    {/* Uploads This Month */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Uploads This Month</span>
                                            <span className="text-sm text-muted-foreground">
                                                {subscription.usage.uploadsCount}
                                            </span>
                                        </div>
                                        <Progress
                                            value={Math.min((subscription.usage.uploadsCount / 100) * 100, 100)}
                                            className="h-2"
                                        />
                                        <div className="text-xs text-muted-foreground">
                                            Total uploads
                                        </div>
                                    </div>
                                </div>

                                {/* Plan Features */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                                    <div className="text-center">
                                        <div className="text-lg font-semibold">{formatStorageLimit(subscription.plan.maxUploadSize)}</div>
                                        <div className="text-xs text-muted-foreground">Max Upload Size</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-lg font-semibold">
                                            {subscription.plan.teamMembers === -1 ? '∞' : subscription.plan.teamMembers}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Team Members</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-lg font-semibold capitalize">{subscription.plan.supportLevel}</div>
                                        <div className="text-xs text-muted-foreground">Support Level</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-lg font-semibold">
                                            {subscription.plan.transformationsLimit.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Monthly Transforms</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Plan Comparison */}
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Available Plans</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {plans.map((plan) => {
                                const isCurrentPlan = subscription?.plan.id === plan.id
                                const isHigherTier = subscription && plan.price > subscription.plan.price

                                return (
                                    <Card key={plan.id} className={`relative ${isCurrentPlan ? 'border-primary ring-2 ring-primary/20' : ''}`}>
                                        {plan.name === 'Pro' && (
                                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                                <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                                            </div>
                                        )}

                                        <CardHeader className="text-center">
                                            <CardTitle className="text-xl">{plan.name}</CardTitle>
                                            <div className="text-3xl font-bold">
                                                {plan.priceEGP === 0 ? '0 EGP' : `${plan.priceEGP} EGP`}
                                                <span className="text-sm text-muted-foreground">/month</span>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="space-y-4">
                                            <ul className="space-y-2 text-sm">
                                                <li className="flex items-center gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                    {formatStorageLimit(plan.storageLimit)} Storage
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                    {formatStorageLimit(plan.maxUploadSize)} Max Upload
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                    {plan.transformationsLimit.toLocaleString()} Transformations/month
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                    {plan.teamMembers === -1 ? 'Unlimited' : plan.teamMembers} Team Members
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                    {plan.supportLevel} Support
                                                </li>
                                            </ul>

                                            <div className="pt-4">
                                                {isCurrentPlan ? (
                                                    <Button disabled className="w-full">
                                                        Current Plan
                                                    </Button>
                                                ) : isHigherTier ? (
                                                    <Button
                                                        className="w-full cursor-pointer"
                                                        onClick={() => handleUpgrade(plan.id)}
                                                        disabled={upgrading === plan.id}
                                                    >
                                                        {upgrading === plan.id ? 'Processing...' : (
                                                            <>
                                                                Upgrade to {plan.name}
                                                                <ArrowRight className="w-4 h-4 ml-2" />
                                                            </>
                                                        )}
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        className="w-full cursor-pointer"
                                                        onClick={() => handleUpgrade(plan.id)}
                                                        disabled={upgrading === plan.id}
                                                    >
                                                        {upgrading === plan.id ? 'Processing...' : `Switch to ${plan.name}`}
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    </div>

                    {/* Payment History */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="w-5 h-5" />
                                Payment History
                            </CardTitle>
                            <CardDescription>
                                View your past transactions and download receipts
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Test Payment Controls - Only show when Paymob is in test mode */}
                            {process.env.NEXT_PUBLIC_PAYMOB_MODE !== 'production' && payments.some(p => p.status === 'PENDING') && (
                                <div className="mb-6 p-4 border-2 border-dashed border-blue-200 rounded-lg bg-blue-50/50">
                                    <h3 className="text-sm font-medium text-blue-900 mb-3">Test Mode Tools</h3>
                                    <TestPaymentControls
                                        payments={payments}
                                        onPaymentUpdated={() => {
                                            fetchPaymentHistory()
                                            fetchSubscriptionData()
                                        }}
                                    />
                                </div>
                            )}

                            {payments.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>No payment history found</p>
                                    <p className="text-sm">Your payments will appear here once you subscribe to a plan</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {payments.map((payment) => (
                                        <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-3 h-3 rounded-full ${payment.status === 'SUCCESS' ? 'bg-green-500' :
                                                    payment.status === 'PENDING' ? 'bg-yellow-500' : 'bg-red-500'
                                                    }`} />
                                                <div>
                                                    <div className="font-medium">{payment.planName} Plan</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {formatDate(payment.createdAt)} • {payment.amount / 100} {payment.currency}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={
                                                    payment.status === 'SUCCESS' ? 'default' :
                                                        payment.status === 'PENDING' ? 'secondary' : 'destructive'
                                                }>
                                                    {payment.status}
                                                </Badge>
                                                {payment.status === 'SUCCESS' && (
                                                    <Button size="sm" variant="outline">
                                                        <Download className="w-4 h-4 mr-2" />
                                                        Receipt
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Usage Alerts - Only show for Free plan */}
                    {subscription && subscription.plan.name === 'Free' && (
                        <Card className="border-yellow-200 bg-yellow-50/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-yellow-800">
                                    <AlertTriangle className="w-5 h-5" />
                                    Usage Alerts
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    {getUsagePercentage(subscription.usage.storageUsed, subscription.plan.storageLimit) >= 90 && (
                                        <div className="flex items-center gap-2 text-yellow-800">
                                            <AlertTriangle className="w-4 h-4" />
                                            Storage usage is at {Math.round(getUsagePercentage(subscription.usage.storageUsed, subscription.plan.storageLimit))}%. Consider upgrading your plan.
                                        </div>
                                    )}
                                    {getUsagePercentage(subscription.usage.transformationsUsed, subscription.plan.transformationsLimit) >= 90 && (
                                        <div className="flex items-center gap-2 text-yellow-800">
                                            <AlertTriangle className="w-4 h-4" />
                                            Transformation usage is at {Math.round(getUsagePercentage(subscription.usage.transformationsUsed, subscription.plan.transformationsLimit))}%. Consider upgrading your plan.
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-yellow-800">
                                        <TrendingUp className="w-4 h-4" />
                                        Upgrade to Pro for 20x more storage and transformations!
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}