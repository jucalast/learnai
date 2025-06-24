/**
 * 👤 Status do Usuário na Sidebar
 * Mostra informações básicas do usuário na barra lateral
 */

'use client';

import React, { useState } from 'react';
import { User, LogIn, Crown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { LoginModal } from './auth';

export function UserStatus() {
  const { user, isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  if (!isAuthenticated || !user) {
    return (
      <div className="border-t border-tertiary pt-4 mt-4">
        <button
          onClick={() => setShowLoginModal(true)}
          className="w-full flex items-center gap-3 p-3 text-muted hover:text-primary hover-bg-tertiary rounded-lg transition-colors"
        >
          <LogIn className="w-5 h-5" />
          <span className="text-sm font-medium">Fazer Login</span>
        </button>
        
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      </div>
    );
  }

  const getUserIcon = () => {
    switch (user.userType) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-400" />;
      case 'registered':
        return <User className="w-4 h-4 text-green-400" />;
      default:
        return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  const getUserTypeLabel = () => {
    switch (user.userType) {
      case 'admin':
        return 'Admin';
      case 'registered':
        return 'Registrado';
      case 'anonymous':
        return 'Anônimo';
      default:
        return '';
    }
  };

  return (
    <div className="border-t border-tertiary pt-4 mt-4">
      <div className="flex items-center gap-3 p-3 bg-tertiary rounded-lg">
        <div className="w-8 h-8 bg-elevated rounded-full flex items-center justify-center">
          {getUserIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-primary truncate">
            {user.name || 'Usuário'}
          </p>
          <p className="text-xs text-muted">
            {getUserTypeLabel()}
          </p>
        </div>
        {user.isVerified && (
          <div className="w-2 h-2 bg-green-400 rounded-full" title="Conta verificada" />
        )}
      </div>
      
      {user.userType === 'anonymous' && (
        <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-500/30 rounded text-xs text-yellow-400">
          💡 Crie uma conta para salvar seu progresso!
        </div>
      )}
    </div>
  );
}
