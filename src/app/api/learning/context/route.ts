import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Processar contexto de aprendizado
    // Por enquanto, apenas retornar um status OK
    
    return NextResponse.json({
      status: 'success',
      message: 'Contexto de aprendizado processado',
      data
    });
  } catch (error) {
    console.error('Erro ao processar contexto de aprendizado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    message: 'API de contexto de aprendizado está funcionando'
  });
}