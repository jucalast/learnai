'use client';

import { useState } from 'react';
import { Plus, Play, Save, RotateCcw, Menu, X } from 'lucide-react';

interface MobileActionButtonProps {
  onRun?: () => void;
  onSave?: () => void;
  onReset?: () => void;
  onToggleMenu?: () => void;
  isMenuOpen?: boolean;
}

export default function MobileActionButton({
  onRun,
  onSave,
  onReset,
  onToggleMenu,
  isMenuOpen
}: MobileActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const ActionItem = ({ 
    icon: Icon, 
    label, 
    onClick, 
    variant = 'default' 
  }: {
    icon: any;
    label: string;
    onClick?: () => void;
    variant?: 'default' | 'primary' | 'success';
  }) => {
    const getVariantClasses = () => {
      switch (variant) {
        case 'primary':
          return 'bg-tertiary text-white';
        case 'success':
          return 'bg-green-600 text-white';
        default:
          return 'bg-tertiary text-secondary';
      }
    };

    return (
      <button
        className={`
          flex items-center justify-center w-12 h-12 rounded-full shadow-lg
          transition-all duration-200 transform hover:scale-105 active:scale-95
          ${getVariantClasses()}
        `}
        onClick={() => {
          onClick?.();
          setIsExpanded(false);
        }}
        title={label}
      >
        <Icon className="w-5 h-5" />
      </button>
    );
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 md:hidden">
      {/* Expanded Actions */}
      {isExpanded && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-20 -z-10"
            onClick={() => setIsExpanded(false)}
          />
          
          {/* Action Items */}
          <div className="flex flex-col space-y-3 mb-3">
            <div className="transform transition-all duration-300 animate-slide-in-up">
              <ActionItem
                icon={Play}
                label="Executar"
                onClick={onRun}
                variant="success"
              />
            </div>
            <div className="transform transition-all duration-300 animate-slide-in-up delay-75">
              <ActionItem
                icon={Save}
                label="Salvar"
                onClick={onSave}
              />
            </div>
            <div className="transform transition-all duration-300 animate-slide-in-up delay-150">
              <ActionItem
                icon={RotateCcw}
                label="Resetar"
                onClick={onReset}
              />
            </div>
          </div>
        </>
      )}
      
      {/* Main FAB */}
      <button
        className={`
          flex items-center justify-center w-14 h-14 rounded-full shadow-lg
          transition-all duration-300 transform
          ${isExpanded 
            ? 'bg-red-600 text-white rotate-45' 
            : 'bg-tertiary text-white hover-bg-elevated'
          }
        `}
        onClick={toggleExpanded}
        title={isExpanded ? 'Fechar' : 'Ações rápidas'}
      >
        {isExpanded ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </button>
    </div>
  );
}
