/**
 * 🚀 SERVIÇOS DE BANCO DE DADOS INTELIGENTES
 * Substituindo o sistema em memória por persistência PostgreSQL
 */

import { prisma } from './prisma'
import { UserAssessment as PrismaUserAssessment, PersonalizedCurriculum as PrismaCurriculum } from '@prisma/client'
import { UserAssessment, PersonalizedCurriculum, LearningTopic } from '@/types/learningSystem'

// ===================================
// 🔧 CONVERSORES DE TIPOS
// ===================================

function convertPrismaToUserAssessment(prismaAssessment: PrismaUserAssessment): UserAssessment {
  return {
    id: prismaAssessment.id,
    language: prismaAssessment.language,
    level: prismaAssessment.level as 'beginner' | 'intermediate' | 'advanced',
    experience: prismaAssessment.experience,
    interests: prismaAssessment.interests,
    previousKnowledge: prismaAssessment.previousKnowledge,
    learningStyle: prismaAssessment.learningStyle as 'visual' | 'practical' | 'theoretical' | 'mixed',
    goals: prismaAssessment.goals,
    timeAvailable: prismaAssessment.timeAvailable as 'low' | 'medium' | 'high',
    completedAt: prismaAssessment.completedAt,
    // Novos campos inteligentes
    generalProgrammingLevel: prismaAssessment.generalProgrammingLevel as 'none' | 'basic' | 'intermediate' | 'advanced',
    languageSpecificLevel: prismaAssessment.languageSpecificLevel as 'none' | 'basic' | 'intermediate' | 'advanced',
    adaptiveLevel: prismaAssessment.adaptiveLevel as 'beginner' | 'intermediate_syntax' | 'intermediate_concepts' | 'advanced',
    programmingExperienceYears: prismaAssessment.programmingExperienceYears || undefined,
    languageExperienceLevel: prismaAssessment.languageExperienceLevel as 'never_used' | 'basic_syntax' | 'some_projects' | 'professional' || undefined
  }
}

// ===================================
// 🧠 SERVIÇO DE ASSESSMENT
// ===================================

export class AssessmentService {
  /**
   * Cria um novo assessment inteligente
   */
  static async createAssessment(
    userId: string, 
    assessmentData: Omit<UserAssessment, 'id' | 'completedAt'>
  ): Promise<UserAssessment> {
    console.log('💾 Salvando assessment inteligente no banco...', { userId, language: assessmentData.language })
    
    const prismaAssessment = await prisma.userAssessment.create({
      data: {
        userId,
        language: assessmentData.language,
        generalProgrammingLevel: assessmentData.generalProgrammingLevel || 'none',
        languageSpecificLevel: assessmentData.languageSpecificLevel || 'none',
        adaptiveLevel: assessmentData.adaptiveLevel || 'beginner',
        level: assessmentData.level,
        experience: assessmentData.experience,
        interests: assessmentData.interests,
        previousKnowledge: assessmentData.previousKnowledge,
        learningStyle: assessmentData.learningStyle,
        goals: assessmentData.goals,
        timeAvailable: assessmentData.timeAvailable,
        programmingExperienceYears: assessmentData.programmingExperienceYears,
        languageExperienceLevel: assessmentData.languageExperienceLevel,
        responses: {}, // TODO: Adicionar respostas originais
        isActive: true
      }
    })

    console.log('✅ Assessment salvo com sucesso:', prismaAssessment.id)
    return convertPrismaToUserAssessment(prismaAssessment)
  }

  /**
   * Busca assessment ativo para um usuário e linguagem
   */
  static async getActiveAssessment(userId: string, language: string): Promise<UserAssessment | null> {
    const assessment = await prisma.userAssessment.findFirst({
      where: {
        userId,
        language,
        isActive: true
      },
      orderBy: {
        completedAt: 'desc'
      }
    })

    return assessment ? convertPrismaToUserAssessment(assessment) : null
  }

  /**
   * Lista todos os assessments de um usuário
   */
  static async getUserAssessments(userId: string): Promise<UserAssessment[]> {
    const assessments = await prisma.userAssessment.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' }
    })

    return assessments.map(convertPrismaToUserAssessment)
  }
}

