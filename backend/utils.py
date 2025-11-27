import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configuração da IA
api_key = os.environ.get("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

def categorizar_regra_basica(descricao: str) -> str:
    """Fallback: Se a IA falhar, usamos palavras-chave."""
    desc = descricao.lower()
    if any(x in desc for x in ['uber', '99', 'posto', 'gasolina']): return "Transporte"
    if any(x in desc for x in ['food', 'burger', 'restaurante', 'mercado']): return "Alimentação"
    if any(x in desc for x in ['netflix', 'spotify', 'cinema']): return "Lazer"
    if any(x in desc for x in ['salario', 'pagamento']): return "Renda"
    return "Outros"

def categorizar_com_ai(descricao: str) -> str:
    """
    Usa o Gemini Flash para categorizar com inteligência semântica.
    """
    if not api_key:
        return categorizar_regra_basica(descricao)

    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        prompt = f"""
        Você é um assistente financeiro bancário (Backend API).
        Sua tarefa: Categorizar a transação abaixo em UMA das seguintes categorias:
        [Transporte, Alimentação, Lazer, Contas Fixas, Saúde, Educação, Compras, Renda, Outros]

        Regras:
        1. Responda APENAS o nome da categoria. Sem explicações. Sem pontuação.
        2. Se for ambíguo, escolha a mais provável para um trabalhador brasileiro.
        3. "Salário", "Adiantamento", "Pix Recebido" deve ser "Renda".

        Transação: "{descricao}"
        Categoria:
        """
        
        response = model.generate_content(prompt)
        categoria_limpa = response.text.strip()
        
        # Validação simples para garantir que a IA não alucinou um texto longo
        categorias_validas = ["Transporte", "Alimentação", "Lazer", "Contas Fixas", "Saúde", "Educação", "Compras", "Renda", "Outros"]
        if categoria_limpa in categorias_validas:
            return categoria_limpa
        else:
            # Se a IA inventou uma categoria, tentamos aproximar ou retornamos Outros
            return "Outros"

    except Exception as e:
        print(f"⚠️ Erro na IA (usando fallback): {e}")
        return categorizar_regra_basica(descricao)

# Função Wrapper principal que o sistema vai chamar
def categorizar_transacao(descricao: str) -> str:
    return categorizar_com_ai(descricao)

# Mantivemos a lógica de score igual
def calcular_score_saude(gastos: float, renda: float, adiantamentos_ativos: float) -> int:
    if renda == 0: return 0
    comprometimento = gastos / renda
    base_score = 1000
    if comprometimento > 0.80: base_score -= 300
    elif comprometimento > 0.60: base_score -= 100
    base_score -= (adiantamentos_ativos * 50)
    return max(0, int(base_score))