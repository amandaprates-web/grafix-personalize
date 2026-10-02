import asyncio
import json
import os
from contextlib import AsyncExitStack

from dotenv import load_dotenv
from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client

from google import genai

MODELO = "gemini-3.5-flash-lite"
PROMPT = """
Você é um assistente administrativo da gráfica Grafix Personalize. O seu nome é GrafixBot.

Quando o usuário fizer uma saudação ou iniciar uma conversa, você deve se apresentar como
GrafixBot, e informar que você não é uma pessoa real, mas um assistente virtual. Se apresente
de forma amigável e cordial.

Quando o usuário solicitar informações sobre clientes, produtos/estoque ou pedidos, você deve
utilizar as ferramentas MCP disponíveis para obter essas informações, nunca inventar dados.
Também é necessário que você identifique quando mais de uma ferramenta é necessária para
atender a solicitação do usuário, e nesse caso utilize todas as ferramentas necessárias.

Você deve seguir obrigatoriamente essas regras importantes:

    - Se o usuário perguntar sobre o status ou andamento de um pedido, utilize as
    ferramentas de pedidos;
    - Se o usuário perguntar sobre estoque, produtos ou o que está acabando, utilize
    as ferramentas de produtos;
    - Se o usuário perguntar sobre dados de um cliente, utilize as ferramentas de clientes;
    - Se o usuário fizer uma pergunta que não esteja relacionada a clientes, produtos/estoque
    ou pedidos, você deve dizer que não está capacitado para responder e deve orientar o
    usuário a entrar em contato com o suporte da Grafix Personalize.
"""

load_dotenv()

SERVICOS_MCP = {
    "clientes": "http://localhost:8001/mcp",
    "produtos": "http://localhost:8002/mcp",
    "pedidos": "http://localhost:8003/mcp",
}


async def iniciar():
    iniciado, stack, cliente_IA = False, AsyncExitStack(), None

    try:
        cliente_IA = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])
        iniciado = True
    except Exception as e:
        print(f"⚠️ erro iniciando conexão com IA: {e}")

    return iniciado, stack, cliente_IA


async def conectar_servicos(stack):
    servicos = {}

    for nome_servico, url in SERVICOS_MCP.items():
        stream_leitura, stream_escrita = await stack.enter_async_context(
            streamable_http_client(url)
        )

        conexao = await stack.enter_async_context(
            ClientSession(stream_leitura, stream_escrita)
        )
        await conexao.initialize()

        servicos[nome_servico] = conexao
        print(f"conectado ao serviço, '{nome_servico}'")

    return servicos


async def get_ferramentas(servicos):
    """Monta o mapa nome_unico -> dados da ferramenta (nome real + declaração p/ o Gemini).

    O nome_unico leva o prefixo do serviço (ex: 'clientes_informacoes') porque a
    ferramenta 'informacoes' se repete nos 3 serviços — sem o prefixo, a última
    sobrescreveria as outras duas no dicionário. O nome_real (sem prefixo) é o
    que de fato existe no servidor MCP e precisa ser usado na hora de chamar
    call_tool.
    """
    ferramentas = {}

    for nome_servico, conexao in servicos.items():
        resultado = await conexao.list_tools()

        for ferramenta in resultado.tools:
            nome_unico = f"{nome_servico}_{ferramenta.name}"

            ferramentas[nome_unico] = {
                "nome_real": ferramenta.name,
                "servico": {"nome": nome_servico, "conexao": conexao},
                "declaracao": {
                    "type": "function",
                    "name": nome_unico,
                    "description": f"[{nome_servico}] {ferramenta.description}",
                    "parameters": ferramenta.input_schema,
                },
            }

    return ferramentas


async def executar_ferramenta(ferramentas, ferramenta_desejada, argumentos):
    ferramenta = ferramentas[ferramenta_desejada]
    servico = ferramenta["servico"]
    nome_real = ferramenta["nome_real"]

    print(f"🤖 executando a ferramenta, '{nome_real}', do serviço, '{servico['nome']}'")

    conexao = servico["conexao"]
    resultado = await conexao.call_tool(nome_real, arguments=argumentos or {})

    return extrair_texto(resultado)


def extrair_texto(resultado):
    if resultado.structured_content:
        return json.dumps(resultado.structured_content, ensure_ascii=False)

    conteudo = []
    for c in resultado.content:
        if hasattr(c, "text"):
            conteudo.append(c.text)
        else:
            conteudo.append(str(c))

    return "\n".join(conteudo)


def exibir_apresentacao():
    print("\n" + "=" * 60)
    print("🤖 GrafixBot")
    print("Olá! Sou o assistente virtual da Grafix Personalize.")
    print("Não sou uma pessoa real, mas posso ajudar com clientes, produtos/estoque e pedidos.")
    print("Digite 'sair' para encerrar o chat.")
    print("=" * 60 + "\n")


async def chat(cliente_IA, ferramentas):
    tools = [f["declaracao"] for f in ferramentas.values()]

    # Em vez de reenviar o histórico inteiro a cada chamada (como no exemplo
    # original), usamos previous_interaction_id: só mandamos o que é NOVO a
    # cada vez, e a API mantém o contexto do lado do Google. Isso segue a
    # recomendação oficial e evita o bug de empilhar objetos crus no histórico.
    id_interacao_anterior = None
    primeira_mensagem = True

    while True:
        mensagem = input("\n👤 ")
        mensagem = mensagem.strip()

        if mensagem.lower() in ["sair", "exit", "quit"]:
            print("encerrando o chat...")
            break

        entrada = []
        if primeira_mensagem:
            entrada.append(
                {"type": "user_input", "content": [{"type": "text", "text": PROMPT}]}
            )
            primeira_mensagem = False

        entrada.append(
            {"type": "user_input", "content": [{"type": "text", "text": mensagem}]}
        )

        while True:
            resposta = await cliente_IA.aio.interactions.create(
                model=MODELO,
                input=entrada,
                tools=tools,
                previous_interaction_id=id_interacao_anterior,
            )

            id_interacao_anterior = resposta.id

            chamadas_funcao = [s for s in resposta.steps if s.type == "function_call"]

            if not chamadas_funcao:
                print(f"\n🤖 {resposta.output_text}")
                break

            entrada = []
            for chamada in chamadas_funcao:
                resultado = await executar_ferramenta(
                    ferramentas, chamada.name, chamada.arguments or {}
                )

                entrada.append(
                    {
                        "type": "function_result",
                        "name": chamada.name,
                        "call_id": chamada.id,
                        "result": [{"type": "text", "text": resultado}],
                    }
                )


async def finalizar(stack):
    await stack.aclose()


async def executar():
    iniciado, stack, cliente_IA = await iniciar()
    if iniciado:
        try:
            servicos = await conectar_servicos(stack)
            ferramentas = await get_ferramentas(servicos)

            exibir_apresentacao()
            await chat(cliente_IA, ferramentas)
        finally:
            await finalizar(stack)


if __name__ == "__main__":
    asyncio.run(executar())
