import { Search } from 'lucide-react'
import { InputHTMLAttributes } from 'react'

interface SearchBarProps extends InputHTMLAttributes<HTMLInputElement> {
    onSearch?: () => void
    fullWidth?: boolean
}

export default function SearchBar({
    onSearch,
    fullWidth = true,
    className = '',
    ...props
}: SearchBarProps) {
    return (
        <div className={`relative ${fullWidth ? 'w-full' : ''} ${className}`}>
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
                type="text"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg 
                    focus:ring-2 focus:ring-slate-900 focus:border-slate-900 
                    placeholder:text-slate-400 text-slate-900
                    transition-all duration-200"
                {...props}
            />
        </div>
    )
}

