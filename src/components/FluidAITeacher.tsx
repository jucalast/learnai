'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Bot, Settings, RotateCcw, Sparkles, Brain, Activity, Zap, CheckCircle, Eye, Lightbulb, AlertCircle } from 'lucide-react';
import PersonalizedLearningSystem from './PersonalizedLearningSystem';
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

type TeachingMode = 'personalized' | 'legacy';

export default function FluidAITeacher({
  language,
  currentCode,
  onCodeChange,
  onMessage,
  userLevel
}: FluidAITeacherProps) {
  
  // 🔴 TODOS OS HOOKS MOVIDOS PARA O TOPO (obrigatório pelo React)
  
  // Estado para controlar o modo de ensino
  const [teachingMode, setTeachingMode] = useState<TeachingMode>('personalized');
  const [showModeSelector, setShowModeSelector] = useState(false);

  // Legacy context (mantido para compatibilidade)
  const [context, setContext] = useState<TeachingContext>({
    currentConcept: 'variables',
    userLevel,
    recentActions: [],
    codeProgress: 0,
    needsHelp: false,
    isStuck: false
  });

  // Interface de chat para comunicação com usuário no modo personalizado
  const [chatInput, setChatInput] = useState('');
  const [isWaitingResponse, setIsWaitingResponse] = useState(false);

  // Estados do modo legacy (sempre inicializados)
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

  // Estabilizar props para evitar re-renders desnecessários no PersonalizedLearningSystem
  const stableLanguage = useMemo(() => language, [language]);
  const stableCurrentCode = useMemo(() => currentCode, [currentCode]);
  const stableOnCodeChange = useMemo(() => onCodeChange, [onCodeChange]);
  const stableOnMessage = useMemo(() => onMessage, [onMessage]);

  // Handler para mensagens do chat no modo personalizado
  const handleChatMessage = useCallback(async () => {
    if (!chatInput.trim() || isWaitingResponse) return;

    setIsWaitingResponse(true);
    
    // Envia mensagem do usuário
    const userMessage = {
      id: Date.now().toString(),
      type: 'user_question',
      suggestion: chatInput,
      explanation: 'Pergunta do usuário',
      timestamp: new Date()
    };
    
    onMessage(userMessage);
    setChatInput('');
    setIsWaitingResponse(false);
  }, [chatInput, isWaitingResponse, onMessage]);

  // Conceitos progressivos por linguagem
  const getConceptFlow = useCallback((lang: string, level: string) => {
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
  }, []);

  const conceptFlow = useMemo(() => getConceptFlow(language, userLevel), [getConceptFlow, language, userLevel]);

  // Comunicação fluida com o usuário
  const speakToUser = useCallback((message: string, type: string) => {
    if (teachingMode !== 'legacy' || recentMessages.includes(message)) {
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
  }, [teachingMode, context.currentConcept, onMessage, recentMessages]);

  // Simulação de digitação fluida
  const simulateTyping = useCallback(async (code: string) => {
    if (teachingMode !== 'legacy') return;
    
    const words = code.split(' ');
    let currentCode = '';
    
    for (let i = 0; i < words.length; i++) {
      currentCode += (i > 0 ? ' ' : '') + words[i];
      onCodeChange(currentCode);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }, [teachingMode, onCodeChange]);

  // Demonstração interativa de código
  const demonstrateConcept = useCallback(async (concept: string) => {
    if (teachingMode !== 'legacy') return;
    
    setIsTypingCode(true);
    
    try {
      // Usar o watcher inteligente para gerar demonstração
      const demoMoment = await intelligentWatcher.watchAndRespond(
        `# Demonstração de ${concept}`,
        concept,
        context.userLevel,
        0
      );
      
      const code = demoMoment?.codeExample;
      
      if (!code) {
        throw new Error('Nenhum código disponível - API necessária');
      }
      
      await simulateTyping(code);
      
      setTimeout(() => {
        if (!demoMoment?.message) {
          throw new Error('AI não conseguiu gerar explicação para o exemplo');
        }
        
        onMessage({
          id: Date.now().toString(),
          type: 'explanation',
          suggestion: demoMoment.message,
          explanation: `Demonstração prática de ${concept}`,
          timestamp: new Date()
        });
      }, 2000);
      
    } catch (error) {
      console.error('❌ Erro ao demonstrar conceito:', error);
      throw error;
    }
    
    setIsTypingCode(false);
  }, [teachingMode, onMessage, context.userLevel, simulateTyping]);

  // Avançar para próximo conceito
  const advanceToNextConcept = useCallback(async () => {
    if (teachingMode !== 'legacy') return;
    
    const currentIndex = conceptFlow.indexOf(context.currentConcept);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < conceptFlow.length) {
      const nextConcept = conceptFlow[nextIndex];
      setContext(prev => ({ ...prev, currentConcept: nextConcept, codeProgress: 0 }));
      
      try {
        // Usar IA para gerar mensagem de progresso
        const progressMoment = await intelligentWatcher.watchAndRespond(
          `// Conceito ${context.currentConcept} completado, avançando para ${nextConcept}`,
          nextConcept,
          context.userLevel,
          0
        );
        
        if (progressMoment?.message) {
          setTimeout(() => {
            speakToUser(progressMoment.message, 'encourage');
            setTimeout(() => {
              demonstrateConcept(nextConcept);
            }, 3000);
          }, 1000);
        } else {
          throw new Error('AI não conseguiu gerar mensagem de progresso');
        }
      } catch (error) {
        console.error('❌ Erro ao gerar mensagem de progresso:', error);
        throw error;
      }
    } else {
      try {
        // Usar IA para gerar mensagem de conclusão
        const completionMoment = await intelligentWatcher.watchAndRespond(
          `// Todos os conceitos concluídos: ${conceptFlow.join(', ')}`,
          'course_completion',
          context.userLevel,
          0
        );
        
        if (completionMoment?.message) {
          speakToUser(completionMoment.message, 'encourage');
        } else {
          throw new Error('AI não conseguiu gerar mensagem de conclusão');
        }
      } catch (error) {
        console.error('❌ Erro ao gerar mensagem de conclusão:', error);
        throw error;
      }
    }
  }, [teachingMode, conceptFlow, context.currentConcept, context.userLevel, speakToUser, demonstrateConcept]);

  // Processa momento de ensino detectado pelo watcher
  const handleTeachingMoment = useCallback((moment: TeachingMoment) => {
    if (teachingMode !== 'legacy') return;
    
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
  }, [teachingMode, context.currentConcept, speakToUser, simulateTyping, demonstrateConcept, advanceToNextConcept]);

  // Fallback básico quando o watcher falha
  const handleBasicFallback = useCallback((code: string, idle: number) => {
    if (teachingMode !== 'legacy') return;
    
    // Lança erro em vez de usar mensagens estáticas
    console.error('❌ AI Watcher falhou - não é possível gerar encorajamento');
    throw new Error('Não é possível gerar resposta de ensino - API indisponível');
  }, [teachingMode]);

  // Nova função que usa o watcher inteligente
  const analyzeCodeWithIntelligentWatcher = useCallback(async (code: string, idle: number = userIdleTime) => {
    if (teachingMode !== 'legacy' || (!code && idle < 10)) return; // Só executa no modo legacy

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
  }, [teachingMode, context.currentConcept, context.userLevel, userIdleTime, handleTeachingMoment, handleBasicFallback]);

  // Sistema inteligente de observação do código (somente modo legacy)
  useEffect(() => {
    if (teachingMode !== 'legacy' || !currentCode) return;

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
  }, [teachingMode, currentCode, analyzeCodeWithIntelligentWatcher]);

  // Observador de inatividade e timing (somente modo legacy)
  useEffect(() => {
    if (teachingMode !== 'legacy' || !isWatching) return;

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
  }, [teachingMode, isWatching, lastCodeChange, currentCode, analyzeCodeWithIntelligentWatcher]);

  // Inicializar o ensino (somente modo legacy)
  useEffect(() => {
    if (teachingMode !== 'legacy' || !language || conceptFlow.length === 0) return;
    
    const initializeTeaching = async () => {
      try {
        // Usar IA para gerar mensagem de boas-vindas
        const welcomeMoment = await intelligentWatcher.watchAndRespond(
          `// Iniciando ensino de ${language} para nível ${userLevel}`,
          'welcome',
          userLevel,
          0
        );
        
        if (welcomeMoment?.message) {
          setTimeout(() => {
            speakToUser(welcomeMoment.message, 'encourage');
            
            setTimeout(() => {
              demonstrateConcept(conceptFlow[0]);
            }, 2000);
          }, 1000);
        } else {
          throw new Error('AI não conseguiu gerar mensagem de boas-vindas');
        }
      } catch (error) {
        console.error('❌ Erro ao inicializar ensino:', error);
        // Não usar fallback - mostrar erro
        throw error;
      }
    };
    
    initializeTeaching();
  }, [teachingMode, language, conceptFlow, userLevel, speakToUser, demonstrateConcept]);

  // Modo Personalizado (novo sistema)
  if (teachingMode === 'personalized') {
    return (
      <div className="space-y-4">
        {/* Cabeçalho com controles */}
        <div className="bg-primary border border-secondary rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-medium text-secondary">
                Sistema de Aprendizado Personalizado
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowModeSelector(!showModeSelector)}
                className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                title="Alternar modo de ensino"
              >
                <Settings className="w-3 h-3" />
              </button>
              
              <button
                onClick={() => setTeachingMode('legacy')}
                className="px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                title="Modo compatibilidade"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>

          {showModeSelector && (
            <div className="mt-3 p-3 bg-secondary rounded border">
              <p className="text-xs text-subtle mb-2">
                Escolha o modo de ensino:
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setTeachingMode('personalized');
                    setShowModeSelector(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  🎯 Personalizado - Assessment + Currículo + Chat/Editor integrados
                </button>
                <button
                  onClick={() => {
                    setTeachingMode('legacy');
                    setShowModeSelector(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  🔧 Legado - Sistema original de observação
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sistema de Aprendizado Personalizado */}
        <PersonalizedLearningSystem
          language={stableLanguage}
          currentCode={stableCurrentCode}
          onCodeChange={stableOnCodeChange}
          onMessage={stableOnMessage}
        />
      </div>
    );
  }

  // Modo Legacy (sistema original) - mantido para compatibilidade
  return (
    <div className="space-y-4">
      {/* Header com controles de modo e estatísticas */}
      <div className="bg-primary border border-secondary rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-green-400" />
            <span className="text-sm font-medium text-secondary">
              IA Professora Observacional (Modo Legacy)
            </span>
            {currentMoment && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-green-400">
                  {currentMoment.responseType === 'observe' ? 'Observando' : 'Respondendo'}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setTeachingMode('personalized')}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              title="Modo personalizado"
            >
              <Sparkles className="w-3 h-3" />
            </button>
            
            <button
              onClick={() => setIsWatching(!isWatching)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                isWatching 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
              title={isWatching ? 'Pausar observação' : 'Retomar observação'}
            >
              <Eye className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Estatísticas do contexto */}
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="bg-secondary rounded p-2">
            <div className="text-subtle">Conceito atual</div>
            <div className="text-primary font-medium capitalize">
              {context.currentConcept.replace('_', ' ')}
            </div>
          </div>
          <div className="bg-secondary rounded p-2">
            <div className="text-subtle">Tempo inativo</div>
            <div className="text-primary font-medium">{userIdleTime}s</div>
          </div>
          <div className="bg-secondary rounded p-2">
            <div className="text-subtle">Nível</div>
            <div className="text-primary font-medium capitalize">{context.userLevel}</div>
          </div>
          <div className="bg-secondary rounded p-2">
            <div className="text-subtle">Status</div>
            <div className={`font-medium ${context.needsHelp ? 'text-yellow-400' : 'text-green-400'}`}>
              {context.needsHelp ? 'Precisa ajuda' : 'Progredindo'}
            </div>
          </div>
        </div>
      </div>

      {/* Debug info se disponível */}
      {Object.keys(watcherStats).length > 0 && (
        <div className="bg-secondary border border-secondary rounded-lg p-3">
          <div className="text-xs text-subtle mb-2">Estatísticas do Watcher Inteligente:</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {Object.entries(watcherStats).map(([key, value]) => (
              <div key={key} className="bg-primary rounded p-2">
                <div className="text-subtle capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</div>
                <div className="text-primary font-mono">{String(value)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conversa recente */}
      {conversation.length > 0 && (
        <div className="bg-secondary border border-secondary rounded-lg p-3">
          <div className="text-xs text-subtle mb-2">Últimas interações:</div>
          <div className="space-y-1">
            {conversation.slice(0, 3).map((msg, idx) => (
              <div key={idx} className="text-xs text-primary bg-primary rounded p-2">
                {msg}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
