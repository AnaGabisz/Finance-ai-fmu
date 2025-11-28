# Finance-ai-fmu
 uma plataforma para centralizar serviços financeiros internos da empresa, com foco em prototipagem rápida, integrações e demonstrações de IA aplicada ao domínio financeiro.

## Índice

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Execução Rápida (desenvolvimento)](#execução-rápida-desenvolvimento)
	- [Backend](#backend)
	- [Frontend](#frontend)
- [Scripts úteis](#scripts-úteis)
- [Dados de teste / seed](#dados-de-teste--seed)
- [Contribuição](#contribuição)
- [Autores e Contato](#autores-e-contato)
- [Licença](#licença)

## Visão Geral

Projeto de demonstração para agrupar serviços financeiros internos — inclui um backend (APIs e utilitários Python) e um frontend web (Vite + React/TypeScript). O objetivo é servir como protótipo para mostrar fluxos, integrações com IA e componentes reutilizáveis para a empresa.

## Funcionalidades

- Estrutura inicial do backend em Python para lógica e APIs.
- Frontend em Vite + React/TypeScript para interfaces rápidas.
- Scripts de seed e exemplos de integração com modelos/serviços de IA.

## Tecnologias

- Backend: Python (veja `backend/requirements.txt`)
- Frontend: Vite, React, TypeScript (veja `package.json` e `vite.config.ts`)
- Estilo: Tailwind CSS (`tailwind.config.js`)

## Estrutura do Projeto (resumo)

- `backend/` — código Python, dependências, scripts de seed e APIs (ex.: `main.py`, `seed_data.py`).
- `public/` — ativos públicos do frontend.
- `src/` — código fonte do frontend (React + TS).
- Arquivos de configuração: `package.json`, `requirements.txt`, `vite.config.ts`, `tsconfig.json`.

## Pré-requisitos

- `Node.js` (>= 16 recomendado) e `npm` ou `pnpm`/`yarn`.
- `Python` (>= 3.8) para o backend.
- Opcional: `git` para controle de versão.

## Execução Rápida (desenvolvimento)

As instruções abaixo assumem que você está em Windows/PowerShell (ajuste conforme necessário para Linux/macOS).

### Backend

1. Criar e ativar um ambiente virtual (PowerShell):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Instalar dependências:

```powershell
pip install -r backend/requirements.txt
```

3. Executar a aplicação:

- Se o backend for um script simples: `python backend/main.py`
- Se for uma API FastAPI/ASGI, inicie com (após instalar `uvicorn`):

```powershell
uvicorn backend.main:app --reload --port 8000
```

Observação: ajuste o módulo (`backend.main:app`) caso a aplicação esteja estruturada de forma diferente.

### Frontend

1. Instalar dependências (na raiz do projeto):

```powershell
npm install
```

2. Iniciar servidor de desenvolvimento:

```powershell
npm run dev
```

O Vite normalmente abrirá a aplicação em `http://localhost:5173` (ou porta indicada no terminal).

## Scripts úteis

- `backend/seed_data.py`: script para popular dados de exemplo/local.
- `package.json` (raiz): contém scripts do frontend (`dev`, `build`, `preview`).
- `requirements.txt` / `backend/requirements.txt`: dependências Python.

## Dados de teste / seed

Para carregar dados de exemplo execute:

```powershell
python backend/seed_data.py
```

Verifique o conteúdo de `backend/seed_data.py` antes de executar para confirmar dependências e conexões (banco de dados, arquivos locais, etc.).

## Contribuição

Contribuições são bem-vindas. Sugestões rápidas:

1. Abra uma issue descrevendo a proposta.
2. Crie uma branch com prefixo `feat/` ou `fix/`.
3. Faça um pull request com descrição e passos para reproduzir/testar.

## Autores e Contato

- Mantentor: Ana (repositório: `AnaGabisz/Finance-ai-fmu`).
- Para dúvidas ou propostas, abra uma issue no repositório ou envie mensagem à equipe do Hackathon.

## Licença

Especifique a licença deste projeto (por exemplo, `MIT`) adicionando um arquivo `LICENSE` ou atualize este documento com a licença escolhida.

---

Se quiser, eu posso:

- adicionar um `LICENSE` (ex.: MIT) automaticamente;
- detectar e ajustar comandos exatos para o backend (se você me disser qual framework está usando, ex.: FastAPI, Flask, Django);
- atualizar `package.json`/`requirements.txt` com scripts/entradas faltantes.

Quer que eu adicione a licença e ajuste comandos conforme o framework do backend? 

