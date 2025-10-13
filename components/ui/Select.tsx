import { SelectHTMLAttributes } from 'react'

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
    label?: string
    error?: string
    fullWidth?: boolean
    size?: 'sm' | 'md' | 'lg'
}

export default function Select({
    label,
    error,
    fullWidth = false,
    size = 'md',
    className = '',
    ...props
}: SelectProps) {
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
            <select
                className={`
                    border border-slate-300 rounded-lg
                    focus:ring-2 focus:ring-slate-900 focus:border-slate-900
                    text-slate-900 bg-white
                    transition-all duration-200
                    disabled:bg-slate-50 disabled:text-slate-500
                    ${sizes[size]}
                    ${fullWidth ? 'w-full' : ''}
                    ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
                    ${className}
                `}
                {...props}
            />
            {error && (
                <p className="mt-1 text-xs text-red-600">{error}</p>
            )}
        </div>
    )
}

