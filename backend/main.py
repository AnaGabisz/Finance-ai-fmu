import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from supabase import create_client, Client
from dotenv import load_dotenv
from collections import defaultdict

# Importando nossa inteligência
from utils import categorizar_transacao, calcular_score_saude, gerar_analise_ia

# ============================================================================
# 1. CONFIGURAÇÃO INICIAL
# ============================================================================
load_dotenv()
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

# Inicializar Supabase com tratamento de erro
supabase: Client = None
try:
    if url and key:
        supabase = create_client(url, key)
        print("✅ Supabase conectado!")
    else:
        print("⚠️ Supabase não configurado - usando modo demo")
except Exception as e:
    print(f"⚠️ Erro ao conectar Supabase: {e}")

# Usuário de teste para demo
DEMO_USER_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"

app = FastAPI(
    title="aiiaHub API",
    description="API para gestão financeira inteligente B2B2C com IA",
    version="2.0.0"
)

# CORS - Permitir requisições do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# 2. MODELOS DE DADOS (Pydantic)
# ============================================================================

class LoginRequest(BaseModel):
    email: str
    password: str

class CategorizacaoRequest(BaseModel):
    descricao: str

class AdiantamentoRequest(BaseModel):
    user_id: str
    valor: float

class SimulacaoConsignadoRequest(BaseModel):
    user_id: str
    valor_desejado: float
    parcelas: int

class SubscriptionCreate(BaseModel):
    user_id: str
    name: str
    amount: float
    category: str
    billing_day: int
    detected_automatically: bool = False

class SubscriptionUpdate(BaseModel):
    status: Optional[str] = None
    amount: Optional[float] = None
    billing_day: Optional[int] = None

# ============================================================================
# 3. ENDPOINTS - HEALTH CHECK
# ============================================================================

@app.get("/")
def read_root():
    """Health check endpoint"""
    return {
        "status": "online",
        "app": "aiiaHub API",
        "version": "2.0.0",
        "demo_user_id": DEMO_USER_ID
    }

# ============================================================================
# 4. ENDPOINTS - AUTENTICAÇÃO (Mock para Demo)
# ============================================================================

@app.post("/login")
def login(req: LoginRequest):
    """
    Login mockado para demonstração.
    Qualquer email/senha retorna o usuário de teste.
    """
    return {
        "status": "success",
        "user_id": DEMO_USER_ID,
        "name": "João da Silva",
        "email": req.email,
        "token": "demo-token-aiiaHub"
    }

# ============================================================================
# 5. ENDPOINTS - IA / CATEGORIZAÇÃO
# ============================================================================

@app.post("/categorizar")
def prever_categoria(req: CategorizacaoRequest):
    """
    Categoriza transações usando IA (Gemini).
    Tempo de resposta: 1-2 segundos.
    """
    categoria = categorizar_transacao(req.descricao)
    return {
        "descricao": req.descricao,
        "categoria_sugerida": categoria
    }

# ============================================================================
# 6. ENDPOINTS - DASHBOARD / EXTRATO INTELIGENTE (B2B2C)
# ============================================================================

@app.get("/extrato-inteligente/{user_id}")
def get_extrato_inteligente(user_id: str):
    """
    Retorna visão unificada B2B2C:
    - Conta corrente (transações)
    - Benefícios corporativos (VR, VA, Gympass)
    - Análise da IA com insights financeiros
    
    Tempo de resposta: 1-2 segundos (IA).
    """
    # A. Buscar perfil
    profile = supabase.table("profiles").select("*").eq("id", user_id).execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    dados_perfil = profile.data[0]
    
    # B. Buscar transações (conta corrente)
    transacoes = supabase.table("transactions") \
        .select("*") \
        .eq("user_id", user_id) \
        .order("created_at", desc=True) \
        .limit(20) \
        .execute()
    
    # Calcular saldo
    todas_transacoes = supabase.table("transactions").select("*").eq("user_id", user_id).execute()
    total_entradas = sum(t['amount'] for t in todas_transacoes.data if t['type'] == 'entrada')
    total_saidas = sum(t['amount'] for t in todas_transacoes.data if t['type'] == 'saida')
    saldo_bancario = total_entradas - total_saidas
    
    # C. Buscar benefícios corporativos
    beneficios = supabase.table("beneficios").select("*").eq("user_id", user_id).execute()
    
    # Se não houver benefícios, usar mock
    beneficios_lista = beneficios.data if beneficios.data else [
        {"tipo": "Vale Refeição", "valor": 800.00},
        {"tipo": "Vale Alimentação", "valor": 400.00},
        {"tipo": "Gympass", "valor": 89.90}
    ]
    
    # D. Gerar análise da IA
    analise = gerar_analise_ia(transacoes.data, saldo_bancario, beneficios_lista)
    
    # E. Formatar transações para o frontend
    conta_corrente = [
        {
            "id": t['id'],
            "valor": t['amount'],
            "tipo": t['type'],
            "categoria": t['category'],
            "descricao": t['description'],
            "data": t['created_at']
        }
        for t in transacoes.data
    ]
    
    return {
        "saldo_bancario": round(saldo_bancario, 2),
        "conta_corrente": conta_corrente,
        "beneficios_corporativos": beneficios_lista,
        "analise_ia": analise
    }

