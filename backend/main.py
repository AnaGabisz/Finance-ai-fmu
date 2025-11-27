import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv
from collections import defaultdict

# Importando nossa inteligência
from utils import categorizar_transacao, calcular_score_saude

# ============================================================================
# 1. CONFIGURAÇÃO INICIAL
# ============================================================================
load_dotenv()
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

app = FastAPI(
    title="aiiaHub API",
    description="API para gestão financeira inteligente com IA",
    version="1.0.0"
)

# CORS - Permitir requisições do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# 2. MODELOS DE DADOS (Pydantic)
# ============================================================================

class CategorizacaoRequest(BaseModel):
    descricao: str

class AdiantamentoRequest(BaseModel):
    user_id: str
    valor: float

class SubscriptionCreate(BaseModel):
    user_id: str
    name: str
    amount: float
    category: str
    billing_day: int
    detected_automatically: bool = False

class SubscriptionUpdate(BaseModel):
    status: str = None
    amount: float = None
    billing_day: int = None

# ============================================================================
# 3. ENDPOINTS - HEALTH CHECK
# ============================================================================

@app.get("/")
def read_root():
    """Health check endpoint"""
    return {
        "status": "online",
        "app": "aiiaHub API",
        "version": "1.0.0"
    }

# ============================================================================
# 4. ENDPOINTS - IA / CATEGORIZAÇÃO
# ============================================================================

@app.post("/categorizar")
def prever_categoria(req: CategorizacaoRequest):
    """
    Endpoint para categorizar transações usando IA (Gemini).
    Útil para o frontend validar categorias antes de salvar.
    """
    categoria = categorizar_transacao(req.descricao)
    return {
        "descricao": req.descricao,
        "categoria_sugerida": categoria
    }

# ============================================================================
# 5. ENDPOINTS - DASHBOARD
# ============================================================================

@app.get("/dashboard/{user_id}")
def get_dashboard(user_id: str):
    """
    Retorna dados consolidados do dashboard:
    - Saldo atual
    - Limite de adiantamento
    - Score de saúde financeira
    - Total de gastos
    - Total de assinaturas ativas
    """
    # A. Buscar perfil do usuário
    profile = supabase.table("profiles").select("*").eq("id", user_id).execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    dados_perfil = profile.data[0]
    
    # B. Buscar transações
    transacoes = supabase.table("transactions").select("*").eq("user_id", user_id).execute()
    
    total_entradas = sum(t['amount'] for t in transacoes.data if t['type'] == 'entrada')
    total_saidas = sum(t['amount'] for t in transacoes.data if t['type'] == 'saida')
    saldo_atual = total_entradas - total_saidas
    
    # Calcular adiantamentos (para penalizar score)
    adiantamentos_feitos = sum(1 for t in transacoes.data if t['category'] == 'Adiantamento')
    
    # C. Calcular Score de Saúde Financeira
    score = calcular_score_saude(
        gastos=total_saidas,
        renda=total_entradas,
        adiantamentos_ativos=adiantamentos_feitos
    )
    
    # D. Buscar assinaturas ativas
    assinaturas = supabase.table("subscriptions").select("*").eq("user_id", user_id).eq("status", "active").execute()
    total_assinaturas = sum(s['amount'] for s in assinaturas.data)
    assinaturas_ativas = len(assinaturas.data)
    
    return {
        "saldo_atual": round(saldo_atual, 2),
        "limite_adiantamento": dados_perfil['advance_limit'],
        "saude_financeira": score,
        "gastos_total": round(total_saidas, 2),
        "renda_total": round(total_entradas, 2),
        "total_assinaturas": round(total_assinaturas, 2),
        "assinaturas_ativas": assinaturas_ativas
    }

# ============================================================================
# 6. ENDPOINTS - EXTRATO / TRANSAÇÕES
# ============================================================================

@app.get("/extrato/{user_id}")
def get_extrato(user_id: str):
    """Retorna as últimas 50 transações do usuário ordenadas por data"""
    response = supabase.table("transactions") \
        .select("*") \
        .eq("user_id", user_id) \
        .order("created_at", desc=True) \
        .limit(50) \
        .execute()
    return response.data

# ============================================================================
# 7. ENDPOINTS - ADIANTAMENTO SALARIAL
# ============================================================================