// ===================================
// 📚 SERVIÇO DE CURRÍCULO
// ===================================

export class CurriculumService {
  /**
   * Cria currículo personalizado e salva no banco
   */
  static async createCurriculum(
    assessmentId: string,
    curriculumData: Omit<PersonalizedCurriculum, 'id' | 'userId' | 'createdAt' | 'lastUpdated'>
  ): Promise<PersonalizedCurriculum> {
    console.log('💾 CurriculumService.createCurriculum chamado');
    console.log('📥 AssessmentId:', assessmentId);
    console.log('📥 CurriculumData:', JSON.stringify(curriculumData, null, 2));

    try {
      // Verificar se o assessment existe
      const assessment = await prisma.userAssessment.findUnique({
        where: { id: assessmentId }
      });

      if (!assessment) {
        throw new Error(`Assessment ${assessmentId} não encontrado`);
      }

      console.log('✅ Assessment encontrado:', assessment.id);

      const curriculum = await prisma.personalizedCurriculum.create({
        data: {
          assessmentId,
          language: curriculumData.language,
          level: curriculumData.level,
          adaptiveLevel: (curriculumData as any).adaptiveLevel || 'beginner',
          estimatedCompletionTime: curriculumData.estimatedCompletionTime,
          currentTopicIndex: curriculumData.currentTopicIndex,
          adaptationRules: curriculumData.adaptationRules ? JSON.parse(JSON.stringify(curriculumData.adaptationRules)) : {},
          topics: {
            create: curriculumData.topics.map((topic, index) => ({
              title: topic.title,
              description: topic.description,
              type: topic.type,
              difficulty: topic.difficulty,
              estimatedTime: topic.estimatedTime,
              prerequisites: topic.prerequisites,
              learningObjectives: topic.learningObjectives,
              tags: topic.tags,
              priority: topic.priority,
              adaptiveLevel: (topic as any).adaptiveLevel,
              focusArea: (topic as any).focusArea,
              codeExample: (topic as any).codeExample,
              explanation: (topic as any).explanation,
              exercises: (topic as any).exercises || [],
              orderIndex: index,
              isUnlocked: index === 0 // Primeiro tópico sempre desbloqueado
            }))
          }
        },
        include: {
          topics: {
            orderBy: { orderIndex: 'asc' }
          }
        }
      });

      console.log('✅ Currículo salvo com sucesso:', curriculum.id);
      return this.convertPrismaToCurriculum(curriculum);
    } catch (error) {
      console.error('❌ Erro no CurriculumService.createCurriculum:', error);
      throw error;
    }
  }

