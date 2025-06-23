'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Code, BookOpen, Play, Settings, FileText } from 'lucide-react';
import { Language } from '@/types';
import { supportedLanguages, getLessonsByLanguage } from '@/lib/languages';

interface SidebarProps {
  selectedLanguage: Language;
  onLanguageChange: (language: Language) => void;
  onLessonSelect: (lesson: any) => void;
  onNewFile: () => void;
  onClose?: () => void;
  isMobile?: boolean;
}

export default function Sidebar({ 
  selectedLanguage, 
  onLanguageChange, 
  onLessonSelect,
  onNewFile,
  onClose,
  isMobile
}: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    languages: true,
    lessons: true,
    files: true
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const lessons = getLessonsByLanguage(selectedLanguage.id);

  const SectionHeader = ({ 
    title, 
    section, 
    icon: Icon 
  }: { 
    title: string; 
    section: string; 
    icon: any;
  }) => (
    <div
      className="flex items-center px-3 py-2 hover-bg-tertiary cursor-pointer"
      onClick={() => toggleSection(section)}
    >
      {expandedSections[section] ? (
        <ChevronDown className="w-4 h-4 text-muted mr-1" />
      ) : (
        <ChevronRight className="w-4 h-4 text-muted mr-1" />
      )}
      <Icon className="w-4 h-4 text-muted mr-2" />
      <span className="text-sm font-medium text-secondary">{title}</span>
    </div>
  );

  return (
    <div className="w-full h-full bg-[#252526] border-r border-frame flex flex-col">
      {/* Header */}
      <div className="h-12 bg-[#323233] flex items-center justify-between px-4 border-b border-frame">
        <div className="flex items-center">
          <Code className="w-5 h-5 text-muted mr-2" />
          <h2 className="text-white font-medium">LearnAI</h2>
        </div>
        {isMobile && onClose && (
          <button
            onClick={onClose}
            className="p-1 hover-bg-tertiary rounded text-muted"
            title="Fechar menu"
          >
            ×
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Languages Section */}
        <div className="border-b border-frame">
          <SectionHeader title="Linguagens" section="languages" icon={Code} />
          {expandedSections.languages && (
            <div className="pb-2">
              {supportedLanguages.map((language) => (
                <div
                  key={language.id}
                  className={`mx-2 md:mx-3 mb-1 px-2 md:px-3 py-2 rounded cursor-pointer transition-colors ${
                    selectedLanguage.id === language.id
                      ? 'bg-tertiary text-white'
                      : 'hover-bg-tertiary text-tertiary'
                  }`}
                  onClick={() => {
                    onLanguageChange(language);
                    isMobile && onClose && onClose();
                  }}
                >
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-current mr-2 md:mr-3 opacity-60"></div>
                    <div>
                      <div className="text-sm font-medium">{language.name}</div>
                      <div className="text-xs opacity-75">{language.extension}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lessons Section */}
        <div className="border-b border-frame">
          <SectionHeader title="Lições" section="lessons" icon={BookOpen} />
          {expandedSections.lessons && (
            <div className="pb-2">
              {lessons.length > 0 ? (
                lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="mx-2 md:mx-3 mb-1 px-2 md:px-3 py-2 rounded cursor-pointer hover-bg-tertiary text-tertiary transition-colors"
                    onClick={() => {
                      onLessonSelect(lesson);
                      isMobile && onClose && onClose();
                    }}
                  >
                    <div className="flex items-center">
                      <Play className="w-3 h-3 mr-2 md:mr-3 text-green-400" />
                      <div>
                        <div className="text-sm font-medium">{lesson.title}</div>
                        <div className="text-xs opacity-75 flex items-center">
                          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                            lesson.level === 'beginner' ? 'bg-green-400' :
                            lesson.level === 'intermediate' ? 'bg-yellow-400' : 'bg-red-400'
                          }`}></span>
                          {lesson.level === 'beginner' ? 'Iniciante' :
                           lesson.level === 'intermediate' ? 'Intermediário' : 'Avançado'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="mx-2 md:mx-3 px-2 md:px-3 py-2 text-xs text-subtle">
                  Nenhuma lição disponível para {selectedLanguage.name}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Files Section */}
        <div>
          <SectionHeader title="Arquivos" section="files" icon={FileText} />
          {expandedSections.files && (
            <div className="pb-2">
              <div
                className="mx-2 md:mx-3 mb-1 px-2 md:px-3 py-2 rounded cursor-pointer hover-bg-tertiary text-tertiary transition-colors"
                onClick={() => {
                  onNewFile();
                  isMobile && onClose && onClose();
                }}
              >
                <div className="flex items-center">
                  <FileText className="w-3 h-3 mr-2 md:mr-3 text-muted" />
                  <span className="text-sm">main{selectedLanguage.extension}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="h-10 md:h-12 bg-[#323233] border-t border-frame flex items-center px-2 md:px-4">
        <div className="flex items-center text-xs text-muted">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
          <span className="hidden md:inline">Conectado ao Gemini AI</span>
          <span className="md:hidden">Online</span>
        </div>
        <Settings className="w-4 h-4 text-muted ml-auto cursor-pointer hover:text-secondary" />
      </div>
    </div>
  );
}
