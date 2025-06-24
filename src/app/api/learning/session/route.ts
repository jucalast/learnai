import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId, language, sessionType, assessmentId, curriculumId, topicId } = await request.json();

    if (!userId || !language) {
      return NextResponse.json(
        { error: 'userId e language são obrigatórios' },
        { status: 400 }
      );
    }

    console.log('🚀 Criando sessão:', { userId, language, sessionType });

    const session = await SessionService.startSession(
      userId,
      language,
      sessionType || 'learning',
      assessmentId,
      curriculumId,
      topicId
    );

    console.log('✅ Sessão criada:', session?.id);

    return NextResponse.json({
      success: true,
      data: session
    });

  } catch (error) {
    console.error('❌ Erro ao criar sessão:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { sessionId, action } = await request.json();

    if (!sessionId || !action) {
      return NextResponse.json(
        { error: 'sessionId e action são obrigatórios' },
        { status: 400 }
      );
    }

    if (action === 'end') {
      console.log('🏁 Finalizando sessão:', sessionId);
      
      const session = await SessionService.endSession(sessionId);
      
      console.log('✅ Sessão finalizada:', sessionId);
      
      return NextResponse.json({
        success: true,
        data: session
      });
    }

    return NextResponse.json(
      { error: 'Action não suportada' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ Erro ao atualizar sessão:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
