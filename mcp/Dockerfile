FROM python:latest

WORKDIR /mcp

# Copia apenas o arquivo de dependências primeiro
COPY requirements.txt .

# Instala todas as bibliotecas listadas no arquivo
RUN pip3 install --no-cache-dir -r requirements.txt

# Copia o restante dos arquivos do projeto (scripts e pastas)
COPY . .