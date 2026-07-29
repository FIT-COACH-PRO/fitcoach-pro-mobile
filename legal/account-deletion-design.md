# Exclusão de conta — desenho final (aguardando aprovação para implementar)

## Premissa confirmada
Aluno não tem login próprio (`students.id` não referencia `auth.users`; RLS
100% escopada por `trainer_id`; nenhum fluxo de portal/login de aluno em
mobile ou web). O único titular com conta é o **personal**. Alunos são dados
tratados pelo personal — o personal é controlador desses dados perante a
LGPD; o FitCoach é operador.

## Restrição estrutural do schema
Toda a cadeia de FKs hoje é `ON DELETE CASCADE` a partir de `profiles` →
`auth.users`. Apagar `auth.users` do personal hoje destrói tudo em cascata,
sem meio-termo. Para anonimizar-e-reter (`students`, `payments`, `sessions`),
a linha de `profiles`/`auth.users` do personal **nunca pode ser fisicamente
apagada** — só anonimizada, com login banido permanentemente (Supabase Auth
Admin API suporta ban permanente sem apagar a linha). Isso evita qualquer
mudança de FK/schema além das duas colunas novas abaixo.

## Fluxo (carência de 30 dias, login ativo durante o período)

1. Personal pede exclusão → grava `profiles.deletion_requested_at = now()` e
   `profiles.deletion_effective_at = now() + 30 dias`. Login continua
   funcionando normalmente.
2. Toda abertura do app, se `deletion_requested_at` estiver setado: banner
   persistente (não dispensável, mas não bloqueia uso) — "Sua conta será
   encerrada em {data}. [Cancelar exclusão]".
3. Cancelar a qualquer momento antes do prazo → limpa os dois campos, volta
   ao normal.
4. Um job diário (Supabase Cron → Edge Function, não a Vercel) varre
   `profiles` com `deletion_effective_at <= now()` e roda a rotina abaixo com
   service role, depois marca `profiles.deleted_at = now()` e bane o login
   permanentemente.

**Colunas novas propostas em `profiles`** (nomes sujeitos a ajuste, aguardando
aprovação antes de criar): `deletion_requested_at TIMESTAMPTZ`,
`deletion_effective_at TIMESTAMPTZ`, `deleted_at TIMESTAMPTZ`.

## Tabela por tabela (decisões finais)

| Tabela | Ação | Observação |
|---|---|---|
| `profiles` | **Anonimizar** (nome, CPF, CREF, e-mail, whatsapp, phone, birth_date, city, state, avatar_url, bio) + banir login permanente | nunca apaga a linha |
| `students` | **Anonimizar tudo**: identificadores (full_name, whatsapp, email, birth_date) **e** campos livres (objective, injuries, restrictions, observations) | confirmado — texto livre é o maior risco de reidentificação |
| `anamnese`, `evaluations` | **Apagar** | histórico de saúde detalhado, sem valor anonimizado |
| `photos` | **Apagar linha + arquivo no Storage** | imagem não é anonimizável |
| `payments` | **Manter integralmente** | registro financeiro/contábil; FK aponta pra `students` já anonimizado |
| `sessions` | **Manter** | confirmado — sustenta o contexto de `payments` |
| `workouts`, `workout_days`, `workout_exercises` | **Apagar** | autoria/produto do personal, sem propósito pós-encerramento |
| `workout_videos` | **Manter** se `shared_to_library=true` e `library_status='published'`; **apagar linha + arquivo no Storage** nos demais casos | autoria fica anonimizada de graça via `profiles` |
| `workout_video_media` (quando existir, Fase futura) | Segue a mesma regra do vídeo pai | — |
| `exercise_library` | **Manter** se `is_global=true`; **apagar** se não | sem exposição de autoria hoje, confirmado |
| `student_workout_schedules` | **Apagar** | agenda operacional |
| `notifications`, `whatsapp_messages` | **Apagar** | logs/mensagens operacionais |
| `calendar_connections` | **Apagar** (revogar token OAuth do Google antes) | credencial de terceiro |
| `two_factor_codes`, `trusted_devices` | **Apagar** | artefatos de auth do personal |
| `audit_logs` | **Manter como está** | já é `ON DELETE SET NULL`, desenhada certo |

## Pendente de aprovação antes de implementar
1. Nomes das 3 colunas novas em `profiles` (acima).
2. Texto exato do banner de aviso e regra de "não dispensável, mas não bloqueia".
3. Onde roda o job de 30 dias — proponho Supabase Cron (pg_cron) chamando uma Edge Function, coerente com a decisão de não depender mais da Vercel.
