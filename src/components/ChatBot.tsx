import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, Bot, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { askGemini } from '@/lib/gemini'

interface Message {
    id: string
    text: string
    isBot: boolean
    timestamp: Date
}

const SUGESTOES = [
    "Quanto gastei este mês?",
    "Qual minha maior despesa?",
    "Posso pedir adiantamento?",
    "Resumo das minhas finanças"
]

// Dados financeiros mockados do usuário
const DADOS_FINANCEIROS = {
    nome: "João da Silva",
    saldo_atual: 1250.50,
    salario: 3500.00,
    limite_adiantamento: 1400.00,
    total_entradas: 3700.00,
    total_saidas: 2449.50,
    gastos_por_categoria: {
        "Alimentação": 395.50,
        "Transporte": 125.90,
        "Lazer": 61.80,
        "Contas Fixas": 1449.90,
        "Saúde": 80.00
    },
    assinaturas: [
        { nome: "Netflix", valor: 39.90 },
        { nome: "Spotify", valor: 21.90 }
    ],
    beneficios: [
        { tipo: "Vale Refeição", valor: 800.00 },
        { tipo: "Vale Alimentação", valor: 400.00 }
    ],
    ultimas_transacoes: [
        { descricao: "Salário Mensal", valor: 3500.00, tipo: "entrada", categoria: "Renda" },
        { descricao: "Aluguel Apto", valor: 1200.00, tipo: "saida", categoria: "Contas Fixas" },
        { descricao: "iFood - McDonalds", valor: 45.50, tipo: "saida", categoria: "Alimentação" },
        { descricao: "Uber - Viagem", valor: 25.90, tipo: "saida", categoria: "Transporte" },
        { descricao: "Netflix", valor: 39.90, tipo: "saida", categoria: "Lazer" },
        { descricao: "Enel Energia", valor: 150.00, tipo: "saida", categoria: "Contas Fixas" },
        { descricao: "Farmacia Drogasil", valor: 80.00, tipo: "saida", categoria: "Saúde" }
    ]
}

