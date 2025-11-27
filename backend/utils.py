import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.environ.get("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

def categorizar_regra_basica(descricao: str) -> str:
    """Fallback simples se a IA falhar."""
    desc = descricao.lower()
    if any(x in desc for x in ['uber', '99', 'posto']): return "Transporte"
    if any(x in desc for x in ['food', 'burger', 'mercado']): return "Alimentação"
    return "Outros"

def categorizar_transacao(descricao: str, regras_usuario: list = None) -> str:
    """
    Categoriza usando IA, mas INFLUENCIADO pelas regras do usuário.
    regras_usuario: Lista de dicionários [{'keyword': 'starbucks', 'category': 'Trabalho'}]
    """
    if not api_key:
        return categorizar_regra_basica(descricao)

    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # 1. Montar o Contexto Personalizado (A Mágica acontece aqui)
        contexto_regras = ""
        if regras_usuario:
            contexto_regras = "O usuário definiu estas regras de preferência pessoal:\n"
            for regra in regras_usuario:
                contexto_regras += f"- Se contiver '{regra['keyword']}', a categoria É '{regra['category']}'.\n"

        # 2. O Prompt Enriquecido
        prompt = f"""
        Atue como um assistente financeiro pessoal.
        {contexto_regras}
        
        Sua tarefa é categorizar a transação abaixo em UMA categoria simples.
        Priorize as regras do usuário acima do seu conhecimento geral.
        
        Transação: "{descricao}"
        Categoria (Responda apenas a palavra):
        """
        
        response = model.generate_content(prompt)
        return response.text.strip()

    except Exception as e:
        print(f"⚠️ Erro na IA: {e}")
        return categorizar_regra_basica(descricao)

# Mantemos a função de score igual
def calcular_score_saude(gastos, renda, adiantamentos):
    if renda == 0: return 0
    ratio = gastos / renda
    score = 1000 - (ratio * 500) - (adiantamentos * 50)
    return max(0, int(score))