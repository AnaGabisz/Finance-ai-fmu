import os
import random
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv
import httpx # Necessário para o hack

# --- HACK DE SEGURANÇA SSL (Para Rede Corporativa) ---
# Isso obriga o sistema a ignorar erros de certificado do Zscaler/Firewall
original_init = httpx.Client.__init__

def new_init(self, *args, **kwargs):
    kwargs['verify'] = False 
    original_init(self, *args, **kwargs)

httpx.Client.__init__ = new_init
# -----------------------------------------------------

from supabase import create_client
from utils import categorizar_transacao

load_dotenv()

# Configuração
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

# ID DO USUÁRIO DEMO (Fixo para facilitar o Front)
USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

def limpar_banco():
    print("🧹 Limpando banco de dados (ordem reversa)...")
    # Apaga tabelas dependentes primeiro
    supabase.table("adiantamentos").delete().eq("user_id", USER_ID).execute()
    supabase.table("beneficios").delete().eq("user_id", USER_ID).execute()
    supabase.table("transacoes").delete().eq("user_id", USER_ID).execute()
    supabase.table("score").delete().eq("user_id", USER_ID).execute()
    supabase.table("profiles").delete().eq("id", USER_ID).execute()

def popular_banco():
    print("🌱 Plantando Perfil Corporativo B2B2C...")
    
    # 1. Criar Perfil
    supabase.table("profiles").insert({
        "id": USER_ID,
        "nome": "João da Silva",
        "email": "joao.silva@techcorp.com",
        "empresa_id": "TechCorp",
        "salario_bruto": 4500.00,
        "trilha_escolhida": "Sair das Dívidas"
    }).execute()
    
    # 2. Criar Score Inicial
    print("🏆 Definindo Score e Nível...")
    supabase.table("score").insert({
        "user_id": USER_ID,
        "pontuacao": 720,
        "nivel": "Prata",
        "ultima_atualizacao": datetime.now().isoformat()
    }).execute()
    
    # 3. Criar Benefícios Corporativos
    print("🎫 Inserindo Benefícios...")
    beneficios = [
        {"user_id": USER_ID, "tipo": "Vale Refeição", "valor": 800.00},
        {"user_id": USER_ID, "tipo": "Vale Transporte", "valor": 250.00},
        {"user_id": USER_ID, "tipo": "Gympass", "valor": 89.90},
        {"user_id": USER_ID, "tipo": "Auxílio Home Office", "valor": 150.00}
    ]
    supabase.table("beneficios").insert(beneficios).execute()
    
    # 4. Gerar Histórico de Transações (90 Dias)
    print("💸 Gerando 3 meses de extrato bancário inteligente...")
    transacoes = []
    hoje = datetime.now()
    
    for dias_atras in range(90, -1, -1):
        data_atual = hoje - timedelta(days=dias_atras)
        dia = data_atual.day
        
        # A. Salário (Dia 05)
        if dia == 5:
            transacoes.append({
                "user_id": USER_ID,
                "valor": 4500.00,
                "tipo": "entrada",
                "categoria": "Renda", # Fixo para não gastar IA
                "data": data_atual.isoformat()
            })
            
        # B. Contas Fixas (Dia 10)
        if dia == 10:
            contas = [
                ("Aluguel QuintoAndar", 1500.00),
                ("Enel Energia", 180.50),
                ("Vivo Fibra Internet", 120.00)
            ]
            for desc, val in contas:
                # Usamos a IA aqui para classificar
                cat = categorizar_transacao(desc) 
                transacoes.append({
                    "user_id": USER_ID,
                    "valor": val,
                    "tipo": "saida",
                    "categoria": cat,
                    "data": data_atual.isoformat()
                })
                time.sleep(0.5) # Pausa para não estourar rate limit da IA
        
        # C. Gastos Variáveis (Aleatórios - Dia sim, dia não)
        if random.random() < 0.4:
            opcoes = [
                ("Uber *Viagem Escritorio", 28.90),
                ("iFood *McDonalds", 45.90),
                ("Assinatura Netflix", 39.90),
                ("Drogasil Farmacia", 60.00),
                ("Posto Ipiranga", 150.00),
                ("Spotify Premium", 21.90),
                ("Padaria Real", 15.50),
                ("Amazon Prime", 19.90)
            ]
            escolha_desc, escolha_val = random.choice(opcoes)
            
            # Usamos IA para categorizar
            cat_ia = categorizar_transacao(escolha_desc)
            
            transacoes.append({
                "user_id": USER_ID,
                "valor": escolha_val,
                "tipo": "saida",
                "categoria": cat_ia,
                "data": data_atual.isoformat()
            })
            # Pausa leve
            time.sleep(0.2)

    # Inserir em lotes de 50 para evitar erro de timeout
    print(f"📦 Salvando {len(transacoes)} transações no banco...")
    batch_size = 50
    for i in range(0, len(transacoes), batch_size):
        batch = transacoes[i:i + batch_size]
        supabase.table("transacoes").insert(batch).execute()
        print(f"   ... Lote {i//batch_size + 1} inserido.")

    print("✅ SEED V3 CONCLUÍDO! O ambiente está pronto para a Demo.")

if __name__ == "__main__":
    limpar_banco()
    popular_banco()