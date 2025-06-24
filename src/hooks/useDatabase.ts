/**
 * Hook personalizado para gerenciar acesso aos serviços de banco de dados
 * Fornece uma interface limpa e typesafe para os componentes React
 */

import { useState, useCallback } from 'react';
import { 
  UserAssessment, 
  PersonalizedCurriculum 
} from '@/types/learningSystem';

// Tipos para gerenciamento de estado
interface DatabaseState {
  currentUser: { id: string; email?: string; name?: string } | null;
  currentSession: any | null;
  currentAssessment: UserAssessment | null;
  currentCurriculum: PersonalizedCurriculum | null;
  currentProgress: any | null;
  isLoading: boolean;
  error: string | null;
}

interface DatabaseActions {
  // User management
  initializeUser: (email?: string, name?: string) => Promise<string | null>;
  
  // Assessment management
  createAssessment: (userId: string, data: Omit<UserAssessment, 'id' | 'completedAt'>) => Promise<UserAssessment | null>;
  updateAssessment: (assessmentId: string, data: Partial<UserAssessment>) => Promise<UserAssessment | null>;
  getAssessmentsByUser: (userId: string) => Promise<UserAssessment[] | null>;
  
  // Curriculum management
  createCurriculum: (assessmentId: string, data: Omit<PersonalizedCurriculum, 'id'>) => Promise<PersonalizedCurriculum | null>;
  getCurriculumByAssessment: (assessmentId: string) => Promise<PersonalizedCurriculum | null>;
  
  // Progress management
  createProgress: (userId: string, assessmentId: string, language: string) => Promise<any | null>;
  updateProgress: (progressId: string, data: any) => Promise<any | null>;
  
  // Session management
  createSession: (userId: string, data: { 
    language: string; 
    sessionType?: string; 
    topicId?: string; 
    curriculumId?: string; 
    assessmentId?: string;
  }) => Promise<any | null>;
  updateSession: (sessionId: string, data: any) => Promise<any | null>;
  endSession: (sessionId: string) => Promise<any | null>;
  
  // Analytics
  trackEvent: (sessionId: string, event: any) => Promise<void>;
  getUserAnalytics: (userId: string) => Promise<any | null>;
  
  // Reset state
  reset: () => void;
}

