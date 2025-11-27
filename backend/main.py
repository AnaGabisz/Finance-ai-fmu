import os
from datetime import datetime
from typing import Optional, List, Dict
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv

# Importando IA (Certifique-se que utils.py está na mesma pasta)
from utils import categorizar_transacao, calcular_score_saude

# 1. Configuração Inicial
load_dotenv()
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("⚠️ AVISO: Variáveis de ambiente SUPABASE_URL ou SUPABASE_KEY não encontradas.")

supabase: Client = create_client(url, key)

app = FastAPI(title="Salário Smart - B2B2C MVP")

# 2. Configuração de CORS (Permite acesso do Front-end Mobile/Web)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 3. MODELOS DE DADOS (PYDANTIC) ---

class LoginRequest(BaseModel):
    email: str
    password: str

class AdiantamentoRequest(BaseModel):
    user_id: str
    valor: float

class SimulacaoConsignadoRequest(BaseModel):
    user_id: str
    valor_desejado: float
    parcelas: int

class TrilhaRequest(BaseModel):
    user_id: str
    trilha: str # Ex: 'Sair das Dívidas', 'Começar a Investir'

class RegraRequest(BaseModel):
    user_id: str
    keyword: str  # Ex: "Starbucks"
    category: str # Ex: "Reuniões"

class CategorizacaoRequest(BaseModel):
    user_id: str
    descricao: str

# Models de Assinaturas
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


# --- 4. ENDPOINTS DA API ---

@app.get("/")
def home():
    return {"status": "API Online", "version": "MVP Final", "ai_engine": "Gemini Pro"}

# --- AUTH (MOCK) ---
@app.post("/login")
def fake_login(req: LoginRequest):
    """
    Login simulado para a Demo. Retorna sempre o usuário João da Silva.
    """
    # ID fixo do nosso seed para garantir que tem dados
    return {
        "status": "success",
        "user_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        "name": "João da Silva",
        "role": "Colaborador TechCorp",
        "token": "demo-token-123"
    }

# --- DASHBOARD B2B2C ---
@app.get("/extrato-inteligente/{user_id}")
def get_extrato_inteligente(user_id: str):
    # Busca transações (Ledger unificado)
    transacoes = supabase.table("transacoes").select("*").eq("user_id", user_id).order("data", desc=True).execute()
    
    # Busca benefícios (VR, VA, Gympass)
    beneficios = supabase.table("beneficios").select("*").eq("user_id", user_id).execute()
    
    # Cálculo simples de totais
    total_entradas = sum(t['valor'] for t in transacoes.data if t['tipo'] == 'entrada')
    total_saidas = sum(t['valor'] for t in transacoes.data if t['tipo'] == 'saida')
    saldo_conta = total_entradas - total_saidas
    
    return {
        "saldo_bancario": round(saldo_conta, 2),
        "conta_corrente": transacoes.data,
        "beneficios_corporativos": beneficios.data,
        "analise_ia": "Seus gastos com alimentação superaram o VR este mês. Sugiro usar a marmita na semana que vem." 
    }

# --- GAMIFICATION ---
@app.get("/score-financeiro/{user_id}")
def get_score(user_id: str):
    response = supabase.table("score").select("*").eq("user_id", user_id).execute()
    if not response.data:
        # Fallback se não tiver score
        return {"pontuacao": 500, "nivel": "Bronze", "ultima_atualizacao": datetime.now().isoformat()}
    return response.data[0]

# --- SERVIÇOS FINANCEIROS ---
@app.post("/adiantamento")
def solicitar_adiantamento(req: AdiantamentoRequest):
    # 1. Verificar Perfil e Salário
    profile = supabase.table("profiles").select("salario_bruto").eq("id", req.user_id).execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")

    salario = profile.data[0]['salario_bruto']
    limite = salario * 0.40 # Regra de negócio: 40% do bruto
    
    if req.valor > limite:
        raise HTTPException(status_code=400, detail=f"Valor excede o limite disponível de R$ {limite:.2f}")

    # 2. Registrar o Pedido
    data_adiantamento = {
        "user_id": req.user_id,
        "valor": req.valor,
        "status": "aprovado",
        "data": datetime.now().isoformat()
    }
    supabase.table("adiantamentos").insert(data_adiantamento).execute()
    
    # 3. Creditar na Conta (Transação de Entrada)
    supabase.table("transacoes").insert({
        "user_id": req.user_id,
        "valor": req.valor,
        "tipo": "entrada",
        "categoria": "Adiantamento Salarial",
        "data": datetime.now().isoformat()
    }).execute()
    
    # 4. Debitar Taxa (Monetização)
    supabase.table("transacoes").insert({
        "user_id": req.user_id,
        "valor": 5.90,
        "tipo": "saida",
        "categoria": "Taxas",
        "data": datetime.now().isoformat()
    }).execute()
    
    return {"status": "sucesso", "mensagem": "Adiantamento liberado na conta!"}

@app.post("/simulacao-consignado")
def simular_consignado(req: SimulacaoConsignadoRequest):
    """
    Simula um empréstimo com juros baixos (benefício empresa).
    """
    taxa_juros = 0.015 # 1.5% a.m.
    montante_final = req.valor_desejado * (1 + taxa_juros * req.parcelas)
    valor_parcela = montante_final / req.parcelas
    
    return {
        "valor_solicitado": req.valor_desejado,
        "taxa_juros_mensal": "1.5%",
        "total_pagar": round(montante_final, 2),
        "valor_parcela": round(valor_parcela, 2),
        "conclusao": "Pré-aprovado pela TechCorp"
    }

