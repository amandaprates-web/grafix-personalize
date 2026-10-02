# Grafix Personalize — Backend SOA

Sistema de gestão operacional para uma gráfica/papelaria, dividido em microsserviços RESTful, containerizados com Docker, e preparado para ser consumido por uma IA através do protocolo MCP (Model Context Protocol).

## Requisitos do Sistema

- **Docker** e **Docker Compose** (v1.29+)
- **Node.js** 18+ (opcional, se for testar serviços localmente)
- **Python** 3.8+ (obrigatório para camada MCP)
- **Google API Key** (para integração com Gemini) - necessário apenas para usar IA

## Arquitetura de Microsserviços

A solução é organizada em 4 serviços independentes, cada um com seu próprio banco de dados lógico no MongoDB:

| Serviço | Porta | Banco de dados | Responsabilidade |
|---|---:|---|---|
| servico-auth | 3000 | grafix-auth | Registro, login e autenticação JWT |
| servico-clientes | 3001 | grafix-clientes | CRUD de clientes |
| servico-produtos | 3002 | grafix-produtos | CRUD de produtos e monitoramento de estoque |
| servico-pedidos | 3003 | grafix-pedidos | CRUD de pedidos e rastreio por status |

**Benefícios desta arquitetura:**
- ✅ Cada serviço pode escalar independentemente
- ✅ Falha em um serviço não afeta os outros
- ✅ Desenvolvimento paralelo e sem acoplamento
- ✅ Fácil manutenção e deploys isolados

---

## Iniciando o Projeto

### Passo 1: Preparar o ambiente

```powershell
# Clone ou extraia o projeto
cd grafix-personalize
```

### Passo 2: Verificar o arquivo de ambiente

O projeto usa o arquivo raiz `.env` para configuração geral, incluindo `JWT_SECRET`.

```powershell
# (Opcional) Edite o JWT_SECRET no arquivo .env para maior segurança
code .env
```

### Passo 3: Criar a rede Docker compartilhada

A configuração do `docker-compose.yml` utiliza uma rede chamada `grafix-net` e ela precisa existir antes do primeiro `up`.

```powershell
# Criar rede compartilhada (só precisa fazer uma vez)
docker network create grafix-net
```

> Se a rede já existir, o comando informa que ela já foi criada; isso é normal.

---

## Subindo os Serviços

```powershell
docker compose up --build -d
```

```powershell
docker compose ps
```

**Saída aproximadamente esperada:**
```
NAME                 STATUS          PORTS
grafix-mongo         Up 2 minutes    27017/tcp
grafix-auth          Up 2 minutes    0.0.0.0:3000->3000/tcp
grafix-clientes      Up 2 minutes    0.0.0.0:3001->3001/tcp
grafix-produtos      Up 2 minutes    0.0.0.0:3002->3002/tcp
grafix-pedidos       Up 2 minutes    0.0.0.0:3003->3003/tcp
```

### Passo 4: População Automática de Dados (Seed)

Ao subir o projeto pela primeira vez, o arquivo `init-mongo.js` popula automaticamente os bancos de dados com dados de exemplo, incluindo:

- clientes de demonstração
- produtos iniciais
- pedidos de exemplo

Esse processo roda apenas quando o volume do MongoDB estiver vazio.

**Para resetar os dados:**
```powershell
docker compose down -v
docker compose up --build -d
```

**Aviso:** Isso apaga TODOS os dados atuais, incluindo usuários de login criados manualmente.

---

## Autenticação e Testes

O serviço de autenticação não vem com um usuário padrão pré-cadastrado. O usuário deve ser criado via endpoint de registro antes de fazer login.

### 1. Criar um usuário

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/auth/registro `
  -ContentType "application/json; charset=utf-8" `
  -Body '{
    "nome": "Usuário Demo",
    "email": "demo@grafix.com",
    "senha": "demo123456",
    "perfil": "gestor"
  }'
```

### 2. Fazer Login e Obter Token JWT

```powershell
$resp = Invoke-RestMethod -Method Post -Uri http://localhost:3000/auth/login `
  -ContentType "application/json; charset=utf-8" `
  -Body '{"email":"demo@grafix.com","senha":"demo123456"}'

$token = $resp.token
$h = @{ Authorization = "Bearer $token" }

# (Opcional) Ver a resposta completa
$resp | ConvertTo-Json
```

