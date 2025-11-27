import os
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv

# Importando IA (Fallback se der erro de cota mantém o app rodando)
from utils import categorizar_transacao 

load_dotenv()
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

app = FastAPI(title="Salário Smart - B2B2C MVP")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELS (Inputs) ---
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

# --- ROTAS ---

@app.get("/")
def home():
    return {"status": "API B2B2C Online"}

# 1. GET /extrato-inteligente (Junta Transações + Benefícios)
@app.get("/extrato-inteligente/{user_id}")
def get_extrato_inteligente(user_id: str):
    # Busca transações bancárias
    transacoes = supabase.table("transacoes").select("*").eq("user_id", user_id).order("data", desc=True).execute()
    
    # Busca benefícios corporativos (O diferencial B2B)
    beneficios = supabase.table("beneficios").select("*").eq("user_id", user_id).execute()
    
    return {
        "conta_corrente": transacoes.data,
        "beneficios_corporativos": beneficios.data,
        "analise_ia": "Seus gastos com alimentação superaram o VR este mês." # Mock para demo
    }

# 2. GET /score-financeiro
@app.get("/score-financeiro/{user_id}")
def get_score(user_id: str):
    response = supabase.table("score").select("*").eq("user_id", user_id).execute()
    if not response.data:
        return {"pontuacao": 0, "nivel": "Indefinido"}
    return response.data[0]

# 3. POST /adiantamento (Salário sob demanda)
@app.post("/adiantamento")
def solicitar_adiantamento(req: AdiantamentoRequest):
    # Validação simples: Máximo 40% do salário bruto
    profile = supabase.table("profiles").select("salario_bruto").eq("id", req.user_id).execute()
    salario = profile.data[0]['salario_bruto']
    limite = salario * 0.40
    
    if req.valor > limite:
        raise HTTPException(status_code=400, detail=f"Valor excede o limite de R$ {limite}")

    # Registra o adiantamento
    data_adiantamento = {
        "user_id": req.user_id,
        "valor": req.valor,
        "status": "aprovado",
        "data": datetime.now().isoformat()
    }
    supabase.table("adiantamentos").insert(data_adiantamento).execute()
    
    # Cria transação de entrada para refletir no extrato
    supabase.table("transacoes").insert({
        "user_id": req.user_id,
        "valor": req.valor,
        "tipo": "entrada",
        "categoria": "Adiantamento Salarial",
        "data": datetime.now().isoformat()
    }).execute()
    
    return {"status": "sucesso", "mensagem": "Adiantamento liberado na conta!"}

# 4. POST /simulacao-consignado
@app.post("/simulacao-consignado")
def simular_consignado(req: SimulacaoConsignadoRequest):
    """
    Simula um empréstimo com juros baixos (benefício empresa).
    Juros simples de 1.5% a.m. para demo.
    """
    taxa_juros = 0.015
    montante_final = req.valor_desejado * (1 + taxa_juros * req.parcelas)
    valor_parcela = montante_final / req.parcelas
    
    return {
        "valor_solicitado": req.valor_desejado,
        "taxa_juros_mensal": "1.5%",
        "total_pagar": round(montante_final, 2),
        "valor_parcela": round(valor_parcela, 2),
        "conclusao": "Pré-aprovado pela TechCorp"
    }

# 5. POST /personalizar-trilha
@app.post("/personalizar-trilha")
def set_trilha(req: TrilhaRequest):
    # Salva a preferência do usuário para mudar a UX do app
    supabase.table("profiles").update({"trilha_escolhida": req.trilha}).eq("id", req.user_id).execute()
    
    # Recalcula nivel (exemplo de gamificação)
    supabase.table("score").update({"nivel": "Em evolução"}).eq("user_id", req.user_id).execute()
    
    return {"status": "trilha definida", "nova_interface": req.trilha}