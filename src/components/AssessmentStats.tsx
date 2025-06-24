/**
 * 📊 Componente de Estatísticas de Assessment
 * Mostra progresso do usuário em diferentes linguagens
 */

'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Clock, BookOpen, User, Trophy, Target } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface AssessmentStats {
  totalAssessments: number;
  completedLanguages: string[];
  languageProfiles: {
    [language: string]: {
      level: 'beginner' | 'intermediate' | 'advanced';
      completedAt: string;
      experience: string;
    };
  };
}

interface AssessmentStatsProps {
  currentLanguage?: string;
  onLanguageSelect?: (language: string) => void;
}

export default function AssessmentStats({ currentLanguage, onLanguageSelect }: AssessmentStatsProps) {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<AssessmentStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadAssessmentStats();
    }
  }, [isAuthenticated, user]);

  const loadAssessmentStats = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/assessment?userId=${user.id}`);
      if (response.ok) {
        const assessments = await response.json();
        const assessmentArray = Array.isArray(assessments) ? assessments : [assessments];
        
        const languageProfiles: AssessmentStats['languageProfiles'] = {};
        assessmentArray.forEach(assessment => {
          languageProfiles[assessment.language] = {
            level: assessment.level,
            completedAt: assessment.createdAt || new Date().toISOString(),
            experience: assessment.experience || 'Não informado'
          };
        });

        setStats({
          totalAssessments: assessmentArray.length,
          completedLanguages: assessmentArray.map(a => a.language),
          languageProfiles
        });
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'intermediate': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'advanced': return 'text-red-400 bg-red-400/10 border-red-400/30';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
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

  const getLanguageIcon = (language: string) => {
    // Retorna emoji baseado na linguagem
    switch (language.toLowerCase()) {
      case 'python': return '🐍';
      case 'javascript': return '🟨';
      case 'typescript': return '🔷';
      case 'java': return '☕';
      case 'go': return '🐹';
      case 'rust': return '🦀';
      case 'c++': return '⚡';
      case 'c#': return '🔷';
      default: return '💻';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-secondary/50 border border-border rounded-lg p-4 text-center">
        <User className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          Faça login para ver suas estatísticas de assessment
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-secondary/50 border border-border rounded-lg p-4">
        <div className="flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin"></div>
          <span className="ml-2 text-sm text-muted-foreground">Carregando estatísticas...</span>
        </div>
      </div>
    );
  }

  if (!stats || stats.totalAssessments === 0) {
    return (
      <div className="bg-secondary/50 border border-border rounded-lg p-4 text-center">
        <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <h3 className="text-sm font-medium text-white mb-1">Nenhum Assessment Realizado</h3>
        <p className="text-xs text-muted-foreground">
          Complete sua primeira entrevista para começar a acompanhar seu progresso
        </p>
      </div>
    );
  }

  return (
    <div className="bg-secondary/50 border border-border rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Trophy className="w-5 h-5 text-accent" />
        <div>
          <h3 className="text-sm font-semibold text-white">Seus Assessments</h3>
          <p className="text-xs text-muted-foreground">
            {stats.totalAssessments} linguagem{stats.totalAssessments !== 1 ? 's' : ''} avaliada{stats.totalAssessments !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Linguagens Completadas */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Linguagens Avaliadas
        </h4>
        
        <div className="grid gap-2">
          {stats.completedLanguages.map((language) => {
            const profile = stats.languageProfiles[language];
            const isCurrentLanguage = language === currentLanguage;
            
            return (
              <div
                key={language}
                onClick={() => onLanguageSelect?.(language)}
                className={`
                  p-3 rounded-lg border transition-all cursor-pointer
                  ${isCurrentLanguage 
                    ? 'bg-accent/10 border-accent/30 ring-1 ring-accent/20' 
                    : 'bg-background/30 border-border hover:bg-background/50'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getLanguageIcon(language)}</span>
                    <div>
                      <h5 className="text-sm font-medium text-white capitalize">
                        {language}
                        {isCurrentLanguage && (
                          <span className="ml-2 text-xs text-accent">(atual)</span>
                        )}
                      </h5>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {profile.experience}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded border ${getLevelColor(profile.level)}`}>
                      {getLevelLabel(profile.level)}
                    </span>
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                </div>
                
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  Avaliado em {new Date(profile.completedAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status da Linguagem Atual */}
      {currentLanguage && !stats.completedLanguages.includes(currentLanguage) && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-orange-400" />
            <h4 className="text-sm font-medium text-orange-300">Assessment Necessário</h4>
          </div>
          <p className="text-xs text-orange-200">
            Você ainda não fez o assessment obrigatório para <strong>{currentLanguage}</strong>. 
            Complete a entrevista para personalizar sua experiência de aprendizado.
          </p>
        </div>
      )}
    </div>
  );
}
