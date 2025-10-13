import { InputHTMLAttributes, ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string
    error?: string
    helperText?: string
    fullWidth?: boolean
    icon?: LucideIcon
    iconPosition?: 'left' | 'right'
    suffix?: ReactNode
    size?: 'sm' | 'md' | 'lg'
}

export default function Input({
    label,
    error,
    helperText,
    fullWidth = false,
    icon: Icon,
    iconPosition = 'left',
    suffix,
    size = 'md',
    className = '',
    ...props
}: InputProps) {
    const sizes = {
        sm: 'px-2.5 py-1.5 text-sm',
        md: 'px-3 py-2 text-sm',
        lg: 'px-4 py-2.5 text-base'
    }
    return (
        <div className={fullWidth ? 'w-full' : ''}>
            {label && (
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && iconPosition === 'left' && (
                    <Icon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                )}
                <input
                    className={`
                        border border-slate-300 rounded-lg
                        focus:ring-2 focus:ring-slate-900 focus:border-slate-900
                        text-slate-900 placeholder:text-slate-400
                        transition-all duration-200
                        disabled:bg-slate-50 disabled:text-slate-500
                        ${sizes[size]}
                        ${Icon && iconPosition === 'left' ? 'pl-10' : ''}
                        ${Icon && iconPosition === 'right' ? 'pr-10' : ''}
                        ${suffix ? 'pr-16' : ''}
                        ${fullWidth ? 'w-full' : ''}
                        ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
                        ${className}
                    `}
                    {...props}
                />
                {Icon && iconPosition === 'right' && (
                    <Icon className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                )}
                {suffix && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-slate-600">
                        {suffix}
                    </div>
                )}
            </div>
            {error && (
                <p className="mt-1 text-xs text-red-600">{error}</p>
            )}
            {helperText && !error && (
                <p className="mt-1 text-xs text-slate-500">{helperText}</p>
            )}
        </div>
    )
}

