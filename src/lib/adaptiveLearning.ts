import { UserAssessment } from '../components/InitialAssessment';

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  estimatedTime: string;
  topics: Topic[];
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  type: 'concept' | 'exercise' | 'project' | 'challenge';
  difficulty: number; // 1-5
  prerequisites: string[];
  codeExample?: string;
  explanation?: string;
  exercises?: Exercise[];
}

export interface Exercise {
  id: string;
  question: string;
  startingCode?: string;
  expectedOutput?: string;
  hints: string[];
  solution: string;
  explanation: string;
}

export interface AdaptiveLearningState {
  assessment: UserAssessment | null;
  currentPath: LearningPath | null;
  currentTopic: Topic | null;
  progress: {
    topicsCompleted: string[];
    exercisesCompleted: string[];
    currentScore: number;
    timeSpent: number;
  };
  adaptiveFeatures: {
    strugglingAreas: string[];
    strengthAreas: string[];
    preferredLearningStyle: 'visual' | 'practical' | 'theoretical' | 'mixed';
    adaptationNeeded: boolean;
  };
}

export class AdaptiveLearningManager {
  private state: AdaptiveLearningState;
  private onStateChange: (state: AdaptiveLearningState) => void;

  constructor(onStateChange: (state: AdaptiveLearningState) => void) {
    this.state = {
      assessment: null,
      currentPath: null,
      currentTopic: null,
      progress: {
        topicsCompleted: [],
        exercisesCompleted: [],
        currentScore: 0,
        timeSpent: 0
      },
      adaptiveFeatures: {
        strugglingAreas: [],
        strengthAreas: [],
        preferredLearningStyle: 'mixed',
        adaptationNeeded: false
      }
    };
    this.onStateChange = onStateChange;
  }

  setAssessment(assessment: UserAssessment) {
    this.state.assessment = assessment;
    this.state.currentPath = this.generateLearningPath(assessment);
    this.notifyStateChange();
  }

  private generateLearningPath(assessment: UserAssessment): LearningPath {
    const language = assessment.language.toLowerCase();
    
    if (language === 'python') {
      return this.generatePythonPath(assessment);
    } else if (language === 'javascript') {
      return this.generateJavaScriptPath(assessment);
    }
    
    // Fallback para outras linguagens
    return this.generateGenericPath(assessment);
  }

  private generatePythonPath(assessment: UserAssessment): LearningPath {
    const baseTopics: Topic[] = [];
    
    if (assessment.level === 'beginner') {
      baseTopics.push(
        {
          id: 'python-basics-1',
          title: 'Primeiros Passos com Python',
          description: 'Entendendo variáveis, tipos de dados e operações básicas',
          type: 'concept',
          difficulty: 1,
          prerequisites: [],
          codeExample: `# Bem-vindo ao Python!
nome = "Python"
versao = 3.12
ativo = True

print(f"Olá, {nome}!")
print(f"Versão: {versao}")
print(f"Ativo: {ativo}")`,
          explanation: 'Em Python, criamos variáveis simplesmente atribuindo valores. Python identifica automaticamente o tipo de dado.',
          exercises: [
            {
              id: 'vars-1',
              question: 'Crie variáveis para armazenar seu nome, idade e se você gosta de programar',
              startingCode: '# Crie suas variáveis aqui\n',
              hints: [
                'Use aspas para textos: nome = "Seu nome"',
                'Números não precisam de aspas: idade = 25',
                'Para verdadeiro/falso use True/False'
              ],
              solution: 'nome = "João"\nidade = 25\ngosta_programar = True',
              explanation: 'Variáveis em Python são criadas simplesmente atribuindo valores com o operador ='
            }
          ]
        },
        {
          id: 'python-basics-2',
          title: 'Trabalhando com Listas',
          description: 'Aprendendo a criar e manipular listas de dados',
          type: 'concept',
          difficulty: 2,
          prerequisites: ['python-basics-1'],
          codeExample: `# Listas em Python
frutas = ["maçã", "banana", "laranja"]
numeros = [1, 2, 3, 4, 5]

# Acessando elementos
print(frutas[0])  # Primeira fruta

# Adicionando elementos
frutas.append("uva")
print(frutas)`,
          explanation: 'Listas são estruturas que guardam múltiplos valores em ordem. Usamos [] e separamos por vírgula.',
          exercises: [
            {
              id: 'lists-1',
              question: 'Crie uma lista com 5 de suas comidas favoritas e imprima a primeira e a última',
              startingCode: '# Crie sua lista de comidas favoritas\n',
              hints: [
                'Use colchetes: lista = ["item1", "item2"]',
                'Primeiro item: lista[0]',
                'Último item: lista[-1]'
              ],
              solution: 'comidas = ["pizza", "hambúrguer", "sushi", "lasanha", "sorvete"]\nprint(comidas[0])\nprint(comidas[-1])',
              explanation: 'Listas começam no índice 0. O índice -1 sempre aponta para o último elemento.'
            }
          ]
        }
      );
    } else if (assessment.level === 'intermediate') {
      baseTopics.push(
        {
          id: 'python-functions',
          title: 'Funções Avançadas',
          description: 'Criando funções reutilizáveis e eficientes',
          type: 'concept',
          difficulty: 3,
          prerequisites: [],
          codeExample: `def calcular_media(*notas, peso=1):
    """Calcula média das notas com peso opcional"""
    if not notas:
        return 0
    
    total = sum(notas) * peso
    return total / len(notas)

# Exemplos de uso
print(calcular_media(8, 9, 7))
print(calcular_media(8, 9, 7, peso=1.2))`,
          explanation: 'Funções com *args permitem número variável de argumentos. Parâmetros com valores padrão tornam a função mais flexível.',
          exercises: [
            {
              id: 'functions-1',
              question: 'Crie uma função que calcula desconto de um produto',
              startingCode: 'def calcular_desconto(preco, desconto=10):\n    # Sua implementação aqui\n    pass\n',
              hints: [
                'Desconto padrão de 10%',
                'Retorne o preço com desconto',
                'desconto_valor = preco * (desconto/100)'
              ],
              solution: 'def calcular_desconto(preco, desconto=10):\n    desconto_valor = preco * (desconto/100)\n    return preco - desconto_valor',
              explanation: 'Parâmetros padrão tornam a função mais flexível e fácil de usar.'
            }
          ]
        }
      );
    } else { // advanced
      baseTopics.push(
        {
          id: 'python-advanced',
          title: 'Programação Orientada a Objetos',
          description: 'Classes, herança e princípios OOP em Python',
          type: 'concept',
          difficulty: 4,
          prerequisites: [],
          codeExample: `class ContaBancaria:
    def __init__(self, titular, saldo_inicial=0):
        self._titular = titular
        self._saldo = saldo_inicial
        self._historico = []
    
    @property
    def saldo(self):
        return self._saldo
    
    def depositar(self, valor):
        if valor > 0:
            self._saldo += valor
            self._historico.append(f"Depósito: +{valor}")
            return True
        return False
    
    def sacar(self, valor):
        if 0 < valor <= self._saldo:
            self._saldo -= valor
            self._historico.append(f"Saque: -{valor}")
            return True
        return False

# Exemplo de uso
conta = ContaBancaria("João", 1000)
conta.depositar(500)
print(f"Saldo: R$ {conta.saldo}")`,
          explanation: 'Classes encapsulam dados e comportamentos. Properties permitem acesso controlado aos atributos.',
          exercises: [
            {
              id: 'oop-1',
              question: 'Estenda a classe ContaBancaria com um método para transferência',
              startingCode: '# Adicione o método transferir à classe\n',
              hints: [
                'Verifique se há saldo suficiente',
                'Use os métodos sacar e depositar',
                'Considere validações'
              ],
              solution: 'def transferir(self, conta_destino, valor):\n    if self.sacar(valor):\n        conta_destino.depositar(valor)\n        return True\n    return False',
              explanation: 'Reutilizar métodos existentes mantém o código consistente e reduz duplicação.'
            }
          ]
        }
      );
    }

    return {
      id: `python-path-${assessment.level}`,
      title: `Python ${assessment.level.charAt(0).toUpperCase() + assessment.level.slice(1)}`,
      description: `Trilha personalizada de Python para nível ${assessment.level}`,
      level: assessment.level === 'unknown' ? 'beginner' : assessment.level,
      language: 'python',
      estimatedTime: assessment.level === 'beginner' ? '4-6 semanas' : assessment.level === 'intermediate' ? '3-4 semanas' : '2-3 semanas',
      topics: baseTopics
    };
  }

