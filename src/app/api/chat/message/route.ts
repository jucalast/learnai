/**
 * API Route para persistir mensagens de chat
 */

import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const {
      sessionId,
      message,
      isUser,
      messageType,
      metadata
    } = await request.json();

    // Validar dados obrigatórios
    if (!sessionId || !message) {
      return NextResponse.json(
        { error: 'SessionId e message são obrigatórios' },
        { status: 400 }
      );
    }

    // Persistir mensagem usando SessionService
    const chatMessage = await SessionService.addChatMessage(
      sessionId,
      isUser ? 'user' : 'ai',
      message,
      messageType || 'conversation'
    );

    return NextResponse.json({
      success: true,
      messageId: chatMessage.id
    });

  } catch (error) {
    console.error('❌ Erro ao salvar mensagem de chat:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'SessionId é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar mensagens da sessão (implementar se necessário)
    // Por enquanto, retornamos array vazio
    return NextResponse.json({
      messages: []
    });

  } catch (error) {
    console.error('❌ Erro ao buscar mensagens:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
