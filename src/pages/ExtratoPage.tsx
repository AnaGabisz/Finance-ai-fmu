import { useState, useEffect } from 'react'
import { 
    Search, 
    Filter, 
    TrendingUp, 
    TrendingDown, 
    Utensils, 
    Car, 
    Zap, 
    ShoppingBag, 
    MoreHorizontal,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Sparkles,
    Download,
    Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Transaction } from '@/types'

// Tipos para o extrato inteligente
interface ExtratoInteligente {
    saldo_bancario: number
    conta_corrente: TransacaoAPI[]
    beneficios_corporativos: Beneficio[]
    analise_ia: string
}

interface TransacaoAPI {
    id: number
    valor: number
    tipo: string
    categoria: string
    descricao: string
    data: string
}

interface Beneficio {
    tipo: string
    valor: number
}

// Mock de transações
const MOCK_TRANSACTIONS: Transaction[] = [
    { id: '1', user_id: '1', amount: 3500.00, type: 'entrada', category: 'Renda', description: 'Salário Mensal', created_at: '2024-11-27T10:00:00' },
    { id: '2', user_id: '1', amount: 45.50, type: 'saida', category: 'Alimentação', description: 'iFood - McDonalds', created_at: '2024-11-27T12:30:00' },
    { id: '3', user_id: '1', amount: 25.90, type: 'saida', category: 'Transporte', description: 'Uber - Viagem', created_at: '2024-11-26T18:00:00' },
    { id: '4', user_id: '1', amount: 39.90, type: 'saida', category: 'Lazer', description: 'Netflix', created_at: '2024-11-15T00:00:00' },
    { id: '5', user_id: '1', amount: 150.00, type: 'saida', category: 'Contas Fixas', description: 'Conta de Luz', created_at: '2024-11-10T00:00:00' },
    { id: '6', user_id: '1', amount: 89.90, type: 'saida', category: 'Contas Fixas', description: 'Internet', created_at: '2024-11-05T00:00:00' },
    { id: '7', user_id: '1', amount: 200.00, type: 'entrada', category: 'Renda', description: 'Freelance - Projeto X', created_at: '2024-11-20T14:00:00' },
    { id: '8', user_id: '1', amount: 350.00, type: 'saida', category: 'Alimentação', description: 'Supermercado Extra', created_at: '2024-11-22T16:00:00' },
    { id: '9', user_id: '1', amount: 69.90, type: 'saida', category: 'Saúde', description: 'Smartfit - Mensalidade', created_at: '2024-11-01T00:00:00' },
    { id: '10', user_id: '1', amount: 21.90, type: 'saida', category: 'Lazer', description: 'Spotify Premium', created_at: '2024-11-10T00:00:00' },
]

const MOCK_BENEFICIOS: Beneficio[] = [
    { tipo: 'Vale Refeição', valor: 800.00 },
    { tipo: 'Vale Alimentação', valor: 400.00 },
    { tipo: 'Gympass', valor: 89.90 }
]

const CATEGORIES = ['Todas', 'Alimentação', 'Transporte', 'Lazer', 'Contas Fixas', 'Saúde', 'Renda']

const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
        case 'alimentação': return Utensils
        case 'transporte': return Car
        case 'contas fixas': return Zap
        case 'lazer': return ShoppingBag
        case 'renda': return TrendingUp
        case 'saúde': return TrendingUp
        default: return MoreHorizontal
    }
}

const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
        case 'alimentação': return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
        case 'transporte': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
        case 'contas fixas': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
        case 'lazer': return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
        case 'saúde': return 'bg-green-500/10 text-green-400 border-green-500/20'
        case 'renda': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
}

