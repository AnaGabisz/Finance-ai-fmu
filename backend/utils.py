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


# ============================================================================
# ANÁLISE INTELIGENTE COM IA
# ============================================================================

def gerar_analise_ia(transacoes: list, saldo: float, beneficios: list) -> str:
    """
    Gera análise financeira personalizada usando Gemini.
    Retorna insights sobre gastos, benefícios e recomendações.
    """
    if not api_key:
        return gerar_analise_fallback(transacoes, saldo, beneficios)
    
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Preparar dados para o prompt
        gastos_por_categoria = {}
        for t in transacoes:
            if t.get('type') == 'saida':
                cat = t.get('category', 'Outros')
                gastos_por_categoria[cat] = gastos_por_categoria.get(cat, 0) + t.get('amount', 0)
        
        total_beneficios = sum(b.get('valor', 0) for b in beneficios)
        
        prompt = f"""
        Você é um consultor financeiro pessoal da aiiaHub.
        Analise os dados financeiros abaixo e gere UM insight curto e útil (máximo 2 frases).

        Dados:
        - Saldo atual: R$ {saldo:.2f}
        - Gastos por categoria: {gastos_por_categoria}
        - Benefícios corporativos disponíveis: R$ {total_beneficios:.2f}

        Regras:
        1. Seja direto e prático
        2. Se houver gasto alto em alimentação e VR disponível, sugira usar o VR
        3. Se o saldo estiver baixo, alerte sobre isso
        4. Use linguagem amigável e brasileira
        5. Não use emojis

        Insight:
        """
        
        response = model.generate_content(prompt)
        return response.text.strip()
    
    except Exception as e:
        print(f"⚠️ Erro na análise IA: {e}")
        return gerar_analise_fallback(transacoes, saldo, beneficios)

def gerar_analise_fallback(transacoes: list, saldo: float, beneficios: list) -> str:
    """Fallback quando a IA não está disponível."""
    gastos_alimentacao = sum(
        t.get('amount', 0) for t in transacoes 
        if t.get('type') == 'saida' and t.get('category') == 'Alimentação'
    )
    
    vr_disponivel = next(
        (b.get('valor', 0) for b in beneficios if 'Refeição' in b.get('tipo', '')), 
        0
    )
    
    if gastos_alimentacao > vr_disponivel and vr_disponivel > 0:
        return f"Atenção: Seus gastos com alimentação (R$ {gastos_alimentacao:.2f}) superaram o VR disponível. Considere usar mais o benefício."
    
    if saldo < 500:
        return f"Seu saldo está baixo (R$ {saldo:.2f}). Revise seus gastos para evitar imprevistos."
    
    return "Suas finanças estão equilibradas. Continue acompanhando seus gastos pelo extrato."


# ============================================================================
# CHATBOT FINANCEIRO INTELIGENTE
# ============================================================================

def processar_chat_financeiro(mensagem: str, contexto: dict) -> str:
    """
    Processa perguntas do usuário sobre suas finanças usando Gemini.
    Recebe o contexto financeiro completo para respostas precisas.
    """
    if not api_key:
        return processar_chat_fallback(mensagem, contexto)
    
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        prompt = f"""
Você é o assistente financeiro da aiiaHub, um app de gestão financeira inteligente.
Responda a pergunta do usuário de forma clara, direta e amigável.

DADOS FINANCEIROS DO USUÁRIO:
- Saldo atual: R$ {contexto.get('saldo_atual', 0):.2f}
- Total de entradas: R$ {contexto.get('total_entradas', 0):.2f}
- Total de saídas: R$ {contexto.get('total_saidas', 0):.2f}
- Limite de adiantamento disponível: R$ {contexto.get('limite_adiantamento', 0):.2f}
- Salário: R$ {contexto.get('salario', 0):.2f}

GASTOS POR CATEGORIA:
{_formatar_gastos(contexto.get('gastos_por_categoria', {}))}

ASSINATURAS ATIVAS:
{_formatar_assinaturas(contexto.get('assinaturas_ativas', []))}
Total em assinaturas: R$ {contexto.get('total_assinaturas', 0):.2f}/mês

BENEFÍCIOS CORPORATIVOS:
{_formatar_beneficios(contexto.get('beneficios', []))}

ÚLTIMAS TRANSAÇÕES:
{_formatar_transacoes(contexto.get('ultimas_transacoes', []))}

REGRAS:
1. Seja direto e objetivo nas respostas
2. Use valores em Reais (R$) formatados
3. Se não souber algo específico, diga que não tem essa informação
4. Dê sugestões práticas quando apropriado
5. Não invente dados que não estão no contexto
6. Use linguagem amigável e brasileira
7. Respostas curtas (máximo 3-4 frases) a menos que peçam detalhes
8. Se perguntarem sobre período específico (semana, mês), analise as datas das transações

PERGUNTA DO USUÁRIO: {mensagem}

RESPOSTA:
"""
        
        response = model.generate_content(prompt)
        return response.text.strip()
    
    except Exception as e:
        print(f"Erro no chat IA: {e}")
        return processar_chat_fallback(mensagem, contexto)

