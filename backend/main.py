import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv

# Importando nossa inteligência (Passo 3)
from utils import categorizar_transacao, calcular_score_saude

# 1. Configuração Inicial
load_dotenv()
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

app = FastAPI(title="Salário Smart API - V1.0")

# 2. Modelos de Dados (Pydantic)
class AdiantamentoRequest(BaseModel):
    user_id: str
    valor: float

class CategorizacaoRequest(BaseModel):
    descricao: str

# 3. ENDPOINTS

@app.get("/")
def read_root():
    return {"status": "online", "mode": "Hackathon MVP"}

# --- NOVO: Endpoint para testar a IA na Demo ---
@app.post("/categorizar")
def prever_categoria(req: CategorizacaoRequest):
    """
    Endpoint utilitário para o Front-end verificar a categoria antes de salvar.
    Usa o Gemini Flash via utils.py.
    """
    categoria = categorizar_transacao(req.descricao)
    return {"descricao": req.descricao, "categoria_sugerida": categoria}

# --- DASHBOARD (Agora com cálculo real) ---
@app.get("/dashboard/{user_id}")
def get_dashboard(user_id: str):
    # A. Buscar perfil
    profile = supabase.table("profiles").select("*").eq("id", user_id).execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    dados_perfil = profile.data[0]
    
    # B. Buscar transações (Todas para calcular o acumulado)
    # Dica: Em produção, filtraríamos por mês atual. Para MVP, pegamos tudo.
    transacoes = supabase.table("transactions").select("*").eq("user_id", user_id).execute()
    
    total_entradas = sum(t['amount'] for t in transacoes.data if t['type'] == 'entrada')
    total_saidas = sum(t['amount'] for t in transacoes.data if t['type'] == 'saida')
    saldo_atual = total_entradas - total_saidas
    
    # Calcular quantos adiantamentos já foram feitos (para penalizar o score)
    adiantamentos_feitos = sum(1 for t in transacoes.data if t['category'] == 'Adiantamento')
    
    # C. Calcular Score usando a função do utils.py
    score = calcular_score_saude(
        gastos=total_saidas, 
        renda=total_entradas, 
        adiantamentos_ativos=adiantamentos_feitos
    )
    
    return {
        "saldo_atual": round(saldo_atual, 2),
        "limite_adiantamento": dados_perfil['advance_limit'],
        "saude_financeira": score,
        "gastos_total": round(total_saidas, 2),
        "renda_total": round(total_entradas, 2)
    }

# --- EXTRATO ---
@app.get("/extrato/{user_id}")
def get_extrato(user_id: str):
    # Retorna as últimas 50 transações ordenadas
    response = supabase.table("transactions").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(50).execute()
    return response.data

# --- ADIANTAMENTO ---
@app.post("/adiantamento")
def solicitar_adiantamento(req: AdiantamentoRequest):
    # 1. Verificar limite
    profile = supabase.table("profiles").select("*").eq("id", req.user_id).execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="User not found")
        
    user_data = profile.data[0]
    
    if req.valor > user_data['advance_limit']:
        raise HTTPException(status_code=400, detail="Valor excede o limite disponível")

    # 2. Registrar Entrada (Dinheiro na conta)
    supabase.table("transactions").insert({
        "user_id": req.user_id,
        "amount": req.valor,
        "type": "entrada",
        "category": "Adiantamento", # Categoria fixa para controle
        "description": "Adiantamento Salário Smart"
    }).execute()
    
    # 3. Atualizar Limite no Perfil
    novo_limite = float(user_data['advance_limit']) - req.valor
    supabase.table("profiles").update({"advance_limit": novo_limite}).eq("id", req.user_id).execute()
    
    # 4. Registrar Taxa (Monetização)
    taxa = 5.90
    supabase.table("transactions").insert({
        "user_id": req.user_id,
        "amount": taxa,
        "type": "saida",
        "category": "Taxas",
        "description": "Taxa de Serviço"
    }).execute()
    
    return {
        "status": "sucesso", 
        "novo_saldo_limite": novo_limite, 
        "mensagem": "Dinheiro liberado na conta!"
    }