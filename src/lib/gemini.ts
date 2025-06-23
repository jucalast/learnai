import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY não encontrada nas variáveis de ambiente');
}

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

export const geminiModel = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-flash',
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 2048,
  },
});

export async function analyzeCode(code: string, language: string): Promise<{
  suggestion: string;
  explanation: string;
  type: 'hint' | 'correction' | 'explanation' | 'encouragement';
}> {
  const prompt = `
    Você é um tutor de programação experiente. Analise o seguinte código ${language} e forneça feedback construtivo:

    \`\`\`${language}
    ${code}
    \`\`\`

    Responda em português com:
    1. Uma sugestão específica para melhorar o código
    2. Uma explicação educativa sobre o conceito
    3. Indique se é uma dica (hint), correção (correction), explicação (explanation) ou encorajamento (encouragement)

    Formato da resposta:
    SUGGESTION: [sua sugestão]
    EXPLANATION: [sua explicação]
    TYPE: [hint|correction|explanation|encouragement]
  `;

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = result.response.text();
    
    const suggestionMatch = response.match(/SUGGESTION: ([\s\S]*?)(?=\nEXPLANATION:|$)/);
    const explanationMatch = response.match(/EXPLANATION: ([\s\S]*?)(?=\nTYPE:|$)/);
    const typeMatch = response.match(/TYPE: (hint|correction|explanation|encouragement)/);
    
    return {
      suggestion: suggestionMatch?.[1]?.trim() || 'Continue praticando!',
      explanation: explanationMatch?.[1]?.trim() || 'Você está no caminho certo.',
      type: (typeMatch?.[1] as any) || 'encouragement'
    };
  } catch (error) {
    console.error('Erro ao analisar código:', error);
    return {
      suggestion: 'Continue escrevendo código! Você está indo bem.',
      explanation: 'A prática leva à perfeição. Continue experimentando!',
      type: 'encouragement'
    };
  }
}

export async function getLesson(language: string, level: string): Promise<{
  title: string;
  description: string;
  code: string;
  objectives: string[];
}> {
  const prompt = `
    Crie uma lição de programação em ${language} para nível ${level}.
    
    Responda em português no formato:
    TITLE: [título da lição]
    DESCRIPTION: [descrição da lição]
    CODE: [código exemplo]
    OBJECTIVES: [objetivos separados por |]
  `;

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = result.response.text();
    
    const titleMatch = response.match(/TITLE: ([\s\S]*?)(?=\nDESCRIPTION:|$)/);
    const descriptionMatch = response.match(/DESCRIPTION: ([\s\S]*?)(?=\nCODE:|$)/);
    const codeMatch = response.match(/CODE: ([\s\S]*?)(?=\nOBJECTIVES:|$)/);
    const objectivesMatch = response.match(/OBJECTIVES: ([\s\S]*?)$/);
    
    return {
      title: titleMatch?.[1]?.trim() || 'Lição de Programação',
      description: descriptionMatch?.[1]?.trim() || 'Aprenda os fundamentos da programação.',
      code: codeMatch?.[1]?.trim() || '// Seu código aqui',
      objectives: objectivesMatch?.[1]?.trim().split('|').map(obj => obj.trim()) || ['Aprender conceitos básicos']
    };
  } catch (error) {
    console.error('Erro ao gerar lição:', error);
    return {
      title: 'Lição Básica',
      description: 'Uma lição introdutória de programação.',
      code: '// Comece escrevendo seu código aqui',
      objectives: ['Aprender sintaxe básica', 'Praticar conceitos fundamentais']
    };
  }
}
