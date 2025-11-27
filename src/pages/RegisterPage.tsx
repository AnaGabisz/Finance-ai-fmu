import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, Mail, Lock, User, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function RegisterPage() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        baseSalary: '',
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        })
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // validacao
        if (formData.password !== formData.confirmPassword) {
            setError('As senhas não coincidem')
            return
        }

        if (formData.password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres')
            return
        }

        const salary = parseFloat(formData.baseSalary)
        if (isNaN(salary) || salary <= 0) {
            setError('Salário base inválido')
            return
        }

        setLoading(true)

        //mock de cadastro - sera substituido pelo supabase
        setTimeout(() => {
            try {
                // Mock: dados do usuario
                const mockUser = {
                    id: Math.random().toString(36).substring(2, 15),
                    email: formData.email,
                    full_name: formData.fullName,
                    base_salary: salary,
                    advance_limit: salary * 0.4,
                }

                // mock: lista de usuarios
                const users = JSON.parse(localStorage.getItem('users') || '[]')
                users.push(mockUser)
                localStorage.setItem('users', JSON.stringify(users))

                // redirecionar para login
                navigate('/login')
            } catch (err: any) {
                setError(err.message || 'Erro ao criar conta')
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

            {/* formulario de cadastro */}
            <div className="relative w-full max-w-md">
                <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-8 shadow-2xl shadow-primary/5">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-violet-500 rounded-2xl mb-4">
                            <UserPlus className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                            aiiaHub
                        </h1>
                        <p className="text-muted-foreground mt-2">Crie sua conta</p>
                    </div>

                    {/* mensagem de erro */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    {/* formulario de cadastro */}
                    <form onSubmit={handleRegister} className="space-y-5">
                        {/* nome completo */}
                        <div className="space-y-2">
                            <label htmlFor="fullName" className="text-sm font-medium text-foreground">
                                Nome Completo
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="Seu nome"
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

                        {/* email */}
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-foreground">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
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

                        {/* salario base */}
                        <div className="space-y-2">
                            <label htmlFor="baseSalary" className="text-sm font-medium text-foreground">
                                Salário Base (R$)
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    id="baseSalary"
                                    name="baseSalary"
                                    type="number"
                                    step="0.01"
                                    value={formData.baseSalary}
                                    onChange={handleChange}
                                    placeholder="5000.00"
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
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
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

                        {/* confirmar senha */}
                        <div className="space-y-2">
                            <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                                Confirmar Senha
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
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

                        {/* botao de submit */}
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
                            {loading ? 'Criando conta...' : 'Cadastrar'}
                        </button>
                    </form>

                    {/* link para login */}
                    <div className="mt-6 text-center">
                        <p className="text-muted-foreground text-sm">
                            Já tem uma conta?{' '}
                            <Link
                                to="/login"
                                className="text-primary hover:text-primary/80 font-medium transition-colors"
                            >
                                Entrar
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