@app.post("/personalizar-trilha")
def set_trilha(req: TrilhaRequest):
    # Salva a preferência UX do usuário
    supabase.table("profiles").update({"trilha_escolhida": req.trilha}).eq("id", req.user_id).execute()
    # Gamification: Usuário ganha XP por configurar
    supabase.table("score").update({"nivel": "Em evolução"}).eq("user_id", req.user_id).execute()
    
    return {"status": "trilha definida", "nova_interface": req.trilha}

# --- IA PERSONALIZADA (RAG) ---

@app.post("/definir-regra")
def criar_regra_personalizada(req: RegraRequest):
    """
    O usuário ensina a IA: 'Sempre que aparecer X, marque como Y'.
    """
    try:
        supabase.table("custom_rules").insert({
            "user_id": req.user_id,
            "keyword": req.keyword,
            "category": req.category
        }).execute()
        return {"status": "sucesso", "mensagem": f"Entendido! A IA aprendeu que '{req.keyword}' é '{req.category}'."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/categorizar")
def prever_categoria(req: CategorizacaoRequest):
    """
    Categoriza usando Gemini, influenciado pelas regras do usuário.
    """
    # 1. Busca regras no banco
    regras_db = supabase.table("custom_rules").select("*").eq("user_id", req.user_id).execute()
    lista_regras = regras_db.data if regras_db.data else []
    
    # 2. Chama a IA (Utils)
    categoria = categorizar_transacao(req.descricao, regras_usuario=lista_regras)
    
    return {
        "descricao": req.descricao, 
        "regras_personalizadas_encontradas": len(lista_regras),
        "categoria_sugerida": categoria
    }

# --- GESTÃO DE ASSINATURAS (NOVO MÓDULO) ---

@app.get("/assinaturas/{user_id}")
def get_assinaturas(user_id: str):
    """Lista todas as assinaturas ativas do usuário"""
    response = supabase.table("subscriptions") \
        .select("*") \
        .eq("user_id", user_id) \
        .order("created_at", desc=False) \
        .execute()
    return response.data

@app.post("/assinaturas")
def criar_assinatura(sub: SubscriptionCreate):
    """Cria uma nova assinatura manualmente"""
    response = supabase.table("subscriptions").insert({
        "user_id": sub.user_id,
        "name": sub.name,
        "amount": sub.amount,
        "category": sub.category,
        "billing_day": sub.billing_day,
        "detected_automatically": sub.detected_automatically,
        "status": "active"
    }).execute()
    
    if not response.data:
        raise HTTPException(status_code=500, detail="Erro ao criar assinatura")
        
    return response.data[0]

@app.patch("/assinaturas/{subscription_id}")
def atualizar_assinatura(subscription_id: str, update: SubscriptionUpdate):
    """Atualiza status, valor ou data de cobrança"""
    update_data = {}
    if update.status: update_data["status"] = update.status
    if update.amount: update_data["amount"] = update.amount
    if update.billing_day: update_data["billing_day"] = update.billing_day
    
    response = supabase.table("subscriptions") \
        .update(update_data) \
        .eq("id", subscription_id) \
        .execute()
        
    if not response.data:
        raise HTTPException(status_code=404, detail="Assinatura não encontrada")
        
    return response.data[0]

@app.delete("/assinaturas/{subscription_id}")
def deletar_assinatura(subscription_id: str):
    """Remove uma assinatura"""
    supabase.table("subscriptions").delete().eq("id", subscription_id).execute()
    return {"status": "deleted", "message": "Assinatura removida com sucesso"}

@app.get("/assinaturas/detectar/{user_id}")
def detectar_assinaturas(user_id: str):
    """
    Algoritmo de IA Simples:
    Analisa o histórico e encontra transações repetidas (mesmo nome, valor similar).
    """
    # 1. Buscar últimas 100 transações de saída
    transacoes = supabase.table("transacoes") \
        .select("*") \
        .eq("user_id", user_id) \
        .eq("tipo", "saida") \
        .order("data", desc=True) \
        .limit(100) \
        .execute()
    
    if not transacoes.data:
        return []

    # 2. Agrupamento Inteligente
    ocorrencias = {} # Key: "netflix", Value: stats
    
    for t in transacoes.data:
        # Normaliza o nome: "Netflix *Pagamento" -> "netflix"
        raw_desc = t.get('descricao') or t.get('category') or 'Outros'
        key = raw_desc.split('*')[0].strip().lower() 
        
        if key not in ocorrencias:
            ocorrencias[key] = {
                "count": 0, 
                "total_amount": 0.0, 
                "original_name": raw_desc,
                "category": t.get('categoria', 'Outros')
            }
        
        ocorrencias[key]["count"] += 1
        ocorrencias[key]["total_amount"] += float(t['valor'])

    # 3. Filtragem de Candidatos (Recorrência >= 2)
    candidatos = []
    for key, data in ocorrencias.items():
        if data["count"] >= 2: 
            media_valor = data["total_amount"] / data["count"]
            candidatos.append({
                "name": data["original_name"],
                "estimated_amount": round(media_valor, 2),
                "category": data["category"],
                "frequency_found": data["count"],
                "confidence": "High" if data["count"] > 3 else "Medium"
            })
            
    return candidatos