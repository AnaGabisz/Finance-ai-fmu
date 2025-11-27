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

export interface Subscription {
    id: string
    user_id: string
    name: string
    amount: number
    category: string
    billing_day: number
    status: 'active' | 'cancelled' | 'paused'
    last_charge_date?: string
    detected_automatically: boolean
    created_at: string
}

export interface DashboardData {
    saldo_atual: number
    limite_adiantamento: number
    saude_financeira: number
    gastos_total: number
    total_assinaturas?: number
    assinaturas_ativas?: number
}
