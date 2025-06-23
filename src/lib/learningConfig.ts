export const learningConfig = {
  // Configurações de digitação automática
  typing: {
    speed: 50, // milissegundos por caractere
    pauseBetweenLines: 200, // pausa entre linhas
    showCursor: true
  },

  // Configurações de timing
  timing: {
    messageDelay: 1000, // delay antes de enviar próxima mensagem
    codeDisplayDelay: 3000, // tempo para mostrar código
    explanationDelay: 2000, // tempo para explicações
    autoCheckDelay: 2000 // delay para verificação automática de exercícios
  },

  // Configurações visuais
  ui: {
    progressBarColor: '#3b82f6',
    successColor: '#10b981',
    warningColor: '#f59e0b',
    errorColor: '#ef4444',
    fontSize: {
      mobile: 'text-sm',
      desktop: 'text-base'
    }
  },

  // Configurações de feedback
  feedback: {
    encouragingMessages: [
      '🎉 Excelente!',
      '✨ Muito bem!',
      '🚀 Perfeito!',
      '👏 Parabéns!',
      '💪 Ótimo trabalho!'
    ],
    hintMessages: [
      '💡 Dica:',
      '🤔 Pense nisso:',
      '💭 Lembre-se:',
      '🔍 Observe que:'
    ]
  },

  // Configurações de exercícios
  exercises: {
    maxHints: 3,
    allowSkip: true,
    autoProgress: true,
    codeValidation: {
      caseSensitive: false,
      ignoreWhitespace: true,
      checkVariableNames: true
    }
  }
};

export type LearningConfig = typeof learningConfig;
