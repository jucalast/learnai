'use client';

import { useState, useEffect, useRef } from 'react';
import { Terminal, X, Trash2, Copy, Download } from 'lucide-react';

interface OutputPanelProps {
  code: string;
  language: string;
  isRunning?: boolean;
  isMobile?: boolean;
}

interface LogEntry {
  id: string;
  type: 'output' | 'error' | 'info' | 'warning';
  message: string;
  timestamp: Date;
}

export default function OutputPanel({ code, language, isRunning = false, isMobile }: OutputPanelProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'output' | 'problems' | 'terminal'>('output');
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    if (isRunning && code.trim()) {
      // Simulate code execution
      simulateCodeExecution();
    }
  }, [isRunning, code]);

  const simulateCodeExecution = () => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      type: 'info',
      message: `Executando código ${language}...`,
      timestamp: new Date()
    };

    setLogs(prev => [...prev, newLog]);

    setTimeout(() => {
      // Simulate output based on language
      let output = '';
      
      if (language === 'javascript' || language === 'typescript') {
        if (code.includes('console.log')) {
          const matches = code.match(/console\.log\((.*?)\)/g);
          if (matches) {
            output = matches.map(match => {
              const content = match.replace(/console\.log\(|\)/g, '');
              return eval(content.replace(/`([^`]*)`/g, '"$1"').replace(/\$\{[^}]*\}/g, 'valor'));
            }).join('\n');
          }
        } else {
          output = 'Código executado com sucesso!';
        }
      } else if (language === 'python') {
        if (code.includes('print')) {
          output = 'Olá, mundo!\nEstudante\n25';
        } else {
          output = 'Código Python executado com sucesso!';
        }
      } else {
        output = `Código ${language} executado com sucesso!`;
      }

      const outputLog: LogEntry = {
        id: (Date.now() + 1).toString(),
        type: 'output',
        message: output,
        timestamp: new Date()
      };

      setLogs(prev => [...prev, outputLog]);

      // Sometimes add a warning or info
      if (Math.random() > 0.7) {
        const infoLog: LogEntry = {
          id: (Date.now() + 2).toString(),
          type: 'warning',
          message: 'Dica: Considere adicionar comentários ao seu código para melhor legibilidade.',
          timestamp: new Date()
        };
        
        setTimeout(() => {
          setLogs(prev => [...prev, infoLog]);
        }, 500);
      }
    }, 1000);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const copyLogs = () => {
    const logsText = logs.map(log => 
      `[${log.timestamp.toLocaleTimeString()}] ${log.type.toUpperCase()}: ${log.message}`
    ).join('\n');
    
    navigator.clipboard.writeText(logsText);
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'output':
        return '📝';
      default:
        return '•';
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'info':
        return 'text-muted';
      case 'output':
        return 'text-green-400';
      default:
        return 'text-tertiary';
    }
  };

  const TabButton = ({ 
    tab, 
    label, 
    count 
  }: { 
    tab: string; 
    label: string; 
    count?: number;
  }) => (
    <button
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        activeTab === tab
          ? 'text-white border-muted'
          : 'text-muted border-transparent hover:text-secondary'
      }`}
      onClick={() => setActiveTab(tab as any)}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="h-full bg-[#1e1e1e] border-t border-frame flex flex-col">
      {/* Header with Tabs */}
      <div className="h-10 md:h-12 bg-[#323233] border-b border-frame flex items-center justify-between">
        <div className="flex">
          <TabButton tab="output" label={isMobile ? "Saída" : "Saída"} />
          {!isMobile && <TabButton tab="problems" label="Problemas" count={0} />}
          {!isMobile && <TabButton tab="terminal" label="Terminal" />}
        </div>
        
        <div className="flex items-center space-x-1 md:space-x-2 px-2 md:px-4">
          <button
            className="p-1 hover-bg-elevated rounded"
            onClick={copyLogs}
            title="Copiar logs"
          >
            <Copy className="w-3 h-3 md:w-4 md:h-4 text-muted" />
          </button>
          <button
            className="p-1 hover-bg-elevated rounded"
            onClick={clearLogs}
            title="Limpar logs"
          >
            <Trash2 className="w-3 h-3 md:w-4 md:h-4 text-muted" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'output' && (
          <div className="p-2 md:p-4 space-y-1 md:space-y-2 font-mono text-xs md:text-sm">
            {logs.length === 0 ? (
              <div className="text-subtle text-center mt-4 md:mt-8">
                <Terminal className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-4 opacity-50" />
                <p className="text-xs md:text-base px-2">
                  {isMobile 
                    ? 'Execute código para ver resultados'
                    : 'Nenhuma saída ainda. Execute seu código para ver os resultados.'
                  }
                </p>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start space-x-1 md:space-x-2">
                  <span className="text-subtle text-xs mt-0.5 w-12 md:w-16 flex-shrink-0">
                    {log.timestamp.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: isMobile ? undefined : '2-digit'
                    })}
                  </span>
                  <span className="text-xs mt-0.5">{getLogIcon(log.type)}</span>
                  <div className={`${getLogColor(log.type)} whitespace-pre-wrap break-words text-xs md:text-sm`}>
                    {log.message}
                  </div>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        )}

        {!isMobile && activeTab === 'problems' && (
          <div className="p-4">
            <div className="text-subtle text-center mt-8">
              <div className="w-12 h-12 mx-auto mb-4 opacity-50 flex items-center justify-center">
                ✅
              </div>
              <p>Nenhum problema encontrado no código.</p>
            </div>
          </div>
        )}

        {!isMobile && activeTab === 'terminal' && (
          <div className="p-4 font-mono text-sm">
            <div className="text-tertiary">
              <div className="text-green-400">$ learnai-terminal</div>
              <div className="text-subtle mt-2">
                Terminal integrado - Execute comandos relacionados ao seu código aqui.
              </div>
              <div className="mt-4 text-muted">
                Linguagem atual: {language}
              </div>
              <div className="text-muted mt-2">
                Digite 'help' para ver comandos disponíveis.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="h-5 md:h-6 bg-[#323233] border-t border-frame flex items-center px-2 md:px-4 text-xs text-muted">
        <div className="flex items-center">
          <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full mr-1 md:mr-2 ${
            isRunning ? 'bg-yellow-400' : 'bg-green-400'
          }`}></div>
          {isRunning ? 'Executando...' : 'Pronto'}
        </div>
        <div className="ml-auto">
          {logs.length} {isMobile ? '' : (logs.length === 1 ? 'entrada' : 'entradas')}
        </div>
      </div>
    </div>
  );
}
