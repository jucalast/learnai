'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Bot, Eye, Lightbulb, CheckCircle, AlertCircle, Zap, Brain, Activity } from 'lucide-react';
import { intelligentWatcher, TeachingMoment, CodeEvent } from '@/lib/intelligentAIWatcher';

interface TeachingContext {
  currentConcept: string;
  userLevel: 'beginner' | 'intermediate' | 'advanced';
  recentActions: string[];
  codeProgress: number;
  needsHelp: boolean;
  isStuck: boolean;
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
  const [currentMoment, setCurrentMoment] = useState<TeachingMoment | null>(null);
  const [watcherStats, setWatcherStats] = useState<any>({});
  const [recentMessages, setRecentMessages] = useState<string[]>([]);
  
  const watcherRef = useRef<NodeJS.Timeout | null>(null);
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

  // Sistema inteligente de observação do código
  useEffect(() => {
    if (!currentCode) return;

    setLastCodeChange(Date.now());
    setUserIdleTime(0);

    // Debounce para análise inteligente
    if (watcherRef.current) {
      clearTimeout(watcherRef.current);
    }

    watcherRef.current = setTimeout(() => {
      analyzeCodeWithIntelligentWatcher(currentCode);
    }, 1200); // Tempo otimizado para análise

    return () => {
      if (watcherRef.current) {
        clearTimeout(watcherRef.current);
      }
    };
  }, [currentCode]);

  // Observador de inatividade e timing
  useEffect(() => {
    if (!isWatching) return;

    const watchInterval = setInterval(() => {
      const timeSinceLastChange = Date.now() - lastCodeChange;
      const idleSeconds = Math.floor(timeSinceLastChange / 1000);
      
      setUserIdleTime(idleSeconds);

      // Análise periódica para detectar se usuário está travado
      if (idleSeconds > 0 && idleSeconds % 10 === 0) {
        analyzeCodeWithIntelligentWatcher(currentCode, idleSeconds);
      }
    }, 1000);

    return () => clearInterval(watchInterval);
  }, [isWatching, lastCodeChange, currentCode]);

  // Nova função que usa o watcher inteligente
  const analyzeCodeWithIntelligentWatcher = useCallback(async (code: string, idle: number = userIdleTime) => {
    if (!code && idle < 10) return; // Evita análises desnecessárias

    try {
      const teachingMoment = await intelligentWatcher.watchAndRespond(
        code,
        context.currentConcept,
        context.userLevel,
        idle
      );

      if (teachingMoment && teachingMoment.shouldRespond) {
        setCurrentMoment(teachingMoment);
        handleTeachingMoment(teachingMoment);
      }

      // Atualiza estatísticas do watcher
      setWatcherStats(intelligentWatcher.getStats());

    } catch (error) {
      console.error('Erro no watcher inteligente:', error);
      // Fallback para resposta básica
      handleBasicFallback(code, idle);
    }
  }, [context.currentConcept, context.userLevel, userIdleTime]);

  // Processa momento de ensino detectado pelo watcher
  const handleTeachingMoment = useCallback((moment: TeachingMoment) => {
    // Envia mensagem da IA
    speakToUser(moment.message, moment.responseType);

    // Executa ação específica baseada no tipo
    switch (moment.responseType) {
      case 'demonstrate':
        if (moment.codeExample) {
          setTimeout(() => {
            simulateTyping(moment.codeExample!);
          }, 2000);
        } else {
          setTimeout(() => {
            demonstrateConcept(context.currentConcept);
          }, 2000);
        }
        break;

      case 'advance':
        setTimeout(() => {
          advanceToNextConcept();
        }, 2000);
        break;

      case 'hint':
      case 'encourage':
      case 'correct':
        // Mensagem já foi enviada
        break;

      case 'observe':
        // Apenas observando, sem ação
        break;
    }

    // Atualiza contexto baseado na resposta
    setContext(prev => ({
      ...prev,
      needsHelp: moment.urgency === 'high',
      isStuck: moment.responseType === 'demonstrate',
      recentActions: [...prev.recentActions, moment.responseType].slice(-5)
    }));
  }, [context.currentConcept]);

  // Fallback básico quando o watcher falha
  const handleBasicFallback = useCallback((code: string, idle: number) => {
    if (code.trim().length === 0 && idle > 15) {
      speakToUser(`Vamos começar com ${context.currentConcept}! Escreva sua primeira linha de código ✨`, 'encourage');
    } else if (idle > 30) {
      speakToUser(`Observando seu código... precisa de uma dica com ${context.currentConcept}? 🤔`, 'hint');
    }
  }, [context.currentConcept]);

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
    
