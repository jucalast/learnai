'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Bot, MessageCircle, Send } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { UserAssessment } from '@/types/learningSystem';

// Interface específica para o assessment inicial (compatível com o sistema legacy)
export interface OriginalAssessment {
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
  onAssessmentComplete: (assessment: OriginalAssessment) => void;
  currentCode: string;
}

export default function InitialAssessment({
  language,
  onCodeChange,
  onMessage,
  onAssessmentComplete,
  currentCode
}: InitialAssessmentProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userResponses, setUserResponses] = useState<string[]>([]);
  const [showInput, setShowInput] = useState(false);
  const [isAssessmentStarted, setIsAssessmentStarted] = useState(false);
  const [showPersonalizedPlan, setShowPersonalizedPlan] = useState(false);
  const [personalizedPlan, setPersonalizedPlan] = useState<any>(null);
  const [isSavingAssessment, setIsSavingAssessment] = useState(false);
  const [assessmentData, setAssessmentData] = useState<OriginalAssessment | null>(null);
  
  // Ref para controlar se o assessment já foi iniciado para esta linguagem
  const assessmentInitialized = useRef<string | null>(null);
  const assessmentCompleted = useRef<boolean>(false);
  const assessmentStartedRef = useRef<boolean>(false);

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
    console.log('🎯 Completando assessment com respostas:', userResponses);
    const assessment = analyzeResponses(userResponses);
    console.log('📊 Assessment analisado:', assessment);
    
    // Marcar como concluído para prevenir reinicializações
    assessmentCompleted.current = true;
    
    // Armazenar dados do assessment
    setAssessmentData(assessment);
    
    // Gerar plano personalizado
    const plan = generatePersonalizedPlan(assessment);
    setPersonalizedPlan(plan);

    const completionMsg: ConversationMessage = {
      id: Date.now().toString(),
      type: 'ai',
      content: `Perfeito! 🎯 Analisei suas respostas e criei um plano personalizado para ${assessment.language}. 

📊 **Seu Perfil:**
• **Experiência Geral:** ${assessment.experience}
• **Experiência em ${assessment.language}:** ${assessment.previousKnowledge[0] || 'Não informado'}
• **Nível Determinado:** ${assessment.level === 'beginner' ? 'Iniciante' : assessment.level === 'intermediate' ? 'Intermediário' : 'Avançado'}

Vou mostrar seu plano personalizado agora. Revise e aprove para salvar no seu perfil!`,
      timestamp: new Date()
    };

    setConversation(prev => [...prev, completionMsg]);
    
    onMessage({
      id: completionMsg.id,
      type: 'encouragement',
      suggestion: completionMsg.content,
      explanation: 'Plano personalizado criado baseado nas suas respostas',
      timestamp: completionMsg.timestamp
    });

    // Mostrar o plano personalizado após um delay menor
    setTimeout(() => {
      setShowPersonalizedPlan(true);
    }, 1500);
  }, [userResponses, onMessage, language]);

  const askNextQuestion = useCallback(() => {
    // Verificar se ainda estamos no processo de assessment
    if (!assessmentStartedRef.current) {
      console.log('⚠️ askNextQuestion chamado mas assessment não está iniciado');
      return;
    }
    
    console.log(`❓ Fazendo pergunta ${currentQuestion + 1}/3`);
    
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
        console.log('🎯 Todas as perguntas respondidas, completando assessment');
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

    console.log('💬 Adicionando pergunta à conversa:', questionContent);
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
  }, [assessmentStartedRef, currentQuestion, questions, onMessage, completeAssessment]);

  // Função para fazer uma pergunta específica (sem dependências problemáticas)
  const makeQuestion = (questionIndex: number) => {
    if (!assessmentStartedRef.current) return;
    
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
    // Evitar múltiplas execuções
    if (assessmentStartedRef.current) {
      console.log('⚠️ Assessment já iniciado, ignorando nova tentativa');
      return;
    }
    
    console.log('🚀 Iniciando assessment para:', language);
    
    // Resetar e iniciar assessment
    setIsAssessmentStarted(true);
    assessmentStartedRef.current = true;
    setCurrentQuestion(0);
    setUserResponses([]);
    setShowInput(false);
    setIsWaitingForResponse(false);
    
    // Limpar editor
    onCodeChange('');
    
    // Mensagem inicial
    const userInfo = user ? 
      `Oi ${user.name}! 👋 Primeira vez com ${language}? Perfeito! Preciso te conhecer melhor nesta linguagem para criar o melhor plano de estudos. Esta entrevista é obrigatória e será salva no seu perfil.` :
      `Olá! 👋 Bem-vindo ao ${language}! Para criar um plano de estudos personalizado, preciso te conhecer primeiro. Esta entrevista rápida é obrigatória para cada linguagem.`;
    
    const welcomeMsg: ConversationMessage = {
      id: Date.now().toString(),
      type: 'ai',
      content: userInfo,
      timestamp: new Date()
    };

    console.log('💬 Adicionando mensagem de boas-vindas');
    setConversation([welcomeMsg]);
    
    // Enviar para o container de mensagens também
    onMessage({
      id: welcomeMsg.id,
      type: 'hint',
      suggestion: welcomeMsg.content,
      explanation: 'Início do assessment personalizado',
      timestamp: welcomeMsg.timestamp
    });

    // Fazer primeira pergunta após um delay
    console.log('⏱️ Agendando primeira pergunta');
    setTimeout(() => {
      console.log('🎯 Disparando primeira pergunta');
      
      // Fazer primeira pergunta inline para evitar dependências
      const questions = getAssessmentQuestions(language);
      const questionMsg: ConversationMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: questions.experience,
        timestamp: new Date(),
        options: questions.experienceOptions
      };

      setConversation(prev => [...prev, questionMsg]);
      
      onMessage({
        id: questionMsg.id,
        type: 'hint',
        suggestion: questionMsg.content,
        explanation: 'Escolha a opção que melhor te representa:',
        timestamp: questionMsg.timestamp
      });

      setIsWaitingForResponse(true);
      setShowInput(false);
    }, 2000);
  }, [language, user, onCodeChange, onMessage]);

  const handleOptionSelect = (option: string) => {
    // Evitar múltiplas seleções
    if (!isWaitingForResponse || !assessmentStartedRef.current) return;
    
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
      if (assessmentStartedRef.current) {
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

  const analyzeResponses = (responses: string[]): OriginalAssessment => {
    let level: 'beginner' | 'intermediate' | 'advanced' | 'unknown' = 'beginner';
    
    const generalExp = responses[0] || '';
    const specificExp = responses[1] || '';
    const conceptsKnown = responses[2] || '';
    
    // Priorizar experiência ESPECÍFICA da linguagem sobre experiência geral
    if (specificExp.includes('bastante experiência') || specificExp.includes('experiente')) {
      level = 'advanced';
    } else if (specificExp.includes('projetos pequenos') || specificExp.includes('exercícios básicos')) {
      level = 'intermediate';
    } else if (specificExp.includes('nunca usei') || specificExp.includes('nunca pratiquei')) {
      // Mesmo com experiência geral, se nunca usou a linguagem específica = beginner
      level = 'beginner';
    } else {
      // Fallback para experiência geral apenas se experiência específica for ambígua
      if (generalExp.includes('experiente')) {
        level = 'intermediate'; // Não advanced, pois não tem experiência específica
      } else if (generalExp.includes('intermediária')) {
        level = 'beginner'; // Reduzir um nível por não ter experiência específica
      }
    }

    return {
      language,
      level,
      experience: generalExp,
      interests: [],
      previousKnowledge: [specificExp, conceptsKnown].filter(Boolean)
    };
  };

  const getPersonalizedWelcome = (assessment: OriginalAssessment): string => {
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

  const giveLevelAppropriateDemo = (assessment: OriginalAssessment) => {
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
          demoCode = '';
          explanation = 'Perfeito! Como você já tem experiência, vou deixar o editor vazio para que você possa começar a escrever. A IA inteligente vai observar seu código e oferecer sugestões contextuais conforme você desenvolve!';
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

    // Simular digitação após delay (apenas se houver código para digitar)
    if (demoCode.trim()) {
      setTimeout(() => {
        simulateTyping(demoCode);
      }, 2000);

      // Após demo, começar interação
      setTimeout(() => {
        startInteractiveSession(assessment);
      }, demoCode.length * 50 + 4000);
    } else {
      // Se não há demo code, começar interação imediatamente
      setTimeout(() => {
        startInteractiveSession(assessment);
      }, 2000);
    }
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

  const startInteractiveSession = (assessment: OriginalAssessment) => {
    let interactiveMsg = '';
    
    switch (assessment.level) {
      case 'beginner':
        interactiveMsg = 'Agora é sua vez! Que tal modificar o código acima? Mude o texto do print() para algo seu!';
        break;
      case 'intermediate':
        interactiveMsg = 'Que tal melhorar esta função? Tente adicionar um filtro para números ímpares também!';
        break;
      case 'advanced':
        interactiveMsg = 'Agora é com você! Comece a escrever qualquer código Python que quiser. A IA inteligente vai observar e reagir conforme você desenvolve, oferecendo sugestões contextuais e avançadas! 🚀';
        break;
    }

    onMessage({
      id: Date.now().toString(),
      type: 'encouragement',
      suggestion: interactiveMsg,
      explanation: 'O sistema de IA observacional está ativo e pronto para te ajudar!',
      timestamp: new Date()
    });
  };

  // Função para gerar plano personalizado baseado no assessment
  const generatePersonalizedPlan = (assessment: OriginalAssessment) => {
    const { level, language: lang, experience, previousKnowledge } = assessment;
    
    const plan = {
      title: `Plano Personalizado de ${lang}`,
      level: level,
      description: '',
      modules: [] as any[],
      estimatedTime: '',
      prerequisites: [] as string[],
      objectives: [] as string[],
      shouldClearEditor: false
    };

    switch (level) {
      case 'beginner':
        plan.description = `Plano completo para iniciantes em ${lang}. Começaremos do absoluto zero com conceitos fundamentais.`;
        plan.estimatedTime = '4-6 semanas';
        plan.shouldClearEditor = false; // Manter código exemplo para iniciantes aprenderem
        plan.modules = [
          {
            name: 'Fundamentos Básicos',
            duration: '1-2 semanas',
            topics: ['Sintaxe básica', 'Variáveis e tipos', 'Operadores'],
            description: 'Primeiros passos na programação'
          },
          {
            name: 'Estruturas de Controle',
            duration: '1 semana',
            topics: ['Condicionais (if/else)', 'Loops básicos', 'Exercícios práticos'],
            description: 'Controle de fluxo do programa'
          }
        ];
        plan.objectives = [
          'Escrever programas simples',
          'Entender sintaxe básica',
          'Resolver problemas básicos'
        ];
        break;

      case 'intermediate':
        plan.description = `Plano intermediário para consolidar conhecimentos em ${lang}. Focaremos em conceitos mais avançados.`;
        plan.estimatedTime = '3-4 semanas';
        plan.shouldClearEditor = false; // Código de exemplo para referência e aprendizado
        plan.modules = [
          {
            name: 'Estruturas de Dados',
            duration: '1 semana',
            topics: ['Listas/Arrays', 'Dicionários/Objects', 'Manipulação avançada'],
            description: 'Organização eficiente de dados'
          },
          {
            name: 'Funções e Modularização',
            duration: '1 semana',
            topics: ['Funções avançadas', 'Escopo', 'Módulos/Imports'],
            description: 'Código reutilizável e organizado'
          }
        ];
        plan.objectives = [
          'Dominar estruturas de dados',
          'Escrever código modular',
          'Implementar algoritmos intermediários'
        ];
        break;

      case 'advanced':
        plan.description = `Plano avançado em ${lang}. Como você tem experiência, vou deixar o ambiente livre para experimentação.`;
        plan.estimatedTime = '2-3 semanas';
        plan.shouldClearEditor = true; // Limpar para experientes começarem do zero
        plan.modules = [
          {
            name: 'Paradigmas Avançados',
            duration: '1 semana',
            topics: ['OOP avançado', 'Programação funcional', 'Design patterns'],
            description: 'Técnicas profissionais de desenvolvimento'
          },
          {
            name: 'Performance e Otimização',
            duration: '1 semana',
            topics: ['Análise de complexidade', 'Otimização de código', 'Debugging avançado'],
            description: 'Código eficiente e profissional'
          }
        ];
        plan.objectives = [
          'Implementar padrões avançados',
          'Otimizar performance',
          'Desenvolver projetos complexos'
        ];
        break;
    }

    // Adicionar módulos específicos por linguagem
    if (lang.toLowerCase() === 'python') {
      if (level === 'beginner') {
        plan.modules.push({
          name: 'Python Específico',
          duration: '1 semana',
          topics: ['print() e input()', 'Indentação', 'Comentários'],
          description: 'Características únicas do Python'
        });
      } else if (level === 'advanced') {
        plan.modules.push({
          name: 'Python Avançado',
          duration: '1 semana',
          topics: ['Decorators', 'Context managers', 'Async/await'],
          description: 'Recursos avançados do Python'
        });
      }
    }

    return plan;
  };

  // Função para salvar assessment no banco
  const saveAssessmentToDatabase = async (assessment: OriginalAssessment, plan: any) => {
    setIsSavingAssessment(true);
    
    try {
      // Usar userId real do usuário autenticado ou gerar temporário
      const userId = user?.id || `anonymous-${Date.now()}`;
      
      // Estruturar dados do assessment para o banco
      const assessmentData = {
        userId: userId,
        language: assessment.language,
        level: assessment.level,
        experience: assessment.experience,
        interests: assessment.interests || [],
        previousKnowledge: assessment.previousKnowledge || [],
        generalProgrammingLevel: assessment.level === 'beginner' ? 'none' : 
                               assessment.level === 'intermediate' ? 'intermediate' : 'advanced',
        languageSpecificLevel: 'none', // Será determinado pelas respostas específicas
        adaptiveLevel: assessment.level,
        learningStyle: 'mixed',
        goals: ['learn_programming'],
        timeAvailable: 'medium',
        responses: {
          generalExperience: assessment.experience,
          previousKnowledge: assessment.previousKnowledge,
          personalizedPlan: plan // Salvar o plano gerado
        }
      };

      const response = await fetch('/api/assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assessmentData),
      });

      if (response.ok) {
        const savedAssessment = await response.json();
        console.log('✅ Assessment salvo no banco:', savedAssessment);
        return savedAssessment;
      } else {
        throw new Error('Erro ao salvar assessment');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar no banco:', error);
      throw error;
    } finally {
      setIsSavingAssessment(false);
    }
  };

  // Função para aprovar e salvar o plano
  const approvePlan = async () => {
    if (!assessmentData || !personalizedPlan) return;

    try {
      // 1. Salvar no banco apenas se houver usuário ou permitir usuários anônimos
      if (user || true) { // Permitir usuários anônimos por enquanto
        await saveAssessmentToDatabase(assessmentData, personalizedPlan);
      }
      
      // 2. Aplicar configurações do plano
      if (personalizedPlan.shouldClearEditor) {
        // Limpar editor completamente
        onCodeChange('');
      } else {
        // Demonstrar código de exemplo baseado no nível
        setTimeout(() => {
          giveLevelAppropriateDemo(assessmentData);
        }, 1000);
      }
      
      // 3. Finalizar processo do assessment e sinalizar sucesso
      onAssessmentComplete(assessmentData);
      
      // 4. Salvar no localStorage para detecção pelo PersonalizedLearningSystem
      localStorage.setItem('assessmentCompleted', JSON.stringify(assessmentData));
      
      // 5. Disparar evento global para notificar outros componentes
      window.dispatchEvent(new CustomEvent('assessmentCompleted', {
        detail: {
          assessment: assessmentData,
          plan: personalizedPlan,
          language: language
        }
      }));
      
      // 6. Mensagem de sucesso específica por linguagem
      const successMsg: ConversationMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: user ? 
          `🎉 Perfeito! Seu perfil de ${assessmentData.language} foi salvo com sucesso!

✅ **Status:** Perfil permanente criado
📊 **Nível:** ${assessmentData.level === 'beginner' ? 'Iniciante' : assessmentData.level === 'intermediate' ? 'Intermediário' : 'Avançado'}
💾 **Salvamento:** Quando você voltar para ${assessmentData.language}, vou usar este perfil automaticamente

🚀 **Iniciando Aprendizado:** Mudando para interface de chat personalizada...` :
          `🎉 Plano personalizado criado para esta sessão!

⚠️ **Modo Visitante:** Este perfil será usado apenas nesta sessão
💡 **Dica:** Faça login para salvar permanentemente seu progresso
          
🚀 **Iniciando Aprendizado:** Mudando para interface de chat personalizada...`,
        timestamp: new Date()
      };
      
      setConversation(prev => [...prev, successMsg]);
      
      // 7. Aguardar um pouco e depois esconder o plano
      setTimeout(() => {
        setShowPersonalizedPlan(false);
        
        // Sinalizar que o assessment foi concluído com sucesso
        console.log('✅ Assessment flow completo - transitioning para learning system');
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao salvar plano:', error);
      // Mostrar erro para o usuário
      const errorMsg: ConversationMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: `❌ Houve um erro ao salvar seu plano. Vamos tentar novamente ou você pode continuar mesmo assim.`,
        timestamp: new Date()
      };
      
      setConversation(prev => [...prev, errorMsg]);
    }
  };

  // Cancelar plano (voltar ao assessment)
  const cancelPlan = () => {
    setShowPersonalizedPlan(false);
    setPersonalizedPlan(null);
    
    const cancelMsg: ConversationMessage = {
      id: Date.now().toString(),
      type: 'ai',
      content: 'Tudo bem! Vamos continuar com as perguntas para criar um plano ainda melhor.',
      timestamp: new Date()
    };
    
    setConversation(prev => [...prev, cancelMsg]);
  };

  // Função para verificar status de assessments do usuário
  const getUserAssessmentStatus = useCallback(async () => {
    if (!user) return null;
    
    try {
      const response = await fetch(`/api/assessment?userId=${user.id}`);
      if (response.ok) {
        const assessments = await response.json();
        const assessmentsByLanguage = Array.isArray(assessments) ? 
          assessments.reduce((acc, assessment) => {
            acc[assessment.language] = assessment;
            return acc;
          }, {}) : 
          { [assessments.language]: assessments };
        
        return {
          total: Array.isArray(assessments) ? assessments.length : 1,
          byLanguage: assessmentsByLanguage,
          completedLanguages: Object.keys(assessmentsByLanguage)
        };
      }
    } catch (error) {
      console.error('Erro ao verificar status de assessments:', error);
    }
    return null;
  }, [user]);

  // Effect para resetar estado quando linguagem muda (executado primeiro)
  useEffect(() => {
    // Se a linguagem mudou, resetar imediatamente o estado
    if (language && assessmentInitialized.current && assessmentInitialized.current !== language) {
      console.log('🔄 Linguagem mudou de', assessmentInitialized.current, 'para', language, '- resetando estado');
      
      // Reset imediato e completo
      setIsAssessmentStarted(false);
      assessmentStartedRef.current = false;
      setCurrentQuestion(0);
      setUserResponses([]);
      setConversation([]);
      setShowPersonalizedPlan(false);
      setPersonalizedPlan(null);
      setAssessmentData(null);
      setIsWaitingForResponse(false);
      setShowInput(false);
      assessmentCompleted.current = false;
      
      // Limpar referência para permitir nova inicialização
      assessmentInitialized.current = null;
      
      // Forçar limpeza do editor para nova linguagem
      onCodeChange('');
    }
  }, [language, onCodeChange]);

  // Effect para iniciar o assessment APENAS quando necessário
  const mountCountRef = useRef(0);
  useEffect(() => {
    mountCountRef.current++;
    
    // Debug info com menos spam
    if (mountCountRef.current % 20 === 1) {
      console.log('🔄 InitialAssessment atualizado (count:', mountCountRef.current, '):', { 
        language, 
        assessmentInitialized: assessmentInitialized.current,
        isAssessmentStarted,
        assessmentCompleted: assessmentCompleted.current 
      });
    }

    // ⚠️ CRITICAL: Só inicializar se NÃO existir assessment para esta linguagem
    if (language && 
        assessmentInitialized.current !== language && 
        !assessmentCompleted.current && 
        !assessmentStartedRef.current) {
      
      // Verificar se JÁ EXISTE assessment no localStorage para esta linguagem
      const assessmentKey = `assessment_${language}`;
      const existingAssessment = localStorage.getItem(assessmentKey);
      
      if (existingAssessment) {
        console.log(`🚫 Assessment JÁ EXISTE para ${language}, não iniciando novo assessment`);
        // Marcar como concluído para evitar tentativas futuras
        assessmentCompleted.current = true;
        assessmentInitialized.current = language;
        return;
      }
      
      console.log(`🚀 Iniciando novo assessment para ${language} (não existe assessment prévio)`);
      
      // Marcar esta linguagem como inicializada
      assessmentInitialized.current = language;
      
      // Aguardar um pouco para garantir que o reset foi completo
      setTimeout(() => {
        // Verificar novamente se ainda é válido iniciar
        if (assessmentInitialized.current === language && 
            !assessmentCompleted.current && 
            !assessmentStartedRef.current) {
          
          console.log('✅ Iniciando assessment para:', language);
          
          // Resetar e iniciar assessment
          setIsAssessmentStarted(true);
          assessmentStartedRef.current = true;
          setCurrentQuestion(0);
          setUserResponses([]);
          setShowInput(false);
          setIsWaitingForResponse(false);
          
          // Limpar editor
          onCodeChange('');
          
          // Mensagem inicial
          const userInfo = user ? 
            `Oi ${user.name}! 👋 Primeira vez com ${language}? Perfeito! Preciso te conhecer melhor nesta linguagem para criar o melhor plano de estudos. Esta entrevista é obrigatória e será salva no seu perfil.` :
            `Olá! 👋 Bem-vindo ao ${language}! Para criar um plano de estudos personalizado, preciso te conhecer primeiro. Esta entrevista rápida é obrigatória para cada linguagem.`;
          
          const welcomeMsg: ConversationMessage = {
            id: Date.now().toString(),
            type: 'ai',
            content: userInfo,
            timestamp: new Date()
          };

          console.log('💬 Adicionando mensagem de boas-vindas');
          setConversation([welcomeMsg]);
          
          // Enviar para o container de mensagens também
          onMessage({
            id: welcomeMsg.id,
            type: 'hint',
            suggestion: welcomeMsg.content,
            explanation: 'Vamos começar nossa jornada de aprendizado!',
            timestamp: welcomeMsg.timestamp
          });

          // Fazer primeira pergunta após um delay
          setTimeout(() => {
            if (assessmentInitialized.current === language && assessmentStartedRef.current) {
              console.log('🎯 Disparando primeira pergunta para', language);
              
              // Fazer primeira pergunta inline para evitar dependências
              const questions = getAssessmentQuestions(language);
              const questionMsg: ConversationMessage = {
                id: Date.now().toString(),
                type: 'ai',
                content: questions.experience,
                timestamp: new Date(),
                options: questions.experienceOptions
              };

              setConversation(prev => [...prev, questionMsg]);
              
              onMessage({
                id: questionMsg.id,
                type: 'hint',
                suggestion: questionMsg.content,
                explanation: 'Escolha a opção que melhor te representa:',
                timestamp: questionMsg.timestamp
              });

              setIsWaitingForResponse(true);
              setShowInput(false);
            }
          }, 1500);
        }
      }, 200);
    }
  }, [language, user, onCodeChange, onMessage]);

  // Effect para debug - mostrar quando o estado muda APENAS quando necessário
  const prevDebugState = useRef({
    isAssessmentStarted: false,
    currentQuestion: 0,
    conversationLength: 0,
    userResponsesLength: 0,
    showPersonalizedPlan: false,
    isWaitingForResponse: false
  });

  useEffect(() => {
    const currentDebugState = {
      isAssessmentStarted,
      currentQuestion,
      conversationLength: conversation.length,
      userResponsesLength: userResponses.length,
      showPersonalizedPlan,
      isWaitingForResponse
    };

    // Só fazer log se algo realmente mudou
    if (JSON.stringify(currentDebugState) !== JSON.stringify(prevDebugState.current)) {
      console.log('📊 Estado do assessment atualizado:', {
        ...currentDebugState,
        assessmentStartedRef: assessmentStartedRef.current
      });
      prevDebugState.current = currentDebugState;
    }
  }, [isAssessmentStarted, currentQuestion, conversation.length, userResponses.length, showPersonalizedPlan, isWaitingForResponse]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-yellow-400 bg-yellow-900/20 border border-yellow-500/30 p-2 mb-2 rounded">
          Debug: Lang={language}, Started={isAssessmentStarted.toString()}, StartedRef={assessmentStartedRef.current.toString()}, Question={currentQuestion}, Conv={conversation.length}
        </div>
      )}
      
      {/* Assessment Progress - Fixo no topo */}
      <div className="flex-shrink-0 bg-primary border border-primary rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-secondary flex items-center">
            <MessageCircle className="w-4 h-4 mr-2 text-muted" />
            Conhecendo você
          </h4>
          <span className="text-xs text-subtle">
            {currentQuestion}/3
          </span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className="bg-elevated h-2 rounded-full transition-all duration-500"
            style={{ width: `${(currentQuestion / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Botão de debug para forçar início do assessment */}
      {process.env.NODE_ENV === 'development' && !assessmentStartedRef.current && (
        <div className="flex-shrink-0 mb-3">
          <button
            onClick={startAssessment}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm"
          >
            🔧 Debug: Forçar início do Assessment
          </button>
        </div>
      )}

      {/* Conversation - Área com scroll */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
        {/* Plano Personalizado - VS Code Style */}
        {showPersonalizedPlan && personalizedPlan && (
          <div className="bg-secondary border border-frame rounded-none shadow-sm">
            {/* Header com título e status */}
            <div className="bg-tertiary border-b border-frame px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-muted" />
                <h3 className="text-sm font-medium text-primary">{personalizedPlan.title}</h3>
              </div>
              <span className={`text-xs px-2 py-1 rounded-sm flex items-center gap-1 ${
                user ? 'bg-green-600/20 text-green-300 border border-green-500/30' : 
                       'bg-yellow-600/20 text-yellow-300 border border-yellow-500/30'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${user ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                {user ? 'Salvar no perfil' : 'Modo visitante'}
              </span>
            </div>

            {/* Conteúdo principal */}
            <div className="p-4 space-y-4">
              <p className="text-sm text-secondary leading-relaxed">{personalizedPlan.description}</p>
              
              {/* Grid de informações básicas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-primary border border-frame p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-muted rounded-full"></div>
                    <h4 className="text-xs font-medium text-muted uppercase tracking-wide">Nível</h4>
                  </div>
                  <span className={`text-sm font-medium ${
                    personalizedPlan.level === 'beginner' ? 'text-green-400' :
                    personalizedPlan.level === 'intermediate' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {personalizedPlan.level === 'beginner' ? 'Iniciante' :
                     personalizedPlan.level === 'intermediate' ? 'Intermediário' : 'Avançado'}
                  </span>
                </div>
                <div className="bg-primary border border-frame p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-muted rounded-full"></div>
                    <h4 className="text-xs font-medium text-muted uppercase tracking-wide">Duração Estimada</h4>
                  </div>
                  <p className="text-sm font-medium text-secondary">{personalizedPlan.estimatedTime}</p>
                </div>
              </div>

              {/* Módulos do curso */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-muted rounded-full"></div>
                  <h4 className="text-xs font-medium text-muted uppercase tracking-wide">Módulos do Curso:</h4>
                </div>
                {personalizedPlan.modules.map((module: any, index: number) => (
                  <div key={index} className="bg-primary border-l-2 border-muted pl-4 py-2">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="text-sm font-medium text-primary">{module.name}</h5>
                      <span className="text-xs text-muted font-mono bg-tertiary px-2 py-0.5 rounded-sm">
                        {module.duration}
                      </span>
                    </div>
                    <p className="text-xs text-secondary mb-2 leading-relaxed">{module.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {module.topics.map((topic: string, topicIndex: number) => (
                        <span key={topicIndex} className="text-xs bg-tertiary border border-frame px-2 py-0.5 text-secondary font-mono">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Objetivos */}
              <div className="pt-3 border-t border-frame">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-muted rounded-full"></div>
                  <h4 className="text-xs font-medium text-muted uppercase tracking-wide">Objetivos do Curso:</h4>
                </div>
                <ul className="space-y-2">
                  {personalizedPlan.objectives.map((objective: string, index: number) => (
                    <li key={index} className="flex items-start gap-3 text-sm">
                      <span className="text-muted mt-1.5">▸</span>
                      <span className="text-secondary leading-relaxed">{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Seção do que acontecerá após aprovar */}
              <div className="pt-3 border-t border-frame">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-yellow-400">⚡</span>
                  <h4 className="text-sm font-medium text-yellow-400">O que acontecerá após aprovar:</h4>
                </div>
                <div className="bg-tertiary border border-frame p-3 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-400 text-sm mt-0.5">💾</span>
                    <div className="flex-1">
                      <span className="text-sm text-secondary">
                        {user ? 
                          `Seu perfil será salvo permanentemente para ${assessmentData?.language}` :
                          'Perfil será usado apenas nesta sessão (faça login para salvar)'
                        }
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-400 text-sm mt-0.5">
                      {personalizedPlan.shouldClearEditor ? '🔄' : '📝'}
                    </span>
                    <div className="flex-1">
                      <span className="text-sm text-secondary">
                        {personalizedPlan.shouldClearEditor ? 
                          'Editor será limpo para você começar do zero' :
                          'Será mostrado código de exemplo baseado no seu nível'
                        }
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-400 text-sm mt-0.5">🤖</span>
                    <div className="flex-1">
                      <span className="text-sm text-secondary">
                        IA observacional ativada para sugestões personalizadas
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer com botões */}
            <div className="bg-tertiary border-t border-frame px-4 py-3 flex gap-2">
              <button
                onClick={approvePlan}
                disabled={isSavingAssessment}
                className="flex-1 bg-elevated hover:bg-subtle disabled:bg-primary text-primary hover:text-primary disabled:text-muted px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2 border border-frame"
              >
                {isSavingAssessment ? (
                  <>
                    <div className="w-3 h-3 border-2 border-muted border-t-primary rounded-full animate-spin"></div>
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    <span>Aprovar Plano</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowPersonalizedPlan(false)}
                className="px-4 py-2 bg-primary hover:bg-secondary text-muted hover:text-secondary text-sm transition-colors border border-frame"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {conversation.map((msg) => (
          <div key={msg.id} className="space-y-2">
            <div className={`p-3 rounded-lg border ${
              msg.type === 'ai' 
                ? 'bg-primary border-secondary' 
                : 'bg-secondary border-secondary ml-6'
            }`}>
              <div className="flex items-start space-x-2">
                {msg.type === 'ai' && <Bot className="w-4 h-4 text-muted mt-0.5 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-secondary leading-relaxed">{msg.content}</p>
                  
                  {/* Options - Layout em grid responsivo */}
                  {msg.options && isWaitingForResponse && (
                    <div className="mt-4">
                      <div className={`grid gap-2 ${
                        msg.options.length <= 2 
                          ? 'grid-cols-1' 
                          : msg.options.length <= 4 
                            ? 'grid-cols-1 sm:grid-cols-2' 
                            : 'grid-cols-1'
                      }`}>
                        {msg.options.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => handleOptionSelect(option)}
                            className="text-left p-3 bg-secondary hover-bg-tertiary border border-secondary hover:border-tertiary rounded-lg text-sm text-secondary transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                          >
                            <div className="flex items-start space-x-2">
                              <span className="w-5 h-5 bg-tertiary border border-frame rounded-full flex items-center justify-center text-xs font-medium text-muted flex-shrink-0 mt-0.5">
                                {index + 1}
                              </span>
                              <span className="flex-1">{option}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Espaçamento no final para scroll */}
        <div className="h-4"></div>
      </div>

      {/* Manual input - Fixo no final */}
      {showInput && (
        <div className="flex-shrink-0 flex space-x-2 mt-3 pt-3 border-t border-frame">
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