@app.get("/score-financeiro/{user_id}")
def get_score_financeiro(user_id: str):
    """
    Retorna score financeiro gamificado.
    Níveis: Bronze (0-400), Prata (401-700), Ouro (701-1000)
    """
    # Buscar transações
    transacoes = supabase.table("transactions").select("*").eq("user_id", user_id).execute()
    
    total_entradas = sum(t['amount'] for t in transacoes.data if t['type'] == 'entrada')
    total_saidas = sum(t['amount'] for t in transacoes.data if t['type'] == 'saida')
    adiantamentos = sum(1 for t in transacoes.data if t['category'] == 'Adiantamento')
    
    # Calcular score
    pontuacao = calcular_score_saude(
        gastos=total_saidas,
        renda=total_entradas,
        adiantamentos_ativos=adiantamentos
    )
    
    # Determinar nível
    if pontuacao <= 400:
        nivel = "Bronze"
    elif pontuacao <= 700:
        nivel = "Prata"
    else:
        nivel = "Ouro"
    
    return {
        "pontuacao": pontuacao,
        "nivel": nivel,
        "max_pontuacao": 1000
    }

@app.get("/dashboard/{user_id}")
def get_dashboard(user_id: str):
    """
    Retorna dados consolidados do dashboard (versão simplificada).
    """
    # Buscar perfil
    profile = supabase.table("profiles").select("*").eq("id", user_id).execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    dados_perfil = profile.data[0]
    
    # Buscar transações
    transacoes = supabase.table("transactions").select("*").eq("user_id", user_id).execute()
    
    total_entradas = sum(t['amount'] for t in transacoes.data if t['type'] == 'entrada')
    total_saidas = sum(t['amount'] for t in transacoes.data if t['type'] == 'saida')
    saldo_atual = total_entradas - total_saidas
    adiantamentos_feitos = sum(1 for t in transacoes.data if t['category'] == 'Adiantamento')
    
    # Score
    score = calcular_score_saude(
        gastos=total_saidas,
        renda=total_entradas,
        adiantamentos_ativos=adiantamentos_feitos
    )
    
    # Assinaturas
    assinaturas = supabase.table("subscriptions").select("*").eq("user_id", user_id).eq("status", "active").execute()
    total_assinaturas = sum(s['amount'] for s in assinaturas.data)
    
    return {
        "saldo_atual": round(saldo_atual, 2),
        "limite_adiantamento": dados_perfil.get('advance_limit', 0),
        "saude_financeira": score,
        "gastos_total": round(total_saidas, 2),
        "renda_total": round(total_entradas, 2),
        "total_assinaturas": round(total_assinaturas, 2),
        "assinaturas_ativas": len(assinaturas.data)
    }

# ============================================================================
# 7. ENDPOINTS - EXTRATO / TRANSAÇÕES
# ============================================================================

@app.get("/extrato/{user_id}")
def get_extrato(user_id: str, limit: int = 50, categoria: str = None, tipo: str = None):
    """
    Retorna transações com filtros opcionais.
    """
    query = supabase.table("transactions").select("*").eq("user_id", user_id)
    
    if categoria:
        query = query.eq("category", categoria)
    if tipo:
        query = query.eq("type", tipo)
    
    response = query.order("created_at", desc=True).limit(limit).execute()
    return response.data