const useDatabase = (): [DatabaseState, DatabaseActions] => {
  const [state, setState] = useState<DatabaseState>({
    currentUser: null,
    currentSession: null,
    currentAssessment: null,
    currentCurriculum: null,
    currentProgress: null,
    isLoading: false,
    error: null
  });

  // Helper para atualizar estado
  const updateState = useCallback((updates: Partial<DatabaseState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Helper para gerenciar loading e erro
  const withLoadingAndError = useCallback(async <T>(
    operation: () => Promise<T>,
    successUpdates?: Partial<DatabaseState>
  ): Promise<T | null> => {
    try {
      updateState({ isLoading: true, error: null });
      const result = await operation();
      
      if (successUpdates) {
        updateState({ ...successUpdates, isLoading: false });
      } else {
        updateState({ isLoading: false });
      }
      
      return result;
    } catch (error) {
      console.error('Database operation failed:', error);
      updateState({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      return null;
    }
  }, [updateState]);

  const actions: DatabaseActions = {
    // User Management
    initializeUser: useCallback(async (email?: string, name?: string) => {
      return withLoadingAndError(async () => {
        const response = await fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            name,
            type: email ? 'registered' : 'anonymous'
          })
        });

        if (!response.ok) {
          throw new Error('Falha ao criar usuário');
        }

        const { userId } = await response.json();
        const user = { id: userId, email, name };
        updateState({ currentUser: user });
        return userId;
      });
    }, [withLoadingAndError, updateState]),

    // Assessment Management
    createAssessment: useCallback(async (userId: string, data: Omit<UserAssessment, 'id' | 'completedAt'>) => {
      return withLoadingAndError(async () => {
        const response = await fetch('/api/assessment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            ...data,
            completedAt: new Date()
          })
        });

        if (!response.ok) {
          throw new Error('Falha ao criar assessment');
        }

        const { assessment } = await response.json();
        updateState({ currentAssessment: assessment });
        return assessment;
      });
    }, [withLoadingAndError, updateState]),

    updateAssessment: useCallback(async (assessmentId: string, data: Partial<UserAssessment>) => {
      console.warn('updateAssessment não implementado ainda');
      return null;
    }, []),

    getAssessmentsByUser: useCallback(async (userId: string) => {
      return withLoadingAndError(async () => {
        const response = await fetch(`/api/assessment?userId=${userId}`);
        
        if (!response.ok) {
          throw new Error('Falha ao buscar assessments');
        }

        const { assessments } = await response.json();
        return assessments;
      });
    }, [withLoadingAndError]),

    // Curriculum Management
    createCurriculum: useCallback(async (assessmentId: string, data: Omit<PersonalizedCurriculum, 'id'>) => {
      return withLoadingAndError(async () => {
        const response = await fetch('/api/curriculum', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assessmentId,
            curriculumData: data
          })
        });

        if (!response.ok) {
          throw new Error('Falha ao criar currículo');
        }

        const { curriculum } = await response.json();
        updateState({ currentCurriculum: curriculum });
        return curriculum;
      });
    }, [withLoadingAndError, updateState]),

    getCurriculumByAssessment: useCallback(async (assessmentId: string) => {
      return withLoadingAndError(async () => {
        const response = await fetch(`/api/curriculum?assessmentId=${assessmentId}`);
        
        if (!response.ok) {
          throw new Error('Falha ao buscar currículo');
        }

        const { curriculum } = await response.json();
        return curriculum;
      });
    }, [withLoadingAndError]),

    // Progress Management
    createProgress: useCallback(async (userId: string, assessmentId: string, language: string) => {
      return withLoadingAndError(async () => {
        const response = await fetch('/api/user/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            assessmentId,
            language,
            type: 'initialize_progress'
          })
        });

        if (!response.ok) {
          throw new Error('Falha ao criar progresso');
        }

        const { data: progress } = await response.json();
        updateState({ currentProgress: progress });
        return progress;
      });
    }, [withLoadingAndError, updateState]),

    updateProgress: useCallback(async (progressId: string, data: any) => {
      return withLoadingAndError(async () => {
        const response = await fetch('/api/user/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            progressId,
            updates: data,
            type: 'update_progress'
          })
        });

        if (!response.ok) {
          throw new Error('Falha ao atualizar progresso');
        }

        const { data: progress } = await response.json();
        return progress;
      });
    }, [withLoadingAndError]),

    // Session Management - usando serviços diretos por simplicidade
    createSession: useCallback(async (userId: string, data: { 
      language: string; 
      sessionType?: string; 
      topicId?: string; 
      curriculumId?: string; 
      assessmentId?: string;
    }) => {
      return withLoadingAndError(async () => {
        // Usar API em vez de importação direta do Prisma
        const response = await fetch('/api/learning/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            language: data.language,
            sessionType: data.sessionType || 'learning',
            assessmentId: data.assessmentId,
            curriculumId: data.curriculumId,
            topicId: data.topicId
          })
        });
        
        if (!response.ok) {
          throw new Error('Falha ao criar sessão');
        }
        
        const { data: session } = await response.json();
        updateState({ currentSession: session });
        return session;
      });
    }, [withLoadingAndError, updateState]),

    updateSession: useCallback(async (sessionId: string, data: any) => {
      console.warn('updateSession não implementado ainda');
      return null;
    }, []),

    endSession: useCallback(async (sessionId: string) => {
      return withLoadingAndError(async () => {
        // Usar API em vez de importação direta do Prisma
        const response = await fetch('/api/learning/session', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, action: 'end' })
        });
        
        if (!response.ok) {
          throw new Error('Falha ao finalizar sessão');
        }
        
        const { data: session } = await response.json();
        updateState({ currentSession: null });
        return session;
      });
    }, [withLoadingAndError, updateState]),

    // Analytics
    trackEvent: useCallback(async (sessionId: string, event: any) => {
      try {
        console.log('Tracking event:', { sessionId, event });
      } catch (error) {
        console.error('Failed to track event:', error);
      }
    }, []),

    getUserAnalytics: useCallback(async (userId: string) => {
      return withLoadingAndError(async () => {
        const response = await fetch(`/api/user/data?userId=${userId}&type=analytics`);
        
        if (!response.ok) {
          throw new Error('Falha ao buscar analytics');
        }

        const { data: analytics } = await response.json();
        return analytics;
      });
    }, [withLoadingAndError]),

    // Reset
    reset: useCallback(() => {
      setState({
        currentUser: null,
        currentSession: null,
        currentAssessment: null,
        currentCurriculum: null,
        currentProgress: null,
        isLoading: false,
        error: null
      });
    }, [])
  };

  return [state, actions];
};

export default useDatabase;
export type { DatabaseState, DatabaseActions };
