import { LucideIcon } from 'lucide-react'
import Card from './Card'

interface StatCardProps {
    label: string
    value: string | number
    icon: LucideIcon
    iconColor?: string
    iconBgColor?: string
    trend?: {
        value: string
        isPositive: boolean
    }
    description?: string
}

export default function StatCard({
    label,
    value,
    icon: Icon,
    iconColor = 'text-slate-600',
    iconBgColor = 'bg-slate-100',
    trend,
    description
}: StatCardProps) {
    return (
        <Card hover>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-slate-600 mb-1">{label}</p>
                    <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>
                    {description && (
                        <p className="text-xs text-slate-500">{description}</p>
                    )}
                    {trend && (
                        <p className={`text-xs font-medium mt-2 ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                            {trend.isPositive ? '↑' : '↓'} {trend.value}
                        </p>
                    )}
                </div>
                <div className={`p-3 rounded-xl ${iconBgColor}`}>
                    <Icon className={`w-6 h-6 ${iconColor}`} />
                </div>
            </div>
        </Card>
    )
}