@app.get("/extrato/{user_id}/resumo")
def get_extrato_resumo(user_id: str):
    """Retorna resumo financeiro com gastos por categoria."""
    transacoes = supabase.table("transactions").select("*").eq("user_id", user_id).execute()
    
    total_entradas = sum(t['amount'] for t in transacoes.data if t['type'] == 'entrada')
    total_saidas = sum(t['amount'] for t in transacoes.data if t['type'] == 'saida')
    
    gastos_por_categoria = {}
    for t in transacoes.data:
        if t['type'] == 'saida':
            cat = t['category']
            gastos_por_categoria[cat] = gastos_por_categoria.get(cat, 0) + t['amount']
    
    categorias_ordenadas = sorted(gastos_por_categoria.items(), key=lambda x: x[1], reverse=True)
    
    return {
        "total_entradas": round(total_entradas, 2),
        "total_saidas": round(total_saidas, 2),
        "saldo": round(total_entradas - total_saidas, 2),
        "total_transacoes": len(transacoes.data),
        "gastos_por_categoria": [
            {"categoria": cat, "valor": round(val, 2)} 
            for cat, val in categorias_ordenadas
        ]
    }

# ============================================================================
# 8. ENDPOINTS - SERVIÇOS FINANCEIROS
# ============================================================================

@app.post("/adiantamento")
def solicitar_adiantamento(req: AdiantamentoRequest):
    """
    Solicita adiantamento salarial.
    Limite: 40% do salário base.
    """
    profile = supabase.table("profiles").select("*").eq("id", req.user_id).execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    user_data = profile.data[0]
    limite = user_data.get('advance_limit', 0)
    
    if req.valor > limite:
        raise HTTPException(
            status_code=400, 
            detail=f"Valor excede o limite disponível de R$ {limite:.2f}"
        )
    
    # Registrar entrada
    supabase.table("transactions").insert({
        "user_id": req.user_id,
        "amount": req.valor,
        "type": "entrada",
        "category": "Adiantamento",
        "description": "Adiantamento Salarial aiiaHub"
    }).execute()
    
    # Atualizar limite
    novo_limite = float(limite) - req.valor
    supabase.table("profiles").update({"advance_limit": novo_limite}).eq("id", req.user_id).execute()
    
    # Taxa de serviço
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
        "mensagem": "Adiantamento liberado na conta!"
    }

@app.post("/simulacao-consignado")
def simular_consignado(req: SimulacaoConsignadoRequest):
    """
    Simula empréstimo consignado.
    Taxa: 1.5% ao mês.
    """
    profile = supabase.table("profiles").select("*").eq("id", req.user_id).execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    user_data = profile.data[0]
    salario = user_data.get('salario_bruto', user_data.get('base_salary', 5000))
    
    # Cálculo do empréstimo (taxa 1.5% a.m.)
    taxa_mensal = 0.015
    total_pagar = req.valor_desejado * ((1 + taxa_mensal) ** req.parcelas)
    valor_parcela = total_pagar / req.parcelas
    
    # Verificar margem consignável (30% do salário)
    margem = salario * 0.30
    aprovado = valor_parcela <= margem
    
    return {
        "valor_solicitado": req.valor_desejado,
        "total_pagar": round(total_pagar, 2),
        "valor_parcela": round(valor_parcela, 2),
        "parcelas": req.parcelas,
        "taxa_mensal": f"{taxa_mensal * 100}%",
        "margem_disponivel": round(margem, 2),
        "conclusao": "Pré-aprovado" if aprovado else "Parcela excede margem consignável",
        "aprovado": aprovado
    }

# ============================================================================
# 9. ENDPOINTS - ASSINATURAS INTELIGENTES
# ============================================================================

@app.get("/assinaturas/{user_id}")
def get_assinaturas(user_id: str):
    """Lista todas as assinaturas do usuário."""
    response = supabase.table("subscriptions") \
        .select("*") \
        .eq("user_id", user_id) \
        .order("created_at", desc=False) \
        .execute()
    return response.data

@app.post("/assinaturas")
def criar_assinatura(sub: SubscriptionCreate):
    """Cria uma nova assinatura."""
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
    """Atualiza status ou dados de uma assinatura."""
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
    """Deleta uma assinatura."""
    supabase.table("subscriptions").delete().eq("id", subscription_id).execute()
    return {"status": "deleted", "message": "Assinatura removida"}

