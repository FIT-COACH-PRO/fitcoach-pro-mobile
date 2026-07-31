# FitCoach Pro — Redesign Dark UI (spec de implementação)

## Contexto

App mobile React Native + Expo, backend Supabase com RLS por `trainer_id`.
O design foi refeito: tema escuro com acento laranja vibrante, nova navegação,
painel de perfil acessado pelo avatar, e formulários de criação de aluno e
treino que hoje não existem.

Os mockups foram gerados por IA (Lovable + Gemini) e contêm artefatos que NÃO
devem ser replicados:

- Textos corrompidos ("Poops - Iusado", "más- mask", "Issagrato", "Enenita",
  "provincar") — usar sempre os rótulos reais definidos neste documento
- Logo "PCP" distorcida — usar o ícone real do app (`assets/icon.png`)
- Bordas e sombras irregulares — usar os valores de radius e elevação deste spec
- Nomes de pessoas (Ana Paula, Bruno Lima etc.) são dados de exemplo — as telas
  consomem dados reais do Supabase, conforme já conectado nas fases anteriores.
  Este redesign é EXCLUSIVAMENTE visual e de navegação. Não reintroduzir
  sample.ts nem dados falsos.

O app será submetido à App Store: respeitar Human Interface Guidelines da Apple —
alvos de toque mínimos de 44pt, respeito a safe areas, fonte do sistema,
contraste legível, sem elementos cortados por notch ou home indicator.

## Regras de execução

1. Trabalhar em fases, na ordem definida na seção "Ordem de execução".
2. Não alterar lógica de dados, queries, auth ou navegação além do especificado.
3. Não instalar dependência sem avisar antes qual e por quê.
4. Toda cor sai dos tokens — nenhum hex solto em tela.

---

## FASE 1 — Tokens do tema

O app passa a ter UM tema: o escuro deste design. Substituir os `darkTokens`
em `src/theme/index.ts` pela paleta abaixo, definir `dark` como modo padrão e
remover o seletor de tema da UI (manter a infraestrutura de ThemeMode intacta
para o futuro — só esconder a opção).

O acento do dark antigo era verde; agora é laranja. O `lightTokens` (bege)
fica no código sem uso — não apagar.

const darkTokens: ThemeTokens = {
  surface: {
    page:    '#14100C',
    card:    '#221B14',
    sunken:  '#2C241B',
    divider: '#3A2F24',
    frame:   '#000000',
  },
  text: {
    primary:   '#F4EFE8',
    secondary: '#A6988A',
    muted:     '#6E6257',
    onDark:    '#F4EFE8',
    onAccent:  '#FFFFFF',
  },
  accent: {
    base:    '#F0641E',
    hover:   '#D5541A',
    pressed: '#B8460F',
    subtle:  '#3A2415',
  },
  success: {
    base:   '#5BBF6B',
    hover:  '#4AA85A',
    subtle: '#1E3322',
  },
  warning: {
    base:   '#E8A13D',
    subtle: '#382A14',
  },
  danger: {
    base:   '#E05252',
    hover:  '#C74444',
    subtle: '#381A1A',
  },
};

Notas de aplicação:

- Valores monetários (R$) usam accent.base (laranja), não mais verde.
- Badge "Ativo" = success. "Pausado" = warning. "Inativo" = neutro
  (surface.sunken + text.secondary). "Atrasado" = danger.
- Botões primários com cor sólida accent.base nesta entrega; gradiente é
  refinamento posterior (exigiria expo-linear-gradient — não instalar agora).
- spacing, radius e fontSize existentes permanecem. Único ajuste: FAB e botão
  central da tab bar usam círculo de 56px.

---

## FASE 2 — Navegação nova

### Tab bar

Sai a aba "Mais". Nova ordem, cinco posições:

1. Home (home) — stack atual
2. Alunos (account-group) — stack atual
3. CENTRO: Comunidade (account-group-outline) — botão circular flutuante
4. Treinos (dumbbell) — stack atual
5. Agenda (calendar) — tela atual

O botão central é um círculo laranja de 56px, elevado ~20px acima da barra,
com sombra. Abre a tela Comunidade, que permanece com o estado "Em breve"
atual — sem funcionalidade nova.

