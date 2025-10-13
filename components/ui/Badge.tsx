import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface BadgeProps {
    children: ReactNode
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'slate'
    size?: 'sm' | 'md' | 'lg'
    icon?: LucideIcon
    dot?: boolean
}

export default function Badge({
    children,
    variant = 'default',
    size = 'md',
    icon: Icon,
    dot = false
}: BadgeProps) {
    const variants = {
        default: 'bg-slate-100 text-slate-700 border-slate-200',
        success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        warning: 'bg-amber-50 text-amber-700 border-amber-200',
        danger: 'bg-rose-50 text-rose-700 border-rose-200',
        info: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        purple: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        slate: 'bg-slate-100 text-slate-700 border-slate-200'
    }

    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm'
    }

    const dotColors = {
        default: 'bg-slate-500',
        success: 'bg-emerald-500',
        warning: 'bg-amber-500',
        danger: 'bg-rose-500',
        info: 'bg-indigo-500',
        purple: 'bg-indigo-500',
        slate: 'bg-slate-500'
    }

    return (
        <span className={`
            inline-flex items-center gap-1.5
            font-semibold rounded-full border
            ${variants[variant]}
            ${sizes[size]}
        `}>
            {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
            {Icon && <Icon className="w-3 h-3" />}
            {children}
        </span>
    )
}

