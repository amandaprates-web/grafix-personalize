from mcp.server.mcpserver import MCPServer
import urllib.request as requisicao
import urllib.error as erro_http
import json
import os

NOME = "clientes"
mcp = MCPServer(NOME)

URL_AUTH = "http://servico-auth:3000/auth/login"
URL_CLIENTES = "http://servico-clientes:3001/clientes"

EMAIL_SERVICO = os.environ.get("MCP_EMAIL", "mcp@grafix.com")
SENHA_SERVICO = os.environ.get("MCP_SENHA", "mcp123456")

INFO = {
    "nome": NOME,
    "descricao": "serviço MCP de clientes da Grafix Personalize"
}

_token = None


def obter_token(forcar_novo=False):
    """Faz login no servico-auth e guarda o token em cache (evita logar a cada chamada)."""
    global _token

    if _token and not forcar_novo:
        return _token

    corpo = json.dumps({"email": EMAIL_SERVICO, "senha": SENHA_SERVICO}).encode("utf-8")
    pedido_login = requisicao.Request(
        URL_AUTH,
        data=corpo,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        resposta = requisicao.urlopen(pedido_login)
        dados = json.loads(resposta.read().decode("utf-8"))
        _token = dados.get("token")
    except Exception as e:
        print(f"Ocorreu um erro ao autenticar no servico-auth: {e}")
        _token = None

    return _token


def acessar(url):
    """Faz um GET autenticado no serviço. Se o token expirou (401), renova e tenta de novo."""
    sucesso, conteudo, erro = False, None, None
    token = obter_token()
    tentativas = 0

    while tentativas < 2:
        tentativas += 1
        try:
            pedido = requisicao.Request(
                url, headers={"Authorization": f"Bearer {token}"}
            )
            resposta = requisicao.urlopen(pedido)

            if resposta.status == 200:
                conteudo = resposta.read().decode("utf-8")
                sucesso = True
            break
        except erro_http.HTTPError as e:
            if e.code == 401:
                token = obter_token(forcar_novo=True)
                continue
            erro = str(e)
            break
        except Exception as e:
            erro = str(e)
            break

    if not sucesso and not erro:
        erro = "Não foi possível autenticar no serviço"

    if not sucesso:
        print(f"Ocorreu um erro acessando: {url}, erro: {erro}")

    return sucesso, conteudo, erro


@mcp.tool(
    name="informacoes",
    title="informacoes sobre o servico MCP de clientes",
    description="apresenta informacoes basicas sobre o servico MCP de clientes da Grafix Personalize",
)
def get_info():
    return INFO


@mcp.tool(
    name="listar_clientes",
    title="lista todos os clientes",
    description="retorna a lista de todos os clientes cadastrados na Grafix Personalize",
)
def listar_clientes():
    sucesso, conteudo, erro = acessar(URL_CLIENTES)

    if sucesso:
        return conteudo
    else:
        return f"Ocorreu um erro: {erro}"


@mcp.tool(
    name="buscar_cliente_por_id",
    title="busca um cliente pelo id",
    description="retorna os dados de um cliente especifico da Grafix Personalize a partir do seu id",
)
def buscar_cliente_por_id(id_cliente):
    url = f"{URL_CLIENTES}/{id_cliente}"
    sucesso, conteudo, erro = acessar(url)

    if sucesso:
        return conteudo
    else:
        return f"Ocorreu um erro: {erro}"


if __name__ == "__main__":
    mcp.run(transport="streamable-http", streamable_http_path="/mcp", host="0.0.0.0")
