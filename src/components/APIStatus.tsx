import React from 'react';
import { AlertTriangle, Wifi, WifiOff, XCircle } from 'lucide-react';

interface APIStatusProps {
  isOnline?: boolean;
  quotaExceeded?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  className?: string;
}

export default function APIStatus({ 
  isOnline = true, 
  quotaExceeded = false,
  hasError = false,
  errorMessage = '',
  className = '' 
}: APIStatusProps) {
  if (hasError || quotaExceeded) {
    return (
      <div className={`flex items-center gap-2 text-red-400 text-xs ${className}`}>
        <XCircle className="w-3 h-3" />
        <span>
          {quotaExceeded 
            ? 'Limite da API atingido (50/dia)' 
            : errorMessage || 'Erro na API'
          }
        </span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className={`flex items-center gap-2 text-amber-400 text-xs ${className}`}>
        <WifiOff className="w-3 h-3" />
        <span>Sem conexão</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-green-400 text-xs ${className}`}>
      <Wifi className="w-3 h-3" />
      <span>IA funcionando</span>
    </div>
  );
}
