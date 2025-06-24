/**
 * 🔐 API Route - Refresh Token
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';

// Forçar esta rota a ser dinâmica
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token é obrigatório' },
        { status: 400 }
      );
    }

    // Gera novos tokens
    const tokens = await AuthService.refreshToken(refreshToken);

    return NextResponse.json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });

  } catch (error) {
    console.error('❌ Erro no refresh token:', error);
    
    return NextResponse.json(
      { error: 'Token inválido ou expirado' },
      { status: 401 }
    );
  }
}
