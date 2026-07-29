# student-insights — Edge Function (IA)

Gera insights de IA sobre um aluno usando a API da Anthropic. A chave fica como
**secret da função**, nunca no app. O app chama via
`supabase.functions.invoke('student-insights', { body: { student_id } })`
(ver `src/api/endpoints.ts` → `getStudentInsights`).

## Pré-requisitos
- Supabase CLI: `npm i -g supabase` (ou `scoop/brew install supabase`)
- Uma chave da Anthropic (console.anthropic.com)

## Deploy (uma vez)
```bash
# na pasta fitcoach-mobile, logado no projeto Supabase certo:
supabase link --project-ref <seu-project-ref>
supabase functions deploy student-insights
supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxxxx
```
`SUPABASE_URL` e `SUPABASE_ANON_KEY` já são injetados automaticamente no runtime
da função — não precisa setar.

## Testar
No app: tela do aluno → **Gerar insights**. Ou via curl (JWT de um trainer logado):
```bash
curl -i -X POST \
  "https://<project-ref>.supabase.co/functions/v1/student-insights" \
  -H "Authorization: Bearer <JWT_DO_TRAINER>" \
  -H "Content-Type: application/json" \
  -d '{"student_id":"<uuid-do-aluno>"}'
```

## Custo / modelo
Usa `claude-opus-4-8` por padrão. Para cortar custo no piloto, troque por
`claude-haiku-4-5` no `index.ts` (linha do `model`). Saída limitada a 1024 tokens.

## Enquanto não estiver publicada
O botão no app mostra um erro amigável ("Verifique se a função de IA está
publicada.") — o resto do app segue funcionando normalmente.
