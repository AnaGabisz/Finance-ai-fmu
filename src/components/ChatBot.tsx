import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, Bot, User } from 'lucide-react'
import { cn } from '@/lib/utils'

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
            const userStr = localStorage.getItem('user')
            const userId = userStr 
                ? JSON.parse(userStr).id 
                : 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

            const response = await fetch('http://localhost:8000/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    message: text.trim()
                })
            })

            const data = await response.json()

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: data.resposta || 'Desculpe, não consegui processar sua pergunta.',
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