  /**
   * Busca currículo por assessment
   */
  static async getCurriculumByAssessment(assessmentId: string): Promise<PersonalizedCurriculum | null> {
    const curriculum = await prisma.personalizedCurriculum.findUnique({
      where: { assessmentId },
      include: {
        topics: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    })

    return curriculum ? this.convertPrismaToCurriculum(curriculum) : null
  }

  /**
   * Atualiza progresso do currículo
   */
  static async updateCurriculumProgress(
    curriculumId: string,
    updates: {
      currentTopicIndex?: number
      completionPercentage?: number
      isCompleted?: boolean
    }
  ): Promise<void> {
    await prisma.personalizedCurriculum.update({
      where: { id: curriculumId },
      data: {
        ...updates,
        lastUpdated: new Date()
      }
    })
  }

  /**
   * Desbloqueia próximo tópico
   */
  static async unlockNextTopic(curriculumId: string, currentTopicIndex: number): Promise<void> {
    const nextIndex = currentTopicIndex + 1
    
    await prisma.curriculumTopic.updateMany({
      where: {
        curriculumId,
        orderIndex: nextIndex
      },
      data: {
        isUnlocked: true
      }
    })
  }

  /**
   * Converte currículo do Prisma para tipo da aplicação
   */
  private static convertPrismaToCurriculum(prismaCurriculum: any): PersonalizedCurriculum {
    return {
      id: prismaCurriculum.id,
      userId: prismaCurriculum.assessmentId, // Usando assessmentId como userId por compatibilidade
      language: prismaCurriculum.language,
      level: prismaCurriculum.level,
      topics: prismaCurriculum.topics.map((topic: any): LearningTopic => ({
        id: topic.id,
        title: topic.title,
        description: topic.description,
        type: topic.type as 'concept' | 'exercise' | 'project' | 'challenge',
        difficulty: topic.difficulty,
        estimatedTime: topic.estimatedTime,
        prerequisites: topic.prerequisites,
        learningObjectives: topic.learningObjectives,
        tags: topic.tags,
        priority: topic.priority
      })),
      currentTopicIndex: prismaCurriculum.currentTopicIndex,
      estimatedCompletionTime: prismaCurriculum.estimatedCompletionTime,
      adaptationRules: Array.isArray(prismaCurriculum.adaptationRules) 
        ? prismaCurriculum.adaptationRules 
        : [],
      createdAt: prismaCurriculum.createdAt,
      lastUpdated: prismaCurriculum.lastUpdated
    }
  }
}

// ===================================
// 📊 SERVIÇO DE PROGRESSO
// ===================================

export class ProgressService {
  /**
   * Inicia tracking de progresso para um usuário
   */
  static async initializeProgress(userId: string, assessmentId: string, language: string) {
    const existingProgress = await prisma.userProgress.findFirst({
      where: { userId, assessmentId }
    })

    if (!existingProgress) {
      await prisma.userProgress.create({
        data: {
          userId,
          assessmentId,
          language,
          totalTime: 0,
          topicsCompleted: [],
          exercisesCompleted: [],
          currentScore: 0.0,
          overallProgress: 0.0,
          strugglingAreas: [],
          strengthAreas: [],
          adaptationsMade: 0
        }
      })
    }
  }

  /**
   * Atualiza progresso do usuário
   */
  static async updateProgress(
    userId: string,
    assessmentId: string,
    updates: {
      totalTime?: number
      topicsCompleted?: string[]
      exercisesCompleted?: string[]
      currentScore?: number
      overallProgress?: number
      strugglingAreas?: string[]
      strengthAreas?: string[]
    }
  ) {
    await prisma.userProgress.updateMany({
      where: { userId, assessmentId },
      data: {
        ...updates,
        lastActivity: new Date()
      }
    })
  }

  /**
   * Marca tópico como completado
   */
  static async completeTopicProgress(
    progressId: string,
    topicId: string,
    score: number,
    timeSpent: number
  ) {
    await prisma.topicProgress.upsert({
      where: {
        progressId_topicId: {
          progressId,
          topicId
        }
      },
      create: {
        progressId,
        topicId,
        isStarted: true,
        isCompleted: true,
        completionDate: new Date(),
        timeSpent,
        score,
        attempts: 1
      },
      update: {
        isCompleted: true,
        completionDate: new Date(),
        timeSpent: { increment: timeSpent },
        score,
        attempts: { increment: 1 }
      }
    })
  }
}

// ===================================
// 🎯 SERVIÇO DE SESSÕES
// ===================================

export class SessionService {
  /**
   * Inicia nova sessão de aprendizado
   */
  static async startSession(
    userId: string,
    language: string,
    sessionType: string,
    assessmentId?: string,
    curriculumId?: string,
    topicId?: string
  ) {
    const session = await prisma.learningSession.create({
      data: {
        userId,
        language,
        sessionType,
        assessmentId,
        curriculumId,
        topicId,
        startTime: new Date(),
        isActive: true
      }
    })

    return session
  }

  /**
   * Finaliza sessão de aprendizado
   */
  static async endSession(sessionId: string) {
    const session = await prisma.learningSession.findUnique({
      where: { id: sessionId }
    })

    if (session && session.isActive) {
      const duration = Math.floor((new Date().getTime() - session.startTime.getTime()) / 1000)
      
      await prisma.learningSession.update({
        where: { id: sessionId },
        data: {
          endTime: new Date(),
          duration,
          isActive: false
        }
      })

      return duration
    }

    return 0
  }

  /**
   * Adiciona mensagem ao chat da sessão
   */
  static async addChatMessage(
    sessionId: string,
    type: 'ai' | 'user',
    content: string,
    messageType?: string,
    topicId?: string
  ) {
    return await prisma.chatMessage.create({
      data: {
        sessionId,
        type,
        content,
        messageType,
        topicId,
        timestamp: new Date()
      }
    })
  }

