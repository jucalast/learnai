/**
 * 📊 Hook para Gerenciamento de Assessments
 * Gerencia assessments de usuários por linguagem
 */

'use client';

import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

export interface UserAssessmentData {
  id?: string;
  userId: string;
  language: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  experience: string;
  interests: string[];
  previousKnowledge: string[];
  personalizedPlan?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export const useAssessment = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar se existe assessment para usuário e linguagem
  const checkExistingAssessment = useCallback(async (language: string): Promise<UserAssessmentData | null> => {
    if (!user) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/assessment?userId=${user.id}&language=${language}`);
      
      if (response.ok) {
        const data = await response.json();
        return data;
      } else if (response.status === 404) {
        return null; // Não encontrado é normal
      } else {
        throw new Error('Erro ao verificar assessment');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Salvar assessment
  const saveAssessment = useCallback(async (assessmentData: Omit<UserAssessmentData, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<UserAssessmentData | null> => {
    if (!user) {
      setError('Usuário não autenticado');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        userId: user.id,
        ...assessmentData,
        generalProgrammingLevel: assessmentData.level === 'beginner' ? 'none' : 
                               assessmentData.level === 'intermediate' ? 'intermediate' : 'advanced',
        languageSpecificLevel: 'none',
        adaptiveLevel: assessmentData.level,
        learningStyle: 'mixed',
        goals: ['learn_programming'],
        timeAvailable: 'medium',
        responses: {
          generalExperience: assessmentData.experience,
          previousKnowledge: assessmentData.previousKnowledge,
          personalizedPlan: assessmentData.personalizedPlan
        }
      };

      const response = await fetch('/api/assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const savedData = await response.json();
        return savedData;
      } else {
        throw new Error('Erro ao salvar assessment');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Atualizar assessment existente
  const updateAssessment = useCallback(async (id: string, updates: Partial<UserAssessmentData>): Promise<UserAssessmentData | null> => {
    if (!user) {
      setError('Usuário não autenticado');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/assessment/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedData = await response.json();
        return updatedData;
      } else {
        throw new Error('Erro ao atualizar assessment');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Listar todos os assessments do usuário
  const getUserAssessments = useCallback(async (): Promise<UserAssessmentData[]> => {
    if (!user) return [];

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/assessment?userId=${user.id}`);
      
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : [data];
      } else {
        throw new Error('Erro ao buscar assessments');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Limpar erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Estado
    loading,
    error,
    isAuthenticated: !!user,
    
    // Ações
    checkExistingAssessment,
    saveAssessment,
    updateAssessment,
    getUserAssessments,
    clearError
  };
};

export default useAssessment;
