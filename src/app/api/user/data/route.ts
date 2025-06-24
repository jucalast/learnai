/**
 * API Route para analytics e progresso do usuário
 */

import { NextRequest, NextResponse } from 'next/server';
import { ProgressService, AnalyticsService } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'progress';

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId é obrigatório' },
        { status: 400 }
      );
    }

    let data;
    switch (type) {
      case 'analytics':
        const days = parseInt(searchParams.get('days') || '30');
        data = await AnalyticsService.getUserAnalytics(userId, days);
        break;
      
      case 'progress':
      default:
        // Buscar progresso geral do usuário (implementar método se necessário)
        data = { message: 'Progresso não implementado ainda' };
        break;
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('❌ Erro ao buscar dados do usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      assessmentId,
      progressId,
      language,
      type,
      updates
    } = await request.json();

    if (!userId || !type) {
      return NextResponse.json(
        { error: 'UserId e type são obrigatórios' },
        { status: 400 }
      );
    }

    let result;
    switch (type) {
      case 'initialize_progress':
        if (!assessmentId || !language) {
          return NextResponse.json(
            { error: 'AssessmentId e language são obrigatórios para inicializar progresso' },
            { status: 400 }
          );
        }
        result = await ProgressService.initializeProgress(userId, assessmentId, language);
        break;

      case 'update_progress':
        if (!progressId || !updates) {
          return NextResponse.json(
            { error: 'ProgressId e updates são obrigatórios para atualizar progresso' },
            { status: 400 }
          );
        }
        result = await ProgressService.updateProgress(progressId, updates, {});
        break;

      default:
        return NextResponse.json(
          { error: 'Tipo de operação não suportado' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Erro ao processar dados do usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
