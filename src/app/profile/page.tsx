/**
 * 👤 Página de Perfil do Usuário
 * Página dedicada para visualização e edição do perfil
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfileModal } from '@/components/auth';
import { useAuth } from '@/hooks/useAuth';

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-elevated border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Redirecionando...
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Meu Perfil</h1>
          <p className="text-muted">Gerencie suas informações pessoais</p>
        </div>
        
        <UserProfileModal
          isOpen={true}
          onClose={() => router.push('/')}
        />
      </div>
    </div>
  );
}
