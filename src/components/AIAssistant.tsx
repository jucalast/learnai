'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Bot, MessageCircle, Lightbulb, Target, AlertCircle, Send, BookOpen, Play } from 'lucide-react';
import FluidAITeacher from './FluidAITeacher';
import InitialAssessment, { OriginalAssessment } from './InitialAssessment';
import { UserAssessment } from '@/types/learningSystem';
import { AdaptiveLearningManager, AdaptiveLearningState, Topic } from '../lib/adaptiveLearning';
import useDatabase from '@/hooks/useDatabase';

interface Message {
  id: string;
  type: 'hint' | 'explanation' | 'encouragement' | 'correction' | 'suggestion';
  suggestion: string;
  explanation: string;
  timestamp: Date;
}

interface AIAssistantProps {
  language: string;
  code: string;
  onCodeChange: (code: string) => void;
  isActive: boolean;
  isMobile?: boolean;
}

type AssistantMode = 'assessment' | 'conversation' | 'structured-learning';

export default function AIAssistant({ language, code, onCodeChange, isActive }: AIAssistantProps) {
  // 🗄️ Database integration
  const [dbState, dbActions] = useDatabase();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mode, setMode] = useState<AssistantMode>('assessment');
  const [userInput, setUserInput] = useState('');
  const [learningManager, setLearningManager] = useState<AdaptiveLearningManager | null>(null);
  const [learningState, setLearningState] = useState<AdaptiveLearningState | null>(null);
  const [showTopics, setShowTopics] = useState(false);
  const [userAssessment, setUserAssessment] = useState<UserAssessment | null>(null);

  // Inicializar learning manager
  useEffect(() => {
    const manager = new AdaptiveLearningManager((state) => {
      setLearningState(state);
    });
    setLearningManager(manager);
  }, []);

  // Resetar quando linguagem muda - OTIMIZADO para evitar re-renders desnecessários
  const previousLanguageRef = useRef<string>('');
  
  useEffect(() => {
    if (language && language !== previousLanguageRef.current) {
      console.log('🔄 AIAssistant - Language mudou de', previousLanguageRef.current, 'para', language);
      
      // Só resetar se realmente mudou de uma linguagem para outra
      if (previousLanguageRef.current !== '') {
        console.log('🔄 AIAssistant - Resetando por mudança real de linguagem');
        setMode('assessment');
        setMessages([]);
        setShowTopics(false);
        setUserAssessment(null);
        // Limpar código quando trocar de linguagem
        onCodeChange('');
      } else {
        console.log('🔄 AIAssistant - Primeira inicialização, não resetando');
      }
      
      previousLanguageRef.current = language;
    }
  }, [language, onCodeChange]);

  const handleAssessmentComplete = useCallback((originalAssessment: OriginalAssessment) => {
    // Converter OriginalAssessment para UserAssessment
    const assessment: UserAssessment = {
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
    
    setUserAssessment(assessment);
    
    if (learningManager) {
      learningManager.setAssessment(assessment);
      setMode('structured-learning'); // Mudar para modo interativo
      
      // Mensagem de transição para modo interativo
      const transitionMessage: Message = {
        id: Date.now().toString(),
        type: 'encouragement',
        suggestion: 'Perfeito! Agora vamos começar o aprendizado interativo personalizado!',
        explanation: 'Vou te ensinar de forma prática, perguntando, explicando e dando exercícios em tempo real.',
        timestamp: new Date()
      };
      
      setMessages([transitionMessage]);
    }
  }, [learningManager]);

  // 💾 Função para persistir mensagens no banco de dados
  const persistChatMessage = useCallback(async (message: Message, isUser: boolean = false) => {
    if (dbState.currentSession?.id) {
      try {
        // Usar o SessionService para adicionar mensagem de chat
        await fetch('/api/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: dbState.currentSession.id,
            message: message.suggestion,
            isUser,
            messageType: message.type,
            metadata: {
              explanation: message.explanation,
              language,
              timestamp: message.timestamp
            }
          })
        });
      } catch (error) {
        console.error('❌ Erro ao persistir mensagem:', error);
      }
    }
  }, [dbState.currentSession, language]);

  const handleMessage = useCallback(async (message: Message) => {
    setMessages(prev => [message, ...prev]);
    // Persistir mensagem da IA
    await persistChatMessage(message, false);
  }, [persistChatMessage]);

  const handleUserMessage = async () => {
    if (!userInput.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'suggestion',
      suggestion: userInput,
      explanation: 'Mensagem do usuário',
      timestamp: new Date()
    };

    setMessages(prev => [userMessage, ...prev]);
    // Persistir mensagem do usuário
    await persistChatMessage(userMessage, true);
    
    setIsAnalyzing(true);

    // Simular resposta da IA baseada no contexto
    setTimeout(async () => {
      const aiResponse = generateAIResponse(userInput, code, learningState);
      setMessages(prev => [aiResponse, ...prev]);
      // Persistir resposta da IA
      await persistChatMessage(aiResponse, false);
      setIsAnalyzing(false);
    }, 1500);

    setUserInput('');
  };

  const generateAIResponse = (userInput: string, currentCode: string, state: AdaptiveLearningState | null): Message => {
    const input = userInput.toLowerCase();
    
    // Respostas contextuais baseadas no assessment
    if (input.includes('ajuda') || input.includes('não entendo')) {
      const level = state?.assessment?.level || 'beginner';
      let response = '';
      
      if (level === 'beginner') {
        response = 'Sem problemas! Vou explicar de forma bem simples. ';
      } else if (level === 'intermediate') {
        response = 'Entendo! Vamos quebrar isso em partes menores. ';
      } else {
        response = 'Vamos analisar isso tecnicamente. ';
      }

      if (currentCode.trim()) {
        response += 'Vejo que você tem código no editor. Que parte específica está causando dúvida?';
      } else {
        response += 'Quer que eu demonstre um exemplo no editor?';
      }

      return {
        id: Date.now().toString(),
        type: 'explanation',
        suggestion: response,
        explanation: 'Estou aqui para ajudar! Me diga o que não está claro.',
        timestamp: new Date()
      };
    }

    if (input.includes('exemplo') || input.includes('demonstra')) {
      return {
        id: Date.now().toString(),
        type: 'hint',
        suggestion: 'Vou criar um exemplo prático no editor!',
        explanation: 'Observe como vou digitar o código passo a passo.',
        timestamp: new Date()
      };
    }

    if (input.includes('exercício') || input.includes('praticar')) {
      return {
        id: Date.now().toString(),
        type: 'encouragement',
        suggestion: 'Ótima ideia! Praticar é fundamental para aprender.',
        explanation: 'Vou criar um exercício adequado ao seu nível. Que tal começarmos?',
        timestamp: new Date()
      };
    }

    // Resposta padrão adaptativa
    const level = state?.assessment?.level || 'beginner';
    let responseStyle = '';
    
    if (level === 'beginner') {
      responseStyle = 'Interessante pergunta! Vou explicar de forma bem clara e com exemplos práticos.';
    } else if (level === 'intermediate') {
      responseStyle = 'Boa pergunta! Vamos explorar isso com mais profundidade e ver alguns casos de uso.';
    } else {
      responseStyle = 'Excelente questão! Podemos abordar isso considerando as melhores práticas e padrões avançados.';
    }

    return {
      id: Date.now().toString(),
      type: 'suggestion',
      suggestion: responseStyle,
      explanation: 'Continue fazendo perguntas - é assim que se aprende!',
      timestamp: new Date()
    };
  };

  const startStructuredLearning = (topic?: Topic) => {
    setMode('structured-learning');
    
    if (topic) {
      const message: Message = {
        id: Date.now().toString(),
        type: 'encouragement',
        suggestion: `Iniciando: ${topic.title}`,
        explanation: topic.description,
        timestamp: new Date()
      };
      setMessages(prev => [message, ...prev]);
    }
  };

  const getTopicRecommendations = () => {
    if (!learningState?.currentPath) return [];
    
    return learningState.currentPath.topics.filter(topic => 
      !learningState.progress.topicsCompleted.includes(topic.id) &&
      topic.prerequisites.every(prereq => 
        learningState.progress.topicsCompleted.includes(prereq)
      )
    ).slice(0, 3); // Mostrar apenas os 3 primeiros
  };

  if (!isActive) return null;

  if (mode === 'assessment') {
    return (
      <div className="h-full text-primary overflow-hidden">
        <div className="h-full flex flex-col">        <div className="flex-shrink-0 p-4 border-b border-primary">
          <h3 className="text-lg font-semibold text-secondary flex items-center">
            <Bot className="w-5 h-5 mr-2 text-muted" />
            Assistente de IA - Avaliação Inicial
          </h3>
          <p className="text-sm text-muted mt-1">
            Vamos conhecer seu nível para personalizar o aprendizado
          </p>
        </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <InitialAssessment
              language={language}
              onCodeChange={onCodeChange}
              onMessage={handleMessage}
              onAssessmentComplete={handleAssessmentComplete}
              currentCode={code}
            />
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'structured-learning') {
    return (
      <div className="h-full text-primary overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="flex-shrink-0 p-4 border-b border-primary">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-secondary flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-muted" />
                Lição Estruturada
              </h3>
              <button
                onClick={() => setMode('conversation')}
                className="text-sm text-muted hover:text-secondary transition-colors"
              >
                Voltar para conversação
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <FluidAITeacher
              language={language}
              currentCode={code}
              onCodeChange={onCodeChange}
              onMessage={handleMessage}
              userLevel={userAssessment?.level || 'beginner'}
            />
          </div>
        </div>
      </div>
    );
  }

  // Modo conversação
  return (
    <div className="h-full text-primary overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-primary">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-secondary flex items-center">
              <Bot className="w-5 h-5 mr-2 text-muted" />
              Assistente de IA
              {learningState?.assessment && (
                <span className="ml-2 text-xs bg-tertiary text-tertiary px-2 py-1 rounded">
                  {learningState.assessment.level}
                </span>
              )}
            </h3>
            <button
              onClick={() => setShowTopics(!showTopics)}
              className="text-sm text-muted hover:text-secondary flex items-center transition-colors"
            >
              <Target className="w-4 h-4 mr-1" />
              Lições
            </button>
          </div>
          
          {learningState?.currentPath && (
            <p className="text-sm text-muted mt-1">
              {learningState.currentPath.title} - {learningState.progress.topicsCompleted.length}/{learningState.currentPath.topics.length} concluídos
            </p>
          )}
        </div>

        {/* Topics Panel */}
        {showTopics && learningState?.currentPath && (
          <div className="flex-shrink-0 bg-primary border-b border-primary p-4">
            <h4 className="text-sm font-medium text-tertiary mb-3">Lições Disponíveis</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {getTopicRecommendations().map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => startStructuredLearning(topic)}
                  className="w-full text-left p-2 bg-secondary hover-bg-tertiary border border-secondary hover:border-tertiary rounded text-sm transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-secondary">{topic.title}</span>
                    <div className="flex items-center text-xs text-muted">
                      <span className="mr-2">Dificuldade: {topic.difficulty}/5</span>
                      <Play className="w-3 h-3" />
                    </div>
                  </div>
                  <p className="text-xs text-muted mt-1">{topic.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted py-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg mb-2">Pronto para te ajudar! 🤖</p>
              <p className="text-sm">
                Faça perguntas, peça ajuda com seu código ou escolha uma lição estruturada.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => setUserInput('Me dê um exemplo prático')}
                  className="text-xs bg-secondary hover-bg-tertiary border border-secondary hover:border-tertiary px-3 py-1 rounded transition-colors"
                >
                  💡 Exemplo prático
                </button>
                <button
                  onClick={() => setUserInput('Quero fazer um exercício')}
                  className="text-xs bg-secondary hover-bg-tertiary border border-secondary hover:border-tertiary px-3 py-1 rounded transition-colors"
                >
                  🎯 Exercício
                </button>
                <button
                  onClick={() => setUserInput('Explique meu código')}
                  className="text-xs bg-secondary hover-bg-tertiary border border-secondary hover:border-tertiary px-3 py-1 rounded transition-colors"
                >
                  🔍 Analisar código
                </button>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              <div className={`p-3 rounded-lg ${getMessageStyle(message.type)}`}>
                <div className="flex items-start space-x-2">
                  {getMessageIcon(message.type)}
                  <div className="flex-1">
                    <p className="text-sm text-secondary leading-relaxed">
                      {message.suggestion}
                    </p>
                    {message.explanation && (
                      <p className="text-xs text-muted mt-1">
                        {message.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isAnalyzing && (
            <div className="flex items-center space-x-2 text-muted">
              <div className="w-4 h-4 border-2 border-elevated border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Analisando...</span>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex-shrink-0 p-4 border-t border-primary">
          <div className="flex space-x-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Faça uma pergunta ou peça ajuda..."
              className="flex-1 px-3 py-2 bg-primary border border-primary rounded text-sm text-secondary placeholder-gray-500 focus:border-secondary focus:outline-none"
              onKeyPress={(e) => e.key === 'Enter' && handleUserMessage()}
            />
            <button
              onClick={handleUserMessage}
              disabled={!userInput.trim() || isAnalyzing}
              className="px-4 py-2 bg-secondary hover-bg-tertiary disabled:bg-primary disabled:cursor-not-allowed border border-secondary hover:border-tertiary rounded text-sm text-secondary transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const getMessageStyle = (type: Message['type']) => {
  switch (type) {
    case 'hint':
      return 'bg-primary border border-primary';
    case 'explanation':
      return 'bg-primary border border-primary';
    case 'encouragement':
      return 'bg-primary border border-primary';
    case 'correction':
      return 'bg-primary border border-primary';
    case 'suggestion':
      return 'bg-secondary border border-secondary ml-6';
    default:
      return 'bg-primary border border-primary';
  }
};

const getMessageIcon = (type: Message['type']) => {
  switch (type) {
    case 'hint':
      return <Lightbulb className="w-4 h-4 text-muted mt-0.5" />;
    case 'explanation':
      return <MessageCircle className="w-4 h-4 text-muted mt-0.5" />;
    case 'encouragement':
      return <Target className="w-4 h-4 text-muted mt-0.5" />;
    case 'correction':
      return <AlertCircle className="w-4 h-4 text-muted mt-0.5" />;
    case 'suggestion':
      return null;
    default:
      return <Bot className="w-4 h-4 text-muted mt-0.5" />;
  }
};
