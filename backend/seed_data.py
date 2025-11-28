import os
import random
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv
import httpx 
from supabase import create_client

# SSL Patch
original_init = httpx.Client.__init__
def new_init(self, *args, **kwargs):
    kwargs['verify'] = False 
    original_init(self, *args, **kwargs)
httpx.Client.__init__ = new_init

from utils import categorizar_transacao
load_dotenv()

supabase = create_client(os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_KEY"))
USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

def run_seed():
    print("🧹 Limpando DB...")
    tabelas = ["adiantamentos", "subscriptions", "pix_transactions", "transactions", "score", "beneficios", "profiles"]
    for t in tabelas:
        try:
            supabase.table(t).delete().eq("user_id" if t != "profiles" else "id", USER_ID).execute()
        except: pass

    print("🌱 Criando Profile (aiiaHub Specs)...")
    supabase.table("profiles").insert({
        "id": USER_ID,
        "full_name": "João da Silva",
        "email": "joao@demo.com",
        "base_salary": 4500.00,
        "advance_limit": 1800.00
    }).execute()

    supabase.table("score").insert({"user_id": USER_ID, "pontuacao": 720, "nivel": "Prata"}).execute()
    
    supabase.table("beneficios").insert([
        {"user_id": USER_ID, "tipo": "VR", "valor": 800},
        {"user_id": USER_ID, "tipo": "Gympass", "valor": 89}
    ]).execute()

    print("💸 Gerando Transactions (Ledger)...")
    transacoes = []
    pix_list = []
    
    # 3 Meses de histórico
    for i in range(90):
        data = (datetime.now() - timedelta(days=i)).isoformat()
        
        # Salário (Entrada)
        if i % 30 == 0:
            transacoes.append({
                "user_id": USER_ID, "amount": 4500.00, "type": "entrada", 
                "category": "Renda", "description": "Salário Mensal", "created_at": data
            })
            
        # Gastos Variáveis
        if random.random() < 0.3:
            desc = random.choice(["Uber", "iFood", "Netflix", "Padaria", "Farmacia"])
            cat = categorizar_transacao(desc)
            transacoes.append({
                "user_id": USER_ID, "amount": round(random.uniform(20, 150), 2), "type": "saida",
                "category": cat, "description": f"Compra {desc}", "created_at": data
            })
            time.sleep(0.1) # Calma pra IA

        # PIX Aleatórios
        if random.random() < 0.1:
            pix_list.append({
                "user_id": USER_ID, "amount": round(random.uniform(50, 200), 2), "type": "enviado",
                "pix_key": "123.456.789-00", "pix_key_type": "cpf", "recipient_name": "Loja Z",
                "description": "Pagamento PIX", "created_at": data
            })

    print(f"📦 Inserindo {len(transacoes)} Transações e {len(pix_list)} PIX...")
    
    # Batch insert simples
    if transacoes: supabase.table("transactions").insert(transacoes).execute()
    if pix_list: supabase.table("pix_transactions").insert(pix_list).execute()

    print("✅ Seed aiiaHub Concluído!")

if __name__ == "__main__":
    run_seed()