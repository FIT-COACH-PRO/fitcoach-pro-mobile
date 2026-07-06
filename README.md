# FitCoach Mobile

App React Native (Expo) do FitCoach Pro — iOS + Android. Vive **ao lado** do
`fitcoach-pro` (Next.js) sem alterá-lo. O app fala com o backend pelas rotas
`/api` já existentes e compartilha os tipos por cópia sincronizada.

```
personalTrainer/
├── fitcoach-pro/      ← backend Next.js + web (INTACTO)
└── fitcoach-mobile/   ← este app
```

## Arquitetura (decisões)

- **Dados/ações** → via `/api` do `fitcoach-pro` (HTTP). Secrets ficam no servidor.
- **Auth** → Supabase direto no app (`src/lib/supabase.ts`) só para obter o JWT.
  Esse JWT é enviado como `Authorization: Bearer` para as rotas `/api`.
- **Tipos** → copiados de `fitcoach-pro/src/types/database.ts` via `npm run sync-types`.
- **Calendário** → `expo-calendar` (Apple Calendar no iOS, Google Calendar no Android).
- **Push** → `expo-notifications`; o token é salvo no backend para o cron de lembretes.

## Setup

```bash
cd personalTrainer/fitcoach-mobile
npm install
npx expo install --fix      # alinha versões dos pacotes ao SDK instalado
cp .env.example .env         # preencha EXPO_PUBLIC_API_URL e as chaves Supabase
npm run sync-types           # copia os tipos do web
npm start                    # abre o Expo (dev)
```

> `EXPO_PUBLIC_API_URL` deve ser a mesma URL do `NEXT_PUBLIC_APP_URL` do web
> (ex.: a URL de produção da Vercel). Em dev local use o IP da sua máquina,
> ex.: `http://192.168.0.10:3000` (não `localhost`, o celular não o alcança).

### Expo Go vs Dev Build
`expo-calendar` e push **não** rodam no app Expo Go — precisam de um *dev build*:

```bash
npx expo install expo-dev-client
eas build --profile development --platform android   # ou ios
```

## ⚠️ Ajuste necessário no backend (fitcoach-pro)

Hoje as rotas `/api` autenticam por **cookie** (Supabase SSR). Para o app
funcionar, elas precisam aceitar **também** o header `Authorization: Bearer`.
É um ajuste pequeno e retrocompatível — sugestão de helper no web:

```ts
// fitcoach-pro/src/lib/supabase/from-request.ts
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

export async function getUserFromRequest(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice(7)
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )
    const { data } = await sb.auth.getUser(token)
    return data.user
  }
  // fallback: fluxo de cookie SSR existente (não muda nada para o web)
  return null
}
```

As rotas de dados que o app consome (`/api/dashboard/stats`, `/api/students`,
`/api/workouts`, `/api/sessions`, `/api/notifications/register-token`) precisam
existir/retornar JSON. Ajuste `src/api/endpoints.ts` conforme os paths reais.

## Push no cron (fitcoach-pro)

Em `src/app/api/cron/reminders/route.ts`, além do SMS, envie push via API do Expo:

```ts
await fetch('https://exp.host/--/api/v2/push/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: student.push_token,               // token Expo salvo pelo app
    title: 'Aula amanhã! 📅',
    body: `${trainer.name}: sua aula é amanhã às ${classTime}`,
  }),
})
```

## Build & Release

```bash
npm install -g eas-cli && eas login
eas build:configure
eas build --platform ios          # TestFlight
eas build --platform android      # Google Play internal
eas submit --platform ios --latest
eas submit --platform android --latest
```

## Pendências manuais

- [ ] Substituir placeholders 1x1 em `assets/` por artes reais:
      `icon.png` 1024×1024, `splash.png` 1242×2436, `notification-icon.png` 96×96 (Android).
- [ ] Criar `EXPO_PUBLIC_API_URL` e chaves Supabase no `.env`.
- [ ] Ajustar `/api` do web para aceitar Bearer (ver acima).
- [ ] Coluna `push_token` na tabela de perfis/alunos do Supabase.
- [ ] Contas Apple Developer ($99/ano) e Google Play ($25 único).
- [ ] Privacy Policy + screenshots das lojas.
