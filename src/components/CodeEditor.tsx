'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Language } from '@/types';
import useDatabase from '@/hooks/useDatabase';

interface CodeEditorProps {
  language: Language;
  initialCode?: string;
  onChange?: (code: string) => void;
  onCodeChange?: (code: string) => void;
}

export default function CodeEditor({ 
  language, 
  initialCode, 
  onChange,
  onCodeChange 
}: CodeEditorProps) {
  // 🗄️ Database integration
  const [dbState] = useDatabase();
  
  const [code, setCode] = useState(initialCode || language.defaultCode);
  const lastCodeRef = useRef<string>('');
  const changeTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setCode(initialCode || language.defaultCode);
    lastCodeRef.current = initialCode || language.defaultCode;
  }, [language, initialCode]);

  // 💾 Função para persistir eventos de código
  const persistCodeEvent = useCallback(async (code: string, eventType: string) => {
    if (dbState.currentSession?.id && code !== lastCodeRef.current) {
      try {
        await fetch('/api/code/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: dbState.currentSession.id,
            eventType,
            code,
            explanation: `Code changed in ${language.name}`,
            metadata: {
              language: language.id,
              timestamp: new Date().toISOString(),
              codeLength: code.length
            }
          })
        });
        lastCodeRef.current = code;
      } catch (error) {
        console.error('❌ Erro ao persistir evento de código:', error);
      }
    }
  }, [dbState.currentSession, language]);

  const handleEditorChange = useCallback((value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    onChange?.(newCode);
    onCodeChange?.(newCode);

    // Debounce para evitar muitos eventos de mudança
    if (changeTimeoutRef.current) {
      clearTimeout(changeTimeoutRef.current);
    }
    
    changeTimeoutRef.current = setTimeout(() => {
      persistCodeEvent(newCode, 'code_change');
    }, 2000); // Aguardar 2 segundos após a última mudança
  }, [onChange, onCodeChange, persistCodeEvent]);

  // Cleanup do timeout
  useEffect(() => {
    return () => {
      if (changeTimeoutRef.current) {
        clearTimeout(changeTimeoutRef.current);
      }
    };
  }, []);

  const editorOptions = {
    theme: 'vs-dark',
    fontSize: 14,
    fontFamily: 'Fira Code, Consolas, monospace',
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
    insertSpaces: true,
    wordWrap: 'on' as const,
    lineNumbers: 'on' as const,
    renderLineHighlight: 'all' as const,
    selectOnLineNumbers: true,
    mouseWheelZoom: true,
    contextmenu: true,
    folding: true,
    foldingStrategy: 'indentation' as const,
    showFoldingControls: 'always' as const,
    unfoldOnClickAfterEndOfLine: false,
    disableLayerHinting: false,
    fixedOverflowWidgets: false,
    acceptSuggestionOnEnter: 'on' as const,
    acceptSuggestionOnCommitCharacter: true,
    suggest: {
      showMethods: true,
      showFunctions: true,
      showConstructors: true,
      showFields: true,
      showVariables: true,
      showClasses: true,
      showModules: true,
      showProperties: true,
      showEvents: true,
      showOperators: true,
      showUnits: true,
      showValues: true,
      showConstants: true,
      showEnums: true,
      showEnumMembers: true,
      showKeywords: true,
      showWords: true,
      showColors: true,
      showFiles: true,
      showReferences: true,
      showFolders: true,
      showTypeParameters: true,
      showSnippets: true,
    },
    bracketPairColorization: {
      enabled: true,
    },
    guides: {
      indentation: true,
      bracketPairs: true,
    },
  };

  return (
    <div className="h-full w-full bg-[#1e1e1e] rounded-lg overflow-hidden border border-frame">
      <div className="h-8 bg-[#323233] flex items-center px-3 border-b border-frame">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="ml-4 text-tertiary text-sm">
          main{language.extension}
        </div>
      </div>
      <div className="h-[calc(100%-2rem)]">
        <Editor
          height="100%"
          language={language.monacoLanguage}
          value={code}
          onChange={handleEditorChange}
          options={editorOptions}
          beforeMount={(monaco) => {
            monaco.editor.defineTheme('vscode-dark', {
              base: 'vs-dark',
              inherit: true,
              rules: [
                { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
                { token: 'keyword', foreground: '569CD6' },
                { token: 'string', foreground: 'CE9178' },
                { token: 'number', foreground: 'B5CEA8' },
              ],
              colors: {
                'editor.background': '#1e1e1e',
                'editor.foreground': '#D4D4D4',
                'editorLineNumber.foreground': '#858585',
                'editorLineNumber.activeForeground': '#C6C6C6',
                'editor.selectionBackground': '#264F78',
                'editor.selectionHighlightBackground': '#ADD6FF26',
              },
            });
          }}
          onMount={(editor, monaco) => {
            monaco.editor.setTheme('vscode-dark');
            editor.focus();
          }}
        />
      </div>
    </div>
  );
}