**Resposta esperada:**
```json
{
    "token":  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhYmZiY2Y0Y2Q3MDM3OGVkODgwMTM1MiIsInBlcmZpbCI6Imdlc3RvciIsImlhdCI6MTc5MDk1MjEzNSwiZXhwIjoxNzkwOTgwOTM1fQ.TCFQ6o7Zoty7jeL26rh515PiorZ9wpff9_Uaw1lz6xI",
    "perfil":  "gestor",
    "nome":  "Usuário Demo"
}
```

### 3. Testar Serviço de Clientes

```powershell
# Listar todos os clientes
Invoke-RestMethod -Method Get -Uri http://localhost:3001/clientes `
  -Headers $h

# Criar novo cliente
Invoke-RestMethod -Method Post -Uri http://localhost:3001/clientes `
  -ContentType "application/json; charset=utf-8" `
  -Headers $h `
  -Body '{
    "nome": "Novo Cliente",
    "email": "cliente@example.com",
    "telefone": "(71) 9 9999-9999",
    "endereco": "Rua Exemplo, 123"
  }'
```

### 4. Testar Serviço de Produtos

```powershell
# Listar todos os produtos
Invoke-RestMethod -Method Get -Uri http://localhost:3002/produtos `
  -Headers $h

# Criar novo produto
Invoke-RestMethod -Method Post -Uri http://localhost:3002/produtos `
  -ContentType "application/json; charset=utf-8" `
  -Headers $h `
  -Body '{
    "nome": "Caderno A4",
    "descricao": "Caderno personalizado tamanho A4",
    "preco": 25.90,
    "estoque": 100,
    "estoqueMinimo": 20
  }'

# Produtos com estoque baixo (abaixo do estoque mínimo)
Invoke-RestMethod -Method Get -Uri http://localhost:3002/produtos/estoque-baixo `
  -Headers $h
```

### 5. Testar Serviço de Pedidos

```powershell
# Listar todos os pedidos
Invoke-RestMethod -Method Get -Uri http://localhost:3003/pedidos `
  -Headers $h

# Criar novo pedido
Invoke-RestMethod -Method Post -Uri http://localhost:3003/pedidos `
  -ContentType "application/json; charset=utf-8" `
  -Headers $h `
  -Body '{
    "cliente": "Ana Beatriz Souza",
    "descricao": "500 cartões de visita",
    "status": "Em Produção",
    "valorTotal": 229.5,
    "dataEntrega": "2026-10-15"
  }'
```
### 6. Health Check (sem autenticação)

```powershell
Invoke-RestMethod http://localhost:3000/health
Invoke-RestMethod http://localhost:3001/health
Invoke-RestMethod http://localhost:3002/health
Invoke-RestMethod http://localhost:3003/health
```

Resposta esperada:

```
status servico 
------ ------- 
ok     auth    
ok     clientes
ok     produtos
ok     pedidos 

```

Os retornos variam conforme o serviço, por exemplo `clientes`, `produtos` ou `pedidos`.

---

## Testes de Resiliência

Um dos requisitos principais é que a falha em um serviço não afete os outros. Para testar:

```powershell
# Parar o serviço de produtos
docker compose stop servico-produtos

# Ao tentar acessar outros serviços - devem responder normalmente
Invoke-RestMethod -Method Get -Uri http://localhost:3001/clientes `
  -Headers $h

# Trazer o serviço de volta
docker compose start servico-produtos
```

---

## Camada MCP (Model Context Protocol)

O MCP permite que agentes de IA consultem dados do sistema em linguagem natural, sem conhecer detalhes técnicos das APIs.

### Estrutura MCP

```text
mcp/
├── clientes/
│   └── ferramentas.py       # Ferramentas de CRUD de clientes
├── produtos/
│   └── ferramentas.py       # Ferramentas de CRUD de produtos
├── pedidos/
│   └── ferramentas.py       # Ferramentas de CRUD de pedidos
├── chat_google.py           # Chat integrado com Google Gemini
├── requirements.txt         # Dependências Python
└── .env.example             # Configuração
```

Cada serviço MCP roda em seu próprio container Docker e conecta aos serviços web via rede interna.

### Configuração e Execução

#### 1. Criar usuário de serviço para o MCP (com serviços já rodando)

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/auth/registro `
  -ContentType "application/json; charset=utf-8" `
  -Body '{
    "nome": "MCP Service",
    "email": "mcp@grafix.com",
    "senha": "mcp123456",
    "perfil": "gestor"
  }'
```

