'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Bot, MessageCircle, Send } from 'lucide-react';

export interface UserAssessment {
  language: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'unknown';
  experience: string;
  interests: string[];
  previousKnowledge: string[];
}

export interface ConversationMessage {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
  options?: string[];
}

interface Message {
  id: string;
  type: 'hint' | 'explanation' | 'encouragement' | 'correction' | 'suggestion';
  suggestion: string;
  explanation: string;
  timestamp: Date;
}

interface InitialAssessmentProps {
  language: string;
  onCodeChange: (code: string) => void;
  onMessage: (message: Message) => void;
  onAssessmentComplete: (assessment: UserAssessment) => void;
  currentCode: string;
}

export default function InitialAssessment({
  language,
  onCodeChange,
  onMessage,
  onAssessmentComplete,
  currentCode
}: InitialAssessmentProps) {
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userResponses, setUserResponses] = useState<string[]>([]);
  const [showInput, setShowInput] = useState(false);
  const [isAssessmentStarted, setIsAssessmentStarted] = useState(false);
  
  // Ref para controlar se o assessment já foi iniciado para esta linguagem
  const assessmentInitialized = useRef<string | null>(null);

  // Perguntas específicas por linguagem
  const getAssessmentQuestions = (lang: string) => {
    const common = {
      intro: `Olá! 👋 Vejo que você selecionou ${lang}. Que bom! Vou te ajudar a aprender de forma personalizada.`,
      experience: `Para começar, me conta: qual é sua experiência com programação em geral?`,
      experienceOptions: [
        'Nunca programei antes - sou totalmente iniciante',
        'Já programei um pouco, mas sou básico',
        'Tenho experiência intermediária em programação',
        'Sou experiente em programação'
      ]
    };

    switch (lang.toLowerCase()) {
      case 'python':
        return {
          ...common,
          specific: 'E especificamente sobre Python, você já teve algum contato?',
          specificOptions: [
            'Nunca usei Python',
            'Já ouvi falar, mas nunca pratiquei',
            'Já fiz alguns exercícios básicos',
            'Já desenvolvi alguns projetos pequenos',
            'Tenho bastante experiência com Python'
          ],
          concepts: 'Quais desses conceitos em Python você já conhece ou já ouviu falar?',
          conceptOptions: [
            'Variáveis e tipos de dados',
            'Listas e dicionários',
            'Loops (for, while)',
            'Funções',
            'Classes e objetos',
            'Bibliotecas (numpy, pandas)',
            'Nenhum desses'
          ]
        };
      
      case 'javascript':
        return {
          ...common,
          specific: 'E sobre JavaScript, qual sua experiência?',
          specificOptions: [
            'Nunca usei JavaScript',
            'Já vi código JavaScript, mas não entendo',
            'Já fiz alguns scripts básicos',
            'Já desenvolvi algumas funcionalidades web',
            'Sou experiente em JavaScript'
          ],
          concepts: 'Quais conceitos de JavaScript você já conhece?',
          conceptOptions: [
            'Variáveis (let, const, var)',
            'Funções e arrow functions',
            'DOM (manipulação de elementos)',
            'Events (clicks, etc)',
            'Promises e async/await',
            'React/Vue/Angular',
            'Nenhum desses'
          ]
        };
      
      default:
        return common;
    }
  };

  const questions = getAssessmentQuestions(language);

  const completeAssessment = useCallback(() => {
    const assessment = analyzeResponses(userResponses);
    
    const completionMsg: ConversationMessage = {
      id: Date.now().toString(),
      type: 'ai',
      content: getPersonalizedWelcome(assessment),
      timestamp: new Date()
    };

    setConversation(prev => [...prev, completionMsg]);
    
    onMessage({
      id: completionMsg.id,
      type: 'encouragement',
      suggestion: completionMsg.content,
      explanation: 'Agora vou criar um plano de aprendizado personalizado para você!',
      timestamp: completionMsg.timestamp
    });

    // Dar uma demonstração baseada no nível
    setTimeout(() => {
      giveLevelAppropriateDemo(assessment);
    }, 3000);

    onAssessmentComplete(assessment);
  }, [userResponses, onMessage, onAssessmentComplete]);

  const askNextQuestion = useCallback(() => {
    // Verificar se ainda estamos no processo de assessment
    if (!isAssessmentStarted) return;
    
    let questionContent = '';
    let options: string[] = [];

    switch (currentQuestion) {
      case 0:
        questionContent = questions.experience;
        options = questions.experienceOptions;
        break;
      case 1:
        questionContent = 'specific' in questions ? questions.specific : 'Conte-me mais sobre sua experiência.';
        options = 'specificOptions' in questions ? questions.specificOptions : ['Pouca experiência', 'Experiência moderada', 'Bastante experiência'];
        break;
      case 2:
        questionContent = 'concepts' in questions ? questions.concepts : 'Quais conceitos você já conhece?';
        options = 'conceptOptions' in questions ? questions.conceptOptions : ['Conceitos básicos', 'Conceitos intermediários', 'Conceitos avançados'];
        break;
      default:
        completeAssessment();
        return;
    }

    const questionMsg: ConversationMessage = {
      id: Date.now().toString(),
      type: 'ai',
      content: questionContent,
      timestamp: new Date(),
      options
    };

    setConversation(prev => [...prev, questionMsg]);
    
    // Enviar para container principal
    onMessage({
      id: questionMsg.id,
      type: 'hint',
      suggestion: questionContent,
      explanation: 'Escolha a opção que melhor te representa:',
      timestamp: questionMsg.timestamp
    });

    setIsWaitingForResponse(true);
    setShowInput(false);
  }, [isAssessmentStarted, currentQuestion, questions, onMessage, completeAssessment]);

  // Função para fazer uma pergunta específica (sem dependências problemáticas)
  const makeQuestion = (questionIndex: number) => {
    if (!isAssessmentStarted) return;
    
    let questionContent = '';
    let options: string[] = [];

    switch (questionIndex) {
      case 0:
        questionContent = questions.experience;
        options = questions.experienceOptions;
        break;
      case 1:
        questionContent = 'specific' in questions ? questions.specific : 'Conte-me mais sobre sua experiência.';
        options = 'specificOptions' in questions ? questions.specificOptions : ['Pouca experiência', 'Experiência moderada', 'Bastante experiência'];
        break;
      case 2:
        questionContent = 'concepts' in questions ? questions.concepts : 'Quais conceitos você já conhece?';
        options = 'conceptOptions' in questions ? questions.conceptOptions : ['Conceitos básicos', 'Conceitos intermediários', 'Conceitos avançados'];
        break;
      default:
        return;
    }

    const questionMsg: ConversationMessage = {
      id: Date.now().toString(),
      type: 'ai',
      content: questionContent,
      timestamp: new Date(),
      options
    };

    setConversation(prev => [...prev, questionMsg]);
    
    // Enviar para container principal
    onMessage({
      id: questionMsg.id,
      type: 'hint',
      suggestion: questionContent,
      explanation: 'Escolha a opção que melhor te representa:',
      timestamp: questionMsg.timestamp
    });

    setIsWaitingForResponse(true);
    setShowInput(false);
  };

  const startAssessment = useCallback(() => {
    // Resetar e iniciar assessment
    setIsAssessmentStarted(true);
    setCurrentQuestion(0);
    setUserResponses([]);
    setShowInput(false);
    
    // Limpar editor
    onCodeChange('');
    
    // Mensagem inicial
    const welcomeMsg: ConversationMessage = {
      id: Date.now().toString(),
      type: 'ai',
      content: questions.intro,
      timestamp: new Date()
    };

    setConversation([welcomeMsg]);
    
    // Enviar para o container de mensagens também
    onMessage({
      id: welcomeMsg.id,
      type: 'hint',
      suggestion: welcomeMsg.content,
      explanation: 'Vamos começar nossa jornada de aprendizado!',
      timestamp: welcomeMsg.timestamp
    });

    // Após um delay, fazer a primeira pergunta
    setTimeout(() => {
      askNextQuestion();
    }, 2000);
  }, [questions.intro, onCodeChange, onMessage, askNextQuestion]);

  const handleOptionSelect = (option: string) => {
    // Evitar múltiplas seleções
    if (!isWaitingForResponse || !isAssessmentStarted) return;
    
    setIsWaitingForResponse(false);
    
    // Adicionar resposta do usuário
    const userMsg: ConversationMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: option,
      timestamp: new Date()
    };

    setConversation(prev => [...prev, userMsg]);
    setUserResponses(prev => [...prev, option]);

    // Capturar a pergunta atual antes de avançar
    const questionIndex = currentQuestion;

    // Dar feedback sobre a resposta
    const feedback = getFeedbackForResponse(questionIndex, option);
    if (feedback) {
      setTimeout(() => {
        const feedbackMsg: ConversationMessage = {
          id: Date.now().toString(),
          type: 'ai',
          content: feedback,
          timestamp: new Date()
        };

        setConversation(prev => [...prev, feedbackMsg]);
        
        onMessage({
          id: feedbackMsg.id,
          type: 'explanation',
          suggestion: feedback,
          explanation: '',
          timestamp: feedbackMsg.timestamp
        });
      }, 1000);
    }

    // Avançar para próxima pergunta
    setTimeout(() => {
      if (isAssessmentStarted) {
        const nextQuestion = questionIndex + 1;
        setCurrentQuestion(nextQuestion);
        
        // Chamar próxima pergunta diretamente após pequeno delay
        setTimeout(() => {
          if (nextQuestion >= 3) {
            completeAssessment();
          } else {
            // Fazer próxima pergunta manualmente para evitar loops
            makeQuestion(nextQuestion);
          }
        }, 200);
      }
    }, feedback ? 3000 : 1500);
  };

  const getFeedbackForResponse = (questionIndex: number, response: string): string => {
    if (questionIndex === 0) { // Experiência geral
      if (response.includes('Nunca programei')) {
        return 'Perfeito! Todo mundo começa do zero. Vou te guiar passo a passo! 😊';
      } else if (response.includes('básico')) {
        return 'Ótimo! Já tem uma base, isso vai nos ajudar muito! 👍';
      } else if (response.includes('intermediária')) {
        return 'Excelente! Com sua experiência, podemos focar nos detalhes específicos! 🚀';
      } else {
        return 'Fantástico! Vou adaptar o conteúdo para seu nível avançado! 💪';
      }
    }
    return '';
  };

  const analyzeResponses = (responses: string[]): UserAssessment => {
    let level: 'beginner' | 'intermediate' | 'advanced' | 'unknown' = 'beginner';
    
    const generalExp = responses[0] || '';
    const specificExp = responses[1] || '';
    
    if (generalExp.includes('experiente') || specificExp.includes('bastante experiência')) {
      level = 'advanced';
    } else if (generalExp.includes('intermediária') || specificExp.includes('projetos pequenos')) {
      level = 'intermediate';
    } else if (generalExp.includes('básico') || specificExp.includes('exercícios básicos')) {
      level = 'beginner';
    }

    return {
      language,
      level,
      experience: generalExp,
      interests: [],
      previousKnowledge: responses.slice(2) || []
    };
  };

  const getPersonalizedWelcome = (assessment: UserAssessment): string => {
    const name = assessment.language;
    
    switch (assessment.level) {
      case 'beginner':
        return `Perfeito! Vou te ensinar ${name} do zero, de forma bem didática e prática. Prepare-se para uma jornada incrível! 🎯`;
      case 'intermediate':
        return `Ótimo! Como você já tem uma base, vamos focar em consolidar seus conhecimentos e explorar conceitos mais avançados de ${name}! 📈`;
      case 'advanced':
        return `Excelente! Vamos trabalhar com conceitos avançados e boas práticas de ${name}. Vai ser bem técnico e prático! 🔥`;
      default:
        return `Vamos começar nossa jornada com ${name}! Vou adaptar o conteúdo conforme formos progredindo! ✨`;
    }
  };

  const giveLevelAppropriateDemo = (assessment: UserAssessment) => {
    let demoCode = '';
    let explanation = '';

    if (assessment.language.toLowerCase() === 'python') {
      switch (assessment.level) {
        case 'beginner':
          demoCode = `# Seu primeiro programa em Python!
print("Olá! Bem-vindo ao Python!")

# Vamos criar sua primeira variável
nome = "Seu nome aqui"
print(f"Olá, {nome}!")`;
          explanation = 'Vou digitar um exemplo bem simples para você ver como o Python funciona!';
          break;
        
        case 'intermediate':
          demoCode = `# Python intermediário - trabalhando com funções e listas
def processar_dados(lista_numeros):
    """Função que processa uma lista de números"""
    resultado = []
    for numero in lista_numeros:
        if numero % 2 == 0:
            resultado.append(numero * 2)
    return resultado

numeros = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
numeros_processados = processar_dados(numeros)
print(f"Números pares dobrados: {numeros_processados}")`;
          explanation = 'Vou mostrar um exemplo mais elaborado com funções e manipulação de listas!';
          break;
        
        case 'advanced':
          demoCode = `# Vamos trabalhar com conceitos avançados!
# O editor está pronto para você começar
print("Pronto para conceitos avançados de Python!")`;
          explanation = 'Ótimo! Como você já tem experiência, vou deixar o editor limpo para trabalharmos juntos em conceitos mais avançados conforme sua necessidade!';
          break;
      }
    }

    // Enviar explicação
    onMessage({
      id: Date.now().toString(),
      type: 'explanation',
      suggestion: explanation,
      explanation: 'Observe como vou digitar no editor:',
      timestamp: new Date()
    });

    // Simular digitação após delay
    setTimeout(() => {
      simulateTyping(demoCode);
    }, 2000);

    // Após demo, começar interação
    setTimeout(() => {
      startInteractiveSession(assessment);
    }, demoCode.length * 50 + 4000);
  };

  const simulateTyping = (code: string) => {
    let index = 0;
    const typeSpeed = 50;
    
    const typeChar = () => {
      if (index <= code.length) {
        onCodeChange(code.substring(0, index));
        index++;
        setTimeout(typeChar, typeSpeed);
      }
    };
    
    typeChar();
  };

  const startInteractiveSession = (assessment: UserAssessment) => {
    let interactiveMsg = '';
    
    switch (assessment.level) {
      case 'beginner':
        interactiveMsg = 'Agora é sua vez! Que tal modificar o código acima? Mude o texto do print() para algo seu!';
        break;
      case 'intermediate':
        interactiveMsg = 'Que tal melhorar esta função? Tente adicionar um filtro para números ímpares também!';
        break;
      case 'advanced':
        interactiveMsg = 'Vamos explorar! Que tal criar um context manager para medir memória também?';
        break;
    }

    onMessage({
      id: Date.now().toString(),
      type: 'correction',
      suggestion: interactiveMsg,
      explanation: 'Vou acompanhar suas modificações e te dar dicas!',
      timestamp: new Date()
    });
  };

  // Iniciar assessment quando componente carrega
  useEffect(() => {
    // Só inicia o assessment se a linguagem mudou e ainda não foi iniciado
    if (language && assessmentInitialized.current !== language) {
      console.log('Iniciando assessment para nova linguagem:', language);
      
      // Marca que o assessment foi iniciado para esta linguagem
      assessmentInitialized.current = language;
      
      // Reset completo e início direto
      setConversation([]);
      setUserInput('');
      setIsWaitingForResponse(false);
      setCurrentQuestion(0);
      setUserResponses([]);
      setShowInput(false);
      setIsAssessmentStarted(false);
      
      // Inicia assessment após um delay para garantir que o reset foi aplicado
      setTimeout(() => {
        startAssessment();
      }, 200);
    }
  }, [language]);

  return (
    <div className="space-y-3">
      {/* Assessment Progress */}
      <div className="bg-primary border border-primary rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-secondary flex items-center">
            <MessageCircle className="w-4 h-4 mr-2 text-muted" />
            Conhecendo você
          </h4>
          <span className="text-xs text-subtle">
            {currentQuestion}/3
          </span>
        </div>        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className="bg-elevated h-2 rounded-full transition-all duration-500"
            style={{ width: `${(currentQuestion / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Conversation */}
      {conversation.map((msg) => (
        <div key={msg.id} className="space-y-2">
          <div className={`p-3 rounded-lg border ${
            msg.type === 'ai' 
              ? 'bg-primary border-secondary' 
              : 'bg-secondary border-secondary ml-6'
          }`}>
            <div className="flex items-start space-x-2">
              {msg.type === 'ai' && <Bot className="w-4 h-4 text-muted mt-0.5" />}
              <div className="flex-1">
                <p className="text-sm text-secondary leading-relaxed">{msg.content}</p>
                
                {/* Options */}
                {msg.options && isWaitingForResponse && (
                  <div className="mt-3 space-y-2">
                    {msg.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleOptionSelect(option)}
                        className="w-full text-left p-2 bg-secondary hover-bg-tertiary border border-secondary hover:border-tertiary rounded text-sm text-secondary transition-colors"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Manual input for more detailed responses */}
      {showInput && (
        <div className="flex space-x-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Digite sua resposta..."
            className="flex-1 px-3 py-2 bg-secondary border border-secondary rounded text-sm text-secondary placeholder-gray-500 focus:border-tertiary focus:outline-none"
            onKeyPress={(e) => e.key === 'Enter' && userInput.trim() && handleOptionSelect(userInput)}
          />
          <button
            onClick={() => userInput.trim() && handleOptionSelect(userInput)}
            className="px-3 py-2 bg-tertiary hover-bg-elevated border border-tertiary hover:border-muted rounded text-sm text-secondary transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
