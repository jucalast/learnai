/**
 * API Route para persistir eventos de código
 */

import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const {
      sessionId,
      eventType,
      code,
      explanation,
      metadata
    } = await request.json();

    // Validar dados obrigatórios
    if (!sessionId || !eventType || !code) {
      return NextResponse.json(
        { error: 'SessionId, eventType e code são obrigatórios' },
        { status: 400 }
      );
    }

    // Persistir evento usando SessionService
    const codeEvent = await SessionService.addCodeEvent(
      sessionId,
      eventType,
      code,
      explanation
    );

    return NextResponse.json({
      success: true,
      eventId: codeEvent.id
    });

  } catch (error) {
    console.error('❌ Erro ao salvar evento de código:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
