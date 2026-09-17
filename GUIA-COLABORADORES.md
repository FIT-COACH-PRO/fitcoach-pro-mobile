# Guia para colaboradores — rodar o FitCoach Mobile localmente

Este guia é para quem vai **olhar o projeto e testar/alterar localmente**, sem
enviar nada para a branch `main`.

---

## 1. Instalar os pré-requisitos (uma vez só)

| Ferramenta | Para quê | Como instalar |
|---|---|---|
| **Node.js LTS (20 ou 22)** | rodar o projeto | https://nodejs.org → baixar "LTS" |
| **Git** | clonar o repositório | https://git-scm.com/downloads |
| **App Expo Go** no celular | abrir o app sem compilar | Play Store (Android) / App Store (iOS) |
| **VS Code** (recomendado) | editar o código | https://code.visualstudio.com |

Confira no terminal (PowerShell, Terminal ou Prompt):

```bash
node -v      # deve mostrar v20.x ou v22.x
git --version
```

---

## 2. Clonar o repositório

```bash
git clone https://github.com/FIT-COACH-PRO/fitcoach-pro-mobile.git
cd fitcoach-pro-mobile
```

> Se pedir login, use sua conta do GitHub (que já tem acesso ao repo).

---

## 3. Criar sua própria branch (para não mexer na `main`)

```bash
git checkout -b teste/seu-nome
```

Toda alteração fica só na sua máquina, nessa branch. Você **não precisa**
(e não deve) dar `git push` para a `main`.

---

## 4. Instalar as dependências

```bash
npm install
npx expo install --fix
```

---

## 5. Configurar as variáveis de ambiente

Crie um arquivo chamado **`.env`** na raiz do projeto (copie do exemplo):

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# Mac/Linux
cp .env.example .env
```

Depois abra o `.env` e preencha com os valores reais do Supabase
(peça ao Matheus — são as chaves **públicas** do projeto):

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

> Sem esse arquivo o app abre mas não faz login.

---

## 6. Sincronizar os tipos

```bash
npm run sync-types
```

---

## 7. Rodar o app

```bash
npm start
```

Vai abrir o **Expo Dev Tools** no terminal com um **QR Code**.

- **Android:** abra o app **Expo Go** → "Scan QR code" → aponte para o QR.
- **iPhone:** abra a **câmera** → aponte para o QR → toque na notificação.
- O celular precisa estar **na mesma rede Wi‑Fi** do computador.
- Sem celular? Aperte **`w`** no terminal para abrir no navegador, ou **`a`**
  para um emulador Android (se tiver o Android Studio).

Alterou um arquivo? O app recarrega sozinho. Se travar, aperte **`r`** no
terminal para recarregar.

---

## 8. Verificar se está tudo certo (opcional)

```bash
npm run typecheck    # checa erros de tipo
npm test             # roda os testes
```

---

## Limitações do Expo Go

O **Expo Go** não roda **calendário** (`expo-calendar`) nem **notificações push**.
O resto do app funciona normalmente. Para testar esses recursos é preciso um
*dev build* (`eas build --profile development`) — fale com o Matheus.

---

## Problemas comuns

| Sintoma | Solução |
|---|---|
| QR não conecta | Mesmo Wi‑Fi? Tente `npx expo start --tunnel` |
| `Metro`/cache estranho | `npx expo start -c` (limpa cache) |
| Erro de versão de pacote | `npx expo install --fix` |
| `command not found: expo` | use sempre `npx expo ...` |
| Login não funciona | conferir o arquivo `.env` |

---

## Enviar sugestões de alteração (se quiser)

```bash
git add .
git commit -m "descreva a mudança"
git push -u origin teste/seu-nome
```

Isso cria a branch **no GitHub** (não na `main`) e você pode abrir um
**Pull Request** para revisão. A `main` continua protegida.
