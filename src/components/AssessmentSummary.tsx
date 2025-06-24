/**
 * 📊 Componente de Resumo de Assessments
 * Exibe histórico de assessments do usuário
 */

'use client';

import { useState, useEffect } from 'react';
import { User, BookOpen, Clock, Trophy, Eye, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import useAssessment, { UserAssessmentData } from '@/hooks/useAssessment';

interface AssessmentSummaryProps {
  onSelectLanguage?: (language: string, existingAssessment?: UserAssessmentData) => void;
}

export default function AssessmentSummary({ onSelectLanguage }: AssessmentSummaryProps) {
  const { user, isAuthenticated } = useAuth();
  const { getUserAssessments, loading, error } = useAssessment();
  const [assessments, setAssessments] = useState<UserAssessmentData[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAssessments();
    }
  }, [isAuthenticated]);

  const loadAssessments = async () => {
    const userAssessments = await getUserAssessments();
    setAssessments(userAssessments);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-600/20 text-green-300 border-green-500/30';
      case 'intermediate': return 'bg-yellow-600/20 text-yellow-300 border-yellow-500/30';
      case 'advanced': return 'bg-red-600/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-600/20 text-gray-300 border-gray-500/30';
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'beginner': return 'Iniciante';
      case 'intermediate': return 'Intermediário';
      case 'advanced': return 'Avançado';
      default: return level;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-secondary rounded-lg p-6 text-center">
        <User className="w-12 h-12 text-accent mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Faça login para ver seu progresso</h3>
        <p className="text-muted-foreground">
          Seus assessments e progresso serão salvos quando você estiver autenticado.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-secondary rounded-lg p-6">
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin"></div>
          <span className="ml-2 text-muted-foreground">Carregando assessments...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
        <h3 className="text-red-300 font-semibold mb-2">Erro ao carregar assessments</h3>
        <p className="text-red-200 text-sm">{error}</p>
      </div>
    );
  }

  if (assessments.length === 0) {
    return (
      <div className="bg-secondary rounded-lg p-6 text-center">
        <BookOpen className="w-12 h-12 text-accent mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Nenhum assessment realizado</h3>
        <p className="text-muted-foreground">
          Selecione uma linguagem de programação para começar seu primeiro assessment.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-secondary rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-6 h-6 text-accent" />
        <h3 className="text-lg font-semibold text-white">Seus Assessments</h3>
        <span className="text-sm text-muted-foreground">({assessments.length})</span>
      </div>

      <div className="space-y-4">
        {assessments.map((assessment) => (
          <div 
            key={assessment.id}
            className="bg-background/50 border border-border rounded-lg p-4 hover:bg-background/70 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-white capitalize">{assessment.language}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded border ${getLevelColor(assessment.level)}`}>
                      {getLevelLabel(assessment.level)}
                    </span>
                    {assessment.createdAt && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(assessment.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onSelectLanguage && (
                  <button
                    onClick={() => onSelectLanguage(assessment.language, assessment)}
                    className="p-2 text-accent hover:bg-accent/20 rounded-lg transition-colors"
                    title="Continuar com esta linguagem"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Experiência:</span> {assessment.experience}
              </p>
              
              {assessment.interests && assessment.interests.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Interesses:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {assessment.interests.map((interest, index) => (
                      <span 
                        key={index}
                        className="text-xs px-2 py-1 bg-accent/10 text-accent rounded"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {assessment.previousKnowledge && assessment.previousKnowledge.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Conhecimentos:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {assessment.previousKnowledge.map((knowledge, index) => (
                      <span 
                        key={index}
                        className="text-xs px-2 py-1 bg-blue-500/10 text-blue-300 rounded"
                      >
                        {knowledge}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {assessment.personalizedPlan && (
                <div className="mt-3 p-3 bg-accent/5 border border-accent/20 rounded">
                  <h5 className="text-sm font-medium text-accent mb-1">Plano Personalizado</h5>
                  <p className="text-xs text-muted-foreground">
                    {assessment.personalizedPlan.title || 'Plano de estudos criado'}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
