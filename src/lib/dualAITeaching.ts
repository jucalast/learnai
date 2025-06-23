import { GoogleGenerativeAI } from '@google/generative-ai';

// Duas instâncias diferentes para diferentes propósitos e evitar redundância
const primaryGenAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
const secondaryGenAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY_SECONDARY || '');

// Modelo para análise rápida (API 1)
const analysisModel = primaryGenAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.3,
    maxOutputTokens: 200,
  }
});

// Modelo para geração de conteúdo pedagógico (API 2)
const teachingModel = secondaryGenAI.getGenerativeModel({ 
  model: "gemini-1.5-pro",
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 500,
  }
});

export interface CodeAnalysis {
  concept: string;
  progress: number;
  errors: string[];
  suggestions: string[];
  nextStep: string;
  isStuck: boolean;
  sentiment: 'frustrated' | 'progressing' | 'confident' | 'confused' | 'experimenting';
  codeQuality?: 'empty' | 'incomplete' | 'basic' | 'good' | 'excellent';
  needsHelp?: boolean;
}

export interface TeachingResponse {
  message: string;
  action: 'demonstrate' | 'hint' | 'encourage' | 'correct' | 'advance';
  codeExample?: string;
  explanation?: string;
}

class DualAITeachingService {
  private analysisHistory: string[] = [];
  private teachingContext: any = {};

  // API 1: Análise rápida do código
  async analyzeCode(
    code: string, 
    concept: string, 
    userLevel: string,
    timeIdle: number
  ): Promise<CodeAnalysis> {
    try {
      const recentHistory = this.analysisHistory.slice(-3).join(', ');
      const codeLength = code.trim().length;
      const hasNewContent = this.isNewContent(code);
      
      const prompt = `
Analise este código Python em relação ao conceito "${concept}" para um usuário ${userLevel}:

CÓDIGO ATUAL:
\`\`\`python
${code}
\`\`\`

CONTEXTO IMPORTANTE:
- Conceito sendo ensinado: ${concept}
- Nível do usuário: ${userLevel}
- Tempo sem digitar: ${timeIdle} segundos
- Tamanho do código: ${codeLength} caracteres
- Conteúdo novo: ${hasNewContent}
- Histórico recente: ${recentHistory || 'Nenhum'}

ANÁLISE ESPECÍFICA:
1. O código demonstra compreensão de "${concept}"?
2. Há erros de sintaxe ou lógica?
3. O usuário está progredindo ou travado?
4. Qual o próximo passo natural?

Responda APENAS com JSON neste formato:
{
  "concept": "${concept}",
  "progress": <0-100 baseado na compreensão do conceito específico>,
  "errors": ["erro1", "erro2"] (apenas erros críticos),
  "suggestions": ["sugestão1", "sugestão2"] (específicas para o conceito),
  "nextStep": "próximo passo concreto e específico",
  "isStuck": <true se parado por mais de 30s sem progresso>,
  "sentiment": "frustrated|progressing|confident|confused|experimenting",
  "codeQuality": "empty|incomplete|basic|good|excellent",
  "needsHelp": <true se claramente precisa de ajuda>
}

Seja PRECISO e relacione tudo ao conceito "${concept}".`;

      const result = await analysisModel.generateContent(prompt);
      const response = result.response.text();
      
      // Tentar parsear JSON
      try {
        const analysis = JSON.parse(response.replace(/```json|```/g, '').trim());
        this.updateAnalysisHistory(concept, analysis.progress, analysis.sentiment);
        return analysis;
      } catch {
        // Fallback inteligente baseado no código
        return this.createFallbackAnalysis(code, concept, timeIdle);
      }
    } catch (error) {
      console.error('Erro na análise:', error);
      return this.createFallbackAnalysis(code, concept, timeIdle);
    }
  }

  // API 2: Geração de resposta pedagógica
  async generateTeachingResponse(
    analysis: CodeAnalysis,
    userCode: string,
    conversationHistory: string[]
  ): Promise<TeachingResponse> {
    try {
      const codeLength = userCode.trim().length;
      const recentHistory = conversationHistory.slice(-2).join(' → ');
      
      const prompt = `
Você é um tutor de programação AI experiente e empático, observando o usuário em TEMPO REAL.

🎯 SITUAÇÃO ATUAL:
Conceito: ${analysis.concept}
Progresso: ${analysis.progress}% 
Qualidade: ${analysis.codeQuality || 'indefinida'}
Estado emocional: ${analysis.sentiment}
Precisa ajuda: ${analysis.needsHelp ? 'SIM' : 'não'}
Está travado: ${analysis.isStuck ? 'SIM' : 'não'}

📝 CÓDIGO ATUAL (${codeLength} caracteres):
\`\`\`python
${userCode}
\`\`\`

🚨 PROBLEMAS IDENTIFICADOS:
${analysis.errors.length > 0 ? analysis.errors.join(', ') : 'Nenhum erro crítico'}

💡 SUGESTÕES DA ANÁLISE:
${analysis.suggestions.join(' • ')}

🗣️ CONVERSA RECENTE:
${recentHistory || 'Início da conversa'}

📋 REGRAS PARA SUA RESPOSTA:
1. Seja NATURAL como um humano observando o código
2. Reaja ESPECIFICAMENTE ao que vê no código
3. Se código vazio/pequeno: ESTIMULE a escrever
4. Se progredindo bem: ENCORAJE e sugira próximo passo  
5. Se com erros: AJUDE de forma GENTIL e ESPECÍFICA
6. Se travado: DEMONSTRE com código ou dica clara
7. Use 1-2 emojis relevantes
8. Máximo 2 frases diretas

Responda APENAS com JSON válido:
{
  "message": "sua reação natural e específica ao código atual",
  "action": "demonstrate|hint|encourage|correct|advance",
  "codeExample": "exemplo de código apenas se ação for demonstrate",
  "explanation": "explicação técnica breve apenas se necessário"
}`;

      const result = await teachingModel.generateContent(prompt);
      const response = result.response.text();
      
      try {
        const parsed = JSON.parse(response.replace(/```json|```/g, '').trim());
        return parsed;
      } catch {
        // Fallback inteligente baseado na análise
        return this.createIntelligentFallback(analysis, userCode);
      }
    } catch (error) {
      console.error('Erro na geração:', error);
      return this.createIntelligentFallback(analysis, userCode);
    }
  }