def processar_chat_fallback(mensagem: str, contexto: dict) -> str:
    """Fallback quando a IA não está disponível."""
    msg_lower = mensagem.lower()
    
    # Perguntas sobre saldo
    if any(x in msg_lower for x in ['saldo', 'tenho', 'quanto tenho']):
        return f"Seu saldo atual é R$ {contexto.get('saldo_atual', 0):.2f}."
    
    # Perguntas sobre gastos
    if any(x in msg_lower for x in ['gastei', 'gasto', 'despesa']):
        return f"Você gastou R$ {contexto.get('total_saidas', 0):.2f} no total. Sua maior categoria de gastos é {_maior_categoria(contexto)}."
    
    # Perguntas sobre adiantamento
    if any(x in msg_lower for x in ['adiantamento', 'antecipar', 'limite']):
        limite = contexto.get('limite_adiantamento', 0)
        return f"Seu limite de adiantamento disponível é R$ {limite:.2f}."
    
    # Perguntas sobre assinaturas
    if any(x in msg_lower for x in ['assinatura', 'netflix', 'spotify']):
        total = contexto.get('total_assinaturas', 0)
        qtd = len(contexto.get('assinaturas_ativas', []))
        return f"Você tem {qtd} assinaturas ativas, totalizando R$ {total:.2f}/mês."
    
    # Resumo geral
    if any(x in msg_lower for x in ['resumo', 'situação', 'como estou']):
        saldo = contexto.get('saldo_atual', 0)
        gastos = contexto.get('total_saidas', 0)
        return f"Seu saldo é R$ {saldo:.2f}. Você gastou R$ {gastos:.2f} este período. {_maior_categoria(contexto)} é sua maior despesa."
    
    return "Desculpe, não entendi sua pergunta. Tente perguntar sobre seu saldo, gastos, assinaturas ou adiantamento."

def _formatar_gastos(gastos: dict) -> str:
    if not gastos:
        return "Nenhum gasto registrado"
    return "\n".join([f"- {cat}: R$ {val:.2f}" for cat, val in sorted(gastos.items(), key=lambda x: x[1], reverse=True)])

def _formatar_assinaturas(assinaturas: list) -> str:
    if not assinaturas:
        return "Nenhuma assinatura ativa"
    return "\n".join([f"- {s['nome']}: R$ {s['valor']:.2f}/mês" for s in assinaturas])

def _formatar_beneficios(beneficios: list) -> str:
    if not beneficios:
        return "Nenhum benefício cadastrado"
    return "\n".join([f"- {b.get('tipo', 'Benefício')}: R$ {b.get('valor', 0):.2f}" for b in beneficios])

def _formatar_transacoes(transacoes: list) -> str:
    if not transacoes:
        return "Nenhuma transação recente"
    linhas = []
    for t in transacoes[:10]:
        tipo = "+" if t['tipo'] == 'entrada' else "-"
        linhas.append(f"- {t['descricao']}: {tipo}R$ {t['valor']:.2f} ({t['categoria']}) em {t['data'][:10]}")
    return "\n".join(linhas)

def _maior_categoria(contexto: dict) -> str:
    gastos = contexto.get('gastos_por_categoria', {})
    if not gastos:
        return "Sem gastos registrados"
    maior = max(gastos.items(), key=lambda x: x[1])
    return f"{maior[0]} (R$ {maior[1]:.2f})"
