# Grafix Personalize — Backend SOA

Sistema de gestão operacional para uma gráfica/papelaria de pequeno porte, dividido em microsserviços RESTful, containerizados com Docker, e preparado para ser consumido por uma IA através do protocolo MCP (Model Context Protocol).

## Requisitos do Sistema

- **Docker** e **Docker Compose** (v1.29+)
- **Node.js** 18+ (opcional, se for testar serviços localmente)
- **Python** 3.8+ (obrigatório para camada MCP)
- **Google API Key** (para integração com Gemini) - necessário apenas para usar IA

## Arquitetura de Microsserviços

A solução é organizada em 4 serviços independentes, cada um com seu próprio banco de dados lógico no MongoDB:

| Serviço            | Porta | Banco de Dados   | Responsabilidade                              |
|--------------------|-------|-----------------|-----------------------------------------------|
| **servico-auth**   | 3000  | grafix-auth     | Registro, login e autenticação JWT            |
| **servico-clientes** | 3001  | grafix-clientes | CRUD de clientes e perfis                   |
| **servico-produtos** | 3002  | grafix-produtos | CRUD de produtos e monitoramento de estoque |
| **servico-pedidos** | 3003  | grafix-pedidos  | CRUD de pedidos e rastreamento por status    |

**Benefícios desta arquitetura:**
- ✅ Cada serviço pode escalar independentemente
- ✅ Falha em um serviço não afeta os outros
- ✅ Desenvolvimento paralelo e sem acoplamento
- ✅ Fácil manutenção e deploys isolados

---

## Iniciando o Projeto

### Passo 1: Preparar o ambiente

```bash
# Clone ou extraia o projeto
cd grafix-personalize

# (Opcional) Edite o JWT_SECRET no arquivo .env para maior segurança
nano .env
```

### Passo 2: Subir os serviços com Docker Compose

```bash
# Criar rede compartilhada (só precisa fazer uma vez)
docker network create grafix-net

# Build e execução
docker compose up --build -d

# Verificar status dos containers
docker compose ps
```

**Saída esperada:**
```
NAME                 STATUS          PORTS
grafix-mongo         Up 2 minutes    27017/tcp
servico-auth         Up 2 minutes    0.0.0.0:3000->3000/tcp
servico-clientes     Up 2 minutes    0.0.0.0:3001->3001/tcp
servico-produtos     Up 2 minutes    0.0.0.0:3002->3002/tcp
servico-pedidos      Up 2 minutes    0.0.0.0:3003->3003/tcp
```

### Passo 3: População Automática de Dados (Seed)

Ao subir o projeto pela primeira vez, o arquivo `init-mongo.js` popula automaticamente:
- ✅ 5 clientes de exemplo
- ✅ 10 produtos com diferentes categorias
- ✅ 15 pedidos em vários status

Esse processo é executado automaticamente apenas quando o volume do MongoDB está vazio (primeira execução).

**Para resetar os dados:**
```bash
docker compose down -v
docker compose up --build -d
```

**Aviso:** Isso apaga TODOS os dados atuais, incluindo usuários de login criados manualmente.

---

## Autenticação e Testes

### Credenciais Padrão para Testes

Para testes rápidos, use as credenciais abaixo (pré-populadas no seed):

```
Email: demo@grafix.com
Senha: demo123456
```

### 1. Fazer Login e Obter Token JWT

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@grafix.com","senha":"demo123456"}'
```

**Resposta esperada:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": "...",
    "nome": "Demo User",
    "email": "demo@grafix.com"
  }
}
```

Copie o valor de `token` para usar nos próximos passos.

### 2. Testar Serviço de Clientes

```bash
# Listar todos os clientes
curl -X GET http://localhost:3001/clientes \
  -H "Authorization: Bearer <seu_token_aqui>"

# Criar novo cliente
curl -X POST http://localhost:3001/clientes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <seu_token_aqui>" \
  -d '{
    "nome": "Novo Cliente",
    "email": "cliente@example.com",
    "telefone": "(71) 9 9999-9999",
    "endereco": "Rua Exemplo, 123"
  }'
```

