'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { supportedLanguages } from '@/lib/languages';
import { Language } from '@/types';
import { useResponsive } from '@/lib/useResponsive';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import EnhancedAIAssistant from '@/components/EnhancedAIAssistant';
import OutputPanel from '@/components/OutputPanel';
import MobileActionButton from '@/components/MobileActionButton';
import { MobileAIButton } from '@/components/MobileAIButton';

// Carregamento dinâmico do editor para evitar problemas de SSR
const CodeEditor = dynamic(() => import('@/components/CodeEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-[#1e1e1e]">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-muted border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted">Carregando editor...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(supportedLanguages[0]);
  const [currentCode, setCurrentCode] = useState<string>(selectedLanguage.defaultCode);
  const [isAIActive, setIsAIActive] = useState<boolean>(true);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isOutputPanelOpen, setIsOutputPanelOpen] = useState<boolean>(false);
  
  const { isMobile } = useResponsive();

  // Controlar sidebar baseado no tamanho da tela
  useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

  const handleLanguageChange = useCallback((language: Language) => {
    setSelectedLanguage(language);
    setCurrentCode(language.defaultCode);
  }, []);

  const handleCodeChange = useCallback((code: string) => {
    setCurrentCode(code);
  }, []);

  const handleLessonSelect = useCallback((lesson: { code: string }) => {
    setCurrentCode(lesson.code);
  }, []);

  const handleNewFile = useCallback(() => {
    setCurrentCode(selectedLanguage.defaultCode);
  }, [selectedLanguage]);

  const handleRun = useCallback(() => {
    setIsRunning(true);
    setTimeout(() => setIsRunning(false), 2000);
  }, []);

  const handleSave = useCallback(() => {
    // Implementar salvamento
    console.log('Salvando código:', currentCode);
  }, [currentCode]);

  const handleReset = useCallback(() => {
    setCurrentCode(selectedLanguage.defaultCode);
  }, [selectedLanguage]);

  const toggleAI = useCallback(() => {
    setIsAIActive(prev => !prev);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const toggleOutputPanel = useCallback(() => {
    setIsOutputPanelOpen(prev => !prev);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] overflow-hidden">
      {/* Top Bar */}
      <TopBar
        language={selectedLanguage}
        onRun={handleRun}
        onSave={handleSave}
        onReset={handleReset}
        isAIActive={isAIActive}
        onToggleAI={toggleAI}
        onToggleSidebar={toggleSidebar}
        onToggleOutputPanel={toggleOutputPanel}
        isSidebarOpen={isSidebarOpen}
        isOutputPanelOpen={isOutputPanelOpen}
        isMobile={isMobile}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <div className={`
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          ${isMobile ? 'absolute z-30 h-full' : 'relative'} 
          transition-transform duration-300 ease-in-out
          w-64 md:w-72 lg:w-80
        `}>
          <Sidebar
            selectedLanguage={selectedLanguage}
            onLanguageChange={handleLanguageChange}
            onLessonSelect={handleLessonSelect}
            onNewFile={handleNewFile}
            onClose={() => isMobile && setIsSidebarOpen(false)}
            isMobile={isMobile}
          />
        </div>

        {/* Overlay para mobile quando sidebar está aberta */}
        {isMobile && isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className={`
            flex-1 flex flex-col lg:flex-row 
            ${isOutputPanelOpen ? 'h-1/2 lg:h-full' : 'h-full'}
          `}>
            {/* Code Editor */}
            <div className="flex-1 min-h-0">
              <CodeEditor
                language={selectedLanguage}
                initialCode={currentCode}
                onCodeChange={handleCodeChange}
              />
            </div>

            {/* AI Assistant */}
            <div className={`
              ${isAIActive ? 'block' : 'hidden'} 
              w-full lg:w-96 xl:w-[28rem] 2xl:w-[32rem]
              ${isMobile ? 'h-1/3' : 'h-full'}
              border-t lg:border-t-0 lg:border-l border-frame
            `}>
              <EnhancedAIAssistant
                language={selectedLanguage.id}
                currentCode={currentCode}
                onCodeChange={handleCodeChange}
                onMessage={(message: any) => console.log('Message:', message)}
                isActive={isAIActive}
              />
            </div>
          </div>

          {/* Output Panel */}
          <div className={`
            ${isOutputPanelOpen ? 'block' : 'hidden'} 
            ${isMobile ? 'h-1/3' : 'h-48 lg:h-64'}
            border-t border-primary
          `}>
            <OutputPanel
              code={currentCode}
              language={selectedLanguage.id}
              isRunning={isRunning}
              isMobile={isMobile}
            />
          </div>
        </div>
      </div>

      {/* Mobile Action Button */}
      {isMobile && (
        <MobileAIButton
          onToggleAI={() => setIsAIActive(!isAIActive)}
          onToggleOutput={() => setIsOutputPanelOpen(!isOutputPanelOpen)}
          onRun={handleRun}
          isAIActive={isAIActive}
          isOutputActive={isOutputPanelOpen}
          hasNotifications={false}
          assessmentCompleted={false}
        />
      )}
    </div>
  );
}
