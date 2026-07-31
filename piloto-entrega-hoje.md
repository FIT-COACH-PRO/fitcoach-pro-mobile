# FitCoach Pro — Entrega do Piloto (hoje)

## Objetivo

Distribuir hoje um APK Android para um grupo de personais testarem o app em uso
real. Escopo mínimo e seguro: ligar insights de IA com limite de uso, corrigir
a leitura de notificações, tornar o CREF opcional, gerar o APK e verificar que
nenhuma chave secreta vazou. Nada além disso.

Envio de treino no piloto é por TEXTO (o botão "Compartilhar treino" já existe e
funciona). Vídeo, PDF com imagens e treino compartilhável NÃO entram nesta
entrega — são o próximo bloco, num segundo APK no fim de semana.

## Regras de execução

1. Trabalhar em fases, na ordem. Parar ao fim de cada uma, rodar
   `npx tsc --noEmit` e os testes, reportar e aguardar confirmação.
2. Não tocar em código de telas, formulários ou navegação — está validado.
3. Não instalar dependência nova.
4. Se algo exigir mudar código de app além do descrito, PARAR e avisar antes.

---

## FASE 1 — Insights de IA com limite de uso

O usuário vai configurar a `ANTHROPIC_API_KEY` como secret da Edge Function de
insights e pagar a API. Antes de ligar a flag, a função precisa de duas
proteções que hoje não tem: rejeitar chamada não autenticada de forma explícita
e limitar o uso por personal.

### 1.1 — Limite de uso por personal (server-side, na Edge Function)

Implementar um limite de 5 chamadas de insights por personal por dia, contado no
servidor — não confiar em contagem feita no app, que é contornável.

Antes de escrever, verifique se já existe alguma tabela de controle de uso no
projeto. Não existe até onde foi mapeado — então proponha uma tabela simples
(por exemplo: trainer_id, data, contador) com RLS, e me mostre o SQL antes de
aplicar. A migração roda manualmente no SQL Editor do Supabase, igual à de
notificações; eu aplico e confirmo.

A Edge Function, a cada chamada:
- Confirma que há um usuário autenticado (JWT do trainer). Se não houver,
  rejeita explicitamente com erro claro, em vez de depender do RLS retornar
  vazio por efeito colateral.
- Verifica o contador do dia para aquele trainer. Se já atingiu 5, retorna um
  erro amigável do tipo "limite diário de insights atingido", sem chamar a API
  da Anthropic.
- Se está abaixo do limite, chama a API, e só incrementa o contador se a
  chamada foi bem-sucedida.

### 1.2 — Ligar a flag

Em `src/config.ts`, mudar `INSIGHTS_ENABLED` de `false` para `true`.

No `AlunoDetalheScreen.tsx`, com a flag ligada o botão volta a funcionar
normalmente. Quando a Edge Function retornar o erro de limite atingido, a tela
mostra essa mensagem no lugar do resultado, sem parecer que o app quebrou —
reaproveitar o `ErrorState`/`iaError` que já existe, com a mensagem vinda da
função.

### 1.3 — Confirmações

- A chave da API vive apenas nos secrets da Edge Function, nunca no app nem em
  variável `EXPO_PUBLIC_`.
- Testar o caminho do limite: simular 6 chamadas e confirmar que a 6ª é barata
  (não chega à API) e mostra mensagem clara.
- Testar o caminho não autenticado: confirmar rejeição explícita.

---

## FASE 2 — Correção da aba de Notificações

A migração `read`/`read_at` já foi escrita numa fase anterior mas não foi
aplicada nem consumida. O usuário vai aplicá-la manualmente no SQL Editor do
Supabase e confirmar aqui.

Depois de confirmada a migração:

- Substituir os dados fake de notificações pela leitura real da tabela
  `notifications` do trainer autenticado, ordenada da mais recente para a mais
  antiga, seguindo o padrão de `requireUserId()` já usado em `endpoints.ts`.
- A tela mostra estado vazio ("Tudo em dia" ou equivalente) quando não há
  notificações — sem loading infinito, sem erro no console.
- Marcar como lida: ao abrir a tela de Notificações, as não lidas do trainer
  passam a `read = true` com `read_at = now()`. Manter simples — marcar todas
  como lidas na abertura da tela é suficiente para o piloto; não precisa de
  marcação individual por item agora.
- Reativar o ponto laranja de "não lida" no sino do cabeçalho, agora que a
  coluna existe: o sino mostra o ponto quando houver ao menos uma notificação
  não lida do trainer. Contagem leve — um count com `read = false`, não trazer
  todas as linhas.

Se a migração não tiver sido confirmada como aplicada, PARAR e avisar — não
escrever a leitura contra colunas que talvez não existam.