### 3. Testar Serviço de Produtos

```bash
# Listar todos os produtos
curl -X GET http://localhost:3002/produtos \
  -H "Authorization: Bearer <seu_token_aqui>"

# Criar novo produto
curl -X POST http://localhost:3002/produtos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <seu_token_aqui>" \
  -d '{
    "nome": "Caderno A4",
    "descricao": "Caderno personalizado tamanho A4",
    "preco": 25.90,
    "estoque": 100,
    "categoria": "cadernos"
  }'

# Produtos com estoque baixo (< 10 unidades)
curl -X GET http://localhost:3002/produtos/baixo-estoque \
  -H "Authorization: Bearer <seu_token_aqui>"
```

### 4. Testar Serviço de Pedidos

```bash
# Listar todos os pedidos
curl -X GET http://localhost:3003/pedidos \
  -H "Authorization: Bearer <seu_token_aqui>"

# Criar novo pedido
curl -X POST http://localhost:3003/pedidos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <seu_token_aqui>" \
  -d '{
    "cliente_id": "...",
    "produtos": [
      {"produto_id": "...", "quantidade": 10}
    ],
    "status": "pendente",
    "data_entrega": "2026-10-15"
  }'

# Filtrar pedidos por status
curl -X GET "http://localhost:3003/pedidos?status=em_producao" \
  -H "Authorization: Bearer <seu_token_aqui>"
```

### 5. Health Check (sem autenticação)

```bash
# Verificar se os serviços estão rodando
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health

# Resposta esperada:
# {"status":"ok"}
```

---

## Testando Resiliência

Um dos requisitos principais é que a falha em um serviço não afete os outros. Para testar:

```bash
# Derrubar o serviço de produtos
docker compose stop servico-produtos

# Tentar acessar outros serviços - devem responder normalmente
curl -X GET http://localhost:3001/clientes \
  -H "Authorization: Bearer <seu_token_aqui>"

# Trazer o serviço de volta
docker compose start servico-produtos

# Deve retomar funcionamento automaticamente
curl -X GET http://localhost:3002/produtos \
  -H "Authorization: Bearer <seu_token_aqui>"
```

---

## Camada MCP (Model Context Protocol)

O MCP permite que agentes de IA consultem dados do sistema em linguagem natural, sem conhecer detalhes técnicos das APIs.

### Estrutura MCP

A pasta `mcp/` contém:

```
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

```bash
curl -X POST http://localhost:3000/auth/registro \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "MCP Service",
    "email": "mcp@grafix.com",
    "senha": "mcp123456",
    "perfil": "gestor"
  }'
```

**Nota:** As credenciais devem corresponder às variáveis `MCP_EMAIL` e `MCP_SENHA` no arquivo `mcp/.env`.

#### 2. Configurar variáveis de ambiente MCP

```bash
cd mcp
cp .env.example .env

# Edite o arquivo .env com:
# - GOOGLE_API_KEY (obtenha em https://ai.google.dev)
# - MCP_EMAIL e MCP_SENHA (as credenciais criadas acima)
nano .env
```

#### 3. Subir os containers MCP

```bash
docker compose up --build -d
```

Isso sobe 3 containers:
- `clientes-mcp` (porta 8001) — acesso a clientes
- `produtos-mcp` (porta 8002) — acesso a produtos
- `pedidos-mcp` (porta 8003) — acesso a pedidos

#### 4. Executar o chat com Gemini

```bash
# Instalar dependências Python (fora do Docker)
pip install -r requirements.txt

# Rodar o chat
python3 chat_google.py
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
> Mostre detalhes do pedido com ID ...
```

A IA interpreta as perguntas e chama as ferramentas MCP automaticamente.

---

## Monitoramento e Logs

### Ver logs de um serviço específico

```bash
# Logs em tempo real
docker compose logs -f servico-produtos

