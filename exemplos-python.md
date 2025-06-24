# 📚 Exemplos de Códigos Python - Diferentes Níveis

## 🟢 NÍVEL INICIANTE

### 1. Loops Básicos (for)
```python
# Loop simples com números
for i in range(5):
    print(f"Contando: {i}")

# Loop com lista de frutas
frutas = ["maçã", "banana", "laranja"]
for fruta in frutas:
    print(f"Eu gosto de {fruta}")
```

### 2. Loops Básicos (while)
```python
# Contador simples
contador = 0
while contador < 5:
    print(f"Contador: {contador}")
    contador += 1

# Perguntar nome até dar uma resposta
nome = ""
while nome == "":
    nome = input("Qual seu nome? ")
print(f"Olá, {nome}!")
```

### 3. Funções Simples
```python
# Função que saúda uma pessoa
def saudar(nome):
    return f"Olá, {nome}! Bem-vindo!"

# Função que soma dois números
def somar(a, b):
    return a + b

# Usando as funções
mensagem = saudar("João")
resultado = somar(5, 3)
print(mensagem)
print(f"5 + 3 = {resultado}")
```

## 🟡 NÍVEL INTERMEDIÁRIO

### 1. List Comprehensions
```python
# Criar lista de números pares
numeros = range(1, 11)
pares = [n for n in numeros if n % 2 == 0]
print(f"Números pares: {pares}")

# Elevar ao quadrado
quadrados = [x**2 for x in range(1, 6)]
print(f"Quadrados: {quadrados}")
```

### 2. Dicionários e Manipulação
```python
# Banco de dados simples de estudantes
estudantes = {
    "Maria": {"idade": 20, "curso": "Python"},
    "João": {"idade": 22, "curso": "JavaScript"},
    "Ana": {"idade": 19, "curso": "Python"}
}

# Filtrar estudantes de Python
python_students = {
    nome: dados for nome, dados in estudantes.items() 
    if dados["curso"] == "Python"
}

print("Estudantes de Python:")
for nome, dados in python_students.items():
    print(f"- {nome}, {dados['idade']} anos")
```

### 3. Classes Básicas
```python
class ContaBancaria:
    def __init__(self, titular, saldo_inicial=0):
        self.titular = titular
        self.saldo = saldo_inicial
    
    def depositar(self, valor):
        self.saldo += valor
        print(f"Depósito de R${valor}. Saldo atual: R${self.saldo}")
    
    def sacar(self, valor):
        if valor <= self.saldo:
            self.saldo -= valor
            print(f"Saque de R${valor}. Saldo atual: R${self.saldo}")
        else:
            print("Saldo insuficiente!")

# Usando a classe
conta = ContaBancaria("João", 100)
conta.depositar(50)
conta.sacar(30)
```

## 🔴 NÍVEL AVANÇADO

### 1. Decorators
```python
import time
from functools import wraps

def cronometrar(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        inicio = time.time()
        resultado = func(*args, **kwargs)
        fim = time.time()
        print(f"{func.__name__} executou em {fim - inicio:.4f} segundos")
        return resultado
    return wrapper

@cronometrar
def operacao_lenta():
    time.sleep(1)
    return "Operação concluída"

resultado = operacao_lenta()
```

### 2. Context Managers
```python
class GerenciadorArquivo:
    def __init__(self, nome_arquivo, modo):
        self.nome_arquivo = nome_arquivo
        self.modo = modo
        self.arquivo = None
    
    def __enter__(self):
        print(f"Abrindo arquivo {self.nome_arquivo}")
        self.arquivo = open(self.nome_arquivo, self.modo)
        return self.arquivo
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        print(f"Fechando arquivo {self.nome_arquivo}")
        if self.arquivo:
            self.arquivo.close()

# Usando o context manager
with GerenciadorArquivo("teste.txt", "w") as arquivo:
    arquivo.write("Conteúdo do arquivo")
```

### 3. Async/Await
```python
import asyncio
import aiohttp

async def buscar_url(session, url):
    async with session.get(url) as response:
        return await response.text()

async def buscar_multiplas_urls(urls):
    async with aiohttp.ClientSession() as session:
        tasks = [buscar_url(session, url) for url in urls]
        resultados = await asyncio.gather(*tasks)
        return resultados

# Exemplo de uso
async def main():
    urls = [
        "https://httpbin.org/delay/1",
        "https://httpbin.org/delay/2",
        "https://httpbin.org/delay/1"
    ]
    
    inicio = time.time()
    resultados = await buscar_multiplas_urls(urls)
    fim = time.time()
    
    print(f"Processou {len(urls)} URLs em {fim - inicio:.2f} segundos")

# asyncio.run(main())
```

## 🎯 EXEMPLOS PRÁTICOS POR TÓPICO

### Strings
```python
# Iniciante
nome = "Python"
print(f"Eu amo {nome}!")

# Intermediário
texto = "  Python é incrível!  "
limpo = texto.strip().upper()
palavras = limpo.split()
print(" -> ".join(palavras))

# Avançado
import re
texto = "Telefones: (11) 1234-5678 e (21) 9876-5432"
telefones = re.findall(r'\((\d{2})\) (\d{4}-\d{4})', texto)
print(f"Telefones encontrados: {telefones}")
```

### Tratamento de Erros
```python
# Iniciante
try:
    numero = int(input("Digite um número: "))
    print(f"Você digitou: {numero}")
except ValueError:
    print("Isso não é um número válido!")

# Intermediário
def dividir(a, b):
    try:
        resultado = a / b
        return resultado
    except ZeroDivisionError:
        print("Erro: Divisão por zero!")
        return None
    except TypeError:
        print("Erro: Tipos inválidos para divisão!")
        return None

# Avançado
class IdadeInvalidaError(Exception):
    def __init__(self, idade, message="Idade deve estar entre 0 e 120"):
        self.idade = idade
        self.message = message
        super().__init__(self.message)

def validar_idade(idade):
    if not 0 <= idade <= 120:
        raise IdadeInvalidaError(idade)
    return True
```

### Trabalhando com Arquivos
```python
# Iniciante
with open("arquivo.txt", "w") as arquivo:
    arquivo.write("Olá, mundo!")

with open("arquivo.txt", "r") as arquivo:
    conteudo = arquivo.read()
    print(conteudo)

# Intermediário
import json

dados = {
    "nome": "João", 
    "idade": 25, 
    "hobbies": ["programação", "leitura"]
}

# Salvar JSON
with open("dados.json", "w") as arquivo:
    json.dump(dados, arquivo, indent=2)

# Ler JSON
with open("dados.json", "r") as arquivo:
    dados_carregados = json.load(arquivo)
    print(dados_carregados)

# Avançado
import csv
from pathlib import Path

def processar_csv(caminho_arquivo):
    arquivo = Path(caminho_arquivo)
    
    if not arquivo.exists():
        print(f"Arquivo {caminho_arquivo} não encontrado!")
        return
    
    with arquivo.open('r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        dados = list(reader)
        
        # Estatísticas
        total_linhas = len(dados)
        colunas = reader.fieldnames
        
        return {
            "total_linhas": total_linhas,
            "colunas": colunas,
            "dados": dados[:5]  # Primeiras 5 linhas
        }
```
