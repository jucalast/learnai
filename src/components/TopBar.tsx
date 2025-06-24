'use client';

import { useState } from 'react';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Save, 
  Download, 
  Upload, 
  Settings, 
  HelpCircle,
  Bot,
  BotOff,
  Menu,
  X,
  Terminal,
  Eye,
  EyeOff
} from 'lucide-react';
import { Language } from '@/types';
import { UserButton } from '@/components/auth';

interface TopBarProps {
  language: Language;
  onRun?: () => void;
  onSave?: () => void;
  onReset?: () => void;
  isAIActive: boolean;
  onToggleAI: () => void;
  onToggleSidebar?: () => void;
  onToggleOutputPanel?: () => void;
  isSidebarOpen?: boolean;
  isOutputPanelOpen?: boolean;
  isMobile?: boolean;
}

export default function TopBar({ 
  language, 
  onRun, 
  onSave, 
  onReset,
  isAIActive,
  onToggleAI,
  onToggleSidebar,
  onToggleOutputPanel,
  isSidebarOpen,
  isOutputPanelOpen,
  isMobile
}: TopBarProps) {
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = () => {
    if (isRunning) {
      setIsRunning(false);
      return;
    }

    setIsRunning(true);
    onRun?.();
    
    // Simulate execution time
    setTimeout(() => {
      setIsRunning(false);
    }, 2000);
  };

  return (
    <div className="h-12 md:h-14 bg-[#323233] border-b border-frame flex items-center justify-between px-2 md:px-4">
      {/* Left Section - Mobile Menu + File Info */}
      <div className="flex items-center space-x-2 md:space-x-4">
        {/* Mobile Menu Button */}
        {isMobile && (
          <button
            className="p-2 hover-bg-tertiary rounded text-tertiary"
            onClick={onToggleSidebar}
            title="Menu"
          >
            {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        )}
        
        <div className="flex items-center">
          <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-400 mr-2 md:mr-3"></div>
          <span className="text-white font-medium text-sm md:text-base">
            main{language.extension}
          </span>
          {!isMobile && (
            <span className="ml-2 text-xs text-muted">
              {language.name}
            </span>
          )}
        </div>
      </div>

      {/* Center Section - Action Buttons */}
      <div className="flex items-center space-x-1 md:space-x-2">
        {/* Run/Stop Button */}
        <button
          className={`flex items-center px-2 md:px-3 py-1 md:py-2 rounded transition-colors text-xs md:text-sm font-medium ${
            isRunning 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
          onClick={handleRun}
          title={isRunning ? 'Parar' : 'Executar'}
        >
          {isRunning ? <Square className="w-3 h-3 md:w-4 md:h-4 md:mr-1" /> : <Play className="w-3 h-3 md:w-4 md:h-4 md:mr-1" />}
          {!isMobile && <span>{isRunning ? 'Parar' : 'Executar'}</span>}
        </button>
        
        {!isMobile && (
          <>
            <div className="w-px h-4 md:h-6 bg-elevated mx-1 md:mx-2"></div>
            
            <button
              className="flex items-center px-2 md:px-3 py-1 md:py-2 rounded transition-colors hover-bg-tertiary text-tertiary text-xs md:text-sm font-medium"
              onClick={onSave}
              title="Salvar"
            >
              <Save className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              <span>Salvar</span>
            </button>
            
            <button
              className="flex items-center px-2 md:px-3 py-1 md:py-2 rounded transition-colors hover-bg-tertiary text-tertiary text-xs md:text-sm font-medium"
              onClick={onReset}
              title="Resetar"
            >
              <RotateCcw className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              <span>Resetar</span>
            </button>
            
            <div className="w-px h-4 md:h-6 bg-elevated mx-1 md:mx-2"></div>
            
            <button
              className={`flex items-center px-2 md:px-3 py-1 md:py-2 rounded transition-colors text-xs md:text-sm font-medium ${
                isOutputPanelOpen ? 'bg-tertiary text-white' : 'hover-bg-tertiary text-tertiary'
              }`}
              onClick={onToggleOutputPanel}
              title={isOutputPanelOpen ? 'Ocultar Terminal' : 'Mostrar Terminal'}
            >
              <Terminal className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              <span>Terminal</span>
            </button>
          </>
        )}
      </div>

      {/* Right Section - Panel Toggles and AI */}
      <div className="flex items-center space-x-1 md:space-x-2">
        {/* Output Panel Toggle (Mobile) */}
        {isMobile && (
          <button
            className={`p-2 rounded transition-colors ${
              isOutputPanelOpen ? 'bg-tertiary text-white' : 'hover-bg-tertiary text-tertiary'
            }`}
            onClick={onToggleOutputPanel}
            title={isOutputPanelOpen ? 'Ocultar Terminal' : 'Mostrar Terminal'}
          >
            <Terminal className="w-4 h-4" />
          </button>
        )}
        
        {/* AI Toggle */}
        <button
          className={`flex items-center px-2 md:px-3 py-1 md:py-2 rounded transition-colors text-xs md:text-sm font-medium ${
            isAIActive ? 'bg-tertiary text-white' : 'hover-bg-tertiary text-tertiary'
          }`}
          onClick={onToggleAI}
          title={isAIActive ? 'IA Ativa' : 'IA Inativa'}
        >
          {isAIActive ? <Bot className="w-3 h-3 md:w-4 md:h-4 md:mr-1" /> : <BotOff className="w-3 h-3 md:w-4 md:h-4 md:mr-1" />}
          {!isMobile && <span>{isAIActive ? 'IA' : 'IA'}</span>}
        </button>
        
        {/* Settings (Desktop only) */}
        {!isMobile && (
          <>
            <div className="w-px h-4 md:h-6 bg-elevated mx-1 md:mx-2"></div>
            
            <button
              className="flex items-center px-2 md:px-3 py-1 md:py-2 rounded transition-colors hover-bg-tertiary text-tertiary text-xs md:text-sm font-medium"
              onClick={() => {}}
              title="Configurações"
            >
              <Settings className="w-3 h-3 md:w-4 md:h-4" />
            </button>
            
            {/* User Button */}
            <div className="w-px h-4 md:h-6 bg-elevated mx-1 md:mx-2"></div>
            <UserButton />
          </>
        )}
        
        {/* Mobile User Button */}
        {isMobile && (
          <>
            <div className="w-px h-4 bg-elevated mx-1"></div>
            <UserButton />
          </>
        )}
      </div>
    </div>
  );
}
