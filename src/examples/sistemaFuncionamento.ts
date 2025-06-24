/**
 * Exemplo Prático: Como o Sistema de Aprendizado Personalizado Funciona
 * 
 * Este arquivo demonstra o fluxo completo do sistema desde o assessment
 * até a coordenação entre chat e editor.
 */

// EXEMPLO 1: Assessment Completo
const exemploAssessment = {
  respostas: [
    "Sou iniciante em Python, já fiz alguns tutoriais online mas ainda tenho dificuldades com conceitos básicos",
    "Quero aprender programação para conseguir um estágio em desenvolvimento e criar meus próprios projetos",
    "Já ouvi falar de variáveis, if/else e loops, mas nunca usei na prática"
  ],
  
  perfilGerado: {
    level: "beginner",
    experience: "Iniciante com conhecimento teórico básico",
    interests: ["desenvolvimento web", "projetos pessoais", "carreira"],
    previousKnowledge: ["variáveis", "condicionais", "loops"],
    learningStyle: "practical", // Detectado pela menção de "usar na prática"
    goals: ["conseguir estágio", "criar projetos"],
    timeAvailable: "medium"
  }
};

// EXEMPLO 2: Currículo Personalizado Gerado
const curriculoPersonalizado = {
  topics: [
    {
      id: "topic_1",
      title: "Variáveis e Tipos de Dados na Prática",
      description: "Domine variáveis criando pequenos projetos práticos",
      type: "concept",
      difficulty: 1,
      estimatedTime: 45,
      learningObjectives: [
        "Criar variáveis para dados reais",
        "Entender tipos de dados com exemplos práticos", 
        "Usar variáveis em mini-projetos"
      ],
      tags: ["fundamentals", "practical"],
      priority: 10
    },
    {
      id: "topic_2", 
      title: "Condicionais: Tomando Decisões no Código",
      description: "Use if/else para criar lógica em projetos simples",
      type: "exercise",
      difficulty: 2,
      estimatedTime: 60,
      learningObjectives: [
        "Implementar decisões com if/else",
        "Combinar múltiplas condições",
        "Criar um projeto com lógica condicional"
      ],
      tags: ["logic", "practical", "projects"],
      priority: 9
    },
    {
      id: "topic_3",
      title: "Loops: Automatizando Tarefas",
      description: "Use for e while para automatizar processos",
      type: "project",
      difficulty: 3,
      estimatedTime: 75,
      learningObjectives: [
        "Criar loops eficientes",
        "Aplicar loops em projetos reais",
        "Combinar loops com condicionais"
      ],
      tags: ["automation", "practical", "projects"],
      priority: 8
    }
  ],
  
  adaptationRules: [
    {
      condition: "struggling_with_syntax",
      action: "provide_hint",
      parameters: { type: "syntax_help", examples: true }
    },
    {
      condition: "completing_quickly", 
      action: "advance",
      parameters: { add_challenge: true }
    }
  ]
};

