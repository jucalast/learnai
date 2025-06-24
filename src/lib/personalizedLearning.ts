/**
 * Sistema de Avaliação e Geração de Currículo Personalizado
 * Arquitetura: Factory Pattern + Strategy Pattern
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  UserAssessment, 
  PersonalizedCurriculum, 
  LearningTopic,
  AdaptationRule 
} from '@/types/learningSystem';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

// Factory para criação de currículos personalizados
export class CurriculumFactory {
  private static assessmentAnalyzer = genAI.getGenerativeModel({ 
    model: "gemini-2.0-pro",
    generationConfig: {
      temperature: 0.3, // Baixa para análises consistentes
      maxOutputTokens: 1500,
    }
  });

  private static topicGenerator = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.7, // Criatividade balanceada para tópicos
      maxOutputTokens: 2000,
    }
  });

  /**
   * Analisa as respostas do assessment e determina perfil INTELIGENTE do usuário
   * Diferencia entre experiência geral e conhecimento específico da linguagem
   */
  static async analyzeAssessment(responses: string[], language: string): Promise<UserAssessment> {
    const prompt = `
Analise estas 3 respostas de avaliação inicial para ${language}:

RESPOSTA 1 (Experiência): "${responses[0]}"
RESPOSTA 2 (Objetivos): "${responses[1]}"  
RESPOSTA 3 (Conhecimento Prévio): "${responses[2]}"

ANÁLISE INTELIGENTE REQUERIDA:
Determine separadamente:
1. EXPERIÊNCIA GERAL em programação (conceitos, lógica, estruturas)
2. CONHECIMENTO ESPECÍFICO da linguagem ${language} (sintaxe, bibliotecas, idiomas)
3. NÍVEL ADAPTATIVO para ensino (baseado na combinação dos dois)

Responda APENAS em JSON:

{
  "generalProgrammingLevel": "none|basic|intermediate|advanced",
  "languageSpecificLevel": "none|basic|intermediate|advanced", 
  "adaptiveLevel": "beginner|intermediate_syntax|intermediate_concepts|advanced",
  "level": "beginner|intermediate|advanced",
  "experience": "descrição resumida da experiência",
  "interests": ["interesse1", "interesse2", "interesse3"],
  "previousKnowledge": ["conceito1", "conceito2"],
  "learningStyle": "visual|practical|theoretical|mixed",
  "goals": ["objetivo1", "objetivo2"],
  "timeAvailable": "low|medium|high",
  "programmingExperienceYears": 0-20,
  "languageExperienceLevel": "never_used|basic_syntax|some_projects|professional"
}

CRITÉRIOS INTELIGENTES:
- generalProgrammingLevel: Experiência com conceitos de programação em QUALQUER linguagem
- languageSpecificLevel: Conhecimento específico de ${language}
- adaptiveLevel: 
  * "beginner": Não sabe programar OU novo em tudo
  * "intermediate_syntax": Sabe programar, mas novo na linguagem (FOCO EM SINTAXE)
  * "intermediate_concepts": Alguma experiência na linguagem, precisa aprofundar
  * "advanced": Experiente na linguagem específica
- level: Nível geral para compatibilidade
- programmingExperienceYears: Anos aproximados de experiência
- languageExperienceLevel: Experiência específica na linguagem

EXEMPLO - Usuário que sabe Java mas quer aprender Python:
{
  "generalProgrammingLevel": "intermediate", 
  "languageSpecificLevel": "none",
  "adaptiveLevel": "intermediate_syntax",
  "level": "intermediate"
}`;

    try {
      const result = await this.assessmentAnalyzer.generateContent(prompt);
      const analysis = JSON.parse(result.response.text().replace(/```json|```/g, '').trim());
      
      return {
        id: Date.now().toString(),
        language,
        level: analysis.level,
        experience: analysis.experience,
        interests: analysis.interests,
        previousKnowledge: analysis.previousKnowledge,
        learningStyle: analysis.learningStyle,
        goals: analysis.goals,
        timeAvailable: analysis.timeAvailable,
        completedAt: new Date(),
        // Novos campos inteligentes
        generalProgrammingLevel: analysis.generalProgrammingLevel,
        languageSpecificLevel: analysis.languageSpecificLevel,
        adaptiveLevel: analysis.adaptiveLevel,
        programmingExperienceYears: analysis.programmingExperienceYears,
        languageExperienceLevel: analysis.languageExperienceLevel
      };
    } catch (error) {
      console.error('Erro na análise do assessment:', error);
      // Fallback inteligente
      return this.createIntelligentFallbackAssessment(language, responses);
    }
  }

  /**
   * Gera currículo personalizado baseado no assessment INTELIGENTE
   */
  static async generatePersonalizedCurriculum(assessment: UserAssessment): Promise<PersonalizedCurriculum> {
    const prompt = `
Crie um currículo INTELIGENTEMENTE ADAPTADO de ${assessment.language} para este perfil:

ANÁLISE INTELIGENTE DO USUÁRIO:
- Experiência Geral em Programação: ${assessment.generalProgrammingLevel || 'basic'}
- Conhecimento Específico de ${assessment.language}: ${assessment.languageSpecificLevel || 'none'}
- Nível Adaptativo: ${assessment.adaptiveLevel || 'beginner'}
- Anos de Experiência: ${assessment.programmingExperienceYears || 0}
- Experiência na Linguagem: ${assessment.languageExperienceLevel || 'never_used'}

PERFIL COMPLEMENTAR:
- Nível Geral: ${assessment.level}
- Experiência: ${assessment.experience}
- Interesses: ${assessment.interests.join(', ')}
- Conhecimento Prévio: ${assessment.previousKnowledge.join(', ')}
- Estilo de Aprendizado: ${assessment.learningStyle}
- Objetivos: ${assessment.goals.join(', ')}
- Tempo Disponível: ${assessment.timeAvailable}

INSTRUÇÕES INTELIGENTES DE GERAÇÃO:

${assessment.adaptiveLevel === 'intermediate_syntax' ? `
🎯 FOCO: SINTAXE DA LINGUAGEM (usuário sabe programar, mas novo na linguagem)
- Priorize sintaxe específica de ${assessment.language}
- Use conceitos de programação que ele já conhece
- Mostre equivalências com outras linguagens quando relevante
- Evite conceitos básicos de programação (já sabe)
- Foque em idiomas e convenções da linguagem
- Exemplos práticos de conversão de conceitos
` : assessment.adaptiveLevel === 'intermediate_concepts' ? `
🎯 FOCO: CONCEITOS INTERMEDIÁRIOS (tem base na linguagem)
- Aprofunde conceitos específicos da linguagem
- Padrões de design apropriados
- Melhores práticas e convenções
- Ferramentas e ecossistema
- Projetos práticos
` : assessment.adaptiveLevel === 'advanced' ? `
🎯 FOCO: TÓPICOS AVANÇADOS (experiente na linguagem)
- Otimização e performance
- Arquitetura de software
- Padrões avançados
- Ferramentas profissionais
- Projetos complexos
` : `
🎯 FOCO: FUNDAMENTOS COMPLETOS (iniciante total)
- Conceitos básicos de programação
- Sintaxe fundamental
- Lógica de programação
- Resolução de problemas
- Prática gradual
`}

Crie 8-12 tópicos específicos para este perfil inteligente.
Ordene por dificuldade e dependências.
Adapte baseado no nível adaptativo detectado.

Responda APENAS em JSON:
{
  "topics": [
    {
      "title": "Nome do Tópico",
      "description": "Descrição detalhada do que será aprendido",
      "type": "concept|exercise|project|challenge",
      "difficulty": 1-5,
      "estimatedTime": minutos,
      "prerequisites": ["tópico1", "tópico2"],
      "learningObjectives": ["objetivo1", "objetivo2", "objetivo3"],
      "tags": ["tag1", "tag2"],
      "priority": 1-10,
      "adaptiveLevel": "${assessment.adaptiveLevel || 'beginner'}",
      "focusArea": "syntax|concepts|advanced|fundamentals"
    }
  ],
  "estimatedCompletionTime": total_em_minutos,
  "adaptationRules": [
    {
      "condition": "if struggling with X",
      "action": "provide_hint|skip|reinforce|change_approach",
      "parameters": {"detail": "valor"}
    }
  ]
}

EXEMPLOS por nível adaptativo:
- beginner: Variables, Input/Output, Conditionals, Loops
- intermediate_syntax: ${assessment.language} Syntax, Data Structures in ${assessment.language}, ${assessment.language} Idioms  
- intermediate_concepts: Advanced Functions, OOP in ${assessment.language}, Error Handling
- advanced: Design Patterns, Performance, Testing, Architecture`;

    try {
      const result = await this.topicGenerator.generateContent(prompt);
      const curriculumData = JSON.parse(result.response.text().replace(/```json|```/g, '').trim());
      
      // Adiciona IDs únicos para cada tópico
      const topicsWithIds = curriculumData.topics.map((topic: any, index: number) => ({
        id: `topic_${Date.now()}_${index}`,
        ...topic
      }));

      return {
        id: `curriculum_${Date.now()}`,
        userId: assessment.id,
        language: assessment.language,
        level: assessment.level,
        topics: topicsWithIds,
        currentTopicIndex: 0,
        estimatedCompletionTime: curriculumData.estimatedCompletionTime,
        adaptationRules: curriculumData.adaptationRules,
        createdAt: new Date(),
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Erro na geração do currículo:', error);
      return this.createFallbackCurriculum(assessment);
    }
  }

  /**
   * Fallback inteligente para assessment
   */
  private static createIntelligentFallbackAssessment(language: string, responses: string[]): UserAssessment {
    // Análise básica das respostas para fallback inteligente
    const hasExperience = responses.some(r => 
      r.toLowerCase().includes('java') || 
      r.toLowerCase().includes('python') || 
      r.toLowerCase().includes('javascript') ||
      r.toLowerCase().includes('programação') ||
      r.toLowerCase().includes('código') ||
      r.toLowerCase().includes('anos')
    );

    const isNewToLanguage = responses.some(r => 
      r.toLowerCase().includes('novo') || 
      r.toLowerCase().includes('começando') ||
      r.toLowerCase().includes('nunca') ||
      r.toLowerCase().includes('primeiro')
    );

    let adaptiveLevel: 'beginner' | 'intermediate_syntax' | 'intermediate_concepts' | 'advanced';
    let generalLevel: 'none' | 'basic' | 'intermediate' | 'advanced';
    let languageLevel: 'none' | 'basic' | 'intermediate' | 'advanced';

    if (hasExperience && isNewToLanguage) {
      // Sabe programar mas novo na linguagem
      adaptiveLevel = 'intermediate_syntax';
      generalLevel = 'intermediate';
      languageLevel = 'none';
    } else if (hasExperience) {
      // Tem experiência geral
      adaptiveLevel = 'intermediate_concepts';
      generalLevel = 'intermediate';
      languageLevel = 'basic';
    } else {
      // Iniciante completo
      adaptiveLevel = 'beginner';
      generalLevel = 'none';
      languageLevel = 'none';
    }

    return {
      id: Date.now().toString(),
      language,
      level: adaptiveLevel === 'beginner' ? 'beginner' : 'intermediate',
      experience: hasExperience ? 'Tem experiência em programação' : 'Iniciante em programação',
      interests: ['programação básica', 'resolução de problemas'],
      previousKnowledge: hasExperience ? ['conceitos básicos'] : [],
      learningStyle: 'mixed',
      goals: ['aprender programação', 'resolver problemas'],
      timeAvailable: 'medium',
      completedAt: new Date(),
      // Campos inteligentes
      generalProgrammingLevel: generalLevel,
      languageSpecificLevel: languageLevel,
      adaptiveLevel: adaptiveLevel,
      programmingExperienceYears: hasExperience ? 2 : 0,
      languageExperienceLevel: 'never_used'
    };
  }

  /**
   * Assessment padrão para fallback
   */
  private static createFallbackAssessment(language: string): UserAssessment {
    return {
      id: Date.now().toString(),
      language,
      level: 'beginner',
      experience: 'Iniciante em programação',
      interests: ['programação básica', 'resolução de problemas'],
      previousKnowledge: [],
      learningStyle: 'mixed',
      goals: ['aprender programação', 'resolver problemas'],
      timeAvailable: 'medium',
      completedAt: new Date()
    };
  }

  /**
   * Currículo padrão para fallback
   */
  private static createFallbackCurriculum(assessment: UserAssessment): PersonalizedCurriculum {
    const basicTopics: LearningTopic[] = [
      {
        id: 'topic_variables',
        title: 'Variáveis e Tipos de Dados',
        description: 'Aprenda a criar e usar variáveis, entenda diferentes tipos de dados',
        type: 'concept',
        difficulty: 1,
        estimatedTime: 30,
        prerequisites: [],
        learningObjectives: ['Criar variáveis', 'Entender tipos de dados', 'Usar variáveis em código'],
        tags: ['fundamentals', 'variables'],
        priority: 10
      },
      {
        id: 'topic_conditionals',
        title: 'Estruturas Condicionais',
        description: 'Tome decisões no seu código usando if, else e elif',
        type: 'concept',
        difficulty: 2,
        estimatedTime: 45,
        prerequisites: ['Variáveis e Tipos de Dados'],
        learningObjectives: ['Usar if/else', 'Combinar condições', 'Resolver problemas com lógica'],
        tags: ['logic', 'conditionals'],
        priority: 9
      }
    ];

    return {
      id: `curriculum_${Date.now()}`,
      userId: assessment.id,
      language: assessment.language,
      level: assessment.level,
      topics: basicTopics,
      currentTopicIndex: 0,
      estimatedCompletionTime: 120,
      adaptationRules: [
        {
          condition: 'struggling_with_concept',
          action: 'provide_hint',
          parameters: { type: 'explanatory' }
        }
      ],
      createdAt: new Date(),
      lastUpdated: new Date()
    };
  }

  /**
   * Adapta currículo baseado no progresso
   */
  static async adaptCurriculum(
    curriculum: PersonalizedCurriculum, 
    progressData: any
  ): Promise<PersonalizedCurriculum> {
    // Implementar lógica de adaptação baseada no progresso
    // Por exemplo: ajustar dificuldade, reordenar tópicos, adicionar reforços
    
    const updatedCurriculum = { ...curriculum };
    updatedCurriculum.lastUpdated = new Date();
    
    // Aqui você pode implementar regras de adaptação mais complexas
    // baseadas nos dados de progresso do usuário
    
    return updatedCurriculum;
  }
}

/**
 * Service para gerenciar assessments e currículos
 */
export class LearningPathService {
  private static assessments = new Map<string, UserAssessment>();
  private static curricula = new Map<string, PersonalizedCurriculum>();

  static async processAssessment(responses: string[], language: string): Promise<{
    assessment: UserAssessment;
    curriculum: PersonalizedCurriculum;
  }> {
    // 1. Analisa as respostas
    const assessment = await CurriculumFactory.analyzeAssessment(responses, language);
    
    // 2. Gera currículo personalizado
    const curriculum = await CurriculumFactory.generatePersonalizedCurriculum(assessment);
    
    // 3. Armazena na memória (em produção, seria banco de dados)
    this.assessments.set(assessment.id, assessment);
    this.curricula.set(curriculum.id, curriculum);
    
    return { assessment, curriculum };
  }

  static getAssessment(id: string): UserAssessment | undefined {
    return this.assessments.get(id);
  }

  static getCurriculum(id: string): PersonalizedCurriculum | undefined {
    return this.curricula.get(id);
  }

  static updateCurriculum(curriculum: PersonalizedCurriculum): void {
    this.curricula.set(curriculum.id, curriculum);
  }
}
