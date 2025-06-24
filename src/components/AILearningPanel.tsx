/**
 * 🤖 PAINEL DE IA APRIMORADO - VS CODE STYLE
 * Interface responsiva e organizada para interação com IA
 * Mantém o fluxo: Assessment → Aprendizado Personalizado → Continuidade
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Bot, 
  MessageSquare, 
  BookOpen, 
  Target,
  Zap,
  ChevronDown,
  ChevronRight,
  Settings,
  Minimize2,
  Maximize2,
  Brain,
  Clock,
  CheckCircle,
  User,
  Send,
  MoreHorizontal,
  ArrowRight,
  X,
  Lightbulb
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import InitialAssessment from './InitialAssessment';
import useDatabase from '@/hooks/useDatabase';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    codeExample?: string;
    relatedTopics?: string[];
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
  };
}

interface AILearningPanelProps {
  language: string;
  currentCode: string;
  onCodeChange: (code: string) => void;
  onMessage?: (message: any) => void;
  isActive: boolean;
  isMobile?: boolean;
}

export function AILearningPanel({ 
  language, 
  currentCode, 
  onCodeChange, 
  onMessage,
  isActive,
  isMobile = false
}: AILearningPanelProps) {
  const { user, isAuthenticated } = useAuth();
  const [dbState, dbActions] = useDatabase();
  
  // Estados principais
  const [currentView, setCurrentView] = useState<'assessment' | 'learning' | 'chat'>('assessment');
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [learningProgress, setLearningProgress] = useState({
    currentTopic: '',
    completedTopics: [] as string[],
    totalTopics: 0,
    progressPercentage: 0
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Verificar se o usuário já completou assessment para esta linguagem
  useEffect(() => {
    console.log(`🔄 AILearningPanel useEffect - user:`, user?.id, 'language:', language);
    
    if (user?.id && language) {
      console.log(`👤 Usuário autenticado - verificando assessment`);
      checkAssessmentStatus();
    } else if (language) {
      // Para usuários não autenticados, sempre mostrar assessment
      console.log(`👻 Usuário não autenticado - forçando assessment`);
      setHasCompletedAssessment(false);
      setCurrentView('assessment');
    } else {
      console.log(`⚠️ Sem linguagem definida`);
    }
  }, [user?.id, language]);

  // Reset do estado quando linguagem muda
  useEffect(() => {
    setMessages([]);
    setInputValue('');
    setIsTyping(false);
  }, [language]);

  const checkAssessmentStatus = async () => {
    console.log(`🔍 Verificando assessment para ${language} - usuário:`, user?.id);
    
    try {
      const response = await fetch(`/api/assessment?userId=${user?.id}&language=${language}`);
      console.log(`📡 Response status:`, response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`📊 Dados do assessment recebidos:`, data);
        
        // Verificar se retornou um assessment específico para esta linguagem
        const hasAssessment = data && (Array.isArray(data) ? data.length > 0 : data.language === language);
        
        console.log(`📊 Assessment status para ${language}:`, hasAssessment ? 'Existe' : 'Não existe');
        
        setHasCompletedAssessment(hasAssessment);
        setCurrentView(hasAssessment ? 'learning' : 'assessment');
        
        if (hasAssessment) {
          const assessmentData = Array.isArray(data) ? data[0] : data;
          console.log(`✅ Carregando perfil salvo para ${language}:`, assessmentData.level);
        }
      } else if (response.status === 404) {
        // 404 significa que não existe assessment para esta linguagem
        console.log(`❌ Nenhum assessment encontrado para ${language} - entrevista obrigatória`);
        setHasCompletedAssessment(false);
        setCurrentView('assessment');
      } else {
        console.log(`⚠️ Erro HTTP ${response.status} - assumindo sem assessment`);
        setHasCompletedAssessment(false);
        setCurrentView('assessment');
      }
    } catch (error) {
      console.error('❌ Erro ao verificar assessment:', error);
      // Em caso de erro, força assessment
      console.log('🔄 Forçando assessment devido ao erro');
      setHasCompletedAssessment(false);
      setCurrentView('assessment');
    }
  };

  const handleAssessmentComplete = useCallback((assessment: any) => {
    setHasCompletedAssessment(true);
    setCurrentView('learning');
    
    // Adicionar mensagem de boas-vindas
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      type: 'system',
      content: `Ótimo! Baseado no seu assessment, criei um plano personalizado para ${language}. Vamos começar!`,
      timestamp: new Date(),
      metadata: {
        difficulty: assessment.level || 'beginner'
      }
    };
    setMessages([welcomeMessage]);
  }, [language]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simular resposta da IA baseada no contexto
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: generateContextualResponse(inputValue, language, currentCode),
        timestamp: new Date(),
        metadata: {
          relatedTopics: ['variables', 'functions', 'loops']
        }
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
      onMessage?.(aiResponse);
    }, 1500);
  }, [inputValue, language, currentCode, onMessage]);

  const generateContextualResponse = (input: string, lang: string, code: string) => {
    // Lógica simplificada para gerar resposta contextual
    if (input.toLowerCase().includes('erro') || input.toLowerCase().includes('error')) {
      return `Vejo que você está com dificuldades. Vamos analisar seu código ${lang} passo a passo. Que tipo de erro específico você está encontrando?`;
    }
    
    if (input.toLowerCase().includes('como') || input.toLowerCase().includes('explicar')) {
      return `Ótima pergunta! Em ${lang}, isso funciona da seguinte forma... Posso criar um exemplo prático para você?`;
    }

    return `Entendi sua questão sobre ${lang}. Baseado no seu nível atual, recomendo que você primeiro entenda os conceitos fundamentais. Quer que eu explique com exemplos práticos?`;
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  if (!isActive) return null;

  return (
    <div className={`
      flex flex-col bg-secondary border-l border-frame h-full
      ${isMobile ? 'w-full' : 'w-96 xl:w-[28rem] 2xl:w-[32rem]'}
    `}>
      {/* Header com estilo VS Code */}
      <div className="flex items-center justify-between px-3 py-2 bg-elevated border-b border-tertiary">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-primary">AI Learning Assistant</span>
          {isAuthenticated && (
            <div className="flex items-center gap-1 text-xs bg-green-900/20 text-green-400 px-2 py-0.5 rounded">
              <CheckCircle className="w-3 h-3" />
              <span>Personalizado</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover-bg-tertiary rounded text-muted hover:text-primary transition-colors"
            title={isMinimized ? 'Expandir' : 'Minimizar'}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button className="p-1 hover-bg-tertiary rounded text-muted hover:text-primary transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Navegação por Abas - Estilo VS Code */}
          <div className="flex bg-tertiary border-b border-frame">
            <button
              onClick={() => setCurrentView('assessment')}
              className={`
                flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors
                ${currentView === 'assessment' 
                  ? 'bg-secondary text-primary border-blue-400' 
                  : 'text-muted hover:text-primary border-transparent hover-bg-secondary'
                }
              `}
            >
              <Target className="w-4 h-4" />
              <span className="hidden sm:block">Assessment</span>
            </button>
            
            <button
              onClick={() => setCurrentView('learning')}
              disabled={!hasCompletedAssessment}
              className={`
                flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors
                ${currentView === 'learning' 
                  ? 'bg-secondary text-primary border-blue-400' 
                  : hasCompletedAssessment 
                    ? 'text-muted hover:text-primary border-transparent hover-bg-secondary'
                    : 'text-subtle cursor-not-allowed border-transparent'
                }
              `}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:block">Aprender</span>
            </button>
            
            <button
              onClick={() => setCurrentView('chat')}
              className={`
                flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors
                ${currentView === 'chat' 
                  ? 'bg-secondary text-primary border-blue-400' 
                  : 'text-muted hover:text-primary border-transparent hover-bg-secondary'
                }
              `}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:block">Chat</span>
              {messages.length > 0 && (
                <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                  {messages.length}
                </span>
              )}
            </button>
          </div>

          {/* Conteúdo Principal */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* View: Assessment */}
            {currentView === 'assessment' && (
              <div className="flex-1 overflow-hidden">
                {/* Debug info em desenvolvimento */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-blue-400 bg-blue-900/20 border border-blue-500/30 p-2 mb-2 rounded">
                    AILearningPanel Debug: hasCompleted={hasCompletedAssessment.toString()}, currentView={currentView}, user={user?.id || 'none'}
                  </div>
                )}
                
                {hasCompletedAssessment ? (
                  <div className="p-4 text-center">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <h3 className="font-medium text-primary mb-2">Assessment Completo!</h3>
                    <p className="text-sm text-muted mb-4">
                      Você já completou o assessment para {language}. 
                      Seu plano de estudos está personalizado e pronto!
                    </p>
                    <button
                      onClick={() => setCurrentView('learning')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Continuar Estudos
                    </button>
                  </div>
                ) : (
                  <InitialAssessment
                    language={language}
                    currentCode={currentCode}
                    onCodeChange={onCodeChange}
                    onMessage={(message) => {
                      const formattedMessage: Message = {
                        id: Date.now().toString(),
                        type: 'assistant',
                        content: message.suggestion || message.explanation,
                        timestamp: new Date(),
                        metadata: {
                          difficulty: 'beginner'
                        }
                      };
                      setMessages(prev => [...prev, formattedMessage]);
                      onMessage?.(formattedMessage);
                    }}
                    onAssessmentComplete={handleAssessmentComplete}
                  />
                )}
              </div>
            )}

            {/* View: Learning */}
            {currentView === 'learning' && (
              <div className="flex-1 p-4 space-y-4">
                {hasCompletedAssessment ? (
                  <>
                    {/* Progresso */}
                    <div className="bg-tertiary rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-primary">Seu Progresso em {language}</h4>
                        <span className="text-xs text-muted">{learningProgress.progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-elevated rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${learningProgress.progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Tópicos de Estudo */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-primary flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Próximos Tópicos
                      </h4>
                      
                      <div className="space-y-2">
                        <button className="w-full p-3 bg-tertiary hover-bg-elevated rounded-lg text-left transition-colors">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-primary">Variáveis e Tipos</p>
                              <p className="text-xs text-muted">Fundamentos básicos</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted" />
                          </div>
                        </button>
                        
                        <button className="w-full p-3 bg-tertiary hover-bg-elevated rounded-lg text-left transition-colors">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-primary">Estruturas de Controle</p>
                              <p className="text-xs text-muted">If, else, loops</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted" />
                          </div>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-muted mx-auto mb-3" />
                    <p className="text-muted text-sm">
                      Complete o assessment primeiro para ver seu plano personalizado
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* View: Chat */}
            {currentView === 'chat' && (
              <>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {messages.length === 0 && (
                    <div className="text-center py-8">
                      <Bot className="w-12 h-12 text-muted mx-auto mb-3" />
                      <p className="text-muted text-sm mb-4">
                        Olá! Sou seu assistente de {language}.
                        <br />
                        Como posso ajudar você hoje?
                      </p>
                      
                      <div className="space-y-2">
                        <button
                          onClick={() => setInputValue('Como funciona este código?')}
                          className="w-full p-2 bg-tertiary hover-bg-elevated rounded text-sm text-primary transition-colors text-left"
                        >
                          💭 Como funciona este código?
                        </button>
                        <button
                          onClick={() => setInputValue(`Explique conceitos básicos de ${language}`)}
                          className="w-full p-2 bg-tertiary hover-bg-elevated rounded text-sm text-primary transition-colors text-left"
                        >
                          📚 Conceitos básicos
                        </button>
                      </div>
                    </div>
                  )}

                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {(message.type === 'assistant' || message.type === 'system') && (
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      
                      <div className={`
                        max-w-[85%] rounded-lg p-3 
                        ${message.type === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : message.type === 'system'
                            ? 'bg-yellow-900/20 border border-yellow-500/30 text-yellow-100'
                            : 'bg-tertiary text-primary'
                        }
                      `}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <div className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                      
                      {message.type === 'user' && (
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-tertiary rounded-lg p-3">
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <div 
                              key={i}
                              className="w-2 h-2 bg-muted rounded-full animate-bounce"
                              style={{ animationDelay: `${i * 0.1}s` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Input do Chat */}
                <div className="border-t border-tertiary p-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                      placeholder="Digite sua pergunta..."
                      className="flex-1 bg-tertiary border border-muted rounded-lg px-3 py-2 text-sm text-primary placeholder-muted focus:border-elevated focus:outline-none transition-colors"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isTyping}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-muted disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
