import { useState } from 'react'
import { Wallet, ArrowRight, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AdiantamentoPage() {
    const [valor, setValor] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [limiteDisponivel, setLimiteDisponivel] = useState(600.00)

    const handleSolicitar = async () => {
        const valorNum = parseFloat(valor)
        
        if (!valorNum || valorNum <= 0) {
            setError('Digite um valor válido')
            return
        }

        if (valorNum > limiteDisponivel) {
            setError(`Valor excede o limite disponível de R$ ${limiteDisponivel.toFixed(2)}`)
            return
        }

        setLoading(true)
        setError(null)

        try {
            const userStr = localStorage.getItem('user')
            const userId = userStr 
                ? JSON.parse(userStr).id 
                : 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

            const response = await fetch('http://localhost:8000/adiantamento', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, valor: valorNum })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.detail || 'Erro ao solicitar adiantamento')
            }

            setSuccess(true)
            setLimiteDisponivel(data.novo_saldo_limite)
            setValor('')
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const valoresRapidos = [100, 200, 300, 500]

    return (
        <div className="space-y-8 pb-10 max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl mb-4">
                    <Wallet className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                    Adiantamento Salarial
                </h2>
                <p className="text-muted-foreground mt-2">
                    Antecipe parte do seu salário de forma rápida e segura
                </p>
            </div>

            {/* Card de Limite */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 shadow-xl">
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-sm font-medium text-muted-foreground">Limite Disponível</span>
                        <div className="text-3xl font-bold text-white mt-1">
                            R$ {limiteDisponivel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-xs text-muted-foreground">Taxa de serviço</span>
                        <div className="text-lg font-bold text-emerald-400">R$ 5,90</div>
                    </div>
                </div>
            </div>

            {/* Mensagem de Sucesso */}
            {success && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <div>
                        <p className="text-emerald-400 font-medium">Adiantamento liberado!</p>
                        <p className="text-sm text-emerald-400/70">O valor foi creditado na sua conta.</p>
                    </div>
                </div>
            )}

            {/* Mensagem de Erro */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <p className="text-red-400">{error}</p>
                </div>
            )}

            {/* Formulário */}
            <div className="space-y-6">
                {/* Input de Valor */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                        Quanto você precisa?
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                            R$
                        </span>
                        <input
                            type="number"
                            value={valor}
                            onChange={(e) => {
                                setValor(e.target.value)
                                setError(null)
                                setSuccess(false)
                            }}
                            placeholder="0,00"
                            className="w-full pl-12 pr-4 py-4 bg-card/50 border border-white/10 rounded-xl text-2xl font-bold text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Valores Rápidos */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                        Valores sugeridos
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                        {valoresRapidos.map((v) => (
                            <button
                                key={v}
                                onClick={() => {
                                    setValor(String(v))
                                    setError(null)
                                    setSuccess(false)
                                }}
                                disabled={v > limiteDisponivel}
                                className={cn(
                                    "py-3 rounded-lg font-medium transition-all",
                                    valor === String(v)
                                        ? "bg-emerald-500 text-white"
                                        : "bg-card/50 text-white border border-white/10 hover:border-emerald-500/50",
                                    v > limiteDisponivel && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                R$ {v}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Resumo */}
                {valor && parseFloat(valor) > 0 && (
                    <div className="p-4 rounded-xl bg-card/40 border border-white/5 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Valor solicitado</span>
                            <span className="text-white">R$ {parseFloat(valor).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Taxa de serviço</span>
                            <span className="text-white">R$ 5,90</span>
                        </div>
                        <div className="border-t border-white/10 pt-2 flex justify-between">
                            <span className="font-medium text-white">Você receberá</span>
                            <span className="font-bold text-emerald-400">
                                R$ {(parseFloat(valor) - 5.90).toFixed(2)}
                            </span>
                        </div>
                    </div>
                )}

                {/* Botão de Solicitar */}
                <button
                    onClick={handleSolicitar}
                    disabled={loading || !valor || parseFloat(valor) <= 0}
                    className={cn(
                        "w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all",
                        "bg-gradient-to-r from-emerald-500 to-emerald-600",
                        "hover:from-emerald-600 hover:to-emerald-700",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processando...
                        </>
                    ) : (
                        <>
                            Solicitar Adiantamento
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>

                {/* Info */}
                <p className="text-xs text-center text-muted-foreground">
                    O valor será creditado instantaneamente na sua conta.
                    O limite é renovado a cada pagamento de salário.
                </p>
            </div>
        </div>
    )
}
