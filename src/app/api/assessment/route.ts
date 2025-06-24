/**
 * API Route para gerenciar assessments
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { AssessmentService } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    console.log('📊 API Assessment POST chamada');
    
    const assessmentData = await request.json();
    console.log('📥 Dados recebidos:', assessmentData);

    // Validar dados obrigatórios
    if (!assessmentData.userId || !assessmentData.language) {
      console.log('❌ Dados obrigatórios faltando:', { 
        userId: !!assessmentData.userId, 
        language: !!assessmentData.language 
      });
      return NextResponse.json(
        { error: 'UserId e language são obrigatórios' },
        { status: 400 }
      );
    }

    console.log('🔄 Criando assessment para usuário:', assessmentData.userId);

    // Criar assessment no banco de dados
    const assessment = await AssessmentService.createAssessment(
      assessmentData.userId,
      assessmentData
    );

    console.log('✅ Assessment criado com sucesso:', assessment.id);

    return NextResponse.json({
      success: true,
      assessment
    });

  } catch (error) {
    console.error('❌ Erro ao criar assessment:', error);
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
    const userId = searchParams.get('userId');
    const language = searchParams.get('language');

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar assessments do usuário
    const assessments = await AssessmentService.getUserAssessments(userId);
    
    // Filtrar por linguagem se fornecida
    const filteredAssessments = language 
      ? assessments.filter(a => a.language === language)
      : assessments;

    return NextResponse.json({
      success: true,
      assessments: filteredAssessments
    });

  } catch (error) {
    console.error('❌ Erro ao buscar assessments:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
