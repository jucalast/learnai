/**
 * Sistema de IA Observacional Inteligente
 * Arquitetura unificada que usa duas APIs Google Gemini de forma estratégica e não redundante
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Configuração das duas APIs com roles específicos
const quickAnalysisAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
const teachingAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY_SECONDARY || '');

// Modelo para análise rápida e detecção de mudanças (API 1)
const watcher = quickAnalysisAI.getGenerativeModel({ 
  model: "gemini-2.0-flash",
  generationConfig: {
    temperature: 0.1, // Muito baixa para análises consistentes
    maxOutputTokens: 150,
  }
});

// Modelo para respostas pedagógicas contextuais (API 2)  
const teacher = teachingAI.getGenerativeModel({ 
  model: "gemini-2.0-pro",
  generationConfig: {
    temperature: 0.6, // Balanceada para respostas naturais
    maxOutputTokens: 300,
  }
});

export interface CodeEvent {
  type: 'typing' | 'pause' | 'error' | 'progress' | 'stuck' | 'completion';
  timestamp: number;
  codeSnapshot: string;
  concept: string;
  confidence: number; // 0-100
  significance: 'low' | 'medium' | 'high' | 'critical';
}

export interface TeachingMoment {
  shouldRespond: boolean;
  urgency: 'low' | 'medium' | 'high' | 'immediate';
  responseType: 'observe' | 'hint' | 'encourage' | 'demonstrate' | 'correct' | 'advance';
  message: string;
  codeExample?: string;
  nextAction?: string;
}

class IntelligentAIWatcher {
  private lastSignificantEvent: CodeEvent | null = null;
  private watchingHistory: CodeEvent[] = [];
  private responseHistory: string[] = [];
  private lastResponseTime: number = 0;
  private conceptProgress: Map<string, number> = new Map();
  private isProcessing: boolean = false;
  
  // Controle de timing para evitar spam
  private readonly MIN_RESPONSE_INTERVAL = 3000; // 3s entre respostas
  private readonly SIGNIFICANT_CHANGE_THRESHOLD = 10; // caracteres para ser significativo
  
  /**
   * Método principal: analisa código e decide se deve reagir
   */
  async watchAndRespond(
    currentCode: string,
    concept: string,
    userLevel: 'beginner' | 'intermediate' | 'advanced',
    timeIdle: number
  ): Promise<TeachingMoment | null> {
    
    if (this.isProcessing) return null;
    this.isProcessing = true;

    try {
      // ETAPA 1: API Watcher - Detecção rápida de eventos significativos
      const event = await this.detectCodeEvent(currentCode, concept, timeIdle);
      
      // Se não há evento significativo, não responde
      if (!event || event.significance === 'low') {
        this.isProcessing = false;
        return null;
      }

      // Controle de timing - evita respostas muito frequentes
      const timeSinceLastResponse = Date.now() - this.lastResponseTime;
      if (timeSinceLastResponse < this.MIN_RESPONSE_INTERVAL && event.significance !== 'critical') {
        this.isProcessing = false;
        return null;
      }

      // ETAPA 2: API Teacher - Gera resposta contextual apenas quando necessário
      const teachingMoment = await this.generateContextualResponse(
        event, 
        currentCode, 
        concept, 
        userLevel
      );

      // Atualiza estado
      this.lastSignificantEvent = event;
      this.addToHistory(event);
      
      if (teachingMoment.shouldRespond) {
        this.lastResponseTime = Date.now();
        this.responseHistory.push(teachingMoment.message);
        
        // Limita histórico para não crescer infinitamente
        if (this.responseHistory.length > 10) {
          this.responseHistory = this.responseHistory.slice(-5);
        }
      }

      this.isProcessing = false;
      return teachingMoment;

    } catch (error) {
      console.error('Erro no watcher inteligente:', error);
      this.isProcessing = false;
      return this.createFallbackResponse(currentCode, concept, timeIdle);
    }
  }

  /**
   * API 1 (Watcher): Detecção rápida de eventos no código
   */
  private async detectCodeEvent(
    code: string, 
    concept: string, 
    timeIdle: number
  ): Promise<CodeEvent | null> {
    
    const codeLength = code.trim().length;
    const lastCode = this.lastSignificantEvent?.codeSnapshot || '';
    const codeChange = Math.abs(codeLength - lastCode.length);
    
    // Detecção local rápida para casos óbvios
    if (codeLength === 0) {
      return {
        type: 'stuck',
        timestamp: Date.now(),
        codeSnapshot: code,
        concept,
        confidence: 90,
        significance: timeIdle > 15 ? 'high' : 'medium'
      };
    }

    if (timeIdle > 30 && codeChange < 3) {
      return {
        type: 'stuck',
        timestamp: Date.now(),
        codeSnapshot: code,
        concept,
        confidence: 85,
        significance: 'high'
      };
    }

    // Para mudanças pequenas, usa análise local
    if (codeChange < this.SIGNIFICANT_CHANGE_THRESHOLD) {
      return null;
    }

    // API para análise mais complexa
    const prompt = `
Analise rapidamente esta mudança no código Python:

CONCEITO SENDO ENSINADO: ${concept}
CÓDIGO ATUAL (${codeLength} chars):
\`\`\`python
${code}
\`\`\`

CÓDIGO ANTERIOR (${lastCode.length} chars):
\`\`\`python
${lastCode}
\`\`\`

TEMPO IDLE: ${timeIdle}s

Detecte o tipo de evento (typing/pause/error/progress/stuck/completion) e sua significância.

Responda APENAS JSON:
{
  "type": "typing|pause|error|progress|stuck|completion",
  "confidence": <0-100>,
  "significance": "low|medium|high|critical"
}`;

    try {
      const result = await watcher.generateContent(prompt);
      const response = JSON.parse(result.response.text().replace(/```json|```/g, '').trim());
      
      return {
        type: response.type,
        timestamp: Date.now(),
        codeSnapshot: code,
        concept,
        confidence: response.confidence,
        significance: response.significance
      };
    } catch {
      // Fallback: considera significativo se mudança for grande
      return {
        type: codeChange > 20 ? 'progress' : 'typing',
        timestamp: Date.now(),
        codeSnapshot: code,
        concept,
        confidence: 70,
        significance: codeChange > 30 ? 'medium' : 'low'
      };
    }
  }

  /**
   * API 2 (Teacher): Gera resposta pedagógica contextual
   */
  private async generateContextualResponse(
    event: CodeEvent,
    currentCode: string,
    concept: string,
    userLevel: string
  ): Promise<TeachingMoment> {

    // Decide urgência baseada no evento
    const urgency = this.calculateUrgency(event);
    
    // Se não é urgente e respondeu recentemente, apenas observa
    if (urgency === 'low' && this.responseHistory.length > 0) {
      return {
        shouldRespond: false,
        urgency: 'low',
        responseType: 'observe',
        message: ''
      };
    }

    const recentResponses = this.responseHistory.slice(-2).join(' | ');
    const progressHistory = this.getProgressContext(concept);

    const prompt = `
Você é um tutor IA que observa um estudante programando em TEMPO REAL.

🎯 EVENTO DETECTADO:
Tipo: ${event.type}
Confiança: ${event.confidence}%
Significância: ${event.significance}
Conceito: ${concept}

📝 CÓDIGO ATUAL DO ESTUDANTE:
\`\`\`python
${currentCode}
\`\`\`

📊 CONTEXTO:
- Nível: ${userLevel}
- Progresso em ${concept}: ${progressHistory}
- Últimas respostas: ${recentResponses || 'Nenhuma'}

🤖 SUA MISSÃO:
Reagir de forma NATURAL e ESPECÍFICA ao que está acontecendo.

REGRAS CRÍTICAS:
1. Se event.type === 'stuck': Ofereça ajuda específica
2. Se event.type === 'progress': Encoraje e sugira próximo passo
3. Se event.type === 'error': Corrija gentilmente  
4. Se event.type === 'completion': Parabenize e avance
5. Se event.type === 'typing': Apenas observe (não responda)
6. Se já respondeu algo similar recentemente: NÃO repita

Responda APENAS JSON:
{
  "shouldRespond": <true apenas se necessário>,
  "urgency": "${urgency}",
  "responseType": "observe|hint|encourage|demonstrate|correct|advance",
  "message": "sua reação específica (máximo 2 frases, 1-2 emojis)",
  "codeExample": "código apenas se responseType=demonstrate",
  "nextAction": "próxima ação sugerida"
}`;

    try {
      const result = await teacher.generateContent(prompt);
      const response = JSON.parse(result.response.text().replace(/```json|```/g, '').trim());
      
      return {
        shouldRespond: response.shouldRespond,
        urgency: response.urgency,
        responseType: response.responseType,
        message: response.message,
        codeExample: response.codeExample,
        nextAction: response.nextAction
      };
    } catch (error) {
      console.error('Erro na resposta pedagógica:', error);
      return this.createFallbackResponse(currentCode, concept, 0);
    }
  }

  /**
   * Calcula urgência baseada no evento
   */
  private calculateUrgency(event: CodeEvent): 'low' | 'medium' | 'high' | 'immediate' {
    if (event.significance === 'critical') return 'immediate';
    if (event.type === 'stuck' && event.confidence > 80) return 'high';
    if (event.type === 'error' && event.significance === 'high') return 'high';
    if (event.type === 'completion') return 'medium';
    return 'low';
  }

  /**
   * Contexto do progresso no conceito atual
   */
  private getProgressContext(concept: string): string {
    const progress = this.conceptProgress.get(concept) || 0;
    const attempts = this.watchingHistory.filter(e => e.concept === concept).length;
    return `${progress}% (${attempts} tentativas)`;
  }

  /**
   * Adiciona evento ao histórico
   */
  private addToHistory(event: CodeEvent): void {
    this.watchingHistory.push(event);
    
    // Limita histórico
    if (this.watchingHistory.length > 50) {
      this.watchingHistory = this.watchingHistory.slice(-25);
    }

    // Atualiza progresso do conceito
    if (event.type === 'progress' || event.type === 'completion') {
      const currentProgress = this.conceptProgress.get(event.concept) || 0;
      const newProgress = Math.min(100, currentProgress + (event.confidence / 10));
      this.conceptProgress.set(event.concept, newProgress);
    }
  }

  /**
   * Resposta de fallback quando APIs falham
   */
  private createFallbackResponse(code: string, concept: string, timeIdle: number): TeachingMoment {
    console.error('❌ AI Watcher falhou - sem fallback disponível');
    throw new Error('Não é possível gerar resposta de ensino - API indisponível');
  }

  /**
   * Limpa estado para novo conceito
   */
  public resetForNewConcept(concept: string): void {
    this.lastSignificantEvent = null;
    this.responseHistory = [];
    this.conceptProgress.set(concept, 0);
  }

  /**
   * Obtém estatísticas atuais
   */
  public getStats() {
    return {
      eventsProcessed: this.watchingHistory.length,
      responsesGiven: this.responseHistory.length,
      currentProgress: Object.fromEntries(this.conceptProgress),
      isProcessing: this.isProcessing
    };
  }
}

// Instância singleton
export const intelligentWatcher = new IntelligentAIWatcher();
