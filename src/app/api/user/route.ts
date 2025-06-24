/**
 * API Route para gerenciar usuários
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAnonymousUser, findOrCreateUser } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { email, name, type = 'anonymous' } = await request.json();

    let userId: string;

    if (type === 'registered' && email) {
      // Criar ou encontrar usuário registrado
      userId = await findOrCreateUser(email, name);
    } else {
      // Criar usuário anônimo
      userId = await createAnonymousUser();
    }

    return NextResponse.json({
      success: true,
      userId,
      type: email ? 'registered' : 'anonymous'
    });

  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId é obrigatório' },
        { status: 400 }
      );
    }

    // Por enquanto, apenas confirmamos que o usuário existe
    // Em produção, buscaríamos dados completos do usuário
    return NextResponse.json({
      success: true,
      userId,
      exists: true
    });

  } catch (error) {
    console.error('❌ Erro ao buscar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