---

## FASE 2.5 — CREF opcional

Hoje o CREF é obrigatório no perfil do personal. Passa a ser opcional: o
personal preenche se tiver, mas consegue criar conta e usar o app sem.

A mudança tem dois lados que PRECISAM andar juntos, senão o cadastro quebra:

Primeiro, investigue e me reporte o estado real antes de mexer:
- A coluna `cref` na tabela de perfis é `NOT NULL`? (provavelmente sim)
- O fluxo de cadastro (signup) realmente coleta CREF, ou ele só existe no
  schema e é preenchido depois na edição de perfil? No cadastro que vi, os
  campos eram nome, e-mail e senha — confirme se CREF entra em algum ponto do
  cadastro ou só no perfil.
- Há validação de CREF obrigatório em algum lugar do app?

Depois de reportar, aplique conforme o que encontrar:

- No banco: se a coluna for `NOT NULL`, escreva a migração que a torna
  nullable. Me mostre o SQL antes — eu aplico manualmente no Supabase e
  confirmo, igual às outras migrações.
- No app: se houver validação de CREF obrigatório em cadastro ou perfil,
  remova, deixando o campo opcional. Se o cadastro nem coleta CREF, não há nada
  a fazer no app além de confirmar isso.

Risco a evitar: mudar só o app sem soltar o `NOT NULL` do banco faz o cadastro
sem CREF ser aceito no app e rejeitado pelo banco, quebrando na cara do
personal. Os dois lados vão juntos ou nenhum vai.

---

## FASE 3 — Build do APK de piloto

Só após as fases 1 e 2 validadas por mim em app rodando.

A configuração de build já existe: o perfil `preview` no `eas.json` gera APK
instalável direto (não AAB), com as variáveis públicas do Supabase declaradas,
e o `projectId` do EAS está no `app.json`. A config Android do `app.json`
(package, versionCode, adaptiveIcon, permissions) está intacta — foi confirmado
que a remoção nunca foi mesclada nesta branch.

- Confirmar que o número de versão incrementa a cada build, para eu identificar
  de qual versão veio cada relato de erro.
- Me dar o comando exato do build e explicar o fluxo: roda na nuvem da Expo,
  20 a 40 minutos de fila, keystore gerada automaticamente por ser o primeiro
  build Android deste projeto, e ao final um link de download mais QR code.
- Não disparar o build sem meu ok — eu decido quando rodar.

---

## FASE 4 — Verificação de segurança do APK (passo 5)

Depois do build, antes de eu mandar o link para qualquer personal:

- Instruir como inspecionar o conteúdo do APK gerado e confirmar que:
  - a chave anon do Supabase pode aparecer (é pública por design, protegida por
    RLS) — isso é esperado e ok;
  - NENHUMA chave de service role do Supabase aparece;
  - NENHUMA chave de API da Anthropic aparece (ela deve estar só na Edge
    Function).
- Me mostrar o resultado dessa verificação. Só depois disso o link é liberado.

---

## Fora do escopo de hoje (registro do backlog pós-piloto)

Não implementar nada disto agora. Fica para o próximo APK:

- Envio de vídeo do exercício: captura, compressão on-device, extração de 3
  frames (início/pico/retorno) via Edge Function, e geração de PDF do treino
  com a tira de frames. Observação técnica travada: NÃO usar GIF — PDF só
  renderiza o primeiro quadro de um GIF, e GIF ocupa ~15× mais espaço que o
  vídeo. O caminho é tira de frames estáticos no PDF; GIF só serve como preview
  animado dentro do app, se um dia entrar.
- Treino compartilhável entre vários alunos: remodelar a relação treino↔aluno
  para que um treino-modelo seja atribuível a vários alunos, em vez de duplicar.
  É migração de schema mais reescrita das telas de treino — feature de médio
  porte, uma das primeiras do pós-piloto.
- Agenda mensal (visão de 30 dias com detalhe do dia ao tocar).
- Aplicar a migração de `read`/`read_at` já está na Fase 2; a de limite de uso
  de insights, na Fase 1.

Lembrete de distribuição: bibliotecas nativas novas (vídeo) exigem um APK novo
que os personais reinstalam — não entram por atualização remota (OTA). Só
mudanças de JavaScript entram por OTA.

## Critérios de aceite de hoje

- `npx tsc --noEmit` limpo e testes passando ao fim de cada fase.
- Insights funcionando com limite de 5/dia por personal, testado o caminho do
  limite e o do não autenticado.
- Notificações lendo dados reais, sino com ponto de não lida, estado vazio
  correto.
- APK gerado, com número de versão identificável.
- Verificação de segurança passada: sem service role e sem chave da Anthropic no
  pacote.