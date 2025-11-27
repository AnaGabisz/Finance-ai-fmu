export interface Profile {
    id: string
    email: string
    full_name: string
    base_salary: number
    advance_limit: number
    created_at: string
}

export interface Transaction {
    id: string
    user_id: string
    amount: number
    type: 'entrada' | 'saida'
    category: string
    description: string
    created_at: string
}

export interface AdiantamentoRequest {
    user_id: string
    valor: number
}

export interface DashboardData {
    saldo_atual: number
    limite_adiantamento: number
    saude_financeira: number
    gastos_total: number
}
