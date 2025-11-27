from utils import categorizar_transacao

testes = [
    "Pgto *Drogaria Sao Paulo",   # IA deve saber que é Saúde
    "Steam Games",                # IA deve saber que é Lazer
    "Curso Udemy Python",         # IA deve saber que é Educação
    "Pagamento recebido Empresa X" # IA deve saber que é Renda
]

print("🧠 Testando Inteligência Artificial...")
for t in testes:
    cat = categorizar_transacao(t)
    print(f"'{t}' -> {cat}")