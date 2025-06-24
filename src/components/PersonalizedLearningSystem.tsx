/**
 * Sistema de Aprendizado Personalizado Integrado
 * Componente principal que coordena Assessment + Chat + Editor
 * Integrado com o sistema de assessment existente
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Brain, 
  MessageCircle, 
  Code, 
  CheckCircle, 
  Clock, 
  Target,
  Zap,
  BookOpen,
  Users,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

import InitialAssessment, { OriginalAssessment } from './InitialAssessment';
import APIStatus from './APIStatus';
import { 
  PersonalizedCurriculum, 
  ChatMessage,
  LearningTopic,
  SessionProgress,
  UserAssessment
} from '@/types/learningSystem';

import { LearningPathService } from '@/lib/personalizedLearning';
import { 
  LearningCoordinator, 
  LearningCoordinatorObserver 
} from '@/lib/learningCoordinator';

import useDatabase from '@/hooks/useDatabase';

interface PersonalizedLearningSystemProps {
  language: string;
  onCodeChange: (code: string) => void;
  onMessage: (message: any) => void;
  currentCode: string;
}

// Estados do sistema
type SystemState = 
  | 'assessment' 
  | 'generating_curriculum' 
  | 'learning_active' 
  | 'topic_completed';

export default function PersonalizedLearningSystem({
  language,
  onCodeChange,
  onMessage,
  currentCode
}: PersonalizedLearningSystemProps) {
  // 🗄️ Database hook
  const [dbState, dbActions] = useDatabase();

  // Log controlado - apenas mudanças significativas
  const prevLanguageRef = useRef(language);
  if (prevLanguageRef.current !== language) {
    console.log('🔄 PersonalizedLearningSystem - Language mudou:', prevLanguageRef.current, '->', language);
    prevLanguageRef.current = language;
  }
  
  // Estados principais
  const [systemState, setSystemState] = useState<SystemState>('assessment');
  const [assessment, setAssessment] = useState<UserAssessment | null>(null);
  const [curriculum, setCurriculum] = useState<PersonalizedCurriculum | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [sessionProgress, setSessionProgress] = useState<SessionProgress>({
    topicsCompleted: [],
    exercisesCompleted: [],
    currentScore: 0,
    timeSpent: 0,
    strugglingAreas: [],
    strengthAreas: [],
    adaptationsMade: 0
  });

  // Assessment states - simplificados já que usamos o componente existente
  const [isProcessing, setIsProcessing] = useState(false);

  // Estados para controle de erro da API
  const [apiError, setApiError] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  // Ref para forçar re-render em casos problemáticos
  const forceUpdateRef = useRef(0);

  // Monitorar mudanças na prop language - REMOVIDO para reduzir logs

  // Ref para o estado atual para uso no listener
  const currentStateRef = useRef(systemState);

  // Atualizar a ref sempre que o estado muda
  useEffect(() => {
    currentStateRef.current = systemState;
  }, [systemState]);

  // 🏁 Inicializar usuário e verificar dados existentes
  useEffect(() => {
    // Verificar se já existe uma instância inicializando
    const initializationKey = `initializing_${language}`;
    if (sessionStorage.getItem(initializationKey)) {
      console.log('🚫 Já existe uma inicialização em andamento para', language);
      return;
    }
    
    const initializeUserAndData = async () => {
      sessionStorage.setItem(initializationKey, 'true');
      console.log('🚀 Inicializando usuário e dados...');
      
      try {
        // Criar usuário anônimo se necessário
        const userId = await dbActions.initializeUser();
        
        if (userId) {
          console.log('✅ Usuário inicializado:', userId);
          
          // Verificar se já existe assessment para esta linguagem no localStorage
          const assessmentKey = `assessment_${language}`;
          const storedAssessment = localStorage.getItem(assessmentKey);
          
          if (storedAssessment) {
            try {
              const localAssessment = JSON.parse(storedAssessment);
              console.log(`📋 Assessment local encontrado para ${language}:`, localAssessment);
              
              // Converter para formato UserAssessment
              const userAssessment: UserAssessment = {
                id: Date.now().toString(),
                userId: userId,
                language: localAssessment.language,
                level: localAssessment.level,
                experience: localAssessment.experience || 'Beginner',
                interests: localAssessment.interests || [],
                previousKnowledge: localAssessment.previousKnowledge || [],
                learningStyle: localAssessment.learningStyle || 'mixed',
                goals: localAssessment.goals || [],
                timeAvailable: localAssessment.timeAvailable || 'medium',
                completedAt: new Date(localAssessment.completedAt || Date.now()),
                createdAt: new Date(localAssessment.createdAt || Date.now()),
                updatedAt: new Date()
              };
              
              setAssessment(userAssessment);
              
              // Verificar se já existe currículo
              const curriculum = await dbActions.getCurriculumByAssessment(userAssessment.id);
              if (curriculum) {
                console.log('📚 Currículo existente encontrado:', curriculum);
                setCurriculum(curriculum);
                setSystemState('learning_active');
              } else {
                console.log('🔄 Assessment existe mas não há currículo, gerando...');
                setSystemState('generating_curriculum');
                
                // Primeiro salvar o assessment do localStorage no banco
                const savedAssessment = await dbActions.createAssessment(userId, {
                  language: userAssessment.language,
                  level: userAssessment.level,
                  experience: userAssessment.experience,
                  interests: userAssessment.interests,
                  previousKnowledge: userAssessment.previousKnowledge,
                  learningStyle: userAssessment.learningStyle,
                  goals: userAssessment.goals,
                  timeAvailable: userAssessment.timeAvailable,
                  generalProgrammingLevel: 'advanced',
                  languageSpecificLevel: 'basic',
                  adaptiveLevel: 'beginner'
                });
                
                if (savedAssessment) {
                  console.log('✅ Assessment salvo no banco:', savedAssessment.id);
                  await generateCurriculumFromExistingAssessment(savedAssessment, userId);
                } else {
                  console.error('❌ Falha ao salvar assessment no banco');
                  setSystemState('assessment');
                }
              }
              return; // Já temos dados, não precisar verificar banco
            } catch (error) {
              console.error('❌ Erro ao parsear assessment local:', error);
            }
          }
          
          // Verificar se já existe assessment para esta linguagem no banco
          const assessments = await dbActions.getAssessmentsByUser(userId);
          const existingAssessment = assessments?.find(a => a.language === language);
          
          if (existingAssessment) {
            console.log('📋 Assessment existente encontrado:', existingAssessment);
            setAssessment(existingAssessment);
            
            // Verificar se já existe currículo
            const curriculum = await dbActions.getCurriculumByAssessment(existingAssessment.id);
            if (curriculum) {
              console.log('📚 Currículo existente encontrado:', curriculum);
              setCurriculum(curriculum);
              setSystemState('learning_active');
            } else {
              console.log('🔄 Assessment existe mas não há currículo, gerando...');
              setSystemState('generating_curriculum');
              await generateCurriculumFromExistingAssessment(existingAssessment, userId);
            }
          } else {
            console.log('📝 Nenhum assessment encontrado, iniciando assessment');
            setSystemState('assessment');
          }
        }
      } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        setSystemState('assessment'); // Fallback para assessment
      } finally {
        sessionStorage.removeItem(initializationKey);
      }
    };

    initializeUserAndData();
  }, [language]); // Re-executar quando a linguagem mudar

  // 🔄 Resetar estados quando linguagem muda
  useEffect(() => {
    // Limpar sessões anteriores
    const sessionKey = `session_${language}`;
    const previousSessions = Object.keys(sessionStorage).filter(key => 
      key.startsWith('session_') && key !== sessionKey
    );
    previousSessions.forEach(key => sessionStorage.removeItem(key));
    
    // Resetar ref de controle
    hasStartedLearningRef.current = false;
        
    console.log('🔄 Estado resetado para nova linguagem:', language);
  }, [language]);

  // Solução ROBUSTA: Polling do localStorage para detectar completion do assessment
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    
    if (systemState === 'assessment') {
      console.log('🔍 Iniciando polling para assessment completion...');
      
      pollInterval = setInterval(() => {
        const completedAssessment = localStorage.getItem('assessmentCompleted');
        if (completedAssessment) {
          console.log('🎯 Assessment detectado via localStorage!');
          
          try {
            const assessment = JSON.parse(completedAssessment) as OriginalAssessment;
            console.log('✅ Assessment parsado:', assessment);
            
            // Limpar localStorage
            localStorage.removeItem('assessmentCompleted');
            
            // Processar assessment
            processAssessmentDirectly(assessment).catch(console.error);
            
            // Parar polling
            clearInterval(pollInterval);
          } catch (error) {
            console.error('❌ Erro ao parsear assessment do localStorage:', error);
          }
        }
      }, 500); // Verificar a cada 500ms
    }
    
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [systemState]);

  // Handler para o evento de assessment completo via window - VERSÃO PERSISTENTE
  useEffect(() => {
    const handleGlobalAssessmentComplete = (event: CustomEvent) => {
      console.log('🌍 Evento global de assessment completo recebido:', event.detail);
      console.log('🎯 Estado atual ao receber evento:', currentStateRef.current);
      
      const originalAssessment = event.detail as OriginalAssessment;
      
      if (currentStateRef.current === 'assessment') {
        console.log('✅ Processando assessment via evento global');
        // Chamar processamento diretamente (agora é async)
        processAssessmentDirectly(originalAssessment).catch(console.error);
      } else {
        console.log('⚠️ Ignorando evento - estado não é assessment:', currentStateRef.current);
      }
    };

    // Adicionar o listener apenas uma vez, sem dependências que causem re-criação
    console.log('🔧 Adicionando listener PERSISTENTE de evento global...');
    window.addEventListener('assessmentComplete', handleGlobalAssessmentComplete as EventListener, true);
    window.addEventListener('assessmentCompleteBackup', handleGlobalAssessmentComplete as EventListener, true);
    
    return () => {
      console.log('🔧 Removendo listener PERSISTENTE de evento global...');
      window.removeEventListener('assessmentComplete', handleGlobalAssessmentComplete as EventListener, true);
      window.removeEventListener('assessmentCompleteBackup', handleGlobalAssessmentComplete as EventListener, true);
    };
  }, []); // ARRAY VAZIO - listener persiste durante toda a vida do componente

  // 📚 Função para gerar currículo a partir de assessment existente
  const generateCurriculumFromExistingAssessment = async (assessment: UserAssessment, userId: string) => {
    console.log('🎯 Gerando currículo para assessment existente:', assessment);
    
    try {
      // Para um assessment existente, geramos um currículo simples baseado nos dados
      const curriculum: Omit<PersonalizedCurriculum, 'id'> = {
        userId: userId,
        language: assessment.language,
        level: assessment.level,
        topics: generateTopicsForLevel(assessment.language, assessment.level),
        currentTopicIndex: 0,
        estimatedCompletionTime: assessment.level === 'beginner' ? 120 : 
                                 assessment.level === 'intermediate' ? 90 : 60,
        adaptationRules: [],
        createdAt: new Date(),
        lastUpdated: new Date()
      };      // Salvar no banco de dados
      const savedCurriculum = await dbActions.createCurriculum(assessment.id, curriculum);

      if (savedCurriculum) {
        console.log('✅ Currículo salvo no banco:', savedCurriculum);
        setCurriculum(savedCurriculum);
        setSystemState('learning_active');
        
        // Criar sessão de aprendizado
        await dbActions.createSession(userId, {
          language: assessment.language,
          curriculumId: savedCurriculum.id,
          assessmentId: assessment.id
        });

        // Criar progresso inicial
        await dbActions.createProgress(userId, assessment.id, assessment.language);
      } else {
        console.error('❌ Falha ao criar currículo - sem resposta do servidor');
        setSystemState('assessment'); // Voltar para assessment em caso de erro
      }
    } catch (error) {
      console.error('❌ Erro ao gerar currículo:', error);
      setSystemState('assessment'); // Fallback
    }
  };

  // Função para processar assessment diretamente (sem deps de estado)
  const processAssessmentDirectly = async (originalAssessment: OriginalAssessment) => {
    console.log('⚙️ Processando assessment DIRETAMENTE:', originalAssessment);
    
    // Usar setters funcionais para não depender do estado atual
    setSystemState(prevState => {
      console.log('🔄 Mudando estado de', prevState, 'para generating_curriculum');
      return 'generating_curriculum';
    });
    
    setIsProcessing(true);
    
    try {
      // Obter usuário atual
      const userId = dbState.currentUser?.id;
      if (!userId) {
        console.error('❌ Usuário não encontrado para salvar assessment');
        // Mesmo sem usuário, podemos continuar em modo local
        setAssessment({
          id: `local-${Date.now()}`,
          userId: 'anonymous',
          language: originalAssessment.language,
          level: originalAssessment.level === 'unknown' ? 'beginner' : originalAssessment.level,
          experience: originalAssessment.experience,
          interests: originalAssessment.interests || [],
          previousKnowledge: originalAssessment.previousKnowledge || [],
          generalProgrammingLevel: originalAssessment.level === 'beginner' ? 'none' : 
                                  originalAssessment.level === 'intermediate' ? 'intermediate' : 'advanced',
          languageSpecificLevel: 'none',
          adaptiveLevel: originalAssessment.level === 'beginner' ? 'beginner' : 
                        originalAssessment.level === 'intermediate' ? 'intermediate_concepts' : 'advanced',
          learningStyle: 'mixed',
          goals: ['aprender programação'],
          timeAvailable: 'medium',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // Gerar currículo local
        await generateLocalCurriculum(originalAssessment);
        return;
      }

      // Criar assessment no banco se usuário existir
      const newAssessment = await dbActions.createAssessment(userId, {
        language: originalAssessment.language,
        level: originalAssessment.level === 'unknown' ? 'beginner' : originalAssessment.level,
        experience: originalAssessment.experience,
        interests: originalAssessment.interests,
        previousKnowledge: originalAssessment.previousKnowledge,
        learningStyle: 'mixed',
        goals: ['aprender programação'],
        timeAvailable: 'medium'
      });

      if (!newAssessment) {
        throw new Error('Falha ao criar assessment');
      }

      console.log('✅ Assessment salvo no banco:', newAssessment);
      setAssessment(newAssessment);

      // Gerar currículo a partir do assessment
      await generateCurriculumFromExistingAssessment(newAssessment, userId);
      
      setIsProcessing(false);
      console.log('🚀 Processamento completo via banco de dados');
    } catch (error) {
      console.error('❌ Erro no processamento:', error);
      setSystemState('assessment');
      setIsProcessing(false);
    }
  };

  // Função para processar assessment via evento global
  const processAssessmentGlobal = (originalAssessment: OriginalAssessment) => {
    console.log('⚙️ Processando assessment via evento global...');
    alert('Assessment processado via evento global!');
    
    setSystemState('generating_curriculum');
    setIsProcessing(true);
    
    // Simular processamento
    setTimeout(() => {
      const newAssessment: UserAssessment = {
        id: Date.now().toString(),
        language: originalAssessment.language,
        level: originalAssessment.level === 'unknown' ? 'beginner' : originalAssessment.level,
        experience: originalAssessment.experience,
        interests: originalAssessment.interests,
        previousKnowledge: originalAssessment.previousKnowledge,
        learningStyle: 'mixed',
        goals: ['aprender programação'],
        timeAvailable: 'medium',
        completedAt: new Date()
      };
      
      const newCurriculum: PersonalizedCurriculum = {
        id: Date.now().toString(),
        userId: newAssessment.id,
        language: newAssessment.language,
        level: newAssessment.level,
        topics: generateTopicsForLevel(newAssessment.language, newAssessment.level),
        currentTopicIndex: 0,
        estimatedCompletionTime: newAssessment.level === 'beginner' ? 120 : newAssessment.level === 'intermediate' ? 90 : 60,
        adaptationRules: [],
        createdAt: new Date(),
        lastUpdated: new Date()
      };
      
      setAssessment(newAssessment);
      setCurriculum(newCurriculum);
      setSystemState('learning_active');
      setIsProcessing(false);
      
      console.log('🚀 Estado mudou para learning_active via evento global');
    }, 1500);
  };

  // Teste do listener - verificar se está funcionando (apenas uma vez)
  useEffect(() => {
    // Delay para garantir que os listeners foram adicionados
    setTimeout(() => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🧪 Testando listener de eventos (execução única)...');
      }
      const testEvent = new CustomEvent('testEvent', { detail: 'teste_unico' });
      
      const testHandler = (e: CustomEvent) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Listener funcionando! Evento teste recebido:', e.detail);
        }
      };
      
      window.addEventListener('testEvent', testHandler as EventListener);
      window.dispatchEvent(testEvent);
      
      setTimeout(() => {
        window.removeEventListener('testEvent', testHandler as EventListener);
      }, 100);
    }, 500);
  }, []); // Array vazio - executar apenas uma vez

  // Learning coordinator
  const coordinatorRef = useRef<LearningCoordinator | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  
  // Handler direto para conclusão do assessment - SIMPLIFICADO
  const handleAssessmentCompleteStable = useCallback((originalAssessment: OriginalAssessment) => {
    console.log('🎯 Assessment Complete Handler chamado:', originalAssessment);
    
    // Previne múltiplas chamadas
    if (systemState !== 'assessment') {
      console.log('⚠️ Assessment já processado, ignorando. Estado atual:', systemState);
      return;
    }
    
    // Forçar mudança de estado imediatamente
    console.log('🔄 Mudando estado para generating_curriculum...');
    setSystemState('generating_curriculum');
    setIsProcessing(true);
    
    // Processar de forma assíncrona
    setTimeout(async () => {
      try {
        console.log('⚙️ Processando assessment...');
        
        // Criar assessment convertido
        const newAssessment: UserAssessment = {
          id: Date.now().toString(),
          language: originalAssessment.language,
          level: originalAssessment.level === 'unknown' ? 'beginner' : originalAssessment.level,
          experience: originalAssessment.experience,
          interests: originalAssessment.interests,
          previousKnowledge: originalAssessment.previousKnowledge,
          learningStyle: 'mixed',
          goals: ['aprender programação'],
          timeAvailable: 'medium',
          completedAt: new Date()
        };
        
        // Criar currículo baseado no assessment
        const newCurriculum: PersonalizedCurriculum = {
          id: Date.now().toString(),
          userId: newAssessment.id,
          language: newAssessment.language,
          level: newAssessment.level,
          topics: generateTopicsForLevel(newAssessment.language, newAssessment.level),
          currentTopicIndex: 0,
          estimatedCompletionTime: newAssessment.level === 'beginner' ? 120 : newAssessment.level === 'intermediate' ? 90 : 60,
          adaptationRules: [],
          createdAt: new Date(),
          lastUpdated: new Date()
        };
        
        console.log('✅ Assessment e currículo criados:', { assessment: newAssessment, curriculum: newCurriculum });
        
        // Atualizar estados
        setAssessment(newAssessment);
        setCurriculum(newCurriculum);
        setSystemState('learning_active');
        setIsProcessing(false);
        
        console.log('� Estado mudou para learning_active');
      } catch (error) {
        console.error('❌ Erro ao processar assessment:', error);
        setIsProcessing(false);
        setSystemState('assessment'); // Volta para assessment em caso de erro
      }
    }, 1500); // Delay para mostrar o loading
  }, [systemState]); // Dependência do systemState para prevenir múltiplas execuções

  // Função para gerar currículo local (sem banco de dados)
  const generateLocalCurriculum = async (originalAssessment: OriginalAssessment) => {
    console.log('📚 Gerando currículo local para:', originalAssessment.language);
    
    try {
      // Criar currículo baseado no assessment
      const localCurriculum: PersonalizedCurriculum = {
        id: `local-curriculum-${Date.now()}`,
        userId: 'anonymous',
        language: originalAssessment.language,
        level: originalAssessment.level,
        topics: generateTopicsForLevel(originalAssessment.language, originalAssessment.level),
        currentTopicIndex: 0,
        estimatedCompletionTime: originalAssessment.level === 'beginner' ? 240 : 
                                 originalAssessment.level === 'intermediate' ? 180 : 120,
        adaptationRules: [],
        createdAt: new Date(),
        lastUpdated: new Date()
      };
      
      setCurriculum(localCurriculum);
      setSystemState('learning_active');
      
      console.log('✅ Currículo local criado:', localCurriculum);
    } catch (error) {
      console.error('❌ Erro ao gerar currículo local:', error);
      setSystemState('assessment');
    } finally {
      setIsProcessing(false);
    }
  };

  // Função auxiliar para gerar tópicos baseado no nível
  const generateTopicsForLevel = (language: string, level: string): LearningTopic[] => {
    const baseTopics: LearningTopic[] = [
      {
        id: '1',
        title: 'Primeiros Passos',
        description: `Introdução básica ao ${language}`,
        type: 'concept',
        learningObjectives: ['Entender sintaxe básica', 'Executar primeiro programa'],
        estimatedTime: 30,
        difficulty: 1, // Nível 1 (mais fácil)
        prerequisites: [],
        tags: ['iniciante', 'sintaxe'],
        priority: 10
      },
      {
        id: '2',
        title: 'Variáveis e Tipos',
        description: 'Trabalhando com dados',
        type: 'concept',
        learningObjectives: ['Criar variáveis', 'Entender tipos de dados'],
        estimatedTime: 45,
        difficulty: 1, // Nível 1 (mais fácil)
        prerequisites: ['1'],
        tags: ['variáveis', 'tipos'],
        priority: 9
      }
    ];

    if (level === 'intermediate' || level === 'advanced') {
      baseTopics.push({
        id: '3',
        title: 'Funções e Estruturas',
        description: 'Organizando seu código',
        type: 'concept',
        learningObjectives: ['Criar funções', 'Organizar código'],
        estimatedTime: 60,
        difficulty: 2, // Nível 2 (intermediário)
        prerequisites: ['1', '2'],
        tags: ['funções', 'estruturas'],
        priority: 8
      });
    }

    return baseTopics;
  };

  // Handler para conclusão do assessment existente - VERSÃO SIMPLIFICADA E CORRIGIDA
  const handleAssessmentComplete = useCallback((originalAssessment: OriginalAssessment) => {
    console.log('🎯 Assessment Complete Handler chamado (fallback):', originalAssessment);
    // Este é um fallback caso o handler principal falhe
    handleAssessmentCompleteStable(originalAssessment);
  }, [handleAssessmentCompleteStable]);

  // Atualizar o ref sempre que o handler muda - REMOVIDO, não mais necessário

  // Callbacks memoizados para o observer
  const onChatMessageCallback = useCallback((message: ChatMessage) => {
    // Garantir ID único
    const messageWithUniqueId = {
      ...message,
      id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    setChatMessages(prev => [...prev, messageWithUniqueId]);
    onMessage({
      id: messageWithUniqueId.id,
      type: message.messageType,
      suggestion: message.content,
      explanation: `Aprendizado: ${curriculum?.topics[curriculum.currentTopicIndex]?.title || 'Tópico Atual'}`,
      timestamp: message.timestamp
    });
  }, [onMessage, curriculum]);

  const onCodeGeneratedCallback = useCallback((code: string, explanation: string) => {
    console.log('📝 Código recebido do coordinator:', { code: code.substring(0, 100) + '...', explanation });
    
    // Atualiza o código no editor
    onCodeChange(code);
    
    // Adiciona explicação como mensagem com delay
    setTimeout(() => {
      const explanationMessage: ChatMessage = {
        id: `explanation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'ai',
        content: explanation,
        timestamp: new Date(),
        messageType: 'explanation'
      };
      setChatMessages(prev => [...prev, explanationMessage]);
      
      console.log('💬 Explicação adicionada ao chat:', explanation);
    }, 500);
  }, [onCodeChange]);

  const onProgressUpdateCallback = useCallback((progress: SessionProgress) => {
    setSessionProgress(progress);
  }, []);

  // Observer para o coordinator - MEMOIZADO para evitar re-criação
  const coordinatorObserver = useMemo((): LearningCoordinatorObserver => ({
    onChatMessage: onChatMessageCallback,
    onCodeGenerated: onCodeGeneratedCallback,
    onExerciseCreated: (exercise) => {
      // Implementar quando necessário
    },
    onProgressUpdate: onProgressUpdateCallback
  }), [onChatMessageCallback, onCodeGeneratedCallback, onProgressUpdateCallback]); // Callbacks estáveis

  // Inicializar coordinator - FIXO para evitar re-inicializações
  useEffect(() => {
    if (!coordinatorRef.current) {
      console.log('🔧 Inicializando LearningCoordinator...');
      coordinatorRef.current = new LearningCoordinator();
    }
    
    coordinatorRef.current.addObserver(coordinatorObserver);
    
    return () => {
      if (coordinatorRef.current) {
        coordinatorRef.current.removeObserver(coordinatorObserver);
      }
    };
  }, [coordinatorObserver]); // Apenas quando observer muda

  // CRÍTICO: Iniciar sessão de aprendizado automaticamente quando sistema fica ativo
  const hasStartedLearningRef = useRef(false);
  
  useEffect(() => {
    const startLearningSession = async () => {
      if (systemState === 'learning_active' && 
          assessment && 
          curriculum && 
          coordinatorRef.current && 
          !hasStartedLearningRef.current) {
        
        // Verificar se já existe uma sessão ativa para evitar duplicatas
        const sessionKey = `session_${language}_${assessment.id}`;
        if (sessionStorage.getItem(sessionKey)) {
          console.log('🚫 Sessão já iniciada para esta linguagem/assessment');
          return;
        }
        
        const currentTopic = curriculum.topics[curriculum.currentTopicIndex];
        
        if (currentTopic) {
          hasStartedLearningRef.current = true; // Marca como iniciado
          sessionStorage.setItem(sessionKey, 'true'); // Marca sessão como ativa
          
          console.log('🚀 INICIANDO SESSÃO DE APRENDIZADO (ÚNICA VEZ)');
          console.log('📚 Tópico:', currentTopic.title);
          console.log('👤 Assessment:', assessment.level, assessment.language);
          
          try {
            // Inicia a sessão de aprendizado no coordinator
            await coordinatorRef.current.startLearningSession(
              assessment,
              currentTopic,
              sessionProgress
            );
            
            console.log('✅ Sessão de aprendizado iniciada com sucesso!');
          } catch (error) {
            console.error('❌ Erro ao iniciar sessão:', error);
            hasStartedLearningRef.current = false; // Reset em caso de erro
            sessionStorage.removeItem(sessionKey); // Remove marca de sessão ativa
            
            // Mostrar erro específico ao usuário
            let errorMessage = 'Ops! Ocorreu um erro inesperado.';
            
            if (error instanceof Error) {
              if (error.message.includes('quota')) {
                setQuotaExceeded(true);
                setApiError('Quota da API Gemini excedida');
                errorMessage = `❌ **Limite da API atingido!**\n\nA quota gratuita da API Gemini (50 requests/dia) foi excedida. O sistema não pode gerar novos exemplos de código no momento.\n\n**Opções:**\n• Aguardar até amanhã para a quota resetar\n• Usar uma API key com plano pago\n• Estudar com exemplos estáticos\n\nDesculpe pelo inconveniente! 😅`;
              } else {
                setApiError(error.message);
                errorMessage = `❌ **Erro de Conexão**\n\n${error.message}\n\nVerifique sua conexão com a internet e tente novamente.`;
              }
            }
            
            const errorChatMessage: ChatMessage = {
              id: `error_${Date.now()}`,
              type: 'ai',
              content: errorMessage,
              timestamp: new Date(),
              topicId: currentTopic.id,
              messageType: 'feedback'
            };
            
            setChatMessages(prev => [...prev, errorChatMessage]);
            
            // NÃO gerar fallback - mostrar apenas o erro
          }
        }
      }
    };

    startLearningSession();
  }, [systemState, assessment, curriculum]); // Removido sessionProgress para evitar loops

  // Reset do flag quando muda de tópico
  useEffect(() => {
    if (curriculum) {
      hasStartedLearningRef.current = false;
    }
  }, [curriculum?.currentTopicIndex]);

  // Tracking de tempo - OTIMIZADO para evitar re-criação do intervalo
  useEffect(() => {
    if (systemState === 'learning_active' && !startTimeRef.current) {
      startTimeRef.current = new Date();
      console.log('⏰ Iniciando tracking de tempo de aprendizado...');
    }

    if (systemState === 'learning_active') {
      const interval = setInterval(() => {
        if (startTimeRef.current) {
          const timeSpent = Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000);
          setSessionProgress(prev => ({ ...prev, timeSpent }));
        }
      }, 1000);

      return () => {
        console.log('⏰ Limpando interval de tracking de tempo');
        clearInterval(interval);
      };
    }
  }, [systemState]); // Apenas quando systemState muda

  // Processa mudanças no código - OTIMIZADO para evitar chamadas excessivas
  const prevCodeRef = useRef(currentCode);
  useEffect(() => {
    if (systemState === 'learning_active' && coordinatorRef.current && currentCode !== prevCodeRef.current) {
      console.log('📝 Processando mudança no código...');
      coordinatorRef.current.onCodeChange(currentCode, language);
      prevCodeRef.current = currentCode;
    }
  }, [currentCode, systemState, language]);

  // Processa mensagem do chat durante aprendizado
  const handleChatMessage = useCallback(async (message: string) => {
    console.log('💬 handleChatMessage chamado:', { message, systemState, hasCoordinator: !!coordinatorRef.current });
    
    if (systemState !== 'learning_active' || !coordinatorRef.current) {
      console.log('❌ Não pode processar mensagem:', { systemState, hasCoordinator: !!coordinatorRef.current });
      return;
    }

    console.log('✅ Enviando mensagem para coordinator...');
    await coordinatorRef.current.onUserMessage(message);
  }, [systemState]);

  // Estados para chat integrado
  const [chatInput, setChatInput] = useState('');
  const [isWaitingResponse, setIsWaitingResponse] = useState(false);

  // Handler para envio de mensagem do chat - MEMOIZADO
  const handleChatSubmit = useCallback(async () => {
    if (!chatInput.trim() || isWaitingResponse || systemState !== 'learning_active') return;

    setIsWaitingResponse(true);
    
    // Envia mensagem do usuário
    const userMessage = {
      id: Date.now().toString(),
      type: 'user_question' as const,
      suggestion: chatInput,
      explanation: 'Pergunta do usuário',
      timestamp: new Date()
    };
    
    onMessage(userMessage);

    // Usa o coordinator para processar a mensagem
    await handleChatMessage(chatInput);

    setChatInput('');
    setIsWaitingResponse(false);
  }, [chatInput, isWaitingResponse, systemState, onMessage, handleChatMessage]);

  // Avança para próximo tópico
  const advanceToNextTopic = useCallback(() => {
    if (!curriculum) return;

    const nextIndex = curriculum.currentTopicIndex + 1;
    
    if (nextIndex < curriculum.topics.length) {
      const updatedCurriculum = {
        ...curriculum,
        currentTopicIndex: nextIndex
      };
      setCurriculum(updatedCurriculum);
      
      // Inicia novo tópico
      if (coordinatorRef.current && assessment) {
        coordinatorRef.current.startLearningSession(
          assessment,
          updatedCurriculum.topics[nextIndex],
          sessionProgress
        );
      }
    } else {
      setSystemState('topic_completed');
    }
  }, [curriculum, assessment, sessionProgress]);

  // Formatação de tempo
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Log do estado atual para debug (apenas quando muda) - SIMPLIFICADO
  const prevStateRef = useRef(systemState);
  if (prevStateRef.current !== systemState) {
    console.log('🎮 PersonalizedLearningSystem - Estado:', prevStateRef.current, '->', systemState);
    prevStateRef.current = systemState;
  }

  // Render do Assessment usando o componente existente
  if (systemState === 'assessment') {
    return (
      <div className="space-y-4">
        <div className="bg-primary border border-secondary rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-4">
            <Brain className="w-6 h-6 text-blue-400" />
            <div>
              <h3 className="text-lg font-semibold text-secondary">
                Sistema de Aprendizado Personalizado
              </h3>
              <p className="text-sm text-subtle">
                Vamos conhecer você para criar a melhor experiência de aprendizado
              </p>
            </div>
          </div>
        </div>

        {/* Usa o componente InitialAssessment existente */}
        <InitialAssessment
          language={language}
          onCodeChange={onCodeChange}
          onMessage={onMessage}
          onAssessmentComplete={handleAssessmentCompleteStable}
          currentCode={currentCode}
        />

        {/* Debug info - Simplificado */}
        <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-2 text-xs">
          <strong>Status:</strong> Handler: {typeof handleAssessmentCompleteStable}, 
          Estado: {systemState}, Processing: {isProcessing.toString()}
        </div>

        <div className="bg-primary border border-secondary rounded-lg p-3">
          <div className="flex items-center space-x-2 text-sm text-subtle">
            <Zap className="w-4 h-4 text-blue-400" />
            <span>
              Após o assessment, criarei um currículo personalizado e iniciarei 
              a coordenação inteligente entre chat e editor!
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Render do estado de geração
  if (systemState === 'generating_curriculum') {
    return (
      <div className="space-y-6">
        <div className="bg-primary border border-secondary rounded-lg p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <div>
              <h3 className="text-lg font-semibold text-secondary mb-2">
                Criando seu currículo personalizado
              </h3>
              <p className="text-sm text-subtle">
                Analisando suas respostas e gerando tópicos específicos para você...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render do aprendizado ativo
  if (systemState === 'learning_active' && curriculum && assessment) {
    const currentTopic = curriculum.topics[curriculum.currentTopicIndex];
    const progress = ((curriculum.currentTopicIndex) / curriculum.topics.length) * 100;

    return (
      <div className="space-y-4">
        {/* Status do Aprendizado */}
        <div className="bg-primary border border-secondary rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-medium text-secondary">
                Tópico {curriculum.currentTopicIndex + 1} de {curriculum.topics.length}
              </span>
            </div>
            <div className="flex items-center space-x-4 text-xs text-subtle">
              <APIStatus 
                quotaExceeded={quotaExceeded}
                hasError={!!apiError}
                errorMessage={apiError || ''}
              />
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{formatTime(sessionProgress.timeSpent)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Zap className="w-3 h-3" />
                <span>{sessionProgress.currentScore}pts</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-md font-semibold text-secondary mb-1">
              {currentTopic.title}
            </h4>
            <p className="text-sm text-subtle mb-3">
              {currentTopic.description}
            </p>
          </div>

          {/* Barra de progresso */}
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Objetivos do Tópico */}
        <div className="bg-primary border border-secondary rounded-lg p-3">
          <h4 className="text-sm font-medium text-secondary mb-2 flex items-center">
            <Target className="w-4 h-4 mr-2" />
            Objetivos de Aprendizado
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {currentTopic.learningObjectives.map((objective, index) => (
              <div key={index} className="flex items-center space-x-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span className="text-xs text-secondary">{objective}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Últimas mensagens do chat */}
        {chatMessages.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-secondary flex items-center">
              <MessageCircle className="w-4 h-4 mr-2" />
              Conversa com IA
            </h4>
            {chatMessages.slice(-3).map((message, index) => (
              <div
                key={message.id}
                className={`flex items-start space-x-2 bg-primary border border-secondary rounded-lg p-3 ${
                  message.type === 'user' ? 'ml-4' : 'mr-4'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  message.type === 'user' ? 'bg-green-600' : 'bg-blue-600'
                }`}>
                  {message.type === 'user' ? 
                    <Users className="w-3 h-3 text-white" /> :
                    <Brain className="w-3 h-3 text-white" />
                  }
                </div>
                <div className="flex-1">
                  <p className="text-sm text-secondary">{message.content}</p>
                  <p className="text-xs text-subtle mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Interface de Chat Integrada */}
        <div className="bg-primary border border-secondary rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <MessageCircle className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-secondary">
              Chat com IA Tutora
            </span>
          </div>
          
          <div className="flex space-x-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
              placeholder="Faça uma pergunta, peça ajuda ou converse sobre o código..."
              className="flex-1 px-3 py-2 text-sm bg-secondary border border-accent rounded text-secondary placeholder-subtle"
              disabled={isWaitingResponse}
            />
            
            <button
              onClick={handleChatSubmit}
              disabled={!chatInput.trim() || isWaitingResponse}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isWaitingResponse ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
          
          <p className="text-xs text-subtle mt-2">
            💡 A IA observa seu código e responde suas perguntas em tempo real
          </p>
        </div>

        {/* Controles */}
        <div className="flex space-x-2">
          <button
            onClick={advanceToNextTopic}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            Próximo Tópico
          </button>
          
          <button
            onClick={() => {
              // Implementar reset se necessário
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            Reiniciar Tópico
          </button>
        </div>
      </div>
    );
  }

  // Estado de conclusão ou fallback para learning_active se não há currículo
  if (systemState === 'topic_completed' || (systemState === 'learning_active' && !curriculum)) {
    if (!curriculum) {
      // Fallback: Se chegou em learning_active mas não tem currículo, criar um simples
      return (
        <div className="bg-primary border border-secondary rounded-lg p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <AlertCircle className="w-12 h-12 text-yellow-500" />
            <div>
              <h3 className="text-lg font-semibold text-secondary mb-2">
                Iniciando aprendizado...
              </h3>
              <p className="text-sm text-subtle">
                Sistema ativo mas ainda processando currículo. 
                {assessment ? `Assessment: ${assessment.level}` : 'Aguardando assessment...'}
              </p>
              <button
                onClick={() => setSystemState('assessment')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reiniciar Assessment
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="bg-primary border border-secondary rounded-lg p-6 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-secondary mb-2">
          Parabéns! 🎉
        </h3>
        <p className="text-subtle">
          Você completou todos os tópicos do seu currículo personalizado!
        </p>
      </div>
    );
  }

  // Se chegou aqui, há um estado não tratado
  return (
    <div className="bg-primary border border-secondary rounded-lg p-6 text-center">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-secondary mb-2">
        Estado não reconhecido
      </h3>
      <p className="text-sm text-subtle mb-4">
        Estado atual: {systemState}
      </p>
      <button
        onClick={() => setSystemState('assessment')}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Reiniciar Sistema
      </button>
    </div>
  );
}
