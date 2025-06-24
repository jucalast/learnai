/**
 * 🔐 Cliente Provider
 * Wrapper para usar contextos client-side no layout
 */

'use client';

import { AuthProvider } from '@/hooks/useAuth';
import { ReactNode } from 'react';

interface ClientProvidersProps {
  children: ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
