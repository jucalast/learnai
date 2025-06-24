/**
 * 🔐 API Route - Login de Usuário
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';

// Forçar esta rota a ser dinâmica
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validações básicas
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Faz login
    const authResponse = await AuthService.login({
      email,
      password
    });

    console.log('✅ Login realizado via API:', authResponse.user.id);

    return NextResponse.json({
      success: true,
      user: authResponse.user,
      accessToken: authResponse.accessToken,
      refreshToken: authResponse.refreshToken
    });

  } catch (error) {
    console.error('❌ Erro no login:', error);
    
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    
    // Se for erro de credenciais, retorna 401
    if (message.includes('Credenciais inválidas')) {
      return NextResponse.json(
        { error: message },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
