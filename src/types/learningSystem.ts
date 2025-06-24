/**
 * Sistema de Tipos para Arquitetura de Aprendizado Personalizado
 * Baseado em padrões de arquitetura: Strategy, Observer, Factory
 */

export interface UserAssessment {
  id: string;
  userId?: string;  // Opcional para compatibilidade com assessments locais
  language: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  experience: string;
  interests: string[];
  previousKnowledge: string[];
  learningStyle: 'visual' | 'practical' | 'theoretical' | 'mixed';
  goals: string[];
  timeAvailable: 'low' | 'medium' | 'high';
  completedAt?: Date;  // Opcional para assessments em progresso
  createdAt?: Date;    // Para compatibilidade
  updatedAt?: Date;    // Para compatibilidade
  
  // ✨ Novos campos para análise inteligente de nível
  generalProgrammingLevel?: 'none' | 'basic' | 'intermediate' | 'advanced';
  languageSpecificLevel?: 'none' | 'basic' | 'intermediate' | 'advanced';
  adaptiveLevel?: 'beginner' | 'intermediate_syntax' | 'intermediate_concepts' | 'advanced';
  programmingExperienceYears?: number;
  languageExperienceLevel?: 'never_used' | 'basic_syntax' | 'some_projects' | 'professional';
}

export interface LearningTopic {
  id: string;
  title: string;
  description: string;
  type: 'concept' | 'exercise' | 'project' | 'challenge';
  difficulty: number; // 1-5
  estimatedTime: number; // em minutos
  prerequisites: string[];
  learningObjectives: string[];
  tags: string[];
  priority: number; // 1-10
}

export interface PersonalizedCurriculum {
  id: string;
  userId: string;
  language: string;
  level: string;
  topics: LearningTopic[];
  currentTopicIndex: number;
  estimatedCompletionTime: number;
  adaptationRules: AdaptationRule[];
  createdAt: Date;
  lastUpdated: Date;
}

export interface AdaptationRule {
  condition: string;
  action: 'skip' | 'reinforce' | 'advance' | 'provide_hint' | 'change_approach';
  parameters: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  type: 'ai' | 'user' | 'system';
  content: string;
  timestamp: Date;
  topicId?: string;
  messageType: 'introduction' | 'explanation' | 'question' | 'feedback' | 'encouragement' | 'hint';
  metadata?: {
    codeReference?: string;
    exerciseId?: string;
    difficulty?: number;
  };
}

export interface CodeExercise {
  id: string;
  topicId: string;
  title: string;
  description: string;
  startingCode: string;
  expectedOutput?: string;
  solution: string;
  hints: string[];
  validationRules: ValidationRule[];
  difficulty: number;
  estimatedTime: number;
}

export interface ValidationRule {
  type: 'syntax' | 'logic' | 'output' | 'pattern' | 'performance';
  condition: string;
  message: string;
  severity: 'error' | 'warning' | 'suggestion';
}

export interface LearningSession {
  id: string;
  userId: string;
  curriculumId: string;
  currentTopicId: string;
  startTime: Date;
  endTime?: Date;
  chatMessages: ChatMessage[];
  codeHistory: CodeSnapshot[];
  progress: SessionProgress;
  adaptations: AdaptationEvent[];
}

export interface CodeSnapshot {
  id: string;
  timestamp: Date;
  code: string;
  language: string;
  topicId: string;
  exerciseId?: string;
  isValid: boolean;
  errors: string[];
  metrics: CodeMetrics;
}

export interface CodeMetrics {
  linesOfCode: number;
  complexity: number;
  completeness: number; // 0-100%
  quality: number; // 0-100%
  timeSpent: number; // em segundos
}

export interface SessionProgress {
  topicsCompleted: string[];
  exercisesCompleted: string[];
  currentScore: number;
  timeSpent: number;
  strugglingAreas: string[];
  strengthAreas: string[];
  adaptationsMade: number;
}

export interface AdaptationEvent {
  id: string;
  timestamp: Date;
  trigger: string;
  action: string;
  parameters: Record<string, any>;
  result: 'success' | 'failure' | 'partial';
}

export interface TeachingStrategy {
  name: string;
  description: string;
  execute: (context: TeachingContext) => Promise<TeachingAction>;
  isApplicable: (context: TeachingContext) => boolean;
}

export interface TeachingContext {
  userAssessment: UserAssessment;
  currentTopic: LearningTopic;
  currentExercise?: CodeExercise;
  sessionProgress: SessionProgress;
  recentCodeHistory: CodeSnapshot[];
  recentChatHistory: ChatMessage[];
  userIdleTime: number;
  strugglingIndicators: string[];
}

export interface TeachingAction {
  type: 'chat_message' | 'code_example' | 'exercise' | 'hint' | 'encouragement' | 'adaptation';
  priority: 'low' | 'medium' | 'high' | 'immediate';
  content: {
    chatMessage?: ChatMessage;
    codeExample?: string;
    exercise?: CodeExercise;
    adaptationRules?: AdaptationRule[];
  };
  timing: 'immediate' | 'delayed' | 'after_user_action';
  delay?: number; // em milissegundos
}

export interface LearningAnalytics {
  userId: string;
  sessionId: string;
  metrics: {
    engagementScore: number; // 0-100
    progressRate: number; // tópicos por hora
    difficultyAdaptation: number; // -5 a +5
    chatInteractionRate: number; // mensagens por minuto
    codeQualityTrend: number[]; // histórico de qualidade
    timeDistribution: {
      thinking: number;
      coding: number;
      reading: number;
    };
  };
  insights: string[];
  recommendations: string[];
}