# Últimas 50 linhas
docker compose logs --tail 50 servico-clientes

# Logs de todos os serviços
docker compose logs -f
```

### Conectar ao MongoDB diretamente

```bash
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

## Troubleshooting

### Erro: "Porta 3000 já está em uso"

```bash
# Encontrar processo usando a porta
lsof -i :3000

# Matar o processo (Linux/Mac)
kill -9 <PID>

# Ou mudar a porta no docker-compose.yml
# Altere "3000:3000" para "3001:3000" (exemplo)
```

### Erro: "Cannot connect to Docker daemon"

```bash
# Verifique se Docker está rodando
docker ps

# Se não estiver, inicie o Docker Desktop ou serviço Docker
# Linux: sudo systemctl start docker
# Mac: open /Applications/Docker.app
```

### Serviço não consegue conectar ao MongoDB

```bash
# Verifique se o container MongoDB está rodando
docker compose ps grafix-mongo

# Se não estiver, reinicie tudo
docker compose down
docker compose up --build -d
```

### Token JWT expirado

Se receber erro `401 Unauthorized`, faça login novamente e use um novo token:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@grafix.com","senha":"demo123456"}'
```

### Volume do MongoDB persistindo dados antigos

Para uma limpeza total:

```bash
# Parar e remover containers + volumes
docker compose down -v

# Recriar do zero
docker compose up --build -d
```

---

## Estrutura do Projeto

```
grafix-personalize/
├── servico-auth/              # Microsserviço de autenticação
│   ├── controllers/
│   ├── models/
│   ├── middlewares/
│   ├── package.json
│   └── Dockerfile
├── servico-clientes/          # Microsserviço de clientes
├── servico-produtos/          # Microsserviço de produtos
├── servico-pedidos/           # Microsserviço de pedidos
├── mcp/                       # Camada MCP com IA
│   ├── clientes/
│   ├── produtos/
│   ├── pedidos/
│   ├── chat_google.py
│   └── requirements.txt
├── docker-compose.yml         # Orquestração de containers
├── init-mongo.js              # Script de seed (dados iniciais)
├── .env.example               # Variáveis de ambiente
└── README.md                  # Este arquivo
```

---

## Fluxo de Desenvolvimento

1. **Desenvolvimento local:** Rode `docker compose up` e desenvolva os serviços
2. **Testes:** Use os endpoints com cURL ou Postman
3. **Resiliência:** Teste derrubar serviços individuais
4. **Integração IA:** Configure MCP e teste com Gemini
5. **Produção:** Faça push para repositório, implemente CI/CD (GitHub Actions)

---

## Próximos Passos (Não Incluído)

1. **Frontend Dashboard** (Vue.js 3 + Vite)
   - Interface para gerenciar clientes, produtos e pedidos
   - Quadro Kanban para rastreamento de pedidos
   - Gráficos com indicadores operacionais
   - Portal público de autoatendimento

2. **Integração com Cloudinary**
   - Upload de imagens de produtos
   - Referências visuais de clientes

3. **CI/CD com GitHub Actions**
   - Build automático
   - Testes unitários
   - Deploy em produção (Vercel/Render)

4. **OpenAI API** (alternativa a Google Gemini)
   - Suporte para múltiplos provedores de IA

---

## Suporte

Para dúvidas ou problemas:
1. Verifique a seção **Troubleshooting** acima
2. Inspect dos containers com `docker logs`
3. Consulte a documentação oficial: [Docker](https://docs.docker.com), [MongoDB](https://docs.mongodb.com), [Node.js](https://nodejs.org/docs)

---

**Versão:** 1.0  
**Última atualização:** Setembro 2026  
**Desenvolvido para:** POSWEB - Instituto Federal da Bahia
