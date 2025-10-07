"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts'
import {
    TrendingUp,
    BarChart3,
    PieChart as PieChartIcon,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Minus
} from 'lucide-react'
import { getChartColors, formatStorageUsage, formatGrowth, calculateGrowth } from '@/lib/analytics-utils'
import type { UsageAnalytics } from '@/types'

interface UsageChartsProps {
    data: UsageAnalytics
    className?: string
}

export function UsageCharts({ data, className }: UsageChartsProps) {
    const colors = getChartColors()

    // Format growth indicators
    const storageGrowth = formatGrowth(calculateGrowth(
        data.historical[data.historical.length - 1]?.storageUsed || 0,
        data.historical[data.historical.length - 2]?.storageUsed || 0
    ))

    const transformationGrowth = formatGrowth(calculateGrowth(
        data.historical[data.historical.length - 1]?.transformationsUsed || 0,
        data.historical[data.historical.length - 2]?.transformationsUsed || 0
    ))

    const uploadGrowth = formatGrowth(calculateGrowth(
        data.historical[data.historical.length - 1]?.uploadsCount || 0,
        data.historical[data.historical.length - 2]?.uploadsCount || 0
    ))

    // Custom tooltip for charts
    const CustomTooltip = ({ active, payload, label }: {
        active?: boolean
        payload?: Array<{
            color: string
            dataKey: string
            value: number
        }>
        label?: string
    }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                    <p className="font-medium text-sm mb-2">{label}</p>
                    {payload.map((entry, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="capitalize">{entry.dataKey}: </span>
                            <span className="font-medium">
                                {entry.dataKey.includes('storage') || entry.dataKey.includes('Storage')
                                    ? formatStorageUsage(entry.value)
                                    : entry.value?.toLocaleString()
                                }
                            </span>
                        </div>
                    ))}
                </div>
            )
        }
        return null
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Growth Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Storage Growth</p>
                                <p className="text-2xl font-bold">{storageGrowth.text}</p>
                            </div>
                            <div className={`p-2 rounded-lg ${storageGrowth.color.replace('text-', 'bg-').replace('-500', '-100')}`}>
                                {storageGrowth.icon === '↗' ? (
                                    <ArrowUpRight className={`h-5 w-5 ${storageGrowth.color}`} />
                                ) : storageGrowth.icon === '↘' ? (
                                    <ArrowDownRight className={`h-5 w-5 ${storageGrowth.color}`} />
                                ) : (
                                    <Minus className={`h-5 w-5 ${storageGrowth.color}`} />
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Transformation Growth</p>
                                <p className="text-2xl font-bold">{transformationGrowth.text}</p>
                            </div>
                            <div className={`p-2 rounded-lg ${transformationGrowth.color.replace('text-', 'bg-').replace('-500', '-100')}`}>
                                {transformationGrowth.icon === '↗' ? (
                                    <ArrowUpRight className={`h-5 w-5 ${transformationGrowth.color}`} />
                                ) : transformationGrowth.icon === '↘' ? (
                                    <ArrowDownRight className={`h-5 w-5 ${transformationGrowth.color}`} />
                                ) : (
                                    <Minus className={`h-5 w-5 ${transformationGrowth.color}`} />
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Upload Growth</p>
                                <p className="text-2xl font-bold">{uploadGrowth.text}</p>
                            </div>
                            <div className={`p-2 rounded-lg ${uploadGrowth.color.replace('text-', 'bg-').replace('-500', '-100')}`}>
                                {uploadGrowth.icon === '↗' ? (
                                    <ArrowUpRight className={`h-5 w-5 ${uploadGrowth.color}`} />
                                ) : uploadGrowth.icon === '↘' ? (
                                    <ArrowDownRight className={`h-5 w-5 ${uploadGrowth.color}`} />
                                ) : (
                                    <Minus className={`h-5 w-5 ${uploadGrowth.color}`} />
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Historical Trends Chart */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Usage Trends ({data.summary.totalMonths} months)
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                        Historical Data
                    </Badge>
                </CardHeader>
                <CardContent>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.historical} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                <XAxis
                                    dataKey="monthName"
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="storageUsed"
                                    stroke={colors.storage.primary}
                                    strokeWidth={2}
                                    name="Storage (MB)"
                                    dot={{ fill: colors.storage.primary, strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, stroke: colors.storage.primary, strokeWidth: 2 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="transformationsUsed"
                                    stroke={colors.transformations.primary}
                                    strokeWidth={2}
                                    name="Transformations"
                                    dot={{ fill: colors.transformations.primary, strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, stroke: colors.transformations.primary, strokeWidth: 2 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="uploadsCount"
                                    stroke={colors.uploads.primary}
                                    strokeWidth={2}
                                    name="Uploads"
                                    dot={{ fill: colors.uploads.primary, strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, stroke: colors.uploads.primary, strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* File Type Breakdown & Daily Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* File Type Breakdown */}
                {data.fileTypes.length > 0 && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                <PieChartIcon className="h-4 w-4" />
                                File Types (This Month)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.fileTypes.map(item => ({ ...item, name: item.type }))}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="count"
                                            label
                                        >
                                            {data.fileTypes.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={colors.gradient[index % colors.gradient.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value, name) => [
                                                `${value} files`,
                                                name === 'count' ? 'Files' : name
                                            ]}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-4 space-y-2">
                                {data.fileTypes.map((type, index) => (
                                    <div key={type.type} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: colors.gradient[index % colors.gradient.length] }}
                                            />
                                            <span className="capitalize font-medium">{type.type}</span>
                                        </div>
                                        <div className="text-right text-muted-foreground">
                                            <div>{type.count} files</div>
                                            <div className="text-xs">{formatStorageUsage(type.size)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Daily Activity */}
                {data.dailyActivity.length > 0 && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                <Activity className="h-4 w-4" />
                                Daily Activity (This Month)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.dailyActivity} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 10 }}
                                            tickLine={false}
                                            tickFormatter={(value) => new Date(value).getDate().toString()}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 12 }}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            content={<CustomTooltip />}
                                            labelFormatter={(value) => new Date(value).toLocaleDateString()}
                                        />
                                        <Bar
                                            dataKey="uploads"
                                            fill={colors.uploads.primary}
                                            name="Uploads"
                                            radius={[2, 2, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-4 text-center">
                                <p className="text-sm text-muted-foreground">
                                    Total: {data.dailyActivity.reduce((sum, day) => sum + day.uploads, 0)} uploads this month
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Usage Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Usage Summary
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                            <div className="text-2xl font-bold text-primary">
                                {formatStorageUsage(data.summary.totalStorageUsed)}
                            </div>
                            <p className="text-sm text-muted-foreground">Total Storage Used</p>
                        </div>
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                            <div className="text-2xl font-bold text-primary">
                                {data.summary.totalTransformations.toLocaleString()}
                            </div>
                            <p className="text-sm text-muted-foreground">Total Transformations</p>
                        </div>
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                            <div className="text-2xl font-bold text-primary">
                                {data.summary.totalUploads.toLocaleString()}
                            </div>
                            <p className="text-sm text-muted-foreground">Total Uploads</p>
                        </div>
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                            <div className="text-2xl font-bold text-primary">
                                {formatStorageUsage(data.summary.averageMonthlyStorage)}
                            </div>
                            <p className="text-sm text-muted-foreground">Avg Monthly Storage</p>
                        </div>
                    </div>
                    {data.summary.planLimits && (
                        <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Current Plan: {data.summary.planLimits.planName}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {formatStorageUsage(data.summary.planLimits.storage)} storage • {data.summary.planLimits.transformations.toLocaleString()} transformations/month
                                    </p>
                                </div>
                                {data.summary.planLimits.planName === 'Free' && (
                                    <Button size="sm" variant="outline">
                                        Upgrade Plan
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}