// Função para gerar o prompt com data/hora atual
const getSystemPrompt = () => {
    const agora = new Date()
    const dataHora = agora.toLocaleString('pt-BR', { 
        dateStyle: 'full', 
        timeStyle: 'short' 
    })
    
    return `Você é o assistente da aiiaHub, um app de gestão financeira inteligente.
Você pode responder sobre QUALQUER assunto, mas tem especialidade em finanças.
Responda de forma clara, amigável e objetiva. Máximo 150 palavras.

DATA E HORA ATUAL: ${dataHora}

DADOS FINANCEIROS DO USUÁRIO (${DADOS_FINANCEIROS.nome}):
- Saldo atual: R$ ${DADOS_FINANCEIROS.saldo_atual.toFixed(2)}
- Salário: R$ ${DADOS_FINANCEIROS.salario.toFixed(2)}
- Limite de adiantamento disponível: R$ ${DADOS_FINANCEIROS.limite_adiantamento.toFixed(2)}
- Total de entradas: R$ ${DADOS_FINANCEIROS.total_entradas.toFixed(2)}
- Total de saídas: R$ ${DADOS_FINANCEIROS.total_saidas.toFixed(2)}

GASTOS POR CATEGORIA:
${Object.entries(DADOS_FINANCEIROS.gastos_por_categoria).map(([cat, val]) => `- ${cat}: R$ ${val.toFixed(2)}`).join('\n')}

ASSINATURAS ATIVAS:
${DADOS_FINANCEIROS.assinaturas.map(a => `- ${a.nome}: R$ ${a.valor.toFixed(2)}/mês`).join('\n')}
Total em assinaturas: R$ ${DADOS_FINANCEIROS.assinaturas.reduce((sum, a) => sum + a.valor, 0).toFixed(2)}/mês

BENEFÍCIOS CORPORATIVOS:
${DADOS_FINANCEIROS.beneficios.map(b => `- ${b.tipo}: R$ ${b.valor.toFixed(2)}`).join('\n')}

ÚLTIMAS TRANSAÇÕES:
${DADOS_FINANCEIROS.ultimas_transacoes.map(t => `- ${t.descricao}: ${t.tipo === 'entrada' ? '+' : '-'}R$ ${t.valor.toFixed(2)} (${t.categoria})`).join('\n')}

REGRAS:
1. Responda qualquer pergunta do usuário (hora, clima, curiosidades, etc)
2. Para perguntas financeiras, use os dados acima
3. Seja direto e amigável
4. Se perguntarem a hora, use a DATA E HORA ATUAL informada acima`
}

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: 'Olá! Sou o assistente financeiro da aiiaHub. Como posso ajudar você hoje?',
            isBot: true,
            timestamp: new Date()
        }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const sendMessage = async (text: string) => {
        if (!text.trim() || loading) return

        const userMessage: Message = {
            id: Date.now().toString(),
            text: text.trim(),
            isBot: false,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setLoading(true)

        try {
            // Prompt personalizado para o Gemini Flash com data/hora atual
            const prompt = `${getSystemPrompt()}\n\nUsuário: ${text.trim()}`
            const geminiResponse = await askGemini(prompt)

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: geminiResponse || 'Desculpe, não consegui processar sua pergunta.',
                isBot: true,
                timestamp: new Date()
            }

            setMessages(prev => [...prev, botMessage])
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: 'Desculpe, estou com dificuldades para responder. Tente novamente em alguns instantes.',
                isBot: true,
                timestamp: new Date()
            }
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        sendMessage(input)
    }

    return (
        <>
            {/* Botão flutuante */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-300",
                    "bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90",
                    "flex items-center justify-center",
                    isOpen && "scale-0 opacity-0"
                )}
            >
                <MessageCircle className="w-6 h-6 text-white" />
            </button>

            {/* Chat Window */}
            <div className={cn(
                "fixed bottom-6 right-6 z-50 w-96 h-[600px] max-h-[80vh] rounded-2xl shadow-2xl transition-all duration-300 flex flex-col overflow-hidden",
                "bg-background border border-white/10",
                isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
            )}>
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-primary to-violet-600 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Assistente aiiaHub</h3>
                            <p className="text-xs text-white/70">Online</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    >
                        <X className="w-4 h-4 text-white" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex gap-3",
                                msg.isBot ? "justify-start" : "justify-end"
                            )}
                        >
                            {msg.isBot && (
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-4 h-4 text-primary" />
                                </div>
                            )}
                            <div className={cn(
                                "max-w-[80%] p-3 rounded-2xl text-sm",
                                msg.isBot 
                                    ? "bg-card/50 text-white rounded-tl-none" 
                                    : "bg-primary text-white rounded-tr-none"
                            )}>
                                {msg.text}
                            </div>
                            {!msg.isBot && (
                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                            )}
                        </div>
                    ))}

                    {loading && (
                        <div className="flex gap-3 justify-start">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-primary" />
                            </div>
                            <div className="bg-card/50 p-3 rounded-2xl rounded-tl-none">
                                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Sugestões */}
                {messages.length <= 2 && (
                    <div className="px-4 pb-2">
                        <p className="text-xs text-muted-foreground mb-2">Sugestões:</p>
                        <div className="flex flex-wrap gap-2">
                            {SUGESTOES.map((sug, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => sendMessage(sug)}
                                    className="text-xs px-3 py-1.5 rounded-full bg-card/50 text-muted-foreground hover:text-white hover:bg-primary/20 border border-white/10 transition-colors"
                                >
                                    {sug}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input */}
                <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Digite sua pergunta..."
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-card/50 border border-white/10 rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="w-12 h-12 rounded-xl bg-primary hover:bg-primary/90 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </form>
            </div>
        </>
    )
}
