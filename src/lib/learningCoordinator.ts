/**
 * Sistema Coordenado de Chat e Editor
 * Arquitetura: Observer Pattern + Command Pattern
 * Gerencia a interação sincronizada entre chat e editor
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  ChatMessage, 
  CodeExercise, 
  TeachingContext,
  TeachingAction,
  LearningTopic,
  CodeSnapshot,
  UserAssessment,
  SessionProgress
} from '@/types/learningSystem';

// Configuração dual de IAs especializadas com chaves diferentes
const chatGenAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
const codeGenAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY_SECONDARY || '');

// 🗨️ IA especializada em conversação educativa (Chave 1 - NEXT_PUBLIC_GEMINI_API_KEY)
// Responsável por: Chat, perguntas, respostas, explicações, motivação
const chatAI = chatGenAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.8, // Mais criativa para conversação natural
    maxOutputTokens: 500,
  }
});

// 👨‍💻 IA especializada em código e exercícios (Chave 2 - NEXT_PUBLIC_GEMINI_API_KEY_SECONDARY)  
// Responsável por: Monitoramento de código, exemplos, exercícios, análise técnica
const codeAI = codeGenAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.4, // Balanceada para código
    maxOutputTokens: 800,
  }
});

export interface LearningCoordinatorObserver {
  onChatMessage(message: ChatMessage): void;
  onCodeGenerated(code: string, explanation: string): void;
  onExerciseCreated(exercise: CodeExercise): void;
  onProgressUpdate(progress: SessionProgress): void;
}

/**
 * Coordenador principal que gerencia Chat + Editor
 */
export class LearningCoordinator {
  private observers: LearningCoordinatorObserver[] = [];
  private currentContext: TeachingContext | null = null;
  private conversationHistory: ChatMessage[] = [];
  private codeHistory: CodeSnapshot[] = [];
  private isProcessing = false;

  // Observer Pattern
  addObserver(observer: LearningCoordinatorObserver): void {
    this.observers.push(observer);
  }

  removeObserver(observer: LearningCoordinatorObserver): void {
    this.observers = this.observers.filter(obs => obs !== observer);
  }

  private notifyObservers<K extends keyof LearningCoordinatorObserver>(
    method: K, 
    ...args: Parameters<LearningCoordinatorObserver[K]>
  ): void {
    this.observers.forEach(observer => {
      (observer[method] as any)(...args);
    });
  }

  /**
   * Inicia uma nova sessão de aprendizado
   */
  async startLearningSession(
    assessment: UserAssessment,
    currentTopic: LearningTopic,
    sessionProgress: SessionProgress
  ): Promise<void> {
    this.currentContext = {
      userAssessment: assessment,
      currentTopic,
      sessionProgress,
      recentCodeHistory: [],
      recentChatHistory: [],
      userIdleTime: 0,
      strugglingIndicators: []
    };

    // Mensagem de boas-vindas personalizada
    const welcomeMessage = await this.generateWelcomeMessage();
    this.addChatMessage(welcomeMessage);

    // Gera primeiro exemplo/exercício
    setTimeout(() => {
      this.generateTopicIntroduction();
    }, 2000);
  }

  /**
   * Processa mudanças no código do editor
   */
  async onCodeChange(code: string, language: string): Promise<void> {
    if (this.isProcessing || !this.currentContext) return;

    const codeSnapshot: CodeSnapshot = {
      id: Date.now().toString(),
      timestamp: new Date(),
      code,
      language,
      topicId: this.currentContext.currentTopic.id,
      isValid: this.validateCode(code),
      errors: this.analyzeCodeErrors(code),
      metrics: this.calculateCodeMetrics(code)
    };

    this.codeHistory.push(codeSnapshot);
    this.currentContext.recentCodeHistory = this.codeHistory.slice(-5);

    // Analisa se deve reagir ao código
    const shouldReact = await this.shouldReactToCode(codeSnapshot);
    if (shouldReact) {
      const action = await this.generateCodeReaction(codeSnapshot);
      await this.executeTeachingAction(action);
    }
  }

  /**
   * Processa mensagens do usuário no chat
   */
  async onUserMessage(userMessage: string): Promise<void> {
    if (!this.currentContext) return;

    console.log('💬 Processando mensagem do usuário:', userMessage);

    // Adiciona mensagem do usuário
    const userChatMessage: ChatMessage = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'user',
      content: userMessage,
      timestamp: new Date(),
      topicId: this.currentContext.currentTopic.id,
      messageType: 'question'
    };

