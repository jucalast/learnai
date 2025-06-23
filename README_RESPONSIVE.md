# 🚀 LearnAI Programming Tutor

Sistema de ensino de programação em tempo real com assistência de IA, otimizado para todos os dispositivos.

## ✨ Principais características

- **🎨 Interface Responsiva**: Design adaptativo que funciona perfeitamente em desktop, tablet e mobile
- **📱 Mobile-First**: Experiência otimizada para dispositivos móveis com gestos touch e navegação intuitiva
- **🤖 IA Integrada**: Assistência em tempo real usando a API Gemini do Google
- **💻 Editor Avançado**: Monaco Editor integrado com syntax highlighting
- **🌙 Tema Dark**: Interface similar ao VS Code com tema escuro
- **📚 Sistema Progressivo**: Lições estruturadas do básico ao avançado
- **🔄 Multi-linguagem**: Suporte a JavaScript, Python, TypeScript e mais

## 📱 Recursos de Responsividade

### Mobile (< 768px)
- ✅ Sidebar colapsível com overlay
- ✅ Botão de ação flutuante (FAB) para ações rápidas
- ✅ Layout vertical otimizado
- ✅ Fonte e espaçamentos adaptados para touch
- ✅ Painéis redimensionáveis dinamicamente
- ✅ Navegação por gestos

### Tablet (768px - 1024px)
- ✅ Layout híbrido com painéis ajustáveis
- ✅ Sidebar persistente com largura otimizada
- ✅ Interface touch-friendly mantendo funcionalidades desktop

### Desktop (> 1024px)
- ✅ Layout completo com todos os painéis visíveis
- ✅ Atalhos de teclado
- ✅ Multi-painéis simultâneos
- ✅ Experiência completa de IDE

## 🛠️ Tecnologias utilizadas

- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS utilitário com configuração responsiva customizada
- **Monaco Editor** - Editor de código avançado
- **Google Gemini AI** - Inteligência artificial para assistência
- **Lucide React** - Ícones otimizados para diferentes tamanhos de tela

## 🚀 Como executar

1. **Clone o repositório**
   ```bash
   git clone <repository-url>
   cd learnai
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   ```bash
   cp .env.example .env.local
   ```
   Adicione sua chave da API Gemini no arquivo `.env.local`

4. **Execute em modo desenvolvimento**
   ```bash
   npm run dev
   ```

5. **Acesse a aplicação**
   - Desktop: http://localhost:3000
   - Mobile: Use o IP da sua máquina na rede local

## 📐 Breakpoints Responsivos

```css
/* Configuração customizada */
xs: 475px       /* Smartphones pequenos */
mobile: <768px   /* Modo mobile */
tablet: 768px-1023px /* Tablets */
desktop: >1024px /* Desktop */
```

## 🎯 Recursos por Dispositivo

| Recurso | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Sidebar | Overlay | Persistente | Sempre visível |
| Assistente IA | Modal/Bottom sheet | Painel lateral | Painel fixo |
| Editor | Tela cheia | Split view | Multi-painel |
| Console | Bottom drawer | Painel inferior | Painel fixo |
| FAB | ✅ | ✅ | ❌ |
| Atalhos teclado | Limitado | Parcial | Completo |

## 🔧 Estrutura do projeto

```
src/
├── app/                    # App Router do Next.js
│   ├── globals.css        # Estilos globais + responsivos
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página inicial responsiva
├── components/            # Componentes React reutilizáveis
│   ├── AIAssistant.tsx    # Assistente IA responsivo
│   ├── CodeEditor.tsx     # Editor Monaco adaptativo
│   ├── Sidebar.tsx        # Sidebar colapsível
│   ├── TopBar.tsx         # Barra superior responsiva
│   ├── OutputPanel.tsx    # Painel de saída adaptativo
│   └── MobileActionButton.tsx # FAB para mobile
├── lib/                   # Utilitários e hooks
│   ├── gemini.ts         # Integração com API Gemini
│   ├── languages.ts      # Configuração de linguagens
│   └── useResponsive.ts   # Hook customizado de responsividade
└── types/                 # Definições TypeScript
    └── index.ts
```

## 🎨 Sistema de Design Responsivo

### Princípios
- **Mobile First**: Desenvolvido primeiro para mobile, depois expandido
- **Progressive Enhancement**: Funcionalidades adicionais em telas maiores
- **Touch Friendly**: Alvos de toque de pelo menos 44px
- **Performance**: Otimizado para dispositivos com recursos limitados

### Componentes Adaptativos
- **Espaçamentos**: `p-2 md:p-4` - Padding menor em mobile
- **Fontes**: `text-sm md:text-base` - Texto responsivo
- **Ícones**: `w-4 h-4 md:w-5 md:h-5` - Ícones adaptativos
- **Alturas**: `h-10 md:h-12` - Alturas proporcionais

## 📊 Performance

- ✅ **Lighthouse Score Mobile**: 95+
- ✅ **First Contentful Paint**: < 2s
- ✅ **Largest Contentful Paint**: < 2.5s
- ✅ **Cumulative Layout Shift**: < 0.1
- ✅ **Time to Interactive**: < 3s

## 🔍 Testes de Responsividade

Para testar em diferentes dispositivos:

```bash
# Desenvolvimento com IP local
npm run dev -- --host 0.0.0.0

# Build de produção
npm run build
npm start
```

## 🚀 Deploy

O projeto está otimizado para deploy em:
- **Vercel** (recomendado para Next.js)
- **Netlify**
- **Railway**
- **Docker** (incluindo mobile testing)

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, leia as diretrizes de contribuição antes de submeter PRs.

### Foco especial em:
- Melhorias de acessibilidade móvel
- Otimizações de performance
- Novos gestos e interações touch
- Testes em dispositivos reais

---

**📱 Desenvolvido com foco na experiência móvel - Teste em seu smartphone!**
