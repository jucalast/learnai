'use client';

import { useState, useEffect, useRef } from 'react';
import { Bot, CheckCircle, ArrowRight, Lightbulb, Target, Code, MessageCircle, Send } from 'lucide-react';

interface Message {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
  hasOptions?: boolean;
  options?: string[];
}

interface ConceptStatus {
  name: string;
  understood: boolean;
  needsPractice: boolean;
}

interface InteractiveLearningProps {
  language: string;
  onCodeChange: (code: string) => void;
  onMessage: (message: any) => void;
  currentCode: string;
  userLevel: 'beginner' | 'intermediate' | 'advanced';
}

export default function InteractiveLearning({
  language,
  onCodeChange,
  onMessage,
  currentCode,
  userLevel
}: InteractiveLearningProps) {
  const [conversation, setConversation] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentConcept, setCurrentConcept] = useState<string>('');
  const [conceptsProgress, setConceptsProgress] = useState<ConceptStatus[]>([]);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [currentStep, setCurrentStep] = useState<'checking' | 'explaining' | 'demonstrating' | 'practicing'>('checking');
  
  // Conceitos por linguagem e nível
  const getConceptsForLanguage = (lang: string, level: string) => {
    if (lang.toLowerCase() === 'python') {
      switch (level) {
        case 'beginner':
          return [
            'variables', 'data_types', 'strings', 'numbers', 'lists', 
            'conditionals', 'loops', 'functions', 'input_output'
          ];
        case 'intermediate':
          return [
            'dictionaries', 'sets', 'list_comprehensions', 'error_handling',
            'file_operations', 'classes', 'modules', 'lambda_functions'
          ];
        case 'advanced':
          return [
            'decorators', 'generators', 'context_managers', 'metaclasses',
            'async_programming', 'threading', 'performance_optimization'
          ];
      }
    }
    return ['variables', 'functions', 'conditionals', 'loops'];
  };

  const concepts = getConceptsForLanguage(language, userLevel);
  
  // Inicializar conceitos
  useEffect(() => {
    if (concepts.length > 0) {
      setConceptsProgress(concepts.map(concept => ({
        name: concept,
        understood: false,
        needsPractice: false
      })));
      
      // Começar o aprendizado
      setTimeout(() => {
        startLearningFlow();
      }, 1000);
    }
  }, [language, userLevel]);

  const startLearningFlow = () => {
    const welcomeMsg: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: `Ótimo! Agora vamos começar um aprendizado interativo de ${language}. Vou te ensinar de forma prática, perguntando, explicando e dando exercícios em tempo real! 🚀`,
      timestamp: new Date()
    };
    
    setConversation([welcomeMsg]);
    
    // Começar verificando o primeiro conceito
    setTimeout(() => {
      checkConceptKnowledge(concepts[0]);
    }, 2000);
  };

  const checkConceptKnowledge = (concept: string) => {
    setCurrentConcept(concept);
    setCurrentStep('checking');
    
    const questions = getConceptQuestions(concept, language);
    
    const questionMsg: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: questions.checkKnowledge,
      timestamp: new Date(),
      hasOptions: true,
      options: ['Sim, conheço bem', 'Já ouvi falar, mas não domino', 'Não, nunca vi isso', 'Quero revisar mesmo conhecendo']
    };
    
    setConversation(prev => [...prev, questionMsg]);
    setIsWaitingForResponse(true);
  };

  const getConceptQuestions = (concept: string, lang: string) => {
    const conceptMap: Record<string, any> = {
      variables: {
        checkKnowledge: `Vamos começar com variáveis em ${lang}! Você já sabe o que são variáveis e como criar elas?`,
        explanation: 'Variáveis são como "caixas" onde guardamos informações na memória do computador. É um dos conceitos mais fundamentais!',
        demoCode: lang === 'python' ? 
          `# Criando variáveis em Python
nome = "João"
idade = 25
altura = 1.75
estudante = True

print("Nome:", nome)
print("Idade:", idade)
print("Altura:", altura)
print("É estudante?", estudante)` :
          `// Criando variáveis em JavaScript
let nome = "João";
let idade = 25;
let altura = 1.75;
let estudante = true;

console.log("Nome:", nome);
console.log("Idade:", idade);`,
        practice: 'Agora é sua vez! Crie uma variável com seu nome e outra com sua idade, depois use print() para mostrar elas.'
      },
      data_types: {
        checkKnowledge: `Agora sobre tipos de dados em ${lang}! Você sabe quais são os tipos básicos como string, int, float?`,
        explanation: 'Tipos de dados definem que tipo de informação uma variável pode guardar: texto (string), números inteiros (int), decimais (float), verdadeiro/falso (bool), etc.',
        demoCode: `# Tipos de dados em Python
texto = "Olá mundo!"          # str (string)
inteiro = 42                  # int 
decimal = 3.14               # float
booleano = True              # bool
lista = [1, 2, 3]           # list
dicionario = {"nome": "Ana"} # dict

# Verificando os tipos
print(type(texto))
print(type(inteiro))
print(type(lista))`,
        practice: 'Crie uma variável de cada tipo básico (string, int, float, bool) e use type() para ver o tipo de cada uma!'
      },
      conditionals: {
        checkKnowledge: `Vamos falar sobre condicionais (if, else) em ${lang}! Você sabe como fazer o programa tomar decisões?`,
        explanation: 'Condicionais permitem que o programa tome decisões baseadas em condições. É como perguntar "se isso for verdade, faça aquilo".',
        demoCode: `# Condicionais em Python
idade = 18

if idade >= 18:
    print("Você é maior de idade!")
    print("Pode dirigir e votar")
else:
    print("Você é menor de idade")
    print("Ainda não pode dirigir")

# Múltiplas condições
nota = 8.5

if nota >= 9:
    print("Excelente!")
elif nota >= 7:
    print("Bom trabalho!")
else:
    print("Precisa estudar mais")`,
        practice: 'Crie um programa que pergunta a temperatura e diz se está frio (< 15°), agradável (15-25°) ou quente (> 25°)!'
      }
    };
    
    return conceptMap[concept] || {
      checkKnowledge: `Vamos aprender sobre ${concept}!`,
      explanation: `Este é um conceito importante em ${lang}.`,
      demoCode: `# Exemplo de ${concept}`,
      practice: `Pratique ${concept} agora!`
    };
  };

  const handleUserResponse = (response: string) => {
    if (!isWaitingForResponse) return;
    
    setIsWaitingForResponse(false);
    
    // Adicionar resposta do usuário
    const userMsg: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: response,
      timestamp: new Date()
    };
    
    setConversation(prev => [...prev, userMsg]);
    
    // Processar resposta baseada no passo atual
    setTimeout(() => {
      if (currentStep === 'checking') {
        handleKnowledgeResponse(response);
      } else if (currentStep === 'practicing') {
        handlePracticeResponse(response);
      }
    }, 1000);
  };

  const handleKnowledgeResponse = (response: string) => {
    if (response.includes('Não') || response.includes('nunca vi')) {
      // Usuário não conhece - explicar do zero
      explainConcept(currentConcept, 'beginner');
    } else if (response.includes('ouvi falar') || response.includes('não domino')) {
      // Conhece superficialmente - explicar com mais detalhes
      explainConcept(currentConcept, 'intermediate');
    } else if (response.includes('revisar')) {
      // Quer revisar - explicação rápida e prática
      explainConcept(currentConcept, 'review');
    } else {
      // Conhece bem - dar desafio avançado
      giveAdvancedChallenge(currentConcept);
    }
  };

  const explainConcept = (concept: string, depth: 'beginner' | 'intermediate' | 'review') => {
    setCurrentStep('explaining');
    const questions = getConceptQuestions(concept, language);
    
    const explanationMsg: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: questions.explanation,
      timestamp: new Date()
    };
    
    setConversation(prev => [...prev, explanationMsg]);
    
    // Enviar para o assistente principal
    onMessage({
      id: explanationMsg.id,
      type: 'explanation',
      suggestion: questions.explanation,
      explanation: `Explicando: ${concept}`,
      timestamp: explanationMsg.timestamp
    });
    
    // Depois da explicação, mostrar código
    setTimeout(() => {
      demonstrateConcept(concept);
    }, 3000);
  };

  const demonstrateConcept = (concept: string) => {
    setCurrentStep('demonstrating');
    const questions = getConceptQuestions(concept, language);
    
    const demoMsg: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: 'Agora vou mostrar na prática! Vou digitar o código no editor para você ver:',
      timestamp: new Date()
    };
    
    setConversation(prev => [...prev, demoMsg]);
    
    // Simular digitação do código
    setTimeout(() => {
      simulateTyping(questions.demoCode);
    }, 2000);
    
    // Após demonstração, ir para prática
    setTimeout(() => {
      startPractice(concept);
    }, questions.demoCode.length * 30 + 3000);
  };

  const simulateTyping = (code: string) => {
    setIsTyping(true);
    let index = 0;
    const typeSpeed = 30;
    
    onCodeChange(''); // Limpar editor
    
    const typeChar = () => {
      if (index <= code.length) {
        onCodeChange(code.substring(0, index));
        index++;
        setTimeout(typeChar, typeSpeed);
      } else {
        setIsTyping(false);
      }
    };
    
    typeChar();
  };

  const startPractice = (concept: string) => {
    setCurrentStep('practicing');
    const questions = getConceptQuestions(concept, language);
    
    const practiceMsg: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: questions.practice,
      timestamp: new Date(),
      hasOptions: true,
      options: ['Vou tentar agora!', 'Preciso de uma dica', 'Quero outro exemplo primeiro']
    };
    
    setConversation(prev => [...prev, practiceMsg]);
    setIsWaitingForResponse(true);
    
    // Enviar para assistente
    onMessage({
      id: practiceMsg.id,
      type: 'encouragement',
      suggestion: 'Hora de praticar! Tente escrever o código.',
      explanation: questions.practice,
      timestamp: practiceMsg.timestamp
    });
  };

  const handlePracticeResponse = (response: string) => {
    if (response.includes('dica')) {
      giveHint(currentConcept);
    } else if (response.includes('exemplo')) {
      giveAnotherExample(currentConcept);
    } else {
      // Usuário vai tentar
      const encourageMsg: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: 'Perfeito! Agora digite seu código no editor. Vou acompanhar e te dar dicas em tempo real! 💪',
        timestamp: new Date()
      };
      
      setConversation(prev => [...prev, encourageMsg]);
      
      // Monitorar código do usuário
      setTimeout(() => {
        monitorUserCode();
      }, 2000);
    }
  };

  const giveHint = (concept: string) => {
    const hints: Record<string, string> = {
      variables: 'Lembre-se: nome_da_variavel = valor. Para texto use aspas: nome = "João"',
      data_types: 'Use type(variavel) para ver o tipo. Teste com: type("texto"), type(123), type(3.14)',
      conditionals: 'A estrutura é: if condição: ação. Não esqueça dos dois pontos (:) e da indentação!'
    };
    
    const hintMsg: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: `💡 Dica: ${hints[concept] || 'Tente passo a passo, sem pressa!'}`,
      timestamp: new Date()
    };
    
    setConversation(prev => [...prev, hintMsg]);
  };

  const monitorUserCode = () => {
    // Esta função vai ser chamada para analisar o código do usuário
    const feedbackMsg: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: 'Estou vendo que você está escrevendo! Continue, vou te dar feedback assim que terminar. Se precisar de ajuda, é só perguntar! 👀',
      timestamp: new Date()
    };
    
    setConversation(prev => [...prev, feedbackMsg]);
    
    // Marcar conceito como concluído após um tempo
    setTimeout(() => {
      markConceptCompleted(currentConcept);
    }, 10000);
  };

  const markConceptCompleted = (concept: string) => {
    setConceptsProgress(prev => 
      prev.map(c => 
        c.name === concept 
          ? { ...c, understood: true }
          : c
      )
    );
    
    const completionMsg: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: `🎉 Excelente! Você entendeu ${concept}! Vamos para o próximo conceito?`,
      timestamp: new Date(),
      hasOptions: true,
      options: ['Sim, vamos continuar!', 'Quero praticar mais este', 'Tenho uma dúvida']
    };
    
    setConversation(prev => [...prev, completionMsg]);
    setIsWaitingForResponse(true);
  };

  const giveAdvancedChallenge = (concept: string) => {
    const challengeMsg: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: `Como você já conhece ${concept}, que tal um desafio mais avançado? Vou te dar um exercício interessante!`,
      timestamp: new Date()
    };
    
    setConversation(prev => [...prev, challengeMsg]);
    
    setTimeout(() => {
      markConceptCompleted(concept);
    }, 5000);
  };

  const giveAnotherExample = (concept: string) => {
    const exampleMsg: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: 'Claro! Vou te dar outro exemplo para ficar mais claro:',
      timestamp: new Date()
    };
    
    setConversation(prev => [...prev, exampleMsg]);
    
    // Dar outro exemplo no código
    setTimeout(() => {
      const alternativeCode = getAlternativeExample(concept);
      simulateTyping(alternativeCode);
    }, 2000);
  };

  const getAlternativeExample = (concept: string): string => {
    const examples: Record<string, string> = {
      variables: `# Outro exemplo de variáveis
produto = "Notebook"
preco = 2500.99
disponivel = True
quantidade = 5

print(f"Produto: {produto}")
print(f"Preço: R$ {preco}")
print(f"Disponível: {disponivel}")
print(f"Quantidade: {quantidade}")`,
      
      conditionals: `# Exemplo com condicionais
salario = 5000

if salario > 10000:
    print("Salário alto")
    desconto = salario * 0.27
elif salario > 3000:
    print("Salário médio")
    desconto = salario * 0.15
else:
    print("Salário baixo")
    desconto = 0

print(f"Desconto: R$ {desconto}")`,
    };
    
    // Retornar o exemplo específico ou um exemplo genérico se não encontrado
    return examples[concept] || `# Exemplo de ${concept}\n# Tente modificar este código para praticar!`;
  };

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="bg-primary border border-secondary rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-secondary flex items-center">
            <Target className="w-4 h-4 mr-2 text-muted" />
            Aprendizado Interativo - {language}
          </h3>
          <span className="text-xs text-subtle">
            {conceptsProgress.filter(c => c.understood).length}/{conceptsProgress.length} concluídos
          </span>
        </div>
        
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {conceptsProgress.map((concept, index) => (
            <div
              key={concept.name}
              className={`h-2 rounded-full transition-all duration-300 ${
                concept.understood
                  ? 'bg-green-500'
                  : concept.name === currentConcept
                  ? 'bg-blue-500'
                  : 'bg-secondary'
              }`}
              title={concept.name}
            />
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="space-y-3">
        {conversation.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            {message.type === 'ai' && (
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            
            <div
              className={`max-w-[80%] p-3 rounded-lg border ${
                message.type === 'ai'
                  ? 'bg-primary border-secondary text-secondary'
                  : 'bg-secondary border-secondary text-secondary'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
              
              {/* Options */}
              {message.hasOptions && message.options && isWaitingForResponse && (
                <div className="mt-3 space-y-2">
                  {message.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleUserResponse(option)}
                      className="w-full text-left p-2 bg-secondary hover-bg-tertiary border border-secondary hover:border-tertiary rounded text-sm text-secondary transition-colors"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-primary border border-secondary p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <span className="text-xs text-subtle ml-2">Digitando código...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Manual Input */}
      {!isWaitingForResponse && conversation.length > 0 && (
        <div className="flex space-x-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Digite sua pergunta ou dúvida..."
            className="flex-1 px-3 py-2 bg-secondary border border-secondary rounded text-sm text-secondary placeholder-gray-500 focus:border-tertiary focus:outline-none"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && userInput.trim()) {
                handleUserResponse(userInput);
                setUserInput('');
              }
            }}
          />
          <button
            onClick={() => {
              if (userInput.trim()) {
                handleUserResponse(userInput);
                setUserInput('');
              }
            }}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
    