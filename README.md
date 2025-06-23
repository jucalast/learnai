# LearnAI - Tutor de Programação com IA

Um sistema avançado de ensino de programação em tempo real que usa a API Gemini do Google para fornecer assistência de IA personalizada enquanto você aprende múltiplas linguagens de programação.

## 🚀 Características Principais

- **Interface similar ao VS Code** com tema dark profissional
- **Editor de código Monaco** integrado com syntax highlighting
- **Assistente de IA em tempo real** usando Google Gemini
- **Suporte a múltiplas linguagens**: JavaScript, TypeScript, Python, Java, C#, C++
- **Sistema de lições progressivas** do básico ao avançado
- **Análise de código inteligente** com sugestões e correções
- **Console de saída integrado** para visualizar resultados

## 🛠️ Tecnologias Utilizadas

- **Next.js 14** com App Router
- **TypeScript** para tipagem forte
- **Tailwind CSS** para estilização
- **Monaco Editor** (mesmo editor do VS Code)
- **Google Gemini AI** para assistência inteligente
- **Lucide React** para ícones

## 📋 Pré-requisitos

- Node.js 18+ 
- NPM ou Yarn
- Chave da API Gemini (Google AI Studio)

## 🔧 Instalação

1. Clone o repositório:
\`\`\`bash
git clone <repository-url>
cd learnai
\`\`\`

2. Instale as dependências:
\`\`\`bash
npm install
\`\`\`

3. Configure as variáveis de ambiente:
\`\`\`bash
cp .env.example .env.local
\`\`\`

4. Adicione sua chave da API Gemini no arquivo \`.env.local\`:
\`\`\`
GEMINI_API_KEY=sua_chave_aqui
NEXT_PUBLIC_GEMINI_API_KEY=sua_chave_aqui
\`\`\`

5. Execute o projeto:
\`\`\`bash
npm run dev
\`\`\`

6. Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 🎯 Como Usar

1. **Selecione uma linguagem** na barra lateral esquerda
2. **Escolha uma lição** ou comece com código próprio
3. **Digite seu código** no editor principal
4. **Receba feedback em tempo real** do assistente de IA
5. **Execute seu código** usando o botão "Executar"
6. **Veja os resultados** no painel de saída

## 🤖 Funcionalidades da IA

- **Análise em tempo real**: A IA analisa seu código enquanto você digita
- **Sugestões inteligentes**: Dicas para melhorar seu código
- **Correções automáticas**: Identificação e correção de erros
- **Explicações educativas**: Aprenda conceitos enquanto programa
- **Progressão adaptativa**: Dificuldade ajustada ao seu nível

## 📁 Estrutura do Projeto

\`\`\`
src/
├── app/                 # App Router do Next.js
│   ├── layout.tsx      # Layout principal
│   ├── page.tsx        # Página inicial
│   └── globals.css     # Estilos globais
├── components/         # Componentes React
│   ├── CodeEditor.tsx  # Editor de código
│   ├── AIAssistant.tsx # Assistente de IA
│   ├── Sidebar.tsx     # Barra lateral
│   ├── TopBar.tsx      # Barra superior
│   └── OutputPanel.tsx # Painel de saída
├── lib/               # Utilitários e configurações
│   ├── gemini.ts      # Configuração da API Gemini
│   └── languages.ts   # Configuração das linguagens
└── types/             # Definições TypeScript
    └── index.ts       # Tipos principais
\`\`\`

## 📝 Scripts Disponíveis

- \`npm run dev\` - Executa em modo de desenvolvimento
- \`npm run build\` - Cria build de produção
- \`npm run start\` - Executa build de produção
- \`npm run lint\` - Executa linting do código

## 🔑 Obtendo Chave da API Gemini

1. Acesse [Google AI Studio](https://aistudio.google.com/)
2. Faça login com sua conta Google
3. Vá para "Get API Key"
4. Crie uma nova chave de API
5. Copie a chave e adicione no arquivo \`.env.local\`

## 🎨 Personalização

O sistema foi projetado para ser facilmente personalizável:

- **Temas**: Modifique \`globals.css\` para criar novos temas
- **Linguagens**: Adicione novas linguagens em \`lib/languages.ts\`
- **Lições**: Crie novas lições na mesma estrutura
- **IA**: Ajuste prompts em \`lib/gemini.ts\`

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (\`git checkout -b feature/AmazingFeature\`)
3. Commit suas mudanças (\`git commit -m 'Add some AmazingFeature'\`)
4. Push para a branch (\`git push origin feature/AmazingFeature\`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo \`LICENSE\` para mais detalhes.

## 🌟 Próximas Funcionalidades

- [ ] Sistema de usuários e progresso
- [ ] Mais linguagens de programação
- [ ] Projetos colaborativos
- [ ] Integração com GitHub
- [ ] Sistema de badges e conquistas
- [ ] Modo offline
- [ ] Temas personalizáveis
- [ ] Exportação de projetos

## 📞 Suporte

Se você encontrar algum problema ou tiver sugestões, por favor:

1. Verifique as [Issues existentes](../../issues)
2. Crie uma nova issue se necessário
3. Forneça detalhes sobre o problema
4. Inclua screenshots se possível

---

Desenvolvido com ❤️ usando Next.js e Google Gemini AI
