/**
 * 🔐 Modal de Login/Registro
 * Interface para autenticação de usuários
 */

'use client';

import React, { useState } from 'react';
import { X, Eye, EyeOff, User, Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export function LoginModal({ isOpen, onClose, initialMode = 'login' }: LoginModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const { login, register } = useAuth();

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (mode === 'register') {
      if (!formData.name) {
        newErrors.name = 'Nome é obrigatório';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Senhas não conferem';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      let success = false;

      if (mode === 'login') {
        success = await login(formData.email, formData.password);
      } else {
        success = await register(formData.email, formData.password, formData.name);
      }

      if (success) {
        onClose();
        setFormData({ email: '', password: '', name: '', confirmPassword: '' });
      } else {
        setErrors({
          submit: mode === 'login' 
            ? 'Email ou senha incorretos' 
            : 'Erro ao criar conta. Tente novamente.'
        });
      }
    } catch (error) {
      setErrors({ submit: 'Erro interno. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setErrors({});
    setFormData({ email: '', password: '', name: '', confirmPassword: '' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-secondary rounded-lg w-full max-w-md border border-tertiary">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-tertiary">
          <div className="flex items-center gap-2">
            {mode === 'login' ? (
              <LogIn className="w-5 h-5 text-muted" />
            ) : (
              <UserPlus className="w-5 h-5 text-muted" />
            )}
            <h2 className="text-lg font-semibold text-primary">
              {mode === 'login' ? 'Entrar' : 'Criar Conta'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover-bg-tertiary rounded text-muted hover:text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nome (apenas no registro) */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Nome Completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-tertiary border border-muted rounded-lg text-primary placeholder-muted focus:border-elevated focus:outline-none transition-colors"
                  placeholder="Seu nome completo"
                />
              </div>
              {errors.name && (
                <p className="text-red-400 text-sm mt-1">{errors.name}</p>
              )}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-tertiary border border-muted rounded-lg text-primary placeholder-muted focus:border-elevated focus:outline-none transition-colors"
                placeholder="seu@email.com"
              />
            </div>
            {errors.email && (
              <p className="text-red-400 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Senha */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-12 py-3 bg-tertiary border border-muted rounded-lg text-primary placeholder-muted focus:border-elevated focus:outline-none transition-colors"
                placeholder="Sua senha"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-400 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Confirmar Senha (apenas no registro) */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-tertiary border border-muted rounded-lg text-primary placeholder-muted focus:border-elevated focus:outline-none transition-colors"
                  placeholder="Confirme sua senha"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>
          )}

          {/* Erro geral */}
          {errors.submit && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-400 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Botão Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-elevated hover-bg-subtle text-primary font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {mode === 'login' ? (
                  <LogIn className="w-5 h-5" />
                ) : (
                  <UserPlus className="w-5 h-5" />
                )}
                {mode === 'login' ? 'Entrar' : 'Criar Conta'}
              </>
            )}
          </button>

          {/* Switch Mode */}
          <div className="text-center pt-4">
            <p className="text-muted text-sm">
              {mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
              <button
                type="button"
                onClick={switchMode}
                className="ml-2 text-primary hover:text-elevated font-medium transition-colors"
              >
                {mode === 'login' ? 'Criar conta' : 'Fazer login'}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
