/**
 * 🔐 API Route - Registro de Usuário
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';

// Forçar esta rota a ser dinâmica
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validações básicas
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, senha e nome são obrigatórios' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Valida formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Registra usuário
    const authResponse = await AuthService.register({
      email,
      password,
      name
    });

    console.log('✅ Usuário registrado via API:', authResponse.user.id);

    return NextResponse.json({
      success: true,
      user: authResponse.user,
      accessToken: authResponse.accessToken,
      refreshToken: authResponse.refreshToken
    });

  } catch (error) {
    console.error('❌ Erro no registro:', error);
    
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
