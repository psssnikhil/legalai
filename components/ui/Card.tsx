import { ReactNode } from 'react'

interface CardProps {
    children: ReactNode
    className?: string
    hover?: boolean
    padding?: 'none' | 'sm' | 'md' | 'lg'
    variant?: 'default' | 'bordered' | 'elevated'
}

export default function Card({
    children,
    className = '',
    hover = false,
    padding = 'md',
    variant = 'default'
}: CardProps) {
    const paddingClasses = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8'
    }

    const variantClasses = {
        default: 'bg-white border border-gray-200 shadow-sm',
        bordered: 'bg-white border-2 border-slate-200',
        elevated: 'bg-white border border-gray-100 shadow-md'
    }

    return (
        <div className={`
            rounded-xl 
            ${variantClasses[variant]}
            ${hover ? 'hover:shadow-lg hover:border-slate-300 transition-all duration-200' : ''}
            ${paddingClasses[padding]}
            ${className}
        `}>
            {children}
        </div>
    )
}

