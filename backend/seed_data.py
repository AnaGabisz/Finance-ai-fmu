# backend/seed_data.py
import os
import random
from datetime import datetime, timedelta
from supabase import create_client
from dotenv import load_dotenv
from utils import categorizar_transacao

load_dotenv()

# Configuração
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

# ID DO NOSSO USUÁRIO DE TESTE (Mesmo do passo 1)
USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

def limpar_dados_antigos():
    print("🧹 Limpando transações antigas...")
    supabase.table("transactions").delete().eq("user_id", USER_ID).execute()

def criar_historico():
    print("🌱 Plantando histórico financeiro...")
    
    transacoes = []
    
    # Vamos gerar dados para os últimos 90 dias
    hoje = datetime.now()
    
    for dias_atras in range(90, -1, -1):
        data_atual = hoje - timedelta(days=dias_atras)
        dia = data_atual.day
        
        # 1. Dia 05: Recebe Salário
        if dia == 5:
            transacoes.append({
                "user_id": USER_ID,
                "amount": 3500.00,
                "type": "entrada",
                "category": "Renda",
                "description": "Pagamento Salário Mensal",
                "created_at": data_atual.isoformat()
            })
            
        # 2. Dia 10: Contas Fixas (Aluguel, Luz)
        if dia == 10:
            contas = [
                ("Aluguel Apto", 1200.00),
                ("Enel Energia", 150.00),
                ("Vivo Fibra", 99.90)
            ]
            for desc, valor in contas:
                transacoes.append({
                    "user_id": USER_ID,
                    "amount": valor,
                    "type": "saida",
                    "category": categorizar_transacao(desc),
                    "description": desc,
                    "created_at": data_atual.isoformat()
                })
        
        # 3. Gastos Variáveis (Aleatórios durante o mês)
        # Chance de 30% de gastar algo em qualquer dia
        if random.random() < 0.3:
            gastos_possiveis = [
                ("Uber *Viagem Trabalho", 25.90),
                ("iFood *McDonalds", 45.50),
                ("Netflix Mensalidade", 39.90),
                ("Padaria Doce Vida", 15.00),
                ("Posto Shell Combustivel", 100.00),
                ("Farmacia Drogasil", 80.00)
            ]
            escolha = random.choice(gastos_possiveis)
            transacoes.append({
                "user_id": USER_ID,
                "amount": escolha[1],
                "type": "saida",
                "category": categorizar_transacao(escolha[0]),
                "description": escolha[0],
                "created_at": data_atual.isoformat()
            })

    # Inserir em lotes para não estourar
    # O supabase aceita insert de lista
    print(f"📦 Inserindo {len(transacoes)} transações...")
    response = supabase.table("transactions").insert(transacoes).execute()
    print("✅ Dados inseridos com sucesso!")

    # Resetar saldo/limite no perfil para o estado inicial da Demo
    supabase.table("profiles").upsert({
        "id": USER_ID,
        "full_name": "João da Silva",
        "base_salary": 3500.00,
        "advance_limit": 1400.00 # 40% do salario
    }).execute()
    print("✅ Perfil resetado!")

if __name__ == "__main__":
    limpar_dados_antigos()
    criar_historico()