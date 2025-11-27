import { Outlet, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Wallet, ArrowRightLeft, LogOut, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'
import ChatBot from '@/components/ChatBot'

export default function Layout() {
    const location = useLocation()

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: ArrowRightLeft, label: 'Extrato', path: '/extrato' },
        { icon: Wallet, label: 'Assinaturas', path: '/assinaturas' },
        { icon: CreditCard, label: 'Adiantamento', path: '/adiantamento' },
    ]

    return (
        <div className="min-h-screen bg-background text-foreground flex">
            {/* barra lateral */}
            <aside className="w-64 border-r border-border bg-card/50 backdrop-blur-xl hidden md:flex flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-primary bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                        aiiaHub
                    </h1>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = location.pathname === item.path
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                )}
                            >
                                <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-border">
                    <button className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors">
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Sair</span>
                    </button>
                </div>
            </aside>

            {/* header smartphone*/}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-card/50 backdrop-blur-xl border-b border-border flex items-center px-4 z-50">
                <h1 className="text-xl font-bold text-primary">aiiaHub</h1>
            </div>

            {/* conteudo principal */}
            <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 md:pt-8">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>

            {/* Chatbot flutuante */}
            <ChatBot />
        </div>
    )
}
