/**
 * 📱 BOTÃO DE AÇÃO MOBILE APRIMORADO V2
 * Botão flutuante com melhor UX para acesso rápido à IA em dispositivos móveis
 */

'use client';

import React, { useState } from 'react';
import { 
  Bot, 
  MessageSquare, 
  Target, 
  BookOpen, 
  X, 
  ChevronUp,
  Terminal,
  Brain,
  Play
} from 'lucide-react';

interface MobileAIButtonProps {
  onToggleAI: () => void;
  onToggleOutput: () => void;
  onRun?: () => void;
  isAIActive: boolean;
  isOutputActive: boolean;
  hasNotifications?: boolean;
  assessmentCompleted?: boolean;
}

export function MobileAIButton({
  onToggleAI,
  onToggleOutput,
  onRun,
  isAIActive,
  isOutputActive,
  hasNotifications = false,
  assessmentCompleted = false
}: MobileAIButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleMainButtonClick = () => {
    if (isExpanded) {
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
    }
  };

  const handleActionClick = (action: () => void) => {
    action();
    setIsExpanded(false);
  };

  return (
    <>
      {/* Overlay para fechar quando clicar fora */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Container dos botões */}
      <div className="fixed bottom-4 right-4 z-50 lg:hidden">
        {/* Botões expandidos */}
        {isExpanded && (
          <div className="flex flex-col gap-2 mb-3 animate-in slide-in-from-bottom-5 fade-in duration-200">
            {/* Botão AI Assistant */}
            <button
              onClick={() => handleActionClick(onToggleAI)}
              className={`
                flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg transition-all duration-200
                ${isAIActive 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-secondary border border-frame text-primary hover:bg-tertiary'
                }
              `}
              style={{ minWidth: '160px' }}
            >
              <div className="relative">
                <Brain className="w-5 h-5" />
                {hasNotifications && !assessmentCompleted && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />
                )}
              </div>
              <span className="text-sm font-medium">
                {!assessmentCompleted ? 'Assessment' : 'AI Assistant'}
              </span>
              {isAIActive && <ChevronUp className="w-4 h-4 ml-auto" />}
            </button>

            {/* Botão Chat Rápido */}
            <button
              onClick={() => handleActionClick(() => {
                if (!isAIActive) onToggleAI();
                // Focar no chat - você pode adicionar lógica específica aqui
              })}
              className="flex items-center gap-2 px-4 py-3 bg-secondary border border-frame text-primary hover:bg-tertiary rounded-xl shadow-lg transition-all duration-200"
              style={{ minWidth: '160px' }}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-sm font-medium">Chat com IA</span>
            </button>

            {/* Botão Run Code */}
            {onRun && (
              <button
                onClick={() => handleActionClick(onRun)}
                className="flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg transition-all duration-200"
                style={{ minWidth: '160px' }}
              >
                <Play className="w-5 h-5" />
                <span className="text-sm font-medium">Executar</span>
              </button>
            )}

            {/* Botão Output */}
            <button
              onClick={() => handleActionClick(onToggleOutput)}
              className={`
                flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg transition-all duration-200
                ${isOutputActive 
                  ? 'bg-green-600 text-white' 
                  : 'bg-secondary border border-frame text-primary hover:bg-tertiary'
                }
              `}
              style={{ minWidth: '160px' }}
            >
              <Terminal className="w-5 h-5" />
              <span className="text-sm font-medium">Terminal</span>
              {isOutputActive && <ChevronUp className="w-4 h-4 ml-auto" />}
            </button>
          </div>
        )}

        {/* Botão principal */}
        <button
          onClick={handleMainButtonClick}
          className={`
            w-14 h-14 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center
            ${isExpanded 
              ? 'bg-red-600 hover:bg-red-700 text-white rotate-45' 
              : isAIActive || isOutputActive
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-secondary border border-frame text-primary hover:bg-tertiary'
            }
          `}
        >
          {isExpanded ? (
            <X className="w-6 h-6" />
          ) : (
            <div className="relative">
              <Bot className="w-6 h-6" />
              {/* Indicador de notificação */}
              {(hasNotifications || !assessmentCompleted) && !isExpanded && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
              )}
              {/* Indicador de atividade */}
              {(isAIActive || isOutputActive) && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />
              )}
            </div>
          )}
        </button>
      </div>
    </>
  );
}
