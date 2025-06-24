/**
 * 🚀 Sistema de Ensino Dual IA - Enhanced AI Assistant
 * 
 * Utiliza os componentes existentes de forma coordenada para ensino passo a passo:
 * - InitialAssessment: Assessment inicial (já existente) 
 * - PersonalizedLearningSystem: Sistema personalizado existente
 * - Integração com FluidAITeacher para coordenação Chat + Editor
 * 
 * Aproveita toda a infraestrutura já implementada
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Bot, 
  GraduationCap, 
  Brain, 
  Target, 
  Settings,
  ArrowRight
} from 'lucide-react';

import InitialAssessment from './InitialAssessment';
import PersonalizedLearningSystem from './PersonalizedLearningSystem';
import FluidAITeacher from './FluidAITeacher';

interface EnhancedAIAssistantProps {
  language: string;
  currentCode: string;
  onCodeChange: (code: string) => void;
  onMessage: (message: any) => void;
  isActive: boolean;
}

type SystemMode = 'assessment' | 'personalized_learning' | 'fluid_teaching';

export default function EnhancedAIAssistant({
  language,
  currentCode,
  onCodeChange,
  onMessage,
  isActive
}: EnhancedAIAssistantProps) {
  // Estados principais
  const [systemMode, setSystemMode] = useState<SystemMode>('assessment');
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);

  // Verificar se já existe assessment para permitir outros modos
  useEffect(() => {
    // Verificar se há assessment específico para esta linguagem
    const assessmentKey = `assessment_${language}`;
    const storedAssessment = localStorage.getItem(assessmentKey);
    
    if (storedAssessment) {
      try {
        const assessment = JSON.parse(storedAssessment);
        console.log(`📚 Assessment encontrado para ${language}:`, assessment);
        setHasCompletedAssessment(true);
        setSystemMode('personalized_learning');
      } catch {
        // Assessment corrompido, iniciar novo
        console.log(`❌ Assessment corrompido para ${language}, iniciando novo`);
        setHasCompletedAssessment(false);
        setSystemMode('assessment');
      }
    } else {
      // Sem assessment para esta linguagem, iniciar novo
      console.log(`📝 Nenhum assessment encontrado para ${language}`);
      setHasCompletedAssessment(false);
      setSystemMode('assessment');
    }
  }, [language]);

  // Handler para assessment completo
  const handleAssessmentComplete = useCallback((assessment: any) => {
    console.log('✅ Assessment completado:', assessment);
    setHasCompletedAssessment(true);
    
    // Salvar assessment específico para esta linguagem
    const assessmentKey = `assessment_${assessment.language}`;
    localStorage.setItem(assessmentKey, JSON.stringify(assessment));
    localStorage.setItem('lastAssessment', JSON.stringify(assessment));
    
    // Mudar para sistema personalizado
    setSystemMode('personalized_learning');
  }, []);

  // Mudança de modo manual
  const switchMode = useCallback((mode: SystemMode) => {
    if (mode === 'assessment' || hasCompletedAssessment) {
      setSystemMode(mode);
      setShowModeSelector(false);
    }
  }, [hasCompletedAssessment]);

  if (!isActive) {
    return null;
  }

  // Renderização condicional baseada no modo
  return (
    <div className="h-full flex flex-col bg-primary text-secondary">
      {/* Header com seletor de modo */}
      <div className="flex-shrink-0 bg-primary border-b border-frame">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold">
                {systemMode === 'assessment' && 'Avaliação Inicial'}
                {systemMode === 'personalized_learning' && 'Sistema Personalizado'}
                {systemMode === 'fluid_teaching' && 'Ensino Fluido'}
              </h3>
            </div>
            
            {hasCompletedAssessment && (
              <button
                onClick={() => setShowModeSelector(!showModeSelector)}
                className="p-2 text-muted hover:text-secondary rounded transition-colors"
                title="Alterar modo de ensino"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Seletor de modo */}
          {showModeSelector && hasCompletedAssessment && (
            <div className="mt-3 p-3 bg-secondary rounded border space-y-2">
              <p className="text-xs text-muted mb-2">Escolha o modo de ensino:</p>
              
              <button
                onClick={() => switchMode('personalized_learning')}
                className={`w-full text-left p-2 rounded text-sm transition-colors ${
                  systemMode === 'personalized_learning' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-tertiary hover:bg-frame text-secondary'
                }`}
              >
                🎯 <strong>Sistema Personalizado</strong> - Assessment completo + Currículo adaptativo + Chat/Editor coordenados
              </button>
              
              <button
                onClick={() => switchMode('fluid_teaching')}
                className={`w-full text-left p-2 rounded text-sm transition-colors ${
                  systemMode === 'fluid_teaching' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-tertiary hover:bg-frame text-secondary'
                }`}
              >
                🌊 <strong>Ensino Fluido</strong> - IA observacional em tempo real + Conceitos progressivos
              </button>
              
              <button
                onClick={() => switchMode('assessment')}
                className={`w-full text-left p-2 rounded text-sm transition-colors ${
                  systemMode === 'assessment' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-tertiary hover:bg-frame text-secondary'
                }`}
              >
                📋 <strong>Nova Avaliação</strong> - Refazer assessment para esta linguagem
              </button>
            </div>
          )}

          {/* Indicador de progresso - apenas quando assessment foi realmente concluído */}
          {hasCompletedAssessment && systemMode !== 'assessment' && (
            <div className="mt-3 flex items-center text-xs text-muted">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Assessment concluído</span>
              </div>
              <ArrowRight className="w-3 h-3 mx-2" />
              <span className="text-blue-400">
                {systemMode === 'personalized_learning' ? 'Aprendizado Personalizado Ativo' : 'Ensino Fluido Ativo'}
              </span>
            </div>
          )}

          {/* Indicador quando assessment está em progresso */}
          {!hasCompletedAssessment && systemMode === 'assessment' && (
            <div className="mt-3 flex items-center text-xs text-muted">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span>Assessment em andamento...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-hidden">
        {systemMode === 'assessment' && (
          <InitialAssessment
            language={language}
            onCodeChange={onCodeChange}
            onMessage={onMessage}
            onAssessmentComplete={handleAssessmentComplete}
            currentCode={currentCode}
          />
        )}

        {systemMode === 'personalized_learning' && (
          <PersonalizedLearningSystem
            language={language}
            currentCode={currentCode}
            onCodeChange={onCodeChange}
            onMessage={onMessage}
          />
        )}

        {systemMode === 'fluid_teaching' && (
          <FluidAITeacher
            language={language}
            currentCode={currentCode}
            onCodeChange={onCodeChange}
            onMessage={onMessage}
            userLevel="intermediate" // TODO: Pegar do assessment
          />
        )}
      </div>
    </div>
  );
}
