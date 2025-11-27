import { useState, useEffect } from 'react'
import { Plus, Trash2, Pause, Play, TrendingDown, Sparkles, Tv, Music, ShoppingBag, Dumbbell, Cloud } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Subscription } from '@/types'

// Mock de assinaturas detectadas
const MOCK_SUBSCRIPTIONS: Subscription[] = [
    {
        id: '1',
        user_id: '1',
        name: 'Netflix',
        amount: 39.90,
        category: 'Entretenimento',
        billing_day: 15,
        status: 'active',
        last_charge_date: '2024-11-15',
        detected_automatically: true,
        created_at: '2024-01-15'
    },
    {
        id: '2',
        user_id: '1',
        name: 'Spotify',
        amount: 21.90,
        category: 'Entretenimento',
        billing_day: 10,
        status: 'active',
        last_charge_date: '2024-11-10',
        detected_automatically: true,
        created_at: '2024-02-10'
    },
    {
        id: '3',
        user_id: '1',
        name: 'Amazon Prime',
        amount: 14.90,
        category: 'Entretenimento',
        billing_day: 5,
        status: 'active',
        last_charge_date: '2024-11-05',
        detected_automatically: true,
        created_at: '2024-03-05'
    },
    {
        id: '4',
        user_id: '1',
        name: 'Smartfit',
        amount: 69.90,
        category: 'Saúde',
        billing_day: 1,
        status: 'active',
        last_charge_date: '2024-11-01',
        detected_automatically: false,
        created_at: '2024-01-01'
    },
    {
        id: '5',
        user_id: '1',
        name: 'iCloud',
        amount: 10.10,
        category: 'Tecnologia',
        billing_day: 20,
        status: 'paused',
        last_charge_date: '2024-10-20',
        detected_automatically: true,
        created_at: '2024-05-20'
    }
]

const getCategoryColor = (category: string) => {
    switch (category) {
        case 'Entretenimento': return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
        case 'Saúde': return 'bg-green-500/10 text-green-400 border-green-500/20'
        case 'Tecnologia': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
        default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
}

const getSubscriptionIcon = (name: string) => {
    const nameLower = name.toLowerCase()
    if (nameLower.includes('netflix') || nameLower.includes('prime')) return Tv
    if (nameLower.includes('spotify') || nameLower.includes('music')) return Music
    if (nameLower.includes('smart') || nameLower.includes('gym') || nameLower.includes('fit')) return Dumbbell
    if (nameLower.includes('cloud') || nameLower.includes('drive')) return Cloud
    return ShoppingBag
}

export default function AssinaturasPage() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>(MOCK_SUBSCRIPTIONS)
    const [showAddModal, setShowAddModal] = useState(false)

    const totalAtivas = subscriptions
        .filter(s => s.status === 'active')
        .reduce((sum, s) => sum + s.amount, 0)

    const totalAnual = totalAtivas * 12

    const handleToggleStatus = (id: string) => {
        setSubscriptions(subs =>
            subs.map(s =>
                s.id === id
                    ? { ...s, status: s.status === 'active' ? 'paused' : 'active' }
                    : s
            )
        )
    }

    const handleDelete = (id: string) => {
        setSubscriptions(subs => subs.filter(s => s.id !== id))
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Assinaturas Inteligentes
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Gerencie e economize em suas assinaturas
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Adicionar
                </button>
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-card/40 backdrop-blur-xl border border-white/5 shadow-xl">
                    <span className="text-sm font-medium text-muted-foreground">Total Mensal</span>
                    <div className="mt-2 text-3xl font-bold text-white">
                        R$ {totalAtivas.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        {subscriptions.filter(s => s.status === 'active').length} assinaturas ativas
                    </p>
                </div>

                <div className="p-6 rounded-2xl bg-card/40 backdrop-blur-xl border border-white/5 shadow-xl">
                    <span className="text-sm font-medium text-muted-foreground">Gasto Anual</span>
                    <div className="mt-2 text-3xl font-bold text-white">
                        R$ {totalAnual.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Projeção dos próximos 12 meses
                    </p>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20 shadow-xl">
                    <div className="flex items-center gap-2 text-green-400 mb-2">
                        <TrendingDown className="w-4 h-4" />
                        <span className="text-sm font-medium">Economia Potencial</span>
                    </div>
                    <div className="text-3xl font-bold text-white">
                        R$ {(subscriptions.filter(s => s.status === 'paused').reduce((sum, s) => sum + s.amount, 0) * 12).toFixed(2)}
                    </div>
                    <p className="text-xs text-green-400/70 mt-2">
                        Cancelando assinaturas pausadas
                    </p>
                </div>
            </div>

            {/* Insight da IA */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-violet-500/10 to-transparent border border-violet-500/20 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                    <Sparkles className="w-6 h-6 text-violet-400 animate-pulse" />
                </div>
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-violet-400" />
                    Sugestão da IA
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed">
                    Você tem <span className="text-violet-300 font-bold">3 assinaturas de streaming</span> (Netflix, Prime, Spotify). 
                    Considere manter apenas 2 e economize <span className="text-violet-300 font-bold">R$ 262,80/ano</span>.
                </p>
            </div>

            {/* Lista de Assinaturas */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">Suas Assinaturas</h3>
                
                {subscriptions.map((sub) => (
                    <div
                        key={sub.id}
                        className={cn(
                            "p-6 rounded-2xl bg-card/40 backdrop-blur-xl border shadow-xl transition-all",
                            sub.status === 'active' ? 'border-white/5' : 'border-yellow-500/20 bg-yellow-500/5'
                        )}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center",
                                        getCategoryColor(sub.category)
                                    )}>
                                        {(() => {
                                            const Icon = getSubscriptionIcon(sub.name)
                                            return <Icon className="w-5 h-5" />
                                        })()}
                                    </div>
                                    <h4 className="text-lg font-bold text-white">{sub.name}</h4>
                                    <span className={cn(
                                        "text-xs px-2 py-1 rounded-full border",
                                        getCategoryColor(sub.category)
                                    )}>
                                        {sub.category}
                                    </span>

                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span>R$ {sub.amount.toFixed(2)}/mês</span>
                                    <span>•</span>
                                    <span>Cobrança dia {sub.billing_day}</span>
                                    {sub.status === 'paused' && (
                                        <>
                                            <span>•</span>
                                            <span className="text-yellow-400 flex items-center gap-1">
                                                <Pause className="w-3 h-3" />
                                                Pausada
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleToggleStatus(sub.id)}
                                    className={cn(
                                        "p-2 rounded-lg transition-colors",
                                        sub.status === 'active'
                                            ? "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                                            : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                                    )}
                                    title={sub.status === 'active' ? 'Pausar' : 'Reativar'}
                                >
                                    {sub.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => handleDelete(sub.id)}
                                    className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                    title="Excluir"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