  /**
   * Registra evento de código
   */
  static async addCodeEvent(
    sessionId: string,
    eventType: string,
    code: string,
    explanation?: string
  ) {
    return await prisma.codeEvent.create({
      data: {
        sessionId,
        eventType,
        code,
        explanation,
        timestamp: new Date()
      }
    })
  }
}

// ===================================
// 📈 SERVIÇO DE ANALYTICS
// ===================================

export class AnalyticsService {
  /**
   * Registra analytics diárias do usuário
   */
  static async recordDailyAnalytics(
    userId: string,
    metrics: {
      timeSpent?: number
      topicsViewed?: number
      exercisesAttempted?: number
      codeGenerated?: number
      messagesExchanged?: number
      sessionCount?: number
    }
  ) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    await prisma.userAnalytics.upsert({
      where: {
        userId_date: {
          userId,
          date: today
        }
      },
      create: {
        userId,
        date: today,
        ...metrics
      },
      update: {
        timeSpent: { increment: metrics.timeSpent || 0 },
        topicsViewed: { increment: metrics.topicsViewed || 0 },
        exercisesAttempted: { increment: metrics.exercisesAttempted || 0 },
        codeGenerated: { increment: metrics.codeGenerated || 0 },
        messagesExchanged: { increment: metrics.messagesExchanged || 0 },
        sessionCount: { increment: metrics.sessionCount || 0 }
      }
    })
  }

  /**
   * Busca analytics do usuário por período
   */
  static async getUserAnalytics(userId: string, days: number = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    return await prisma.userAnalytics.findMany({
      where: {
        userId,
        date: {
          gte: startDate
        }
      },
      orderBy: {
        date: 'desc'
      }
    })
  }
}

// ===================================
// 🎮 SERVIÇO DE GAMIFICAÇÃO
// ===================================

export class GamificationService {
  /**
   * Cria achievements padrão do sistema
   */
  static async createDefaultAchievements() {
    const defaultAchievements = [
      {
        title: 'Primeiro Passo',
        description: 'Complete seu primeiro assessment',
        category: 'milestone',
        condition: { type: 'assessment_completed', count: 1 },
        points: 10,
        rarity: 'common'
      },
      {
        title: 'Explorador de Código',
        description: 'Gere 100 linhas de código',
        category: 'skill',
        condition: { type: 'code_lines', count: 100 },
        points: 25,
        rarity: 'rare'
      },
      {
        title: 'Maratonista',
        description: 'Estude por 7 dias consecutivos',
        category: 'streak',
        condition: { type: 'daily_streak', count: 7 },
        points: 50,
        rarity: 'epic'
      }
    ]

    for (const achievement of defaultAchievements) {
      const existing = await prisma.achievement.findFirst({
        where: { title: achievement.title }
      })
      
      if (!existing) {
        await prisma.achievement.create({
          data: achievement
        })
      }
    }
  }

  /**
   * Desbloqueia achievement para usuário
   */
  static async unlockAchievement(userId: string, achievementTitle: string) {
    const achievement = await prisma.achievement.findFirst({
      where: { title: achievementTitle }
    })

    if (achievement) {
      await prisma.userAchievement.upsert({
        where: {
          userId_achievementId: {
            userId,
            achievementId: achievement.id
          }
        },
        create: {
          userId,
          achievementId: achievement.id,
          unlockedAt: new Date(),
          progress: 100.0
        },
        update: {
          progress: 100.0
        }
      })
    }
  }
}

// ===================================
// 🔧 SERVIÇOS AUXILIARES
// ===================================

/**
 * Cria um usuário anônimo para sessões sem login
 */
export async function createAnonymousUser(): Promise<string> {
  const user = await prisma.user.create({
    data: {
      username: `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: 'Usuário Anônimo',
      userType: 'anonymous'
    }
  })

  return user.id
}

/**
 * Busca ou cria usuário pelo email
 */
export async function findOrCreateUser(email: string, name?: string): Promise<string> {
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: name || 'Usuário',
      userType: 'registered'
    },
    update: {}
  })

  return user.id
}
