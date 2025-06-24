/**
 * 🔐 Hook de Autenticação
 * Gerencia estado de autenticação no frontend
 */

'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { AuthUser } from '@/lib/auth';

// Tipos para o contexto de autenticação
interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  convertAnonymousUser: (email: string, password: string, name: string) => Promise<boolean>;
}

interface AuthContextType extends AuthState, AuthActions {}

// Contexto de autenticação
export const AuthContext = createContext<AuthContextType | null>(null);

// Provider de autenticação
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    isLoading: true,
    isAuthenticated: false
  });

  // Salva tokens no localStorage
  const saveTokens = useCallback((accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }, []);

  // Remove tokens do localStorage
  const clearTokens = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }, []);

  // Carrega tokens do localStorage
  const loadTokensFromStorage = useCallback(() => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    return { accessToken, refreshToken };
  }, []);

  // Verifica se usuário está autenticado
  const checkAuth = useCallback(async () => {
    const { accessToken } = loadTokensFromStorage();
    
    if (!accessToken) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const { user } = await response.json();
        const { refreshToken } = loadTokensFromStorage();
        
        setState({
          user,
          accessToken,
          refreshToken,
          isLoading: false,
          isAuthenticated: true
        });
      } else {
        // Token expirado, tenta refresh
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          clearTokens();
          setState(prev => ({ ...prev, isLoading: false }));
        }
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      clearTokens();
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [loadTokensFromStorage, clearTokens]);

  // Login
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const { user, accessToken, refreshToken } = await response.json();
        
        saveTokens(accessToken, refreshToken);
        setState({
          user,
          accessToken,
          refreshToken,
          isLoading: false,
          isAuthenticated: true
        });
        
        console.log('✅ Login realizado com sucesso');
        return true;
      } else {
        const { error } = await response.json();
        console.error('❌ Erro no login:', error);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro no login:', error);
      return false;
    }
  }, [saveTokens]);

  // Registro
  const register = useCallback(async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });

      if (response.ok) {
        const { user, accessToken, refreshToken } = await response.json();
        
        saveTokens(accessToken, refreshToken);
        setState({
          user,
          accessToken,
          refreshToken,
          isLoading: false,
          isAuthenticated: true
        });
        
        console.log('✅ Registro realizado com sucesso');
        return true;
      } else {
        const { error } = await response.json();
        console.error('❌ Erro no registro:', error);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro no registro:', error);
      return false;
    }
  }, [saveTokens]);

  // Logout
  const logout = useCallback(async () => {
    try {
      const { refreshToken } = loadTokensFromStorage();
      
      if (refreshToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
      }
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      clearTokens();
      setState({
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        isAuthenticated: false
      });
      
      console.log('✅ Logout realizado');
    }
  }, [loadTokensFromStorage, clearTokens]);

  // Refresh token
  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    try {
      const { refreshToken } = loadTokensFromStorage();
      
      if (!refreshToken) {
        return false;
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (response.ok) {
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await response.json();
        
        saveTokens(newAccessToken, newRefreshToken);
        setState(prev => ({
          ...prev,
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        }));
        
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Erro no refresh token:', error);
      return false;
    }
  }, [loadTokensFromStorage, saveTokens]);

  // Converte usuário anônimo em registrado
  const convertAnonymousUser = useCallback(async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      // TODO: Implementar conversão via API
      console.warn('Conversão de usuário anônimo ainda não implementada');
      return await register(email, password, name);
    } catch (error) {
      console.error('Erro na conversão de usuário:', error);
      return false;
    }
  }, [register]);

  // Verifica autenticação na inicialização
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshAccessToken,
    convertAnonymousUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar o contexto de autenticação
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

// Hook simplificado para status de autenticação
export function useAuthStatus() {
  const { isAuthenticated, isLoading, user } = useAuth();
  return { isAuthenticated, isLoading, user };
}

// Hook para ações de autenticação
export function useAuthActions() {
  const { login, register, logout, convertAnonymousUser } = useAuth();
  return { login, register, logout, convertAnonymousUser };
}
