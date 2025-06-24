/**
 * API Route para gerenciar currículos
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { CurriculumService } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    console.log('📚 API Curriculum POST chamada');
    
    const body = await request.json();
    console.log('📥 Dados recebidos:', body);
    
    const { assessmentId, curriculumData } = body;

    // Validar dados obrigatórios
    if (!assessmentId || !curriculumData) {
      console.log('❌ Dados obrigatórios faltando:', { assessmentId: !!assessmentId, curriculumData: !!curriculumData });
      return NextResponse.json(
        { error: 'AssessmentId e curriculumData são obrigatórios' },
        { status: 400 }
      );
    }

    console.log('🔄 Criando currículo para assessment:', assessmentId);
    
    // Criar currículo no banco de dados
    const curriculum = await CurriculumService.createCurriculum(
      assessmentId,
      curriculumData
    );

    console.log('✅ Currículo criado com sucesso:', curriculum.id);

    return NextResponse.json({
      success: true,
      curriculum
    });

  } catch (error) {
    console.error('❌ Erro ao criar currículo:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack');
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assessmentId = searchParams.get('assessmentId');

    if (!assessmentId) {
      return NextResponse.json(
        { error: 'AssessmentId é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar currículo por assessment
    const curriculum = await CurriculumService.getCurriculumByAssessment(assessmentId);

    return NextResponse.json({
      success: true,
      curriculum
    });

  } catch (error) {
    console.error('❌ Erro ao buscar currículo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { curriculumId, currentTopicIndex, progressData } = await request.json();

    if (!curriculumId || currentTopicIndex === undefined) {
      return NextResponse.json(
        { error: 'CurriculumId e currentTopicIndex são obrigatórios' },
        { status: 400 }
      );
    }

    // Atualizar progresso do currículo
    await CurriculumService.updateCurriculumProgress(
      curriculumId,
      currentTopicIndex
    );

    // Se necessário, desbloquear próximo tópico
    if (progressData?.completed) {
      await CurriculumService.unlockNextTopic(curriculumId, currentTopicIndex);
    }

    return NextResponse.json({
      success: true,
      message: 'Progresso atualizado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar progresso do currículo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
