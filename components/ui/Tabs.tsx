import { ReactNode } from 'react'

interface Tab {
    id: string
    label: string
    count?: number
    icon?: ReactNode
}

interface TabsProps {
    tabs: Tab[]
    activeTab: string
    onChange: (tabId: string) => void
    variant?: 'default' | 'pills'
}

export default function Tabs({
    tabs,
    activeTab,
    onChange,
    variant = 'default'
}: TabsProps) {
    if (variant === 'pills') {
        return (
            <div className="flex gap-2 flex-wrap">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                            transition-all duration-200
                            ${activeTab === tab.id
                                ? 'bg-slate-900 text-white shadow-md'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                            }
                        `}
                    >
                        {tab.icon}
                        {tab.label}
                        {tab.count !== undefined && (
                            <span className={`
                                ml-1 px-2 py-0.5 rounded-full text-xs font-semibold
                                ${activeTab === tab.id
                                    ? 'bg-white text-slate-900'
                                    : 'bg-slate-100 text-slate-600'
                                }
                            `}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>
        )
    }

    return (
        <div className="border-b border-slate-200">
            <div className="flex gap-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        className={`
                            relative flex items-center gap-2 px-6 py-4 font-medium text-sm
                            transition-all duration-200
                            ${activeTab === tab.id
                                ? 'text-slate-900 bg-slate-50'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }
                        `}
                    >
                        {tab.icon}
                        {tab.label}
                        {tab.count !== undefined && (
                            <span className={`
                                px-2 py-0.5 rounded-full text-xs font-semibold
                                ${activeTab === tab.id
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-slate-100 text-slate-600'
                                }
                            `}>
                                {tab.count}
                            </span>
                        )}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    )
}

