import { Language } from '@/types';

export const supportedLanguages: Language[] = [
  {
    id: 'javascript',
    name: 'JavaScript',
    extension: '.js',
    monacoLanguage: 'javascript',
    defaultCode: `// Bem-vindo ao JavaScript!
console.log("Olá, mundo!");

// Variáveis
let nome = "Estudante";
const idade = 25;

// Função
function saudar(nome) {
    return \`Olá, \${nome}!\`;
}

console.log(saudar(nome));`,
    description: 'Linguagem de programação dinâmica para web e desenvolvimento geral'
  },
  {
    id: 'python',
    name: 'Python',
    extension: '.py',
    monacoLanguage: 'python',
    defaultCode: `# Bem-vindo ao Python!
print("Olá, mundo!")

# Variáveis
nome = "Estudante"
idade = 25

# Função
def saudar(nome):
    return f"Olá, {nome}!"

print(saudar(nome))

# Lista
frutas = ["maçã", "banana", "laranja"]
for fruta in frutas:
    print(f"Eu gosto de {fruta}")`,
    description: 'Linguagem de programação simples e poderosa, ideal para iniciantes'
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    extension: '.ts',
    monacoLanguage: 'typescript',
    defaultCode: `// Bem-vindo ao TypeScript!
interface Pessoa {
    nome: string;
    idade: number;
}

const estudante: Pessoa = {
    nome: "Estudante",
    idade: 25
};

function saudar(pessoa: Pessoa): string {
    return \`Olá, \${pessoa.nome}! Você tem \${pessoa.idade} anos.\`;
}

console.log(saudar(estudante));`,
    description: 'JavaScript com tipagem estática para desenvolvimento mais seguro'
  },
  {
    id: 'java',
    name: 'Java',
    extension: '.java',
    monacoLanguage: 'java',
    defaultCode: `// Bem-vindo ao Java!
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Olá, mundo!");
        
        // Variáveis
        String nome = "Estudante";
        int idade = 25;
        
        // Chamada de método
        saudar(nome, idade);
    }
    
    public static void saudar(String nome, int idade) {
        System.out.println("Olá, " + nome + "! Você tem " + idade + " anos.");
    }
}`,
    description: 'Linguagem orientada a objetos robusta para desenvolvimento enterprise'
  },
  {
    id: 'csharp',
    name: 'C#',
    extension: '.cs',
    monacoLanguage: 'csharp',
    defaultCode: `// Bem-vindo ao C#!
using System;

class Program 
{
    static void Main() 
    {
        Console.WriteLine("Olá, mundo!");
        
        // Variáveis
        string nome = "Estudante";
        int idade = 25;
        
        // Chamada de método
        Saudar(nome, idade);
    }
    
    static void Saudar(string nome, int idade) 
    {
        Console.WriteLine($"Olá, {nome}! Você tem {idade} anos.");
    }
}`,
    description: 'Linguagem da Microsoft para desenvolvimento de aplicações .NET'
  },
  {
    id: 'cpp',
    name: 'C++',
    extension: '.cpp',
    monacoLanguage: 'cpp',
    defaultCode: `// Bem-vindo ao C++!
#include <iostream>
#include <string>

void saudar(const std::string& nome, int idade) {
    std::cout << "Olá, " << nome << "! Você tem " << idade << " anos." << std::endl;
}

int main() {
    std::cout << "Olá, mundo!" << std::endl;
    
    // Variáveis
    std::string nome = "Estudante";
    int idade = 25;
    
    // Chamada de função
    saudar(nome, idade);
    
    return 0;
}`,
    description: 'Linguagem de programação de alto desempenho para sistemas e jogos'
  }
];

export const getLessonsByLanguage = (languageId: string) => {
  const lessons = {
    javascript: [
      {
        id: 'js-basics',
        title: 'Fundamentos do JavaScript',
        level: 'beginner' as const,
        description: 'Aprenda variáveis, tipos de dados e operadores básicos',
        code: `// Variáveis em JavaScript
let nome = "João";
const idade = 30;
var ativo = true;

console.log(nome, idade, ativo);`,
        objectives: ['Entender variáveis', 'Conhecer tipos de dados', 'Usar console.log']
      },
      {
        id: 'js-functions',
        title: 'Funções em JavaScript',
        level: 'intermediate' as const,
        description: 'Aprenda a criar e usar funções',
        code: `// Funções em JavaScript
function calcular(a, b) {
    return a + b;
}

const resultado = calcular(5, 3);
console.log(resultado);`,
        objectives: ['Criar funções', 'Usar parâmetros', 'Retornar valores']
      }
    ],
    python: [
      {
        id: 'py-basics',
        title: 'Fundamentos do Python',
        level: 'beginner' as const,
        description: 'Aprenda variáveis e tipos de dados em Python',
        code: `# Variáveis em Python
nome = "João"
idade = 30
ativo = True

print(nome, idade, ativo)`,
        objectives: ['Entender variáveis', 'Conhecer tipos de dados', 'Usar print()']
      }
    ]
  };
  
  return lessons[languageId as keyof typeof lessons] || [];
};
