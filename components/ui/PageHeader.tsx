import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface PageHeaderProps {
    title: string
    description?: string
    icon?: LucideIcon
    actions?: ReactNode
    badge?: {
        text: string
        variant?: 'blue' | 'green' | 'purple' | 'yellow' | 'red'
    }
}

export default function PageHeader({
    title,
    description,
    icon: Icon,
    actions,
    badge
}: PageHeaderProps) {
    const badgeColors = {
        blue: 'bg-blue-100 text-blue-700 border-blue-200',
        green: 'bg-green-100 text-green-700 border-green-200',
        purple: 'bg-purple-100 text-purple-700 border-purple-200',
        yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        red: 'bg-red-100 text-red-700 border-red-200',
    }

    return (
        <div className="bg-white border-b border-gray-200 px-6 py-6">
            <div className="max-w-[1800px] mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        {Icon && (
                            <div className="hidden md:flex w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl items-center justify-center shadow-lg">
                                <Icon className="w-6 h-6 text-white" />
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                                    {title}
                                </h1>
                                {badge && (
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${badgeColors[badge.variant || 'blue']}`}>
                                        {badge.text}
                                    </span>
                                )}
                            </div>
                            {description && (
                                <p className="text-slate-600 mt-1.5 text-sm md:text-base">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>
                    {actions && (
                        <div className="flex items-center gap-2 flex-wrap">
                            {actions}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

