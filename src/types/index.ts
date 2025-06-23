export interface Language {
  id: string;
  name: string;
  extension: string;
  monacoLanguage: string;
  defaultCode: string;
  description: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  language: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  code: string;
  objectives: string[];
  hints: string[];
}

export interface AIResponse {
  suggestion: string;
  explanation: string;
  correction?: string;
  nextSteps?: string[];
  type: 'hint' | 'correction' | 'explanation' | 'encouragement';
}

export interface CodeAnalysis {
  hasErrors: boolean;
  errors: string[];
  suggestions: string[];
  quality: number; // 0-100
}

export interface LearningProgress {
  currentLesson: string;
  completedLessons: string[];
  skillLevel: number; // 0-100
  languageProgress: Record<string, number>;
}
