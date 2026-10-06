// Tokens semânticos do FitCoach.
// Os valores hex são fixos por design — não substituir por valores de
// bibliotecas de tema genéricas (MD3, etc.). Consumir sempre via useAppTheme().

export const colors = {
  // Superfícies (fundo)
  surface: {
    page:      '#EDE1C9', // fundo do app — bege areia quente
    card:      '#FAF3E1', // cards e superfícies elevadas — creme
    sunken:    '#E4D3A8', // fundo de ícones circulares, chips
    divider:   '#D9C89E', // linhas divisórias, borders sutis
    frame:     '#26221C', // frame escuro (barras de status, se houver)
  },

  // Texto
  text: {
    primary:   '#1F1B15', // preto quente — títulos, números
    secondary: '#78685A', // marrom-cinza — labels, subtítulos, datas
    muted:     '#A0907C', // placeholder, texto desabilitado
    onDark:    '#FAF3E1', // texto sobre fills escuros (frame, avatares)
    onAccent:  '#FAF3E1', // texto sobre laranja-brasa
  },

  // Acento principal — energia, ação, item ativo, CTA
  accent: {
    base:      '#C2410C', // laranja-brasa (queimado, cor de couro/tijolo)
    hover:     '#9A340A',
    pressed:   '#7A2909',
    subtle:    '#F5D5B8', // background de banners/badges de alerta suave
  },

  // Valores, dinheiro, "success" — verde-oliva militar
  success: {
    base:      '#4D5D2E', // verde-oliva escuro
    hover:     '#3F4A24',
    subtle:    '#D8DBC0', // background de badges positivos
  },

  // Alerta / pendências — âmbar profundo (não amarelo neon)
  warning: {
    base:      '#B45309',
    subtle:    '#F5E0BF',
  },

  // Erro / crítico — vermelho tijolo (não vermelho neon)
  danger: {
    base:      '#991B1B',
    hover:     '#7F1717',
    subtle:    '#F0D0CC',
  },
} as const;

export type ColorTokens = typeof colors;

// Escala de espaçamento. Valores derivados do que as telas já usavam
// (padding 16, gap 12) — esta task não altera espaçamento.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

// Escala tipográfica. Subiu um degrau em relação à versão inicial para dar
// leitura confortável em uso na academia (celular na mão, luz forte, pressa).
// É escala, não redesenho: os mesmos slots, só maiores.
export const fontSize = {
  xs: 13, // badges, rótulos da barra de navegação
  sm: 15, // subtítulos, datas, descrições
  md: 18, // corpo, título de card/linha de lista
  lg: 22, // títulos de seção
  xl: 30, // títulos de tela
  xxl: 38, // números grandes dos cards de métrica
} as const;

/**
 * Dimensões de elementos interativos. `min` é o piso de área de toque de
 * qualquer botão ou item de lista (Material/HIG pedem 44–48dp).
 */
export const touch = {
  min: 48, // altura mínima de botão / linha tocável
  circle: 48, // círculo de ícone em linhas de lista
  glyph: 24, // ícone dentro do círculo
  chevron: 24, // affordance de navegação à direita
  tabIcon: 26, // ícone da barra inferior
} as const;

export type Spacing = typeof spacing;
export type Radius = typeof radius;
export type FontSize = typeof fontSize;
export type Touch = typeof touch;
