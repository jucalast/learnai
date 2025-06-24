/**
 * 👤 Botão de Usuário
 * Botão na TopBar para login/perfil do usuário
 */

'use client';

import React, { useState } from 'react';
import { User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { LoginModal } from './LoginModal';
import { UserProfileModal } from './UserProfileModal';

export function UserButton() {
  const { user, isAuthenticated, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    await logout();
    setShowDropdown(false);
  };

  if (!isAuthenticated || !user) {
    return (
      <>
        <button
          onClick={() => setShowLoginModal(true)}
          className="flex items-center gap-2 px-3 py-2 bg-elevated hover-bg-subtle text-primary rounded-lg transition-colors"
        >
          <User className="w-4 h-4" />
          <span className="hidden sm:block">Entrar</span>
        </button>
        
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      </>
    );
  }

  return (
    <div className="relative">
      {/* User Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-2 bg-elevated hover-bg-subtle text-primary rounded-lg transition-colors"
      >
        <div className="w-6 h-6 bg-tertiary rounded-full flex items-center justify-center">
          <User className="w-4 h-4" />
        </div>
        <span className="hidden sm:block max-w-24 truncate">
          {user.name || user.email || 'Usuário'}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <>
          {/* Overlay para fechar o dropdown */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          
          <div className="absolute right-0 top-full mt-2 w-48 bg-secondary border border-tertiary rounded-lg shadow-lg z-20">
            {/* User Info */}
            <div className="px-3 py-2 border-b border-tertiary">
              <p className="text-sm font-medium text-primary truncate">
                {user.name || 'Usuário'}
              </p>
              <p className="text-xs text-muted truncate">
                {user.email || 'Usuário anônimo'}
              </p>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <button
                onClick={() => {
                  setShowProfileModal(true);
                  setShowDropdown(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary hover-bg-tertiary transition-colors"
              >
                <Settings className="w-4 h-4" />
                Meu Perfil
              </button>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
        </>
      )}

      {/* Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
}