@app.post("/adiantamento")
def solicitar_adiantamento(req: AdiantamentoRequest):
    """
    Solicita adiantamento salarial.
    Valida limite, registra transação e cobra taxa de serviço.
    """
    # 1. Verificar limite disponível
    profile = supabase.table("profiles").select("*").eq("id", req.user_id).execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    user_data = profile.data[0]
    
    if req.valor > user_data['advance_limit']:
        raise HTTPException(status_code=400, detail="Valor excede o limite disponível")
    
    # 2. Registrar entrada (dinheiro na conta)
    supabase.table("transactions").insert({
        "user_id": req.user_id,
        "amount": req.valor,
        "type": "entrada",
        "category": "Adiantamento",
        "description": "Adiantamento Salarial"
    }).execute()
    
    # 3. Atualizar limite no perfil
    novo_limite = float(user_data['advance_limit']) - req.valor
    supabase.table("profiles").update({
        "advance_limit": novo_limite
    }).eq("id", req.user_id).execute()
    
    # 4. Registrar taxa de serviço
    taxa = 5.90
    supabase.table("transactions").insert({
        "user_id": req.user_id,
        "amount": taxa,
        "type": "saida",
        "category": "Taxas",
        "description": "Taxa de Serviço - Adiantamento"
    }).execute()
    
    return {
        "status": "sucesso",
        "novo_saldo_limite": novo_limite,
        "mensagem": "Adiantamento liberado com sucesso!"
    }

# ============================================================================
# 8. ENDPOINTS - ASSINATURAS INTELIGENTES
# ============================================================================

@app.get("/assinaturas/{user_id}")
def get_assinaturas(user_id: str):
    """Lista todas as assinaturas do usuário"""
    response = supabase.table("subscriptions") \
        .select("*") \
        .eq("user_id", user_id) \
        .order("created_at", desc=False) \
        .execute()
    return response.data

@app.post("/assinaturas")
def criar_assinatura(sub: SubscriptionCreate):
    """Cria uma nova assinatura"""
    response = supabase.table("subscriptions").insert({
        "user_id": sub.user_id,
        "name": sub.name,
        "amount": sub.amount,
        "category": sub.category,
        "billing_day": sub.billing_day,
        "detected_automatically": sub.detected_automatically,
        "status": "active"
    }).execute()
    return response.data[0]

@app.patch("/assinaturas/{subscription_id}")
def atualizar_assinatura(subscription_id: str, update: SubscriptionUpdate):
    """Atualiza status ou dados de uma assinatura (pausar, reativar, etc)"""
    update_data = {}
    if update.status:
        update_data["status"] = update.status
    if update.amount:
        update_data["amount"] = update.amount
    if update.billing_day:
        update_data["billing_day"] = update.billing_day
    
    response = supabase.table("subscriptions") \
        .update(update_data) \
        .eq("id", subscription_id) \
        .execute()
    return response.data[0]

@app.delete("/assinaturas/{subscription_id}")
def deletar_assinatura(subscription_id: str):
    """Deleta uma assinatura"""
    supabase.table("subscriptions") \
        .delete() \
        .eq("id", subscription_id) \
        .execute()
    return {"status": "deleted", "message": "Assinatura removida com sucesso"}

@app.get("/assinaturas/detectar/{user_id}")
def detectar_assinaturas(user_id: str):
    """
    Detecta assinaturas recorrentes automaticamente analisando transações.
    Identifica padrões de cobranças repetidas (3+ ocorrências).
    """
    # Buscar transações de saída dos últimos meses
    transacoes = supabase.table("transactions") \
        .select("*") \
        .eq("user_id", user_id) \
        .eq("type", "saida") \
        .order("created_at", desc=True) \
        .limit(100) \
        .execute()
    
    # Agrupar por descrição e valor (chave única)
    recorrentes = defaultdict(list)
    
    for tx in transacoes.data:
        desc = tx['description'].lower()
        valor = tx['amount']
        key = f"{desc}_{valor}"
        recorrentes[key].append(tx)
    
    # Detectar padrões: 3+ ocorrências = possível assinatura
    assinaturas_detectadas = []
    for key, txs in recorrentes.items():
        if len(txs) >= 3:
            assinaturas_detectadas.append({
                "name": txs[0]['description'],
                "amount": txs[0]['amount'],
                "category": txs[0]['category'],
                "occurrences": len(txs),
                "detected": True
            })
    
    return assinaturas_detectadas