// EXEMPLO 3: Fluxo de Coordenação Chat + Editor
const exemploFluxoCoordenado = {
  
  // 1. IA inicia explicando o tópico
  chatMensagem1: {
    type: "ai",
    content: "Vamos aprender variáveis criando um projeto prático! Vou mostrar como armazenar informações sobre um jogo simples. 🎮",
    timestamp: "2025-01-23T10:00:00Z"
  },

  // 2. IA gera código automaticamente no editor
  codigoGerado: `# Projeto: Sistema de Pontuação de Jogo
# Vamos criar variáveis para um jogo simples

# Informações do jogador
nome_jogador = "Alex"
pontuacao = 1250
nivel = 3
vidas = 3
tem_powerup = True

# Mostrando as informações
print(f"Jogador: {nome_jogador}")
print(f"Pontuação: {pontuacao}")
print(f"Nível: {nivel}")
print(f"Vidas restantes: {vidas}")

if tem_powerup:
    print("🔥 Power-up ativo!")
else:
    print("Sem power-ups")`,

  // 3. IA explica o código
  chatMensagem2: {
    type: "ai", 
    content: "Viu como criamos variáveis para diferentes tipos de dados? string (nome), int (pontos, nível), bool (power-up). Agora tente modificar os valores ou adicionar novas variáveis! 💡",
    timestamp: "2025-01-23T10:02:00Z"
  },

  // 4. Usuário modifica o código
  codigoUsuario: `# Projeto: Sistema de Pontuação de Jogo
nome_jogador = "João"  # Mudei o nome
pontuacao = 2500       # Aumentei a pontuação
nivel = 5              # Aumentei o nível
vidas = 2              # Diminui as vidas
tem_powerup = False    # Desativei o power-up

# Nova variável que eu adicionei
experiencia = 1500

print(f"Jogador: {nome_jogador}")
print(f"Pontuação: {pontuacao}")
print(f"Nível: {nivel}")
print(f"Vidas restantes: {vidas}")
print(f"Experiência: {experiencia}")  # Nova linha

if tem_powerup:
    print("🔥 Power-up ativo!")
else:
    print("Sem power-ups")`,

  // 5. IA detecta progresso e responde
  chatMensagem3: {
    type: "ai",
    content: "Excelente! 🎉 Você entendeu perfeitamente! Modificou valores existentes E criou uma nova variável 'experiencia'. Isso mostra que dominou o conceito. Pronto para o próximo desafio?",
    timestamp: "2025-01-23T10:05:00Z"
  },

  // 6. Usuário faz pergunta
  usuarioMensagem: {
    type: "user",
    content: "Posso criar uma variável para o nome do jogo também?",
    timestamp: "2025-01-23T10:06:00Z"
  },

  // 7. IA responde e gera exemplo
  chatMensagem4: {
    type: "ai",
    content: "Claro que sim! Ótima ideia! Vou mostrar como adicionar isso ao nosso código. 👨‍💻",
    timestamp: "2025-01-23T10:06:30Z"
  },

  // 8. IA gera código atualizado
  codigoAtualizado: `# Projeto: Sistema de Pontuação de Jogo
nome_jogo = "Python Quest"  # Nova variável para o nome do jogo
nome_jogador = "João"
pontuacao = 2500
nivel = 5
vidas = 2
tem_powerup = False
experiencia = 1500

# Cabeçalho do jogo
print(f"=== {nome_jogo} ===")
print(f"Jogador: {nome_jogador}")
print(f"Pontuação: {pontuacao}")
print(f"Nível: {nivel}")
print(f"Vidas restantes: {vidas}")
print(f"Experiência: {experiencia}")

if tem_powerup:
    print("🔥 Power-up ativo!")
else:
    print("Sem power-ups")

print("=" * 20)`
};

// EXEMPLO 4: Métricas e Adaptação em Tempo Real
const exemploMetricas = {
  sessaoProgresso: {
    topicsCompleted: [],
    exercisesCompleted: [],
    currentScore: 85,
    timeSpent: 420, // 7 minutos
    strugglingAreas: [], // Nenhuma dificuldade detectada
    strengthAreas: ["variables", "string_manipulation"],
    adaptationsMade: 0
  },

  analiseIA: {
    engagementScore: 92, // Alto engajamento
    progressRate: 1.2,   // 1.2 conceitos por 10 minutos
    difficultyAdaptation: 0, // Nível apropriado
    chatInteractionRate: 0.8, // 0.8 mensagens por minuto
    codeQualityTrend: [70, 75, 85, 90], // Melhorando
    recommendation: "Usuário está progredindo bem. Pode avançar para próximo tópico."
  }
};

// EXEMPLO 5: Detecção de Dificuldades e Adaptação
const exemploAdaptacao = {
  situacao: "Usuário está há 2 minutos sem modificar código e fez 3 perguntas sobre sintaxe",
  
  deteccaoIA: {
    strugglingIndicators: ["idle_time_high", "syntax_questions", "no_code_progress"],
    adaptationNeeded: true,
    suggestedAction: "provide_guided_example"
  },

  acaoTomada: {
    chatMensagem: {
      type: "ai",
      content: "Vejo que você está com algumas dúvidas sobre sintaxe. Que tal eu criar um exemplo passo a passo bem detalhado? 🔍",
      messageType: "hint"
    },
    
    codigoGuiado: `# Vamos fazer passo a passo - Criando variáveis
# Passo 1: Escolha um nome descritivo
idade = 25          # ✅ Bom: nome claro

# Passo 2: Python detecta o tipo automaticamente  
nome = "Maria"      # ✅ String (texto)
altura = 1.75       # ✅ Float (decimal)
estudante = True    # ✅ Boolean (verdadeiro/falso)

# Passo 3: Use as variáveis
print(nome)         # ✅ Mostra: Maria
print(idade)        # ✅ Mostra: 25

# Agora você tenta! Crie uma variável para:
# - Sua cor favorita
# - Quantos pets você tem
# - Se você gosta de pizza (True/False)`,

    followUp: "Tente criar essas 3 variáveis. Estou aqui para ajudar com qualquer dúvida! 😊"
  }
};

export {
  exemploAssessment,
  curriculoPersonalizado, 
  exemploFluxoCoordenado,
  exemploMetricas,
  exemploAdaptacao
};