DECISÃO REGISTRADA: destacar no centro uma feature "Em breve" segue o mockup
fielmente, mas é candidata a troca por Alunos no centro. Implementar como
especificado; a troca é ajuste de uma linha depois.

A barra usa surface.card de fundo, divider no topo, aba ativa em accent.base,
inativas em text.secondary.

### Perfil via avatar

As telas que viviam na aba "Mais" (Financeiro, Notificações, Configurações)
migram para uma nova tela Perfil, aberta pelo avatar no cabeçalho da Home.

Estrutura da tela Perfil:

- Cabeçalho: avatar grande com inicial, nome do trainer, subtítulo
  "Personal Trainer" (sem "Plano Pro" — planos ainda não existem)
- Seção CONTA: Configurações do Perfil (em breve), Configurações Gerais
  (abre ConfiguracoesScreen), Notificações (abre NotificacoesScreen)
- Seção NEGÓCIO: Financeiro (abre FinanceiroScreen), Conexões e Integrações
  (em breve)
- Seção ADMINISTRATIVO: Privacidade e Segurança (em breve), Ajuda e Suporte
  (em breve)
- Botão "Sair da conta" em danger, no rodapé

Itens "em breve" mostram o badge padrão e não navegam. Ajustar os ParamLists
em src/navigation/types.ts: remover MaisStack, criar PerfilStack ou anexar ao
HomeStack — escolher o que gerar menos mudança e reportar.

MaisScreen.tsx deixa de ser usada — remover apenas depois que a navegação nova
compilar e for validada.

### Cabeçalho padrão

Home, Alunos, Treinos e Agenda ganham no canto direito do cabeçalho:

- Ícone de sino (abre Notificações) com ponto laranja quando houver não lidas
- Avatar circular 36px com inicial do trainer em fundo laranja (abre Perfil)

Estender o componente ScreenHeader existente — não criar componente novo.

---

## FASE 3 — Restyle das telas existentes

Aplicar o tema novo tela a tela. Layout e hierarquia seguem os mockups; a
lógica de dados não muda.

### Login

- Fundo page, card central card
- Logo: usar assets/icon.png real — NÃO recriar a logo distorcida do mockup
- O mockup mostra toggle CPF/CNPJ. NÃO implementar: a autenticação é por
  e-mail no Supabase e não há coluna de login por CPF. Manter E-mail e Senha
  com o visual novo (inputs sunken, borda divider, foco laranja)
- "Esqueci minha senha" em laranja, conectado ao fluxo real já implementado
- Botão Entrar laranja, largura total, 48px de altura
- "Não tem conta? Cadastre-se grátis" — link laranja para o cadastro real

### Home

- Saudação "Bom dia, {nome}" + data por extenso (lógica atual)
- Sino e avatar no cabeçalho (Fase 2)
- Grade 2×3 de métricas: mesmos dados, cards card, número grande em
  text.primary, ícone em círculo sunken com cor semântica
- Valores monetários em laranja
- Lista de renovações: avatar colorido com inicial, nome, data relativa,
  valor à direita em laranja

### Alunos

- Busca em input sunken, chips de filtro (ativo laranja preenchido,
  inativos sunken)
- Linhas: avatar com inicial, nome, foco/plano em secondary, badge de status
- FAB laranja abre o formulário Novo Aluno (Fase 4)

### Treinos

- Busca + chips de categoria (Todos, Superiores, Inferiores, Cardio) — não
  existe coluna de categoria para esses filtros; renderizar os chips
  filtrando por template_category se preenchido, senão exibir só "Todos".
  Não inventar dado.
- Cards maiores: ícone, nome, nível, descrição em duas linhas com
  reticências, badge "Ativo" quando aplicável, duração
- FAB laranja abre o formulário Novo Treino (Fase 4)

### Agenda

Substituir a faixa de 7 dias por calendário mensal:

- Cabeçalho "MÊS ANO" com setas para navegar entre meses
- Grade Seg–Dom; dia selecionado em círculo laranja preenchido; hoje com
  contorno laranja quando não selecionado
