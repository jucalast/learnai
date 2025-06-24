/**
 * 👤 Modal de Perfil do Usuário
 * Interface para visualizar e editar perfil
 */

'use client';

import React, { useState } from 'react';
import { X, User, Mail, Calendar, Shield, Edit2, Save, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  if (!isOpen || !user) return null;

  const handleSave = async () => {
    // TODO: Implementar atualização de perfil via API
    console.log('Salvando perfil:', formData);
    setIsEditing(false);
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUserTypeLabel = (userType: string) => {
    switch (userType) {
      case 'registered':
        return 'Usuário Registrado';
      case 'anonymous':
        return 'Usuário Anônimo';
      case 'premium':
        return 'Usuário Premium';
      default:
        return 'Usuário';
    }
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'registered':
        return 'text-green-400 bg-green-900/20 border-green-500/30';
      case 'anonymous':
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      case 'premium':
        return 'text-purple-400 bg-purple-900/20 border-purple-500/30';
      default:
        return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-secondary rounded-lg w-full max-w-md border border-tertiary">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-tertiary">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-muted" />
            <h2 className="text-lg font-semibold text-primary">Perfil do Usuário</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover-bg-tertiary rounded text-muted hover:text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Avatar e Nome */}
          <div className="text-center">
            <div className="w-20 h-20 bg-elevated rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-muted" />
            </div>
            {isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="text-xl font-semibold text-primary bg-tertiary border border-muted rounded px-3 py-1 text-center"
              />
            ) : (
              <h3 className="text-xl font-semibold text-primary">{user.name}</h3>
            )}
            
            {/* Status Badge */}
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border mt-2 ${getUserTypeColor(user.userType)}`}>
              <Shield className="w-3 h-3" />
              {getUserTypeLabel(user.userType)}
            </div>
          </div>

          {/* Informações */}
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Email
              </label>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted" />
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="flex-1 bg-tertiary border border-muted rounded px-3 py-2 text-primary"
                  />
                ) : (
                  <span className="text-primary">{user.email}</span>
                )}
              </div>
            </div>

            {/* Data de Criação - removido temporariamente */}
            
            {/* Email verificado */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Status da conta
              </label>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-muted" />
                <span className={`text-sm ${user.isVerified ? 'text-green-400' : 'text-yellow-400'}`}>
                  {user.isVerified ? 'Conta verificada' : 'Aguardando verificação'}
                </span>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="bg-tertiary rounded-lg p-4">
              <h4 className="text-sm font-medium text-secondary mb-3">Estatísticas</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted text-sm">Sessões de estudo</span>
                  <span className="text-primary text-sm font-medium">-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted text-sm">Tempo total</span>
                  <span className="text-primary text-sm font-medium">-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted text-sm">Linguagens estudadas</span>
                  <span className="text-primary text-sm font-medium">-</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Salvar
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({ name: user.name || '', email: user.email || '' });
                  }}
                  className="px-4 py-2 bg-tertiary hover-bg-elevated text-primary font-medium rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 py-2 bg-elevated hover-bg-subtle text-primary font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar Perfil
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
