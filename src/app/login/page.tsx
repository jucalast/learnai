/**
 * 🔐 Página de Login
 * Página dedicada para autenticação
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginModal } from '@/components/auth';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-elevated border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Redirecionando...
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">LearnAI</h1>
          <p className="text-muted">Seu tutor de programação com IA</p>
        </div>
        
        <LoginModal
          isOpen={true}
          onClose={() => router.push('/')}
          initialMode="login"
        />
      </div>
    </div>
  );
}
