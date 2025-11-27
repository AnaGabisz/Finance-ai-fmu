import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn, Mail, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LoginPage() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        // TODO: Integrar com Supabase Auth
        // Substituir mock por: const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        
        // autenticaçao mockada
        setTimeout(() => {
            try {
                // validaçao simples
                if (!email || !password) {
                    throw new Error('Email e senha são obrigatórios')
                }

                // autenticaçao mockada ate implementar a autenticaçao real
                const mockUser = {
                    id: '1',
                    email: email,
                    full_name: 'Usuário Teste',
                }
                localStorage.setItem('user', JSON.stringify(mockUser))

                navigate('/')
            } catch (err: any) {
                setError(err.message || 'Erro ao fazer login')
            } finally {
                setLoading(false)
            }
        }, 500)
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* efeitos de fundo */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-primary/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-violet-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            {/* card de login */}
            <div className="relative w-full max-w-md">
                <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-8 shadow-2xl shadow-primary/5">
                    {/* header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-violet-500 rounded-2xl mb-4">
                            <LogIn className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                            aiiaHub
                        </h1>
                        <p className="text-muted-foreground mt-2">Entre na sua conta</p>
                    </div>

                    {/* mensagem de erro */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    {/* formulario de login */}
                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* email */}
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-foreground">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    required
                                    className={cn(
                                        "w-full pl-11 pr-4 py-3 bg-background/50 border border-border rounded-lg",
                                        "text-foreground placeholder:text-muted-foreground",
                                        "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                                        "transition-all duration-200"
                                    )}
                                />
                            </div>
                        </div>

                        {/* senha */}
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium text-foreground">
                                Senha
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className={cn(
                                        "w-full pl-11 pr-4 py-3 bg-background/50 border border-border rounded-lg",
                                        "text-foreground placeholder:text-muted-foreground",
                                        "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                                        "transition-all duration-200"
                                    )}
                                />
                            </div>
                        </div>

                        {/* botao de login */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={cn(
                                "w-full py-3 px-4 rounded-lg font-medium text-white",
                                "bg-gradient-to-r from-purple-600 to-violet-500",
                                "hover:from-purple-700 hover:to-violet-600",
                                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
                                "transition-all duration-200 transform hover:scale-[1.02]",
                                "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            )}
                        >
                            {loading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </form>

                    {/* link de cadastro */}
                    <div className="mt-6 text-center">
                        <p className="text-muted-foreground text-sm">
                            Não tem uma conta?{' '}
                            <Link
                                to="/register"
                                className="text-primary hover:text-primary/80 font-medium transition-colors"
                            >
                                Cadastre-se
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

