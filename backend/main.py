import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv

# 1. Configuração Inicial
load_dotenv()
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

app = FastAPI(title="Salário Smart API")

# 2. Modelos de Dados (Pydantic - Validação)
class AdiantamentoRequest(BaseModel):
    user_id: str
    valor: float

class Transacao(BaseModel):
    user_id: str
    amount: float
    type: str # 'entrada' ou 'saida'
    category: str
    description: str

# 3. ENDPOINTS

@app.get("/")
def read_root():
    return {"status": "API Online", "projeto": "Salário Smart"}

# --- ENDPOINT 1: DASHBOARD (Resumo Financeiro) ---
@app.get("/dashboard/{user_id}")
def get_dashboard(user_id: str):
    # Buscar perfil
    profile = supabase.table("profiles").select("*").eq("id", user_id).execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    dados_perfil = profile.data[0]
    
    # Buscar transações para calcular saldo
    transacoes = supabase.table("transactions").select("*").eq("user_id", user_id).execute()
    
    total_entradas = sum(t['amount'] for t in transacoes.data if t['type'] == 'entrada')
    total_saidas = sum(t['amount'] for t in transacoes.data if t['type'] == 'saida')
    saldo_atual = total_entradas - total_saidas
    
    # Lógica simples de Score (Mockada para MVP)
    # Se gastou menos de 50% do salário, score alto.
    razao = total_saidas / dados_perfil['base_salary'] if dados_perfil['base_salary'] > 0 else 1
    score = int(1000 - (razao * 500))
    
    return {
        "saldo_atual": saldo_atual,
        "limite_adiantamento": dados_perfil['advance_limit'],
        "saude_financeira": score,
        "gastos_total": total_saidas
    }

# --- ENDPOINT 2: EXTRATO ---
@app.get("/extrato/{user_id}")
def get_extrato(user_id: str):
    # Retorna as últimas 20 transações
    response = supabase.table("transactions").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(20).execute()
    return response.data

# --- ENDPOINT 3: ADIANTAMENTO (A Core Feature) ---
@app.post("/adiantamento")
def solicitar_adiantamento(req: AdiantamentoRequest):
    # 1. Verificar se tem limite
    profile = supabase.table("profiles").select("*").eq("id", req.user_id).execute()
    user_data = profile.data[0]
    
    if req.valor > user_data['advance_limit']:
        raise HTTPException(status_code=400, detail="Valor excede o limite disponível")

    # 2. Criar a transação de entrada (O dinheiro caindo na conta)
    nova_transacao = {
        "user_id": req.user_id,
        "amount": req.valor,
        "type": "entrada",
        "category": "Adiantamento Salarial",
        "description": "Adiantamento via App"
    }
    supabase.table("transactions").insert(nova_transacao).execute()
    
    # 3. Deduzir do limite disponível (Atualiza tabela profiles)
    novo_limite = user_data['advance_limit'] - req.valor
    supabase.table("profiles").update({"advance_limit": novo_limite}).eq("id", req.user_id).execute()
    
    # 4. Cobrar taxa (Opcional - Feature de Monetização)
    # Aqui criamos uma saída simbólica de taxa
    taxa = 5.90
    supabase.table("transactions").insert({
        "user_id": req.user_id,
        "amount": taxa,
        "type": "saida",
        "category": "Taxas",
        "description": "Taxa de Serviço Adiantamento"
    }).execute()
    
    return {"status": "sucesso", "novo_saldo_limite": novo_limite, "mensagem": "Adiantamento realizado!"}