import { LucideIcon, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  icon: LucideIcon
  color: string
  subtitle?: string
}

export default function StatsCard({ title, value, change, changeType, icon: Icon, color, subtitle }: StatsCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-indigo-600',
    green: 'from-emerald-500 to-teal-600',
    purple: 'from-purple-500 to-indigo-600',
    orange: 'from-orange-500 to-amber-600',
  }

  const iconBgClasses = {
    blue: 'bg-gradient-to-br from-blue-500/10 to-indigo-600/10 text-blue-600',
    green: 'bg-gradient-to-br from-emerald-500/10 to-teal-600/10 text-emerald-600',
    purple: 'bg-gradient-to-br from-purple-500/10 to-indigo-600/10 text-purple-600',
    orange: 'bg-gradient-to-br from-orange-500/10 to-amber-600/10 text-orange-600',
  }

  const changeClasses = {
    positive: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    negative: 'text-rose-600 bg-rose-50 border-rose-200',
    neutral: 'text-slate-600 bg-slate-50 border-slate-200',
  }

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/60 p-6 hover:shadow-2xl hover:shadow-slate-300/20 hover:-translate-y-1 hover:border-slate-300/60 transition-all duration-300 overflow-hidden">
      {/* Gradient Background Effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">{title}</p>
            <p className="text-4xl lg:text-5xl font-black text-slate-900 mb-1 tracking-tight">{value}</p>
          </div>
          <div className={`p-4 rounded-2xl ${iconBgClasses[color as keyof typeof iconBgClasses]} group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-7 h-7 lg:w-8 lg:h-8" strokeWidth={2.5} />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border ${changeClasses[changeType]}`}>
            {changeType === 'positive' && <TrendingUp className="w-3.5 h-3.5" strokeWidth={3} />}
            {changeType === 'negative' && <TrendingDown className="w-3.5 h-3.5" strokeWidth={3} />}
            {change}
          </span>
          {subtitle && (
            <span className="text-xs font-medium text-slate-500">{subtitle}</span>
          )}
        </div>
      </div>

      {/* Hover Arrow Indicator */}
      <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <ArrowUpRight className="w-5 h-5 text-slate-400" />
      </div>
    </div>
  )
}