- Ponto laranja sob os dias que têm sessão (derivar das sessions reais)
- Lista do dia selecionado abaixo: horário, nome do aluno, tipo, ação
  "Ver/Editar" em laranja (abre o detalhe existente; edição real é futura)
- Implementar com date math próprio — SEM biblioteca de calendário nova.
  Se inviável no prazo, reportar antes: fallback é a faixa semanal atual
  com o visual novo.

### Notificações, Financeiro, Configurações

Somente aplicar tokens novos. Sem mudança estrutural.

---

## FASE 4 — Formulários de criação (essenciais para o piloto)

Hoje os FABs mostram Alert "em breve". O objetivo do piloto é coletar uso
real — sem criar aluno e treino, não há uso. Prioridade máxima.

### Novo Aluno

Tela de stack (não modal), cabeçalho "Novo Aluno" + "Cancelar".

Campos → colunas de students:

- Nome Completo → full_name (obrigatório)
- E-mail → email
- WhatsApp → whatsapp (obrigatório, máscara (11) 99999-9999)
- Data de Nascimento → birth_date
- Sexo → gender (male/female/other)
- Plano de Treino (texto livre, ex. "Hipertrofia - 3x/sem") → objective
- Data de Início → subscription_start
- Mensalidade (R$) → monthly_fee
- Notas e Objetivos → observations

- O mockup tem campo CPF do aluno — students NÃO tem coluna cpf. Omitir.
- "Periodicidade de Cobrança" e "Forma de Pagamento" pertencem a payments.
  Omitir nesta entrega.
- "Adicionar Fotos de Avaliação" → botão desabilitado com "Em breve"
- Ao salvar: insert com trainer_id do usuário autenticado, status 'active',
  voltar para a lista e recarregar. Erro → ErrorState inline, sem Alert
  genérico.

### Novo Treino

Cabeçalho "Novo Treino" + "Cancelar".

- Nome do Treino → name (obrigatório)
- Nível → difficulty (beginner/intermediate/advanced)
- Duração (meses) → duration_weeks (armazenar meses × 4)
- Frequência (dias/sem) → days_per_week (1–7)
- Descrição ("Snippets" no mockup) → description
- Dias de Treino (chips Seg–Dom) → gera workout_days: um day por dia
  marcado, day_order sequencial, name "Treino A/B/C…"
- Adicionar Exercício → gera workout_exercises

Adicionar Exercício: lista dinâmica no form — nome, séries, repetições,
descanso (s), carga opcional. Cada exercício associado ao dia selecionado no
momento da adição (seletor simples de dia ativo).
Ao salvar: insert de workout (type 'custom', is_template false), depois
workout_days, depois workout_exercises, nessa ordem. Falha no meio → erro
claro; não deixar treino pela metade (apagar o workout criado se os days
falharem).

---

## FASE 5 — Gates de funcionalidade do piloto

1. Insights de IA desativados. Criar flag em src/config.ts:
   export const INSIGHTS_ENABLED = false;
   O card de Insights permanece visível, botão desabilitado com "Disponível
   em breve". NENHUMA chamada à Edge Function quando a flag está false.
2. Comunidade segue "Em breve" — só o visual novo da tela de aviso.
3. Verificar que nenhum caminho de código chama a Edge Function de insights
   fora do gate.

---

## Ordem de execução

1. Fase 1 (tokens)
2. Fase 2 (navegação + perfil)
3. Fase 5 (gates — rápida, obrigatória antes de qualquer build)
4. Fase 4 (formulários) — ANTES do restyle fino
5. Fase 3 (restyle telas) — Agenda mensal é o primeiro corte de escopo

## Critérios de aceite

- npx tsc --noEmit limpo e testes passando ao final de cada fase
- Nenhum hex fora dos tokens; nenhuma referência a sample.ts
- Login por e-mail funcionando com visual novo; sem toggle CPF/CNPJ
- Avatar do cabeçalho abre Perfil; itens da antiga aba Mais acessíveis
- FABs de Alunos e Treinos abrem formulários reais que gravam no Supabase
- Botão de Insights desabilitado; zero chamadas à Edge Function com flag off
- Comunidade abre "Em breve" sem erro nem loading infinito
- Todas as telas respeitam safe area e alvos de toque ≥ 44pt