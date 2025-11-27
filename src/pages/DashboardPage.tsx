import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Wallet, TrendingUp, TrendingDown, Activity, CreditCard, ArrowRight, ShoppingBag, Utensils, Car, Zap, MoreHorizontal, Sparkles } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { cn } from '@/lib/utils'
import { DashboardData } from '@/types'

// Cores do tema 
const COLORS = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#4c1d95']; // Violets

// (MOCK  para Demonssraçao) Integrar API depois 
const MOCK_DATA: DashboardData = {
    saldo_atual: 1250.00,
    limite_adiantamento: 600.00,
    saude_financeira: 850,
    gastos_total: 2250.00,
    total_assinaturas: 156.70,
    assinaturas_ativas: 5
}

const CHART_DATA = [
    { name: 'Alimentação', value: 400, color: COLORS[0] },
    { name: 'Transporte', value: 300, color: COLORS[1] },
    { name: 'Lazer', value: 300, color: COLORS[2] },
    { name: 'Contas', value: 200, color: COLORS[3] },
];

// Helper para ícones do "Extrato Inteligente"
const getCategoryIcon = (category: string) => {
    switch(category.toLowerCase()) {
        case 'alimentação': return <Utensils className="w-4 h-4" />;
        case 'transporte': return <Car className="w-4 h-4" />;
        case 'contas': return <Zap className="w-4 h-4" />;
        case 'lazer': return <ShoppingBag className="w-4 h-4" />;
        default: return <MoreHorizontal className="w-4 h-4" />;
    }
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData>(MOCK_DATA)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Pegar user_id do localStorage (mock auth)
                const userStr = localStorage.getItem('user')
                if (!userStr) {
                    setError('Usuário não autenticado')
                    setLoading(false)
                    return
                }

                const user = JSON.parse(userStr)
                const userId = user.id

                // Chamar API do backend
                const response = await fetch(`http://localhost:8000/dashboard/${userId}`)
                
                if (!response.ok) {
                    throw new Error('Erro ao buscar dados do dashboard')
                }

                const dashboardData = await response.json()
                setData(dashboardData)
                setError(null)
            } catch (err: any) {
                console.error('Erro ao carregar dashboard:', err)
                setError(err.message)
                // Manter dados mockados em caso de erro
                setData(MOCK_DATA)
            } finally {
                setLoading(false)
            }
        }

        fetchDashboardData()
    }, [])

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Alerta de erro (se API falhar, mostra dados mockados) */}
            {error && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-500 text-sm">
                    ⚠️ Usando dados de demonstração. Backend offline ou erro: {error}
                </div>
            )}

            {/* Header com Personalização (Item 03 do Slide) */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/40 pb-6">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Visão Geral
                    </h2>
                    <p className="text-muted-foreground flex items-center gap-2 mt-1">
                        Bem-vindo de volta, João <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
                    </p>
                </div>

                {/* Score Gamificado */}
                <div className="flex items-center gap-3 bg-card/50 backdrop-blur-md px-5 py-2.5 rounded-full border border-primary/20 shadow-[0_0_15px_rgba(139,92,246,0.15)]">
                    <Activity className="w-5 h-5 text-primary" />
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Score Financeiro</span>
                        <span className="text-sm font-bold text-white leading-none">
                            {data.saude_financeira} <span className="text-muted-foreground font-normal">/ 1000</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Grid de KPIs - Design Glassmorphism */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Card Saldo */}
                <div className="group relative p-6 rounded-2xl bg-card/40 backdrop-blur-xl border border-white/5 shadow-xl overflow-hidden hover:border-primary/20 transition-all duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity transform group-hover:scale-110 duration-500">
                        <Wallet className="w-32 h-32 text-white" />
                    </div>
                    <div className="relative z-10">
                        <span className="text-sm font-medium text-muted-foreground">Saldo em Conta</span>
                        <div className="mt-2 text-3xl font-bold text-white tracking-tight">
                            R$ {data.saldo_atual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-green-400 bg-green-400/10 w-fit px-2 py-1 rounded-md">
                            <TrendingUp className="w-3 h-3" />
                            <span>+12% vs mês passado</span>
                        </div>
                    </div>
                </div>

                {/* Card Adiantamento */}
                <div className="relative p-6 rounded-2xl bg-gradient-to-br from-emerald-600/90 to-emerald-900 border border-emerald-500/20 shadow-2xl shadow-emerald-500/10 overflow-hidden text-white">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-white/80 font-medium text-sm mb-1">
                                <Wallet className="w-4 h-4" />
                                <span>Limite Disponível</span>
                            </div>
                            <div className="text-3xl font-bold tracking-tight">
                                R$ {data.limite_adiantamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-sm text-white/70 mt-2">
                                Adiantamento Salarial
                            </div>
                        </div>
                        <Link to="/adiantamento">
                            <button className="mt-4 w-full group flex items-center justify-center gap-2 bg-white text-emerald-600 font-bold py-3 rounded-xl hover:bg-gray-50 transition-all active:scale-95 shadow-lg">
                                Solicitar
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Card Assinaturas Inteligentes */}
                <div className="relative p-6 rounded-2xl bg-gradient-to-br from-primary/90 to-violet-900 border border-primary/20 shadow-2xl shadow-primary/20 overflow-hidden text-white">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-white/80 font-medium text-sm mb-1">
                                <CreditCard className="w-4 h-4" />
                                <span>Assinaturas Ativas</span>
                            </div>
                            <div className="text-3xl font-bold tracking-tight">
                                {data.assinaturas_ativas || 0}
                            </div>
                            <div className="text-sm text-white/70 mt-2">
                                R$ {(data.total_assinaturas || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                            </div>
                        </div>
                        <Link to="/assinaturas">
                            <button className="mt-4 w-full group flex items-center justify-center gap-2 bg-white text-primary font-bold py-3 rounded-xl hover:bg-gray-50 transition-all active:scale-95 shadow-lg">
                                Gerenciar
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Card Gastos */}
                <div className="p-6 rounded-2xl bg-card/40 backdrop-blur-xl border border-white/5 shadow-xl flex flex-col justify-center">
                    <span className="text-sm font-medium text-muted-foreground mb-2">Saídas Totais</span>
                    <div className="text-2xl font-bold text-white mb-2">
                        R$ {data.gastos_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="w-full bg-secondary/30 rounded-full h-2 overflow-hidden">
                        <div 
                            className="bg-red-500 h-full rounded-full" 
                            style={{ width: '65%' }} // Exemplo estático
                        />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">65% da renda comprometida</p>
                </div>
            </div>

            {/* Seção Inferior: Gráficos e Extrato Inteligente */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Gráfico (Visualização Clara - Item 02) */}
                <div className="lg:col-span-2 p-6 rounded-3xl bg-card/40 backdrop-blur-xl border border-white/5 shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-white">Análise de Despesas</h3>
                        <select className="bg-background/50 border border-white/10 rounded-lg text-xs px-2 py-1 text-muted-foreground focus:outline-none">
                            <option>Este Mês</option>
                            <option>Últimos 3 meses</option>
                        </select>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="h-[250px] w-[250px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={CHART_DATA}
                                        innerRadius={65}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {CHART_DATA.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: '#18181b', 
                                            borderColor: '#27272a', 
                                            borderRadius: '12px', 
                                            color: '#fff' 
                                        }}
                                        itemStyle={{ color: '#a1a1aa' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Texto no meio do Donut */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-xs text-muted-foreground">Total</span>
                                <span className="text-xl font-bold text-white">R$ 2.2k</span>
                            </div>
                        </div>

                        {/* Legenda Customizada */}
                        <div className="flex-1 grid grid-cols-2 gap-4">
                            {CHART_DATA.map((item, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-background/30 border border-white/5">
                                    <div className="p-2 rounded-lg bg-background/50 text-white">
                                        {getCategoryIcon(item.name)}
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">{item.name}</p>
                                        <p className="font-bold text-sm text-white">R$ {item.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Personalização / IA (Item 03) */}
                <div className="space-y-6">
                    {/* Card Insight IA */}
                    <div className="p-6 rounded-3xl bg-gradient-to-b from-violet-500/10 to-transparent border border-violet-500/20 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4">
                            <Sparkles className="w-6 h-6 text-violet-400 animate-pulse" />
                        </div>
                        <h3 className="font-bold text-white mb-2">aiiaHub</h3>
                        <p className="text-sm text-gray-300 leading-relaxed mb-4">
                            Notei que você gastou <span className="text-violet-300 font-bold">R$ 400</span> em alimentação. 
                            Que tal definir um limite diário de R$ 30,00 para economizar 15%?
                        </p>
                        <button className="text-xs font-bold text-violet-300 hover:text-violet-200 uppercase tracking-wide">
                            Ver sugestão completa →
                        </button>
                    </div>

                    {/* Mini Extrato Inteligente (Item 02 - Prévia) */}
                    <div className="p-6 rounded-3xl bg-card/40 backdrop-blur-xl border border-white/5 shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-white">Últimas</h3>
                            <Link to="/extrato" className="text-xs text-primary hover:text-primary/80">Ver tudo</Link>
                        </div>
                        <div className="space-y-4">
                            {[
                                { desc: 'iFood *McDonalds', val: -45.50, cat: 'Alimentação', date: 'Hoje' },
                                { desc: 'Uber Viagem', val: -25.90, cat: 'Transporte', date: 'Ontem' },
                                { desc: 'Salário Mensal', val: 3500.00, cat: 'Renda', date: '05/12' },
                            ].map((tx, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center border transition-colors",
                                            tx.val > 0 
                                                ? "bg-green-500/10 border-green-500/20 text-green-500" 
                                                : "bg-background/50 border-white/5 text-muted-foreground group-hover:border-primary/30 group-hover:text-primary"
                                        )}>
                                            {tx.val > 0 ? <TrendingUp className="w-4 h-4" /> : getCategoryIcon(tx.cat)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white group-hover:text-primary transition-colors">{tx.desc}</p>
                                            <p className="text-xs text-muted-foreground">{tx.cat} • {tx.date}</p>
                                        </div>
                                    </div>
                                    <span className={cn(
                                        "text-sm font-bold",
                                        tx.val > 0 ? "text-green-400" : "text-white"
                                    )}>
                                        {tx.val > 0 ? '+' : ''} R$ {Math.abs(tx.val).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