  private generateJavaScriptPath(assessment: UserAssessment): LearningPath {
    // Similar implementation for JavaScript
    return {
      id: `javascript-path-${assessment.level}`,
      title: `JavaScript ${assessment.level.charAt(0).toUpperCase() + assessment.level.slice(1)}`,
      description: `Trilha personalizada de JavaScript para nível ${assessment.level}`,
      level: assessment.level === 'unknown' ? 'beginner' : assessment.level,
      language: 'javascript',
      estimatedTime: '3-5 semanas',
      topics: []
    };
  }

  private generateGenericPath(assessment: UserAssessment): LearningPath {
    return {
      id: `generic-path-${assessment.level}`,
      title: `${assessment.language} Learning Path`,
      description: `Trilha personalizada para ${assessment.language}`,
      level: assessment.level === 'unknown' ? 'beginner' : assessment.level,
      language: assessment.language,
      estimatedTime: '4-6 semanas',
      topics: []
    };
  }

  startTopic(topicId: string) {
    if (this.state.currentPath) {
      const topic = this.state.currentPath.topics.find(t => t.id === topicId);
      if (topic) {
        this.state.currentTopic = topic;
        this.notifyStateChange();
      }
    }
  }

  completeTopic(topicId: string, score: number = 100) {
    this.state.progress.topicsCompleted.push(topicId);
    this.state.progress.currentScore += score;
    this.analyzeProgress();
    this.notifyStateChange();
  }

  completeExercise(exerciseId: string, attempts: number, timeSpent: number) {
    this.state.progress.exercisesCompleted.push(exerciseId);
    this.state.progress.timeSpent += timeSpent;
    
    // Analisar performance para adaptação
    if (attempts > 3) {
      this.state.adaptiveFeatures.adaptationNeeded = true;
    }
    
    this.notifyStateChange();
  }

  private analyzeProgress() {
    // Análise simples de progresso para adaptação
    const completionRate = this.state.progress.topicsCompleted.length / (this.state.currentPath?.topics.length || 1);
    
    if (completionRate > 0.5 && this.state.progress.currentScore > 80) {
      this.state.adaptiveFeatures.preferredLearningStyle = 'practical';
    }
  }

  getNextRecommendation(): Topic | null {
    if (!this.state.currentPath) return null;
    
    // Encontrar próximo tópico baseado em pré-requisitos
    return this.state.currentPath.topics.find(topic => 
      !this.state.progress.topicsCompleted.includes(topic.id) &&
      topic.prerequisites.every(prereq => 
        this.state.progress.topicsCompleted.includes(prereq)
      )
    ) || null;
  }

  getState(): AdaptiveLearningState {
    return { ...this.state };
  }

  private notifyStateChange() {
    this.onStateChange({ ...this.state });
  }
}
