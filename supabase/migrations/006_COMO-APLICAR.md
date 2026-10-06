# Como aplicar a migration 006 no Supabase

A migration `006_weekend_features.sql` **não é aplicada automaticamente**. Este
guia é o roteiro para rodá-la — e também serve como prompt pronto para colar no
assistente de IA do Supabase (SQL Editor → "Ask AI") ou em outra sessão de agente
com acesso ao banco.

Resumo do que a 006 faz: programas/mesociclos, histórico de progresso do aluno,
histórico de cargas por exercício, modalidade da aula (presencial/online) com
conflito de horário só entre presenciais, exercícios substitutos, janela do
alerta de vencimento por personal e o canal de avisos da comunidade.

## Ordem em relação ao app

As telas novas dependem destas tabelas. Enquanto a migration não rodar, elas
mostram mensagem de erro em vez de quebrar, e o alerta de vencimento cai no
padrão de 7 dias. Pode aplicar antes ou depois de publicar o app.

---

## Prompt

Daqui para baixo é o texto para colar no assistente, anexando junto o conteúdo de
`006_weekend_features.sql`.

```markdown
# Aplicar a migration 006 do FitCoach Pro no Supabase

Você vai aplicar uma migration num projeto Supabase que já tem as migrations
001 a 005 rodadas. O SQL completo está anexado (006_weekend_features.sql).
Siga as etapas na ordem e PARE para me avisar se qualquer checagem falhar.
Não invente nomes de tabela ou coluna: use só os que já existem no banco e os
que a migration cria.

## Etapa 1 — Checagens antes de aplicar (só leitura)

Rode as consultas abaixo e me mostre o resultado. Se algo vier diferente do
esperado, pare e me avise.

1. Extensões necessárias (esperado: as três presentes):
   SELECT extname FROM pg_extension
   WHERE extname IN ('uuid-ossp', 'pgcrypto', 'btree_gist');

2. Função de updated_at da migration 001 (esperado: 1 linha):
   SELECT proname FROM pg_proc WHERE proname = 'update_updated_at_column';

3. Colunas que a 006 pressupõe (esperado: as 3 existem):
   SELECT table_name, column_name FROM information_schema.columns
   WHERE table_schema = 'public' AND (
     (table_name = 'profiles' AND column_name = 'is_admin') OR
     (table_name = 'students' AND column_name = 'subscription_end') OR
     (table_name = 'sessions' AND column_name = 'starts_at')
   );

4. Constraint de exclusão atual de sessions (esperado: 1 linha, algo como
   sessions_trainer_id_tstzrange_excl):
   SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
   WHERE conrelid = 'public.sessions'::regclass AND contype = 'x';

5. Tabelas que a 006 vai criar NÃO devem existir ainda (esperado: 0 linhas;
   se existirem, me avise antes de seguir):
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public' AND table_name IN (
     'programs', 'program_workouts', 'student_progress', 'exercise_logs',
     'exercise_substitutes', 'community_announcements'
   );

## Etapa 2 — Aplicar

Rode o arquivo 006_weekend_features.sql inteiro, de uma vez, sem editar.

Contexto para você não estranhar:
- É idempotente: usa IF NOT EXISTS, DROP ... IF EXISTS e um bloco DO que
  remove e recria a constraint. Rodar de novo não duplica nada.
- O ÚNICO ponto destrutivo é a seção 4: remove a constraint EXCLUDE de
  sessions e recria como parcial (WHERE modalidade = 'presencial'), para que
  aula online não gere conflito de horário. Nenhuma linha é apagada. A
  recriação não tem como falhar por dados antigos: a regra nova é mais
  permissiva que a anterior.
- Aulas já cadastradas recebem modalidade = 'presencial' pelo DEFAULT, o que
  mantém o comportamento atual delas.

Se der erro, pare, me mostre a mensagem completa e NÃO tente corrigir
alterando o SQL por conta própria.

## Etapa 3 — Verificação depois de aplicar

Rode e me mostre:

1. As 6 tabelas novas existem com RLS ligado (esperado: 6 linhas, todas true):
   SELECT tablename, rowsecurity FROM pg_tables
   WHERE schemaname = 'public' AND tablename IN (
     'programs', 'program_workouts', 'student_progress', 'exercise_logs',
     'exercise_substitutes', 'community_announcements'
   );

2. Colunas novas em tabelas existentes (esperado: 4 linhas):
   SELECT table_name, column_name, column_default FROM information_schema.columns
   WHERE table_schema = 'public' AND (
     (table_name = 'workout_exercises' AND column_name = 'exercise_id') OR
     (table_name = 'student_workout_schedules' AND column_name = 'program_id') OR
     (table_name = 'sessions' AND column_name = 'modalidade') OR
     (table_name = 'profiles' AND column_name = 'renewal_alert_days')
   );

3. Constraint de sessions agora é parcial (esperado: 1 linha, nome
   sessions_presencial_no_overlap, definição terminando em
   WHERE (modalidade = 'presencial'::text)):
   SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
   WHERE conrelid = 'public.sessions'::regclass AND contype = 'x';

4. Policies criadas (esperado: 8 policies nas 6 tabelas):
   SELECT tablename, policyname, cmd FROM pg_policies
   WHERE schemaname = 'public' AND tablename IN (
     'programs', 'program_workouts', 'student_progress', 'exercise_logs',
     'exercise_substitutes', 'community_announcements'
   ) ORDER BY tablename;

5. IMC gerado funciona com metros e centímetros (roda dentro de uma transação
   desfeita, não grava nada; esperado: as duas linhas com bmi ≈ 24.09):
   BEGIN;
   SELECT 68::numeric / (1.68 * 1.68) AS bmi_metros,
          68::numeric / ((168/100.0) * (168/100.0)) AS bmi_cm;
   ROLLBACK;

## Etapa 4 — Marcar o administrador (necessário para publicar avisos)

Só o admin publica no mural da Comunidade. Confirme comigo antes de rodar:
   UPDATE profiles SET is_admin = true WHERE email = '<EMAIL_DO_ADMIN>';
Depois confirme com:
   SELECT email, is_admin FROM profiles WHERE is_admin = true;

## Não fazer

- Não apagar nem recriar tabelas existentes (workouts, workout_exercises,
  exercise_library, sessions etc.): a separação treino/exercício já existe.
- Não desligar RLS de nenhuma tabela.
- Não conceder nada ao role anon.
- Não "corrigir" o SQL da migration sem me perguntar.

## Rollback (só se eu pedir)

Para voltar a regra antiga de conflito (qualquer sobreposição bloqueia):
   ALTER TABLE sessions DROP CONSTRAINT sessions_presencial_no_overlap;
   ALTER TABLE sessions ADD EXCLUDE USING gist (
     trainer_id WITH =, tstzrange(starts_at, ends_at) WITH &&
   );
Atenção: isso falha se já houver aulas online sobrepostas a outras aulas.
Nesse caso, liste-as primeiro e me mostre.
```

---

## Observações

- **Etapa 4 não é opcional** se você quiser usar o mural da Comunidade: troque
  `<EMAIL_DO_ADMIN>` pelo e-mail da conta administradora. Sem isso, a tela abre
  vazia e ninguém consegue publicar — a RLS bloqueia a escrita de quem não é
  admin.
- **Depois de aplicar**, quando o repositório web (`fitcoach-pro`) incorporar a
  006, mova os tipos de `src/types/extras.ts` para o `database.ts` de lá e rode
  `npm run sync-types` no mobile.