    this.addChatMessage(userChatMessage);

    // Gera resposta da IA
    const aiResponse = await this.generateChatResponse(userMessage);
    this.addChatMessage(aiResponse);

    // Verifica se deve gerar código/exercício baseado na conversa
    const shouldGenerateCode = await this.shouldGenerateCodeFromChat(userMessage);
    console.log('🤔 Deve gerar código?', shouldGenerateCode, 'para mensagem:', userMessage);
    
    if (shouldGenerateCode) {
      console.log('👨‍💻 Gerando código em 1.5 segundos...');
      setTimeout(async () => {
        await this.generateCodeExample(userMessage);
      }, 1500);
    }
  }

  /**
   * Gera mensagem de boas-vindas personalizada
   */
  private async generateWelcomeMessage(): Promise<ChatMessage> {
    if (!this.currentContext) throw new Error('Contexto não definido');
    
    const prompt = `
Você é um tutor de programação amigável. Crie uma mensagem de boas-vindas personalizada:

PERFIL DO ESTUDANTE:
- Nível: ${this.currentContext.userAssessment.level}
- Linguagem: ${this.currentContext.userAssessment.language}
- Interesses: ${this.currentContext.userAssessment.interests.join(', ')}
- Objetivos: ${this.currentContext.userAssessment.goals.join(', ')}
- Estilo: ${this.currentContext.userAssessment.learningStyle}

TÓPICO ATUAL: ${this.currentContext.currentTopic.title}

Crie uma mensagem:
1. Calorosa e motivadora
2. Que mencione o tópico atual
3. Que conecte com os interesses do usuário
4. Máximo 2-3 frases
5. Use 1-2 emojis apropriados

Responda apenas o texto da mensagem.`;

    try {
      const result = await chatAI.generateContent(prompt);
      return {
        id: `welcome_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'ai',
        content: result.response.text(),
        timestamp: new Date(),
        topicId: this.currentContext.currentTopic.id,
        messageType: 'introduction'
      };
    } catch (error) {
      console.error('Erro ao gerar mensagem de boas-vindas:', error);
      throw error;
    }
  }

  /**
   * Gera introdução do tópico com exemplo de código
   */
  private async generateTopicIntroduction(): Promise<void> {
    if (!this.currentContext) return;

    this.isProcessing = true;

    try {
      // 1. Mensagem explicativa no chat
      const explanationMessage = await this.generateTopicExplanation();
      this.addChatMessage(explanationMessage);

      // 2. Aguarda um pouco e gera código de exemplo
      setTimeout(async () => {
        const codeExample = await this.generateTopicCodeExample();
        this.notifyObservers('onCodeGenerated', codeExample.code, codeExample.explanation);

        // 3. Mensagem incentivando a prática
        setTimeout(() => {
          const practiceMessage: ChatMessage = {
            id: Date.now().toString(),
            type: 'ai',
            content: 'Agora é sua vez! Tente modificar o código acima ou escreva seu próprio exemplo. Estou aqui para ajudar! 💡',
            timestamp: new Date(),
            topicId: this.currentContext!.currentTopic.id,
            messageType: 'encouragement'
          };
          this.addChatMessage(practiceMessage);
        }, 2000);
      }, 3000);

    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Gera explicação do tópico para o chat
   */
  private async generateTopicExplanation(): Promise<ChatMessage> {
    if (!this.currentContext) throw new Error('Contexto não definido');

    const prompt = `
Explique este tópico de ${this.currentContext.userAssessment.language} de forma clara e motivadora:

TÓPICO: ${this.currentContext.currentTopic.title}
DESCRIÇÃO: ${this.currentContext.currentTopic.description}
OBJETIVOS: ${this.currentContext.currentTopic.learningObjectives.join(', ')}
NÍVEL DO USUÁRIO: ${this.currentContext.userAssessment.level}
ESTILO DE APRENDIZADO: ${this.currentContext.userAssessment.learningStyle}

Crie uma explicação:
1. Clara e acessível para o nível do usuário
2. Que conecte com aplicações práticas
3. Motivadora, mostrando a importância do tópico
4. 3-4 frases máximo
5. Use linguagem conversacional
6. Mencione que vai mostrar um exemplo

Responda apenas o texto da explicação.`;

    try {
      const result = await chatAI.generateContent(prompt);
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: result.response.text(),
        timestamp: new Date(),
        topicId: this.currentContext.currentTopic.id,
        messageType: 'explanation'
      };
    } catch (error) {
      console.error('Erro ao gerar explicação:', error);
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: `Vamos aprender sobre ${this.currentContext.currentTopic.title}! Este conceito é fundamental para programação.`,
        timestamp: new Date(),
        topicId: this.currentContext.currentTopic.id,
        messageType: 'explanation'
      };
    }
  }

  /**
   * Gera exemplo de código INTELIGENTE para o tópico
   */
  private async generateTopicCodeExample(): Promise<{ code: string; explanation: string }> {
    if (!this.currentContext) throw new Error('Contexto não definido');

    const { userAssessment, currentTopic } = this.currentContext;
    const adaptiveLevel = userAssessment.adaptiveLevel || 'beginner';
    const generalLevel = userAssessment.generalProgrammingLevel || 'none';
    const languageLevel = userAssessment.languageSpecificLevel || 'none';

    console.log('🧠 Geração INTELIGENTE de código:', {
      adaptiveLevel,
      generalLevel,
      languageLevel,
      topic: currentTopic.title
    });

    const prompt = `
Crie um exemplo de código ${userAssessment.language} INTELIGENTEMENTE ADAPTADO:

ANÁLISE INTELIGENTE DO USUÁRIO:
- Nível Adaptativo: ${adaptiveLevel}
- Experiência Geral: ${generalLevel}  
- Conhecimento da Linguagem: ${languageLevel}
- Anos de Experiência: ${userAssessment.programmingExperienceYears || 0}

TÓPICO: ${currentTopic.title}
OBJETIVOS: ${currentTopic.learningObjectives.join(', ')}
INTERESSES: ${userAssessment.interests.join(', ')}

${adaptiveLevel === 'intermediate_syntax' ? `
🎯 ESTRATÉGIA: SINTAXE INTERMEDIÁRIA
O usuário entende conceitos de programação, mas precisa aprender a sintaxe específica de ${userAssessment.language}.

CÓDIGO DEVE:
- Usar conceitos intermediários que ele já conhece (loops, condicionais, funções)
- Mostrar a sintaxe específica de ${userAssessment.language}
- Ter comentários explicando as diferenças sintáticas
- Evitar explicações básicas de conceitos
- Focar em "como fazer em ${userAssessment.language}"
- 15-25 linhas de código
- Nível de complexidade: intermediário mas focado em sintaxe

EXEMPLO DE ABORDAGEM:
// Como fazer loops em ${userAssessment.language} (você já conhece o conceito)
// Estrutura de dados específica de ${userAssessment.language}
// Sintaxe de funções em ${userAssessment.language}
` : adaptiveLevel === 'intermediate_concepts' ? `
🎯 ESTRATÉGIA: CONCEITOS INTERMEDIÁRIOS
O usuário tem base na linguagem e quer aprofundar conceitos.

CÓDIGO DEVE:
- Usar conceitos intermediários específicos da linguagem
- Mostrar padrões e melhores práticas
- Explicar o "porquê" além do "como"
- 20-30 linhas de código
- Incluir conceitos como OOP, estruturas de dados avançadas
` : adaptiveLevel === 'advanced' ? `
🎯 ESTRATÉGIA: CONCEITOS AVANÇADOS
O usuário é experiente e quer tópicos complexos.

CÓDIGO DEVE:
- Usar padrões avançados e otimizações
- Mostrar código profissional e eficiente
- Explicar trade-offs e decisões de design
- 25-40 linhas de código
- Incluir conceitos como design patterns, performance
` : `
🎯 ESTRATÉGIA: FUNDAMENTOS COMPLETOS
O usuário é iniciante total em programação.

CÓDIGO DEVE:
- Começar com conceitos muito básicos
- Explicar cada linha detalhadamente
- Usar exemplos simples e práticos
- 8-15 linhas de código
- Focar em entendimento gradual
`}

Requisitos:
1. Código claro e bem comentado em português
2. Exemplo prático e relevante aos interesses
3. Apropriado para o nível adaptativo detectado
4. Comentários explicativos específicos para o nível

Responda em JSON:
{
  "code": "código aqui",
  "explanation": "explicação de 1-2 frases sobre o que o código faz e por que é apropriado para este nível"
}`;

    try {
      const result = await codeAI.generateContent(prompt);
      let responseText = result.response.text().replace(/```json|```/g, '').trim();
      
      // Tentar limpar a resposta se não for JSON válido
      if (!responseText.startsWith('{')) {
        const jsonStart = responseText.indexOf('{');
        const jsonEnd = responseText.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          responseText = responseText.substring(jsonStart, jsonEnd + 1);
        }
      }
      
      const response = JSON.parse(responseText);
      
      console.log('✅ Código INTELIGENTE gerado:', {
        linhas: response.code.split('\n').length,
        adaptiveLevel,
        hasComments: response.code.includes('#') || response.code.includes('//')
      });
      
      return response;
    } catch (error) {
      // Mostrar erro em vez de usar fallback silencioso
      if (error instanceof Error && error.message.includes('quota')) {
        console.error('❌ ERRO: Quota da API Gemini excedida!', error.message);
        throw new Error('Quota da API Gemini excedida. Limite de 50 requests/dia atingido.');
      } else {
        console.error('❌ ERRO ao gerar código inteligente:', error);
        throw error; // Re-throw para que o erro seja propagado
      }
    }
  }

  /**
   * Gera resposta para mensagem do usuário
   */
  private async generateChatResponse(userMessage: string): Promise<ChatMessage> {
    if (!this.currentContext) throw new Error('Contexto não definido');

    const recentChat = this.conversationHistory.slice(-3).map(msg => 
      `${msg.type}: ${msg.content}`
    ).join('\n');

    const prompt = `
Você é um tutor de programação conversando com um estudante.

CONTEXTO:
- Tópico atual: ${this.currentContext.currentTopic.title}
- Nível do usuário: ${this.currentContext.userAssessment.level}
- Últimas mensagens:
${recentChat}

MENSAGEM DO USUÁRIO: "${userMessage}"

Responda como um tutor experiente:
1. Seja prestativo e encorajador
2. Responda diretamente à pergunta/comentário
3. Se for dúvida técnica, explique claramente
4. Se precisar, sugira que vai mostrar exemplo no editor
5. Use linguagem conversacional e amigável
6. Máximo 2-3 frases
7. Use emojis quando apropriado

Responda apenas o texto da resposta.`;

    try {
      const result = await chatAI.generateContent(prompt);
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: result.response.text(),
        timestamp: new Date(),
        topicId: this.currentContext.currentTopic.id,
        messageType: 'feedback'
      };
    } catch (error) {
      console.error('Erro ao gerar resposta:', error);
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: 'Entendi! Vou te ajudar com isso. 😊',
        timestamp: new Date(),
        topicId: this.currentContext.currentTopic.id,
        messageType: 'feedback'
      };
    }
  }

  /**
   * Verifica se deve gerar código baseado na conversa
   */
  private async shouldGenerateCodeFromChat(userMessage: string): Promise<boolean> {
    const codeKeywords = [
      'exemplo', 'código', 'mostrar', 'como fazer', 'demonstrar', 
      'não entendi', 'explica', 'como', 'fazer', 'me dê', 'me de',
      'gerar', 'criar', 'implementar', 'escrever', 'show', 'example',
      'pode mostrar', 'vou mostrar', 'tutorial', 'prática', 'exercício'
    ];
    
    const shouldGenerate = codeKeywords.some(keyword => 
      userMessage.toLowerCase().includes(keyword)
    );
    
    console.log('🔍 Análise de keywords:', {
      mensagem: userMessage,
      keywords: codeKeywords.filter(k => userMessage.toLowerCase().includes(k)),
      resultado: shouldGenerate
    });
    
    return shouldGenerate;
  }

  /**
   * Gera exemplo de código baseado na conversa
   */
  private async generateCodeExample(userMessage: string): Promise<void> {
    if (!this.currentContext) return;

    console.log('👨‍💻 Iniciando geração de código para:', userMessage);

    const chatMessage: ChatMessage = {
      id: `code_gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'ai',
      content: 'Deixe-me mostrar um exemplo no editor! 👨‍💻',
      timestamp: new Date(),
      topicId: this.currentContext.currentTopic.id,
      messageType: 'explanation'
    };

    this.addChatMessage(chatMessage);

    try {
      // Gera código específico para a pergunta
      const codeExample = await this.generateSpecificCodeExample(userMessage);
      
      console.log('✅ Código gerado:', codeExample);
      
      setTimeout(() => {
        console.log('📤 Enviando código para o editor...');
        this.notifyObservers('onCodeGenerated', codeExample.code, codeExample.explanation);
      }, 1000);
    } catch (error) {
      console.error('❌ Erro ao gerar código:', error);
      
      // Lança erro em vez de usar fallback
      throw error;
    }
  }

  /**
   * Gera código específico INTELIGENTE baseado na pergunta do usuário
   */
  private async generateSpecificCodeExample(userMessage: string): Promise<{ code: string; explanation: string }> {
    if (!this.currentContext) throw new Error('Contexto não definido');

    const { userAssessment, currentTopic } = this.currentContext;
    const adaptiveLevel = userAssessment.adaptiveLevel || 'beginner';

    const prompt = `
O usuário perguntou: "${userMessage}"

CONTEXTO INTELIGENTE:
- Tópico atual: ${currentTopic.title}
- Linguagem: ${userAssessment.language}
- Nível Adaptativo: ${adaptiveLevel}
- Experiência Geral: ${userAssessment.generalProgrammingLevel || 'basic'}
- Conhecimento da Linguagem: ${userAssessment.languageSpecificLevel || 'none'}

${adaptiveLevel === 'intermediate_syntax' ? `
🎯 ESTRATÉGIA INTELIGENTE: SINTAXE INTERMEDIÁRIA
O usuário entende programação, mas precisa da sintaxe específica de ${userAssessment.language}.

RESPOSTA DEVE:
- Mostrar como fazer isso especificamente em ${userAssessment.language}
- Usar conceitos que ele já conhece
- Focar na sintaxe, não na explicação do conceito
- Incluir comentários sobre diferenças de outras linguagens
- Ser direta e prática
` : adaptiveLevel === 'beginner' ? `
🎯 ESTRATÉGIA INTELIGENTE: FUNDAMENTOS
O usuário é iniciante e precisa de explicação completa.

RESPOSTA DEVE:
- Explicar o conceito básico primeiro
- Mostrar código muito simples
- Incluir muitos comentários explicativos
- Ser gradual e detalhada
` : `
🎯 ESTRATÉGIA INTELIGENTE: CONCEITOS INTERMEDIÁRIOS/AVANÇADOS
O usuário tem base e quer aprofundar.

RESPOSTA DEVE:
- Mostrar exemplos mais sofisticados
- Incluir boas práticas
- Explicar o "porquê" das escolhas
- Ser mais concisa mas completa
`}

Crie um exemplo de código que responda especificamente à pergunta no nível adequado.

MUITO IMPORTANTE: 
- Responda APENAS com JSON válido
- Não inclua texto explicativo fora do JSON
- Não use markdown code blocks
- Use escape de aspas duplas dentro das strings

Formato obrigatório:
{
  "code": "código aqui com \\n para quebras de linha",
  "explanation": "explicação aqui"
}

JSON de resposta:`;

    try {
      const result = await codeAI.generateContent(prompt);
      const responseText = result.response.text().trim();
      
      // Tentar extrair JSON do texto de resposta
      let response;
      try {
        // Remover markdown code blocks se existirem
        const cleanText = responseText.replace(/```json\s*|\s*```/g, '').trim();
        
        // Tentar fazer parse direto
        response = JSON.parse(cleanText);
      } catch (parseError) {
        console.log('❌ JSON parse falhou, tentando extrair JSON do texto:', responseText.substring(0, 200));
        
        // Tentar encontrar JSON no texto usando regex
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            response = JSON.parse(jsonMatch[0]);
          } catch (regexParseError) {
            console.error('❌ Regex JSON parse também falhou');
            throw new Error('IA não retornou JSON válido');
          }
        } else {
          // Se não conseguir extrair JSON, criar manualmente
          console.log('⚠️ Criando estrutura manual a partir do texto da IA');
          const lines = responseText.split('\n');
          const codeLines = lines.filter(line => 
            line.includes('def ') || 
            line.includes('print(') || 
            line.includes('=') || 
            line.includes('if ') ||
            line.includes('for ') ||
            line.includes('#')
          );
          
          response = {
            code: codeLines.length > 0 ? codeLines.join('\n') : `# Exemplo de ${userMessage}\nprint("Exemplo baseado em: ${userMessage}")`,
            explanation: `Aqui está um exemplo de ${userMessage} em ${this.currentContext?.userAssessment.language || 'Python'}`
          };
        }
      }
      
      console.log('🎯 Código específico INTELIGENTE gerado:', {
        userMessage: userMessage.substring(0, 50),
        adaptiveLevel,
        codeLength: response.code?.length || 0
      });
      
      return response;
    } catch (error) {
      console.error('❌ Erro ao gerar código específico inteligente:', error);
      throw error; // Propagar erro em vez de usar fallback
    }
  }
  // Métodos auxiliares...
  private addChatMessage(message: ChatMessage): void {
    this.conversationHistory.push(message);
    this.notifyObservers('onChatMessage', message);
    
    if (this.currentContext) {
      this.currentContext.recentChatHistory = this.conversationHistory.slice(-5);
    }
  }

  private async shouldReactToCode(codeSnapshot: CodeSnapshot): Promise<boolean> {
    // Critérios mais inteligentes para reagir ao código
    const codeLength = codeSnapshot.code.trim().length;
    const hasSignificantContent = codeLength > 15;
    const hasRecentChanges = this.codeHistory.length > 0 && 
      this.codeHistory[this.codeHistory.length - 1]?.code !== codeSnapshot.code;
    
    // Reagir se:
    // 1. Código tem conteúdo significativo E houve mudanças
    // 2. OU há erros para corrigir
    // 3. OU progresso significativo (>70% completude)
    return hasSignificantContent && (
      hasRecentChanges ||
      codeSnapshot.errors.length > 0 ||
      codeSnapshot.metrics.completeness > 70
    );
  }

  private async generateCodeReaction(codeSnapshot: CodeSnapshot): Promise<TeachingAction> {
    if (!this.currentContext) throw new Error('Contexto não definido');

    const prompt = `
Você é uma IA especializada em monitoramento de código em tempo real. Analise o código do estudante e gere uma resposta contextual.

PERFIL DO ESTUDANTE:
- Nível: ${this.currentContext.userAssessment.level}
- Linguagem: ${this.currentContext.userAssessment.language}
- Tópico atual: ${this.currentContext.currentTopic.title}

CÓDIGO ATUAL:
\`\`\`${codeSnapshot.language}
${codeSnapshot.code}
\`\`\`

ANÁLISE TÉCNICA:
- Linhas: ${codeSnapshot.metrics.linesOfCode}
- Completude: ${codeSnapshot.metrics.completeness}%
- Erros detectados: ${codeSnapshot.errors.length}
- Última mudança: agora

INSTRUÇÕES PARA RESPOSTA:
- Se há progresso: reconheça especificamente o que foi feito bem
- Se há erros: dê dicas técnicas precisas
- Se está travado: sugira próximos passos específicos
- Se completou algo: parabenize e sugira evolução
- Seja técnico mas amigável (máximo 2 frases)
- Use emojis quando apropriado

Responda apenas a mensagem para o estudante:`;

    try {
      // Usando a IA especializada em código (segunda chave)
      const result = await codeAI.generateContent(prompt);
      const response = result.response;
      
      return {
        type: 'chat_message',
        priority: 'medium',
        content: {
          chatMessage: {
            id: Date.now().toString(),
            type: 'ai',
            content: response.text(),
            timestamp: new Date(),
            topicId: codeSnapshot.topicId,
            messageType: 'feedback'
          }
        },
        timing: 'immediate'
      };
    } catch (error) {
      console.error('❌ Erro na IA de código (chave 2):', error);
      throw error;
    }
  }

  private async executeTeachingAction(action: TeachingAction): Promise<void> {
    if (action.content.chatMessage) {
      this.addChatMessage(action.content.chatMessage);
    }
  }

  private validateCode(code: string): boolean {
    // Validação básica do código
    return code.trim().length > 0;
  }

  private analyzeCodeErrors(code: string): string[] {
    // Análise básica de erros
    return [];
  }

  private calculateCodeMetrics(code: string): any {
    return {
      linesOfCode: code.split('\n').length,
      complexity: 1,
      completeness: Math.min(100, code.length / 10),
      quality: 80,
      timeSpent: 0
    };
  }
}