  // Fallback inteligente quando a API falha
  private createIntelligentFallback(analysis: CodeAnalysis, userCode: string): TeachingResponse {
    const { concept, progress, sentiment, isStuck, errors } = analysis;
    
    // Resposta baseada no contexto da análise
    if (isStuck || sentiment === 'frustrated') {
      return {
        message: `Vejo que você parou em ${concept}. Que tal eu te dar um exemplo prático? 🤔`,
        action: 'demonstrate',
        explanation: 'O usuário parece precisar de ajuda'
      };
    }
    
    if (errors.length > 0) {
      return {
        message: `Quase lá! ${errors[0]}. Continue tentando! 💪`,
        action: 'hint',
        explanation: 'Corrigindo erros detectados'
      };
    }
    
    if (progress >= 80) {
      return {
        message: `Excelente trabalho com ${concept}! Vamos avançar? 🚀`,
        action: 'advance',
        explanation: 'Usuário demonstrou domínio do conceito'
      };
    }
    
    if (progress > 50) {
      return {
        message: `Ótimo progresso! Você está entendendo ${concept} muito bem! 👍`,
        action: 'encourage',
        explanation: 'Encorajando progresso positivo'
      };
    }
    
    if (userCode.trim().length === 0) {
      return {
        message: `Vamos começar com ${concept}! Posso te mostrar um exemplo?`,
        action: 'demonstrate',
        explanation: 'Iniciando com demonstração'
      };
    }
    
    // Fallback padrão
    return {
      message: `Continue explorando ${concept}! Você está no caminho certo! ✨`,
      action: 'encourage',
      explanation: 'Encorajamento geral'
    };
  }

  // Estimativa local de progresso (backup)
  private estimateProgress(code: string, concept: string): number {
    const checks = {
      variables: [
        code.includes('=') && !code.includes('=='),
        code.includes('print('),
        code.split('\n').length > 2
      ],
      conditionals: [
        code.includes('if '),
        code.includes(':'),
        code.includes('else') || code.includes('elif')
      ],
      loops: [
        code.includes('for ') || code.includes('while '),
        code.includes(':'),
        code.includes('range(') || code.includes(' in ')
      ],
      functions: [
        code.includes('def '),
        code.includes('return'),
        code.includes('(') && code.includes(')')
      ]
    };

    const conceptChecks = checks[concept as keyof typeof checks] || [];
    const completed = conceptChecks.filter(Boolean).length;
    return Math.round((completed / Math.max(conceptChecks.length, 1)) * 100);
  }

  private generateFallbackMessage(analysis: CodeAnalysis): string {
    if (analysis.isStuck) {
      return "Vejo que você parou um pouco. Quer uma dica? 🤔";
    }
    if (analysis.progress > 70) {
      return "Excelente! Você está quase terminando! 🚀";
    }
    if (analysis.errors.length > 0) {
      return "Quase lá! Só ajustar alguns detalhes. 💪";
    }
    return "Ótimo progresso! Continue assim! 👍";
  }

  // Métodos auxiliares para análise mais contextualizada
  private lastCodeSnapshot: string = '';
  
  private isNewContent(code: string): boolean {
    const hasNew = code.trim() !== this.lastCodeSnapshot.trim();
    this.lastCodeSnapshot = code;
    return hasNew;
  }

  private updateAnalysisHistory(concept: string, progress: number, sentiment: string): void {
    const entry = `${concept}-${progress}%-${sentiment}`;
    this.analysisHistory.push(entry);
    
    // Manter apenas os últimos 5 entries
    if (this.analysisHistory.length > 5) {
      this.analysisHistory = this.analysisHistory.slice(-5);
    }
  }

  private createFallbackAnalysis(code: string, concept: string, timeIdle: number): CodeAnalysis {
    const codeLength = code.trim().length;
    const hasCode = codeLength > 0;
    const seemsStuck = timeIdle > 30 && codeLength < 10;
    
    // Análise básica baseada em padrões
    let progress = 0;
    if (hasCode) {
      progress = Math.min(80, Math.floor(codeLength / 5) + 10);
    }
    
    let sentiment: 'frustrated' | 'progressing' | 'confident' | 'confused' | 'experimenting' = 'progressing';
    if (seemsStuck) sentiment = 'confused';
    if (progress > 60) sentiment = 'confident';
    if (timeIdle > 60) sentiment = 'frustrated';
    
    return {
      concept,
      progress,
      errors: [],
      suggestions: hasCode ? ['Continue desenvolvendo o conceito'] : ['Comece escrevendo algum código'],
      nextStep: hasCode ? `Melhore o código para demonstrar ${concept}` : `Escreva código para praticar ${concept}`,
      isStuck: seemsStuck,
      sentiment,
      codeQuality: hasCode ? 'basic' : 'empty',
      needsHelp: seemsStuck || timeIdle > 45
    };
  }

  // Limpar histórico periodicamente
  clearHistory() {
    this.analysisHistory = [];
    this.teachingContext = {};
  }
}

export const dualAI = new DualAITeachingService();
