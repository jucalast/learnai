/**
 * 🔐 API Route - Logout
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';

// Forçar esta rota a ser dinâmica
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (refreshToken) {
      await AuthService.logout(refreshToken);
    }

    return NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro no logout:', error);
    
    // Mesmo com erro, retorna sucesso pois logout deve ser sempre possível
    return NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  }
}