@app.get("/assinaturas/detectar/{user_id}")
def detectar_assinaturas(user_id: str):
    """
    Detecta assinaturas recorrentes automaticamente.
    Tempo de resposta: 1-2 segundos.
    """
    transacoes = supabase.table("transactions") \
        .select("*") \
        .eq("user_id", user_id) \
        .eq("type", "saida") \
        .order("created_at", desc=True) \
        .limit(100) \
        .execute()
    
    recorrentes = defaultdict(list)
    for tx in transacoes.data:
        desc = tx['description'].lower()
        valor = tx['amount']
        key = f"{desc}_{valor}"
        recorrentes[key].append(tx)
    
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


# ============================================================================
# 10. ENDPOINTS - CHATBOT FINANCEIRO INTELIGENTE
# ============================================================================

class ChatRequest(BaseModel):
    user_id: str
    message: str

@app.post("/chat")
def chat_financeiro(req: ChatRequest):
    """
    Chatbot financeiro inteligente usando Gemini.
    Responde perguntas sobre gastos, análises e recomendações.
    
    Exemplos de perguntas:
    - "Quanto gastei em alimentação este mês?"
    - "Qual minha maior despesa?"
    - "Me dá um resumo das minhas finanças"
    - "Posso pedir adiantamento de R$ 300?"
    """
    from utils import processar_chat_financeiro
    
    # Buscar todos os dados do usuário para contexto
    try:
        # Transações
        transacoes = supabase.table("transactions") \
            .select("*") \
            .eq("user_id", req.user_id) \
            .order("created_at", desc=True) \
            .limit(100) \
            .execute()
        
        # Perfil
        profile = supabase.table("profiles").select("*").eq("id", req.user_id).execute()
        dados_perfil = profile.data[0] if profile.data else {}
        
        # Assinaturas
        assinaturas = supabase.table("subscriptions") \
            .select("*") \
            .eq("user_id", req.user_id) \
            .execute()
        
        # Benefícios
        beneficios = supabase.table("beneficios").select("*").eq("user_id", req.user_id).execute()
        beneficios_lista = beneficios.data if beneficios.data else [
            {"tipo": "Vale Refeição", "valor": 800.00},
            {"tipo": "Vale Alimentação", "valor": 400.00}
        ]
        
        # Calcular métricas
        total_entradas = sum(t['amount'] for t in transacoes.data if t['type'] == 'entrada')
        total_saidas = sum(t['amount'] for t in transacoes.data if t['type'] == 'saida')
        saldo = total_entradas - total_saidas
        
        # Gastos por categoria
        gastos_categoria = {}
        for t in transacoes.data:
            if t['type'] == 'saida':
                cat = t['category']
                gastos_categoria[cat] = gastos_categoria.get(cat, 0) + t['amount']
        
        # Contexto financeiro completo
        contexto = {
            "saldo_atual": round(saldo, 2),
            "total_entradas": round(total_entradas, 2),
            "total_saidas": round(total_saidas, 2),
            "limite_adiantamento": dados_perfil.get('advance_limit', 0),
            "salario": dados_perfil.get('salario_bruto', dados_perfil.get('base_salary', 0)),
            "gastos_por_categoria": gastos_categoria,
            "assinaturas_ativas": [
                {"nome": s['name'], "valor": s['amount']} 
                for s in assinaturas.data if s.get('status') == 'active'
            ],
            "total_assinaturas": sum(s['amount'] for s in assinaturas.data if s.get('status') == 'active'),
            "beneficios": beneficios_lista,
            "ultimas_transacoes": [
                {
                    "descricao": t['description'],
                    "valor": t['amount'],
                    "tipo": t['type'],
                    "categoria": t['category'],
                    "data": t['created_at']
                }
                for t in transacoes.data[:20]
            ]
        }
        
        # Processar com IA
        resposta = processar_chat_financeiro(req.message, contexto)
        
        return {
            "resposta": resposta,
            "contexto_usado": True
        }
        
    except Exception as e:
        print(f"Erro no chat: {e}")
        return {
            "resposta": "Desculpe, tive um problema ao processar sua pergunta. Tente novamente.",
            "contexto_usado": False,
            "erro": str(e)
        }
