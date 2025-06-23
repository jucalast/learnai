'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Bot, Eye, Lightbulb, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { dualAI, CodeAnalysis, TeachingResponse } from '@/lib/dualAITeaching';

interface TeachingContext {
  currentConcept: string;
  userLevel: 'beginner' | 'intermediate' | 'advanced';
  recentActions: string[];
  codeProgress: number;
  needsHelp: boolean;
  isStuck: boolean;
}

interface AIResponse {
  message: string;
  action?: 'demonstrate' | 'hint' | 'encourage' | 'correct' | 'advance';
  nextConcept?: string;
  codeExample?: string;
}

interface FluidAITeacherProps {
  language: string;
  currentCode: string;
  onCodeChange: (code: string) => void;
  onMessage: (message: any) => void;
  userLevel: 'beginner' | 'intermediate' | 'advanced';
}

export default function FluidAITeacher({
  language,
  currentCode,
  onCodeChange,
  onMessage,
  userLevel
}: FluidAITeacherProps) {
  const [context, setContext] = useState<TeachingContext>({
    currentConcept: 'variables',
    userLevel,
    recentActions: [],
    codeProgress: 0,
    needsHelp: false,
    isStuck: false
  });
  
  const [conversation, setConversation] = useState<string[]>([]);
  const [isWatching, setIsWatching] = useState(true);
  const [isTypingCode, setIsTypingCode] = useState(false);
  const [lastCodeChange, setLastCodeChange] = useState(Date.now());
  const [userIdleTime, setUserIdleTime] = useState(0);
  const [lastAnalysis, setLastAnalysis] = useState<CodeAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const codeAnalysisRef = useRef<NodeJS.Timeout | null>(null);
  const watchingRef = useRef<NodeJS.Timeout | null>(null);
  const [recentMessages, setRecentMessages] = useState<string[]>([]);
  const lastMessageRef = useRef<string>('');

  // Conceitos progressivos por linguagem
  const getConceptFlow = (lang: string, level: string) => {
    const flows = {
      python: {
        beginner: [
          'variables', 'data_types', 'strings', 'numbers', 
          'conditionals', 'loops', 'functions', 'lists'
        ],
        intermediate: [
          'dictionaries', 'list_comprehensions', 'error_handling',
          'classes', 'modules', 'file_operations'
        ],
        advanced: [
          'decorators', 'generators', 'context_managers', 
          'async_programming', 'metaclasses'
        ]
      }
    };
    
    return flows[lang as keyof typeof flows]?.[level as keyof typeof flows.python] || flows.python.beginner;
  };

  const conceptFlow = getConceptFlow(language, userLevel);

  // Monitoramento inteligente do código
  useEffect(() => {
    if (!currentCode) return;

    setLastCodeChange(Date.now());
    setUserIdleTime(0);

    // Debounce para análise do código - mais responsivo
    if (codeAnalysisRef.current) {
      clearTimeout(codeAnalysisRef.current);
    }

    codeAnalysisRef.current = setTimeout(() => {
      analyzeCodeInRealTime(currentCode);
    }, 800); // Reduzido para ser mais responsivo

    return () => {
      if (codeAnalysisRef.current) {
        clearTimeout(codeAnalysisRef.current);
      }
    };
  }, [currentCode]);

  // Observador de inatividade
  useEffect(() => {
    if (!isWatching) return;

    const watchInterval = setInterval(() => {
      const timeSinceLastChange = Date.now() - lastCodeChange;
      const idleSeconds = Math.floor(timeSinceLastChange / 1000);
      
      setUserIdleTime(idleSeconds);

      // Se usuário está há mais de 8 segundos sem digitar (mais responsivo)
      if (idleSeconds > 8 && idleSeconds < 12 && currentCode.length > 0) {
        checkIfUserNeedsHelp();
      }
      
      // Se está há muito tempo parado (reduzido para 25 segundos)
      if (idleSeconds > 25) {
        offerEncouragement();
      }
    }, 1000);

    return () => clearInterval(watchInterval);
  }, [isWatching, lastCodeChange, currentCode]);

  // Análise em tempo real com Dual AI
  const analyzeCodeInRealTime = useCallback(async (code: string) => {
    if (!code.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    
    try {
      // API 1: Análise rápida
      const analysis = await dualAI.analyzeCode(
        code,
        context.currentConcept,
        context.userLevel,
        userIdleTime
      );

      setLastAnalysis(analysis);

      // API 2: Gerar resposta pedagógica
      const teachingResponse = await dualAI.generateTeachingResponse(
        analysis,
        code,
        conversation
      );

      // Reagir baseado na análise
      handleTeachingResponse(teachingResponse, analysis);

    } catch (error) {
      console.error('Erro na análise dual AI:', error);
      // Fallback para análise local
      const localAnalysis = analyzeCodeForConcept(code, context.currentConcept);
      if (localAnalysis.isProgressing) {
        reactToProgress(localAnalysis);
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [context.currentConcept, context.userLevel, userIdleTime, conversation, isAnalyzing]);

  // Processar resposta do sistema de ensino
  const handleTeachingResponse = useCallback((response: TeachingResponse, analysis: CodeAnalysis) => {
    // Enviar mensagem da IA
    speakToUser(response.message, response.action);

    // Executar ação se necessário
    switch (response.action) {
      case 'demonstrate':
        if (response.codeExample) {
          setTimeout(() => {
            simulateTyping(response.codeExample!);
          }, 2000);
        } else {
          setTimeout(() => {
            demonstrateConcept(context.currentConcept);
          }, 2000);
        }
        break;

      case 'advance':
        if (analysis.progress >= 80) {
          setTimeout(() => {
            advanceToNextConcept();
          }, 2000);
        }
        break;

      case 'hint':
        // Já enviou a mensagem, nada mais a fazer
        break;
    }

    // Atualizar contexto
    setContext(prev => ({
      ...prev,
      codeProgress: analysis.progress,
      needsHelp: analysis.isStuck,
      isStuck: analysis.isStuck
    }));
  }, [context.currentConcept]);

  // Análise local do código (sem API para rapidez)
  const analyzeCodeForConcept = (code: string, concept: string) => {
    const analysis = {
      isProgressing: false,
      hasErrors: false,
      isStuck: false,
      suggestions: [] as string[],
      progress: 0
    };

    switch (concept) {
      case 'variables':
        if (code.includes('=') && !code.includes('==')) {
          analysis.isProgressing = true;
          analysis.progress = 30;
        }
        if (code.includes('print(')) {
          analysis.progress = 70;
        }
        if (code.includes('=') && code.includes('print(')) {
          analysis.progress = 100;
        }
        break;

      case 'conditionals':
        if (code.includes('if ')) {
          analysis.isProgressing = true;
          analysis.progress = 40;
        }
        if (code.includes('else')) {
          analysis.progress = 70;
        }
        if (code.includes('elif')) {
          analysis.progress = 90;
        }
        break;

      case 'loops':
        if (code.includes('for ') || code.includes('while ')) {
          analysis.isProgressing = true;
          analysis.progress = 50;
        }
        if (code.includes('range(')) {
          analysis.progress = 80;
        }
        break;

      case 'functions':
        if (code.includes('def ')) {
          analysis.isProgressing = true;
          analysis.progress = 40;
        }
        if (code.includes('return')) {
          analysis.progress = 80;
        }
        break;
    }

    // Detectar erros comuns
    if (code.includes('print') && !code.includes('print(')) {
      analysis.hasErrors = true;
      analysis.suggestions.push('Lembre-se dos parênteses em print()');
    }

    if (code.includes('if') && !code.includes(':')) {
      analysis.hasErrors = true;
      analysis.suggestions.push('Não esqueça dos dois pontos (:) após o if');
    }

    return analysis;
  };

  // Reações da IA baseadas no progresso
  const reactToProgress = useCallback((analysis: any) => {
    const messages = [
      "Isso aí! Você está no caminho certo! 👍",
      "Ótimo progresso! Continue assim!",
      "Perfeito! Está entendendo bem o conceito!",
      "Excelente! Vejo que você pegou a ideia!"
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    speakToUser(randomMessage, 'encouragement');

    // Atualizar contexto
    setContext(prev => ({
      ...prev,
      codeProgress: analysis.progress,
      needsHelp: false,
      isStuck: false
    }));

    // Se completou o conceito, avançar
    if (analysis.progress >= 100) {
      setTimeout(() => {
        advanceToNextConcept();
      }, 2000);
    }
  }, []);

  const reactToErrors = useCallback((analysis: any) => {
    if (analysis.suggestions.length > 0) {
      const hint = `💡 ${analysis.suggestions[0]}`;
      speakToUser(hint, 'hint');
    }
  }, []);

  const reactToConfusion = useCallback((analysis: any) => {
    const helpMessages = [
      "Posso ajudar com alguma coisa? Vejo que você parou um pouco...",
      "Alguma dúvida? Estou aqui para ajudar!",
      "Que tal uma dica? Posso explicar melhor!"
    ];

    const message = helpMessages[Math.floor(Math.random() * helpMessages.length)];
    speakToUser(message, 'suggestion');
  }, []);

  const checkIfUserNeedsHelp = useCallback(() => {
    if (context.codeProgress < 30) {
      const concept = context.currentConcept;
      speakToUser(
        `Vejo que você está começando com ${concept}. Quer que eu te dê um exemplo primeiro?`,
        'suggestion'
      );
    }
  }, [context]);

  const offerEncouragement = useCallback(() => {
    const messages = [
      "Não desista! Programar é assim mesmo, devagar e sempre! 💪",
      "Está pensando? Ótimo! Tomar tempo para entender é importante.",
      "Precisa de uma pausa? Ou quer que eu te ajude com o próximo passo?"
    ];

    const message = messages[Math.floor(Math.random() * messages.length)];
    speakToUser(message, 'encouragement');
  }, []);

  // Comunicação fluida com o usuário
  const speakToUser = useCallback((message: string, type: string) => {
    if (recentMessages.includes(message)) {
      return;
    }

    const aiMessage = {
      id: Date.now().toString(),
      type: type,
      suggestion: message,
      explanation: `Observando: ${context.currentConcept}`,
      timestamp: new Date()
    };

    onMessage(aiMessage);
    setConversation(prev => [message, ...prev.slice(0, 4)]); // Manter últimas 5 mensagens
    setRecentMessages(prev => [message, ...prev.slice(0, 4)]); // Manter últimas 5 mensagens
  }, [context.currentConcept, onMessage, recentMessages]);

  // Demonstração interativa de código
  const demonstrateConcept = useCallback(async (concept: string) => {
    setIsTypingCode(true);
    
    // Ao invés de código pré-definido, vamos gerar com a IA
    try {
      // Criar uma análise básica para gerar demonstração
      const demoAnalysis: CodeAnalysis = {
        concept: concept,
        progress: 0,
        errors: [],
        suggestions: [],
        nextStep: `Demonstrar ${concept}`,
        isStuck: false,
        sentiment: 'progressing',
        codeQuality: 'empty',
        needsHelp: false
      };
      
      const response = await dualAI.generateTeachingResponse(
        demoAnalysis,
        '# Vamos aprender juntos!',
        [`Demonstre o conceito de ${concept} com código simples`]
      );
      
      const code = response.codeExample || `# Exemplo de ${concept}\n# Vamos aprender juntos!`;
      
      simulateTyping(code);
      
      setTimeout(() => {
        onMessage({
          id: Date.now().toString(),
          type: 'explanation',
          suggestion: response.message || `Aqui está um exemplo de ${concept}. Vamos praticá-lo juntos!`,
          explanation: `Demonstração prática de ${concept}`,
          timestamp: new Date()
        });
      }, 2000);
      
    } catch (error) {
      // Fallback simples em caso de erro
      const fallbackCode = `# Vamos aprender ${concept}!\n# Digite seu código aqui`;
      simulateTyping(fallbackCode);
    }
    
    setIsTypingCode(false);
  }, [onMessage, currentCode, userLevel]);

  // Simulação natural de digitação
  const simulateTyping = useCallback((code: string) => {
    return new Promise<void>((resolve) => {
      let index = 0;
      const typeSpeed = 50 + Math.random() * 30; // Velocidade mais humana
      
      onCodeChange(''); // Limpar
      
      const typeChar = () => {
        if (index <= code.length) {
          onCodeChange(code.substring(0, index));
          index++;
          
          // Pausas naturais em pontos específicos
          const char = code[index - 1];
          let delay = typeSpeed;
          
          if (char === '\n') delay = typeSpeed * 3;
          if (char === ':') delay = typeSpeed * 2;
          if (char === '#') delay = typeSpeed * 4;
          
          setTimeout(typeChar, delay);
        } else {
          setIsTypingCode(false);
          resolve();
        }
      };
      
      typeChar();
    });
  }, [onCodeChange]);

  const advanceToNextConcept = useCallback(() => {
    const currentIndex = conceptFlow.indexOf(context.currentConcept);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < conceptFlow.length) {
      const nextConcept = conceptFlow[nextIndex];
      
      setContext(prev => ({
        ...prev,
        currentConcept: nextConcept,
        codeProgress: 0,
        needsHelp: false,
        isStuck: false
      }));
      
      speakToUser(
        `🎉 Parabéns! Você dominou ${context.currentConcept}! Agora vamos para ${nextConcept}!`,
        'encouragement'
      );
      
      setTimeout(() => {
        demonstrateConcept(nextConcept);
      }, 3000);
    } else {
      speakToUser(
        "🎊 Incrível! Você completou todos os conceitos! Agora pode explorar livremente!",
        'encouragement'
      );
    }
  }, [context.currentConcept, conceptFlow, demonstrateConcept]);

  // Inicializar o ensino
  useEffect(() => {
    if (language && conceptFlow.length > 0) {
      setTimeout(() => {
        speakToUser(
          `Olá! Vou te ensinar ${language} de forma interativa. Vou observar tudo que você faz e te ajudar em tempo real! 🚀`,
          'encouragement'
        );
        
        setTimeout(() => {
          demonstrateConcept(context.currentConcept);
        }, 2000);
      }, 1000);
    }
  }, [language, userLevel]);

  return (
    <div className="space-y-4">
      {/* Status de Observação */}
      <div className="bg-primary border border-secondary rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isWatching ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
            <Eye className="w-4 h-4 text-muted" />
            <span className="text-xs text-secondary">
              {isAnalyzing ? 'Analisando com IA...' : isWatching ? 'Observando seu código...' : 'Modo observação pausado'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-xs text-subtle">
              {context.currentConcept} - {context.codeProgress}%
              {lastAnalysis && ` (${lastAnalysis.sentiment})`}
            </span>
            {isAnalyzing && (
              <div className="flex items-center space-x-1">
                <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" />
                <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <span className="text-xs text-purple-400">AI</span>
              </div>
            )}
            {isTypingCode && (
              <div className="flex items-center space-x-1">
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" />
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            )}
          </div>
        </div>
        
        {/* Barra de Progresso */}
        <div className="mt-2 w-full bg-secondary rounded-full h-1">
          <div
            className="bg-blue-500 h-1 rounded-full transition-all duration-300"
            style={{ width: `${context.codeProgress}%` }}
          />
        </div>
      </div>

      {/* Progresso dos Conceitos */}
      <div className="bg-primary border border-secondary rounded-lg p-3">
        <h4 className="text-sm font-medium text-secondary mb-2 flex items-center">
          <Zap className="w-4 h-4 mr-2 text-muted" />
          Jornada de Aprendizado
        </h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {conceptFlow.map((concept: string, index: number) => {
            const isCompleted = conceptFlow.indexOf(context.currentConcept) > index;
            const isCurrent = concept === context.currentConcept;
            
            return (
              <div
                key={concept}
                className={`p-2 rounded text-xs text-center transition-all ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-blue-500 text-white'
                    : 'bg-secondary text-subtle'
                }`}
              >
                {isCompleted && <CheckCircle className="w-3 h-3 mx-auto mb-1" />}
                {concept}
              </div>
            );
          })}
        </div>
      </div>

      {/* Últimas Interações */}
      {conversation.length > 0 && (
        <div className="space-y-2">
          {conversation.slice(0, 3).map((message, index) => (
            <div
              key={index}
              className="flex items-start space-x-2 bg-primary border border-secondary rounded-lg p-2"
            >
              <Bot className="w-4 h-4 text-blue-500 mt-0.5" />
              <p className="text-xs text-secondary">{message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Controles */}
      <div className="flex space-x-2">
        <button
          onClick={() => setIsWatching(!isWatching)}
          className={`px-3 py-1 text-xs rounded transition-colors ${
            isWatching
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
        >
          {isWatching ? 'Pausar Observação' : 'Iniciar Observação'}
        </button>
        
        <button
          onClick={() => demonstrateConcept(context.currentConcept)}
          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Mostrar Exemplo
        </button>
      </div>
    </div>
  );
}
