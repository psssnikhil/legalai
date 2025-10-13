import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'
import Button from './Button'

interface EmptyStateProps {
    icon: LucideIcon
    title: string
    description: string
    action?: {
        label: string
        onClick: () => void
        icon?: LucideIcon
    }
    children?: ReactNode
}

export default function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    children
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
                <Icon className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-slate-600 text-center max-w-md mb-6">{description}</p>
            {action && (
                <Button
                    variant="primary"
                    onClick={action.onClick}
                    icon={action.icon}
                >
                    {action.label}
                </Button>
            )}
            {children}
        </div>
    )
}