const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return 'Hoje'
    if (date.toDateString() === yesterday.toDateString()) return 'Ontem'
    
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export default function ExtratoPage() {
    const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS)
    const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS)
    const [beneficios, setBeneficios] = useState<Beneficio[]>(MOCK_BENEFICIOS)
    const [analiseIA, setAnaliseIA] = useState<string>('')
    const [saldoBancario, setSaldoBancario] = useState<number>(0)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('Todas')
    const [selectedType, setSelectedType] = useState<'all' | 'entrada' | 'saida'>('all')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchExtratoInteligente = async () => {
            try {
                const userStr = localStorage.getItem('user')
                const userId = userStr 
                    ? JSON.parse(userStr).id 
                    : 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' // Demo user

                const response = await fetch(`http://localhost:8000/extrato-inteligente/${userId}`)
                
                if (!response.ok) throw new Error('Erro ao buscar extrato')

                const data: ExtratoInteligente = await response.json()
                
                // Converter formato da API para formato do componente
                const txConverted: Transaction[] = data.conta_corrente.map(t => ({
                    id: String(t.id),
                    user_id: userId,
                    amount: t.valor,
                    type: t.tipo as 'entrada' | 'saida',
                    category: t.categoria,
                    description: t.descricao,
                    created_at: t.data
                }))
                
                setTransactions(txConverted)
                setFilteredTransactions(txConverted)
                setBeneficios(data.beneficios_corporativos)
                setAnaliseIA(data.analise_ia)
                setSaldoBancario(data.saldo_bancario)
                setError(null)
            } catch (err: any) {
                console.error('Erro ao carregar extrato:', err)
                setError(err.message)
                setTransactions(MOCK_TRANSACTIONS)
                setFilteredTransactions(MOCK_TRANSACTIONS)
                setBeneficios(MOCK_BENEFICIOS)
                setAnaliseIA('Usando dados de demonstração. Conecte ao backend para análise personalizada.')
            } finally {
                setLoading(false)
            }
        }

        fetchExtratoInteligente()
    }, [])

    useEffect(() => {
        let filtered = transactions

        // Filtro por busca
        if (searchTerm) {
            filtered = filtered.filter(t => 
                t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.category.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        // Filtro por categoria
        if (selectedCategory !== 'Todas') {
            filtered = filtered.filter(t => t.category === selectedCategory)
        }

        // Filtro por tipo
        if (selectedType !== 'all') {
            filtered = filtered.filter(t => t.type === selectedType)
        }

        setFilteredTransactions(filtered)
    }, [searchTerm, selectedCategory, selectedType, transactions])

    // Cálculos para resumo
    const totalEntradas = filteredTransactions
        .filter(t => t.type === 'entrada')
        .reduce((sum, t) => sum + t.amount, 0)

    const totalSaidas = filteredTransactions
        .filter(t => t.type === 'saida')
        .reduce((sum, t) => sum + t.amount, 0)

    const saldo = totalEntradas - totalSaidas

    // Agrupar por data
    const groupedByDate = filteredTransactions.reduce((groups, tx) => {
        const date = new Date(tx.created_at).toDateString()
        if (!groups[date]) groups[date] = []
        groups[date].push(tx)
        return groups
    }, {} as Record<string, Transaction[]>)

    // Loading state
    if (loading) {
        return (
            <div className="space-y-8 pb-10 animate-pulse">
                <div className="h-10 bg-card/40 rounded-lg w-64" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-card/40 rounded-2xl" />
                    ))}
                </div>
                <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-20 bg-card/40 rounded-xl" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Extrato Inteligente
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Visualize e analise suas transações
                    </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-card/50 hover:bg-card border border-white/10 text-white rounded-lg transition-colors">
                    <Download className="w-4 h-4" />
                    Exportar
                </button>
            </div>

            {/* Alerta de erro */}
            {error && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-500 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Usando dados de demonstração. Backend offline.
                </div>
            )}

            {/* Análise da IA */}
            {analiseIA && (
                <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-500/10 to-primary/10 border border-violet-500/20 shadow-xl">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white mb-1">Análise Inteligente</h3>
                            <p className="text-sm text-gray-300 leading-relaxed">{analiseIA}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Benefícios Corporativos */}
            {beneficios.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {beneficios.map((ben, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-card/40 backdrop-blur-xl border border-white/5 shadow-lg">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{ben.tipo}</span>
                            <div className="text-xl font-bold text-white mt-1">
                                R$ {ben.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-card/40 backdrop-blur-xl border border-white/5 shadow-xl">
                    <div className="flex items-center gap-2 text-emerald-400 mb-2">
                        <ArrowUpRight className="w-4 h-4" />
                        <span className="text-sm font-medium">Entradas</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                        R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-card/40 backdrop-blur-xl border border-white/5 shadow-xl">
                    <div className="flex items-center gap-2 text-red-400 mb-2">
                        <ArrowDownRight className="w-4 h-4" />
                        <span className="text-sm font-medium">Saídas</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                        R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                </div>

                <div className={cn(
                    "p-6 rounded-2xl backdrop-blur-xl border shadow-xl",
                    saldo >= 0 
                        ? "bg-emerald-500/10 border-emerald-500/20" 
                        : "bg-red-500/10 border-red-500/20"
                )}>
                    <div className={cn(
                        "flex items-center gap-2 mb-2",
                        saldo >= 0 ? "text-emerald-400" : "text-red-400"
                    )}>
                        {saldo >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span className="text-sm font-medium">Saldo do Período</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                        R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-col md:flex-row gap-4">
                {/* Busca */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar transação..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-card/50 border border-white/10 rounded-lg text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                </div>

                {/* Filtro por tipo */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setSelectedType('all')}
                        className={cn(
                            "px-4 py-2 rounded-lg font-medium transition-colors",
                            selectedType === 'all'
                                ? "bg-primary text-white"
                                : "bg-card/50 text-muted-foreground hover:text-white border border-white/10"
                        )}
                    >
                        Todas
                    </button>
                    <button
                        onClick={() => setSelectedType('entrada')}
                        className={cn(
                            "px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2",
                            selectedType === 'entrada'
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-card/50 text-muted-foreground hover:text-white border border-white/10"
                        )}
                    >
                        <ArrowUpRight className="w-4 h-4" />
                        Entradas
                    </button>
                    <button
                        onClick={() => setSelectedType('saida')}
                        className={cn(
                            "px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2",
                            selectedType === 'saida'
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : "bg-card/50 text-muted-foreground hover:text-white border border-white/10"
                        )}
                    >
                        <ArrowDownRight className="w-4 h-4" />
                        Saídas
                    </button>
                </div>
            </div>

            {/* Filtro por categoria */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                            selectedCategory === cat
                                ? "bg-primary text-white"
                                : "bg-card/50 text-muted-foreground hover:text-white border border-white/10"
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Lista de Transações Agrupadas por Data */}
            <div className="space-y-6">
                {Object.entries(groupedByDate)
                    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                    .map(([date, txs]) => (
                        <div key={date}>
                            <div className="flex items-center gap-2 mb-4">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">
                                    {formatDate(txs[0].created_at)}
                                </span>
                            </div>

                            <div className="space-y-3">
                                {txs.map((tx) => {
                                    const Icon = getCategoryIcon(tx.category)
                                    return (
                                        <div
                                            key={tx.id}
                                            className="p-4 rounded-xl bg-card/40 backdrop-blur-xl border border-white/5 shadow-lg hover:border-primary/20 transition-all group"
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-xl flex items-center justify-center border transition-colors",
                                                        tx.type === 'entrada'
                                                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                                            : getCategoryColor(tx.category)
                                                    )}>
                                                        {tx.type === 'entrada' 
                                                            ? <TrendingUp className="w-5 h-5" />
                                                            : <Icon className="w-5 h-5" />
                                                        }
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-white group-hover:text-primary transition-colors">
                                                            {tx.description}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={cn(
                                                                "text-xs px-2 py-0.5 rounded-full border",
                                                                getCategoryColor(tx.category)
                                                            )}>
                                                                {tx.category}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {formatTime(tx.created_at)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className={cn(
                                                    "text-lg font-bold",
                                                    tx.type === 'entrada' ? "text-emerald-400" : "text-white"
                                                )}>
                                                    {tx.type === 'entrada' ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
            </div>

            {/* Empty State */}
            {filteredTransactions.length === 0 && (
                <div className="text-center py-12">
                    <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhuma transação encontrada</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                        Tente ajustar os filtros
                    </p>
                </div>
            )}
        </div>
    )
}