    try {
      // Usar o watcher inteligente para gerar demonstração
      const demoMoment = await intelligentWatcher.watchAndRespond(
        '# Vamos aprender juntos!',
        concept,
        context.userLevel,
        0
      );
      
      const code = demoMoment?.codeExample || getBasicConceptExample(concept);
      
      await simulateTyping(code);
      
      setTimeout(() => {
        onMessage({
          id: Date.now().toString(),
          type: 'explanation',
          suggestion: demoMoment?.message || `Aqui está um exemplo de ${concept}. Vamos praticá-lo juntos!`,
          explanation: `Demonstração prática de ${concept}`,
          timestamp: new Date()
        });
      }, 2000);
      
    } catch (error) {
      // Fallback simples em caso de erro
      const fallbackCode = getBasicConceptExample(concept);
      await simulateTyping(fallbackCode);
    }
    
    setIsTypingCode(false);
  }, [onMessage, context.userLevel]);

  // Exemplos básicos para fallback
  const getBasicConceptExample = (concept: string): string => {
    const examples: Record<string, string> = {
      variables: `# Exemplo de variáveis
nome = "Python"
idade = 25
print(f"Olá, {nome}! Você tem {idade} anos.")`,

      conditionals: `# Exemplo de condicionais
idade = 18
if idade >= 18:
    print("Você é maior de idade")
else:
    print("Você é menor de idade")`,

      loops: `# Exemplo de loops
for i in range(5):
    print(f"Número: {i}")`,

      functions: `# Exemplo de funções
def saudacao(nome):
    return f"Olá, {nome}!"

resultado = saudacao("Python")
print(resultado)`
    };

    return examples[concept] || `# Vamos aprender ${concept}!\n# Digite seu código aqui`;
  };

  // Simulação natural de digitação
  const simulateTyping = useCallback((code: string): Promise<void> => {
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

      // Reset do watcher para novo conceito
      intelligentWatcher.resetForNewConcept(nextConcept);
      
      speakToUser(
        `🎉 Parabéns! Você dominou ${context.currentConcept}! Agora vamos para ${nextConcept}!`,
        'encourage'
      );
      
      setTimeout(() => {
        demonstrateConcept(nextConcept);
      }, 3000);
    } else {
      speakToUser(
        "🎊 Incrível! Você completou todos os conceitos! Agora pode explorar livremente!",
        'encourage'
      );
    }
  }, [context.currentConcept, conceptFlow]);

  // Inicializar o ensino
  useEffect(() => {
    if (language && conceptFlow.length > 0) {
      setTimeout(() => {
        speakToUser(
          `Olá! Vou te ensinar ${language} de forma interativa. Vou observar tudo que você faz e te ajudar em tempo real! 🚀`,
          'encourage'
        );
        
        setTimeout(() => {
          demonstrateConcept(context.currentConcept);
        }, 2000);
      }, 1000);
    }
  }, [language, userLevel]);

  return (
    <div className="space-y-4">
      {/* Status de Observação Inteligente */}
      <div className="bg-primary border border-secondary rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isWatching ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
            <Brain className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-secondary">
              {currentMoment?.shouldRespond ? 'IA reagindo...' : isWatching ? 'Observando seu código...' : 'Modo observação pausado'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-xs text-subtle">
              {context.currentConcept} - {context.codeProgress}%
              {currentMoment && ` (${currentMoment.urgency})`}
            </span>
            {currentMoment?.shouldRespond && (
              <div className="flex items-center space-x-1">
                <Activity className="w-3 h-3 text-blue-400 animate-pulse" />
                <span className="text-xs text-blue-400">AI</span>
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

        {/* Stats do Watcher Inteligente */}
        {watcherStats && Object.keys(watcherStats).length > 0 && (
          <div className="mt-2 text-xs text-subtle">
            Eventos: {watcherStats.eventsProcessed} | Respostas: {watcherStats.responsesGiven}
          </div>
        )}
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

      {/* Últimas Interações da IA */}
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

        {/* Indicador do status atual */}
        {currentMoment && (
          <div className="px-3 py-1 text-xs bg-purple-600 text-white rounded">
            {currentMoment.responseType}: {currentMoment.urgency}
          </div>
        )}
      </div>
    </div>
  );
}