**Nota:** As credenciais devem corresponder às variáveis `MCP_EMAIL` e `MCP_SENHA` no arquivo `mcp/.env`.

#### 2. Configurar variáveis de ambiente MCP

```powershell
Set-Location mcp

# Crie o arquivo apenas se ele ainda não existir
if (-not (Test-Path .env)) { New-Item -ItemType File -Path .env }

# Edite o arquivo .env com:
# - GOOGLE_API_KEY (obtenha em https://ai.google.dev)
# - MCP_EMAIL e MCP_SENHA (as credenciais criadas acima)
code .env
```

#### 3. Subir os containers MCP

```powershell
docker compose up --build -d
```

Isso sobe 3 containers:
- `clientes-mcp` (porta 8001) — acesso a clientes
- `produtos-mcp` (porta 8002) — acesso a produtos
- `pedidos-mcp` (porta 8003) — acesso a pedidos

#### 4. Executar o chat com Gemini

Importante: o script `chat_google.py` usa `load_dotenv()` sem apontar explicitamente um caminho, então a execução deve ocorrer a partir da pasta `mcp`.

```powershell
# Instalar dependências Python (fora do Docker)
cd mcp
pip install -r requirements.txt

# Rodar o chat
python chat_google.py
```

### Exemplos de Perguntas para o Chat IA

Com o chat rodando, você pode fazer perguntas naturais:

```
> Quais produtos estão com estoque baixo?
> Mostre-me os 5 últimos pedidos criados
> Qual é o total de clientes cadastrados?
> Quais pedidos estão em produção?
> Crie um novo cliente chamado "João Silva"
> Qual é o valor total de todos os pedidos?
```

A IA interpreta as perguntas e chama as ferramentas MCP automaticamente.

---

## Monitoramento e Logs

### Ver logs de um serviço específico

```powershell
# Logs em tempo real
docker compose logs -f servico-produtos

# Últimas 50 linhas
docker compose logs --tail 50 servico-clientes

# Logs de todos os serviços
docker compose logs -f
```

### Conectar ao MongoDB diretamente

```powershell
docker compose exec grafix-mongo mongosh
```

Dentro do MongoDB:

```javascript
// Ver bancos de dados
show dbs

// Usar banco de dados
use grafix-clientes

// Ver coleções
show collections

// Consultar documentos
db.clientes.find()

// Sair
exit
```
---

## Solução de Problemas

### Token JWT expirado

Se receber erro `401 Unauthorized`, faça login novamente e use um novo token:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/auth/login `
  -ContentType "application/json; charset=utf-8" `
  -Body '{"email":"demo@grafix.com","senha":"demo123456"}'
```

### Volume do MongoDB persistindo dados antigos

Para uma limpeza total:

```powershell
# Parar e remover containers + volumes
docker compose down -v

# Recriar do zero
docker compose up --build -d
```

---

## Estrutura do Projeto

```text
grafix-personalize/
├── .env
├── docker-compose.yml
├── init-mongo.js
├── README.md
├── servico-auth/
│   ├── controllers/
│   ├── models/
│   ├── middlewares/
│   ├── routes/
│   ├── package.json
│   ├── server.js
│   └── Dockerfile
├── servico-clientes/
│   ├── controllers/
│   ├── models/
│   ├── middlewares/
│   ├── routes/
│   ├── package.json
│   ├── server.js
│   └── Dockerfile
├── servico-produtos/
│   ├── controllers/
│   ├── models/
│   ├── middlewares/
│   ├── routes/
│   ├── package.json
│   ├── server.js
│   └── Dockerfile
├── servico-pedidos/
│   ├── controllers/
│   ├── models/
│   ├── middlewares/
│   ├── routes/
│   ├── package.json
│   ├── server.js
│   └── Dockerfile
├── mcp/
│   ├── clientes/
│   ├── produtos/
│   ├── pedidos/
│   ├── chat_google.py
│   ├── .env
│   ├── Dockerfile
│   └── requirements.txt
└── .gitignore
```

---

## Fluxo de Desenvolvimento

1. Preparar ambiente e rede Docker
2. Subir os serviços com `docker compose up --build -d`
3. Criar usuário e autenticar
4. Validar endpoints e health checks
5. Configurar MCP e testar IA
6. Fazer melhorias e deploys em seguida

---

Versão: 1.1
Última atualização: outubro de 2026
Desenvolvido para: POSWEB — Instituto Federal da Bahia